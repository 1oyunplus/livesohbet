import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(excludeId?: string, sortByLocation?: { lat: number; lng: number }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getMessages(senderId: string, receiverId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(senderId: string, receiverId: string, messageId: string): Promise<void>;
  deleteAllMessages(senderId: string, receiverId: string): Promise<void>;
  blockUser(userId: string, blockedUserId: string): Promise<void>;
  getMessageCount(senderId: string, receiverId: string): Promise<{ senderId: string; receiverId: string; freeMessagesSent: number; paidMessagesSent: number }>;
  incrementFreeMessageCount(senderId: string, receiverId: string): Promise<void>;
  incrementPaidMessageCount(senderId: string, receiverId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (e) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (e) {
      return undefined;
    }
  }

  async getAllUsers(excludeId?: string, sortByLocation?: { lat: number; lng: number }): Promise<User[]> {
    try {
      let allUsers = await db.select().from(users);
      if (excludeId) {
        allUsers = allUsers.filter(u => u.id !== excludeId);
      }
      
      if (sortByLocation) {
        allUsers.sort((a, b) => {
          if (!a.location || !b.location) return 0;
          const distA = this.calculateDistance(sortByLocation, a.location as { lat: number; lng: number });
          const distB = this.calculateDistance(sortByLocation, b.location as { lat: number; lng: number });
          return distA - distB;
        });
      }
      return allUsers;
    } catch (e) {
      return [];
    }
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; 
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = insertUser.id || `u${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [user] = await db.insert(users).values({
      ...insertUser,
      id,
      lastActive: new Date(),
      isOnline: true,
      diamonds: insertUser.diamonds || 10,
      vipStatus: insertUser.vipStatus || 'none'
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set({ ...updates, lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async getMessages(senderId: string, receiverId: string): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
        and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
      )
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [newMessage] = await db.insert(messages).values({
      ...message,
      id,
      createdAt: new Date(),
      isRead: false,
      isPaid: message.isPaid || false
    }).returning();
    return newMessage;
  }

  async getMessageCount(senderId: string, receiverId: string) {
    return { senderId, receiverId, freeMessagesSent: 0, paidMessagesSent: 0 };
  }

  async incrementFreeMessageCount(_s: string, _r: string): Promise<void> {}
  async incrementPaidMessageCount(_s: string, _r: string): Promise<void> {}

  async deleteMessage(_s: string, _r: string, messageId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async deleteAllMessages(senderId: string, receiverId: string): Promise<void> {
    await db.delete(messages).where(
      or(
        and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
        and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
      )
    );
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    await this.deleteAllMessages(userId, blockedUserId);
  }
}

export const storage = new DatabaseStorage();
