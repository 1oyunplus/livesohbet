import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage.js";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // WebSocket bağlantıları için güvenli bir Map (Sadece desteklenen ortamlarda dolacak)
  const wsClients = new Map<string, WebSocket>();

  // Yardımcı Fonksiyonlar: Broadcast (Vercel'de sessizce pas geçer)
  function broadcastMessage(userId: string, data: any) {
    const ws = wsClients.get(userId);
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(data));
    }
  }

  function broadcastUserUpdate(data: any) {
    wsClients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  app.get("/api/status", (req, res) => {
    res.json({ status: "ok", env: process.env.VERCEL ? "production" : "development" });
  });

  // Kullanıcı kayıt
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, photoUrl } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Kullanıcı adı, e-posta ve şifre gereklidir" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı" });
      }

      const user = await storage.createUser({
        username,
        email,
        photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        diamonds: 10,
        vipStatus: "none",
        isOnline: true,
        location: { lat: 40.7128, lng: -74.0060 }
      });

      res.json({ user, token: user.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kullanıcı giriş
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "E-posta ve şifre gereklidir" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Geçersiz giriş bilgileri" });
      }

      await storage.updateUser(user.id, { isOnline: true, lastActive: new Date() });
      res.json({ user, token: user.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kullanıcı bilgilerini getir
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      if (!token) return res.status(401).json({ error: "Yetkisiz erişim" });

      const user = await storage.getUser(token);
      if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tüm kullanıcıları getir
  app.get("/api/users", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const currentUser = await storage.getUser(token);
      if (!currentUser) return res.status(401).json({ error: "User not found" });

      const userLocation = currentUser.location as { lat: number; lng: number } | null;
      const users = await storage.getAllUsers(token, userLocation || undefined);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mesaj gönder (limit kontrolü ile)
  app.post("/api/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      const { receiverId, content, useDiamonds } = req.body;

      if (!token || !receiverId || !content) {
        return res.status(400).json({ error: "Eksik bilgi" });
      }

      const sender = await storage.getUser(token);
      if (!sender) return res.status(401).json({ error: "Gönderici bulunamadı" });

      const messageCount = storage.getMessageCount(token, receiverId);
      const FREE_MESSAGE_LIMIT = 3;
      
      let isPaid = false;
      if (messageCount.freeMessagesSent < FREE_MESSAGE_LIMIT) {
        storage.incrementFreeMessageCount(token, receiverId);
      } else if (useDiamonds && sender.diamonds >= 1) {
        isPaid = true;
        await storage.updateUser(token, { diamonds: sender.diamonds - 1 });
        storage.incrementPaidMessageCount(token, receiverId);
      } else {
        return res.status(402).json({ error: "Elmas gerekiyor", requiresDiamonds: true });
      }

      const message = await storage.createMessage({
        senderId: token,
        receiverId,
        content,
        isPaid
      });

      // WebSocket Bildirimleri (Sadece Vercel dışında çalışır)
      broadcastMessage(receiverId, { type: "new_message", message });
      broadcastMessage(token, { type: "new_message", message });

      res.json({ message, isPaid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DİĞER ROUTE'LAR (Profil, Mesaj Geçmişi vb. Buraya eklenebilir)

  // --- WEBSOCKET KURULUMU (SADECE VERCEL DIŞINDA) ---
  if (process.env.VERCEL !== '1') {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws: WebSocket, req) => {
      let token: string | null = null;
      if (req.url) {
        const match = req.url.match(/[?&]token=([^&]+)/);
        token = match ? match[1] : null;
      }

      if (!token) {
        ws.close(1008, "Token required");
        return;
      }

      wsClients.set(token, ws);

      storage.getUser(token).then(user => {
        if (user) {
          storage.updateUser(token, { isOnline: true, lastActive: new Date() });
          broadcastUserUpdate({ type: "user_online", userId: token });
        }
      });

      ws.on("close", () => {
        wsClients.delete(token!);
        storage.getUser(token!).then(user => {
          if (user) {
            storage.updateUser(token!, { isOnline: false, lastActive: new Date() });
            broadcastUserUpdate({ type: "user_offline", userId: token });
          }
        });
      });
    });
  }

  return httpServer;
}
