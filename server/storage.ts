
import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";

// This is a minimal storage interface as we are primarily using Firebase
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
  getMessageCount(senderId: string, receiverId: string): { senderId: string; receiverId: string; freeMessagesSent: number; paidMessagesSent: number };
  incrementFreeMessageCount(senderId: string, receiverId: string): void;
  incrementPaidMessageCount(senderId: string, receiverId: string): void;
}

interface MessageCount {
  senderId: string;
  receiverId: string;
  freeMessagesSent: number;
  paidMessagesSent: number;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message[]>;
  private messageCounts: Map<string, MessageCount>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.messageCounts = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getAllUsers(excludeId?: string, sortByLocation?: { lat: number; lng: number }): Promise<User[]> {
    let allUsers = Array.from(this.users.values());
    if (excludeId) {
      allUsers = allUsers.filter(u => u.id !== excludeId);
    }
    
    // Konum bazlı sıralama
    if (sortByLocation) {
      allUsers.sort((a, b) => {
        if (!a.location || !b.location) return 0;
        const distA = this.calculateDistance(sortByLocation, a.location as { lat: number; lng: number });
        const distB = this.calculateDistance(sortByLocation, b.location as { lat: number; lng: number });
        return distA - distB;
      });
    }
    
    return allUsers;
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = insertUser.id || `u${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user: User = { 
      ...insertUser, 
      id, 
      lastActive: new Date(),
      isOnline: true,
      diamonds: insertUser.diamonds || 10,
      vipStatus: insertUser.vipStatus || 'none'
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  private getMessageKey(senderId: string, receiverId: string): string {
    // Sort IDs to ensure same key for both directions
    const [id1, id2] = [senderId, receiverId].sort();
    return `${id1}_${id2}`;
  }

  async getMessages(senderId: string, receiverId: string): Promise<Message[]> {
    const key = this.getMessageKey(senderId, receiverId);
    return this.messages.get(key) || [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: message.createdAt || new Date(),
      isRead: false,
      isPaid: message.isPaid || false
    };
    
    const key = this.getMessageKey(message.senderId, message.receiverId);
    const existing = this.messages.get(key) || [];
    existing.push(newMessage);
    this.messages.set(key, existing);
    
    return newMessage;
  }

  getMessageCount(senderId: string, receiverId: string): MessageCount {
    const key = this.getMessageKey(senderId, receiverId);
    const count = this.messageCounts.get(key);
    if (count) {
      return count;
    }
    const newCount: MessageCount = {
      senderId,
      receiverId,
      freeMessagesSent: 0,
      paidMessagesSent: 0
    };
    this.messageCounts.set(key, newCount);
    return newCount;
  }

  incrementFreeMessageCount(senderId: string, receiverId: string): void {
    const key = this.getMessageKey(senderId, receiverId);
    const count = this.messageCounts.get(key) || {
      senderId,
      receiverId,
      freeMessagesSent: 0,
      paidMessagesSent: 0
    };
    count.freeMessagesSent++;
    this.messageCounts.set(key, count);
  }

  incrementPaidMessageCount(senderId: string, receiverId: string): void {
    const key = this.getMessageKey(senderId, receiverId);
    const count = this.messageCounts.get(key) || {
      senderId,
      receiverId,
      freeMessagesSent: 0,
      paidMessagesSent: 0
    };
    count.paidMessagesSent++;
    this.messageCounts.set(key, count);
  }

  async deleteMessage(senderId: string, receiverId: string, messageId: string): Promise<void> {
    const key = this.getMessageKey(senderId, receiverId);
    const messages = this.messages.get(key) || [];
    const filtered = messages.filter(msg => msg.id !== messageId);
    this.messages.set(key, filtered);
  }

  async deleteAllMessages(senderId: string, receiverId: string): Promise<void> {
    const key = this.getMessageKey(senderId, receiverId);
    this.messages.delete(key);
    // Mesaj sayısını da sıfırla
    this.messageCounts.delete(key);
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    // Engellenen kullanıcıları ayrı bir map'te tut
    // Şimdilik basit bir implementasyon
    // Production'da friendships tablosuna status: 'blocked' eklenebilir
    const key = this.getMessageKey(userId, blockedUserId);
    // Mesajları sil
    this.messages.delete(key);
    this.messageCounts.delete(key);
  }
}

export const storage = new MemStorage();
