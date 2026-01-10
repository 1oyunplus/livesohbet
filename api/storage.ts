import { users, type User, type InsertUser, messages, type Message, type InsertMessage } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>; // 🔥 YENİ
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
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  // 🔥 YENİ: Google ID ile kullanıcı bul
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
      return user;
    } catch (error) {
      console.error("Error getting user by Google ID:", error);
      throw error;
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
          const locA = a.location as { lat: number; lng: number };
          const locB = b.location as { lat: number; lng: number };
          const distA = this.calculateDistance(sortByLocation, locA);
          const distB = this.calculateDistance(sortByLocation, locB);
          return distA - distB;
        });
      }
      
      return allUsers;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = insertUser.id || `u${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Email'i normalize et
      const normalizedEmail = insertUser.email.toLowerCase().trim();
      
      const [user] = await db.insert(users).values({
        id,
        username: insertUser.username?.trim() || null, // 🔥 nullable
        email: normalizedEmail,
        password: insertUser.password || null, // 🔥 nullable
        googleId: insertUser.googleId || null, // 🔥 YENİ
        photoUrl: insertUser.photoUrl,
        bio: insertUser.bio || null,
        hobbies: insertUser.hobbies || null,
        location: insertUser.location || null,
        diamonds: insertUser.diamonds !== undefined ? insertUser.diamonds : 10,
        vipStatus: insertUser.vipStatus || 'none',
        vipExpiry: insertUser.vipExpiry || null,
        isOnline: insertUser.isOnline !== undefined ? insertUser.isOnline : true,
        lastActive: new Date(),
        blockedUsers: insertUser.blockedUsers || null,
        age: insertUser.age || null,
        gender: insertUser.gender || null,
        birthDate: insertUser.birthDate || null,
      }).returning();
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [updated] = await db.update(users)
        .set({ ...updates, lastActive: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (!updated) {
        throw new Error('User not found');
      }
      
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async getMessages(senderId: string, receiverId: string): Promise<Message[]> {
    try {
      return await db.select().from(messages).where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      );
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const id = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const [newMessage] = await db.insert(messages).values({
        ...message,
        id,
        createdAt: new Date(),
        isRead: false,
        isPaid: message.isPaid || false
      }).returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  }

  async getAllMessages(userId: string): Promise<Message[]> {
    try {
      return await db.select().from(messages).where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      );
    } catch (error) {
      console.error("Error getting all messages:", error);
      throw error;
    }
  }

  async getMessageCount(senderId: string, receiverId: string) {
    // TODO: Implement proper message counting with a separate table
    return { senderId, receiverId, freeMessagesSent: 0, paidMessagesSent: 0 };
  }

  async incrementFreeMessageCount(_s: string, _r: string): Promise<void> {
    // TODO: Implement proper message counting
  }
  
  async incrementPaidMessageCount(_s: string, _r: string): Promise<void> {
    // TODO: Implement proper message counting
  }

  async deleteMessage(_s: string, _r: string, messageId: string): Promise<void> {
    try {
      await db.delete(messages).where(eq(messages.id, messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  async deleteAllMessages(senderId: string, receiverId: string): Promise<void> {
    try {
      await db.delete(messages).where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      );
    } catch (error) {
      console.error("Error deleting all messages:", error);
      throw error;
    }
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      await this.deleteAllMessages(userId, blockedUserId);
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();