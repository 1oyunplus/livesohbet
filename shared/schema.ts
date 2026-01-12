import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We use these table definitions to derive types, even if using Firebase
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID veya Google ID
  username: text("username"), // 🔥 nullable yaptık - profilde doldurulacak
  email: text("email").notNull(),
  password: text("password"), // 🔥 nullable yaptık - Google kullanıcıları için null
  photoUrl: text("photo_url"),
  googleId: text("google_id").unique(), // 🔥 YENİ: Google OAuth ID
  isOnline: boolean("is_online").default(false),
  diamonds: integer("diamonds").default(10),
  vipStatus: text("vip_status").default("none"), // none, bronze, silver, gold
  location: jsonb("location"), // { lat: number, lng: number }
  lastActive: timestamp("last_active").defaultNow(),
  age: integer("age"),
  gender: text("gender"), // erkek, kadın, diğer
  birthDate: timestamp("birth_date"),
  hobbies: jsonb("hobbies"), // string array
  bio: text("bio"),
  blockedUsers: jsonb("blocked_users"), // string array of blocked user IDs
  vipExpiry: timestamp("vip_expiry"),
  likes: integer("likes").default(0), // 🔥 YENİ: Beğeni sayısı
  likedBy: jsonb("liked_by"), // 🔥 YENİ: Beğenen kullanıcı ID'leri (string array)
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
  isPaid: boolean("is_paid").default(false), // Elmas ile gönderilen mesajlar için
});

export const messageCounts = pgTable("message_counts", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  freeMessagesSent: integer("free_messages_sent").default(0),
  paidMessagesSent: integer("paid_messages_sent").default(0),
});

export const friendships = pgTable("friendships", {
  id: text("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  status: text("status").notNull(), // pending, accepted, blocked
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertMessageSchema = createInsertSchema(messages);
export const insertFriendshipSchema = createInsertSchema(friendships);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Friendship = typeof friendships.$inferSelect;

export type VIPStatus = 'none' | 'bronze' | 'silver' | 'gold';