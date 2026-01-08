
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/status", (req, res) => {
    res.json({ status: "ok" });
  });

  // Kullanıcı kayıt
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, photoUrl } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Kullanıcı adı, e-posta ve şifre gereklidir" });
      }

      // Email kontrolü
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı" });
      }

      // Yeni kullanıcı oluştur
      const user = await storage.createUser({
        username,
        email,
        photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        diamonds: 10,
        vipStatus: "none",
        isOnline: true,
        location: { lat: 40.7128, lng: -74.0060 } // Default location
      });

      res.json({ user, token: user.id }); // Basit token olarak user ID kullanıyoruz
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

      // Basit şifre kontrolü (gerçek uygulamada hash kullanılmalı)
      // Şimdilik herhangi bir şifre kabul ediyoruz
      
      // Kullanıcıyı online yap
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
      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      const user = await storage.getUser(token);
      if (!user) {
        return res.status(401).json({ error: "Kullanıcı bulunamadı" });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tüm kullanıcıları getir (konum bazlı sıralama ile)
  app.get("/api/users", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const currentUser = await storage.getUser(token);
      if (!currentUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Kullanıcının konumunu kullanarak sırala
      const userLocation = currentUser.location as { lat: number; lng: number } | null;
      const users = await storage.getAllUsers(token, userLocation || undefined);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profil fotoğrafı upload (base64)
  app.post("/api/users/upload-photo", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      const { photoBase64 } = req.body;
      if (!photoBase64) {
        return res.status(400).json({ error: "Fotoğraf gereklidir" });
      }

      // Base64'ü direkt photoUrl olarak kaydet (production'da bir storage servisi kullanılmalı)
      const photoUrl = photoBase64;
      
      const updatedUser = await storage.updateUser(token, { photoUrl });
      res.json({ user: updatedUser, photoUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profil güncelleme
  app.put("/api/users/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      const { username, photoUrl, age, gender, birthDate, hobbies, bio } = req.body;
      const updates: any = {};
      
      if (username !== undefined) updates.username = username;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;
      if (age !== undefined) updates.age = age;
      if (gender !== undefined) updates.gender = gender;
      if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;
      if (hobbies !== undefined) updates.hobbies = hobbies;
      if (bio !== undefined) updates.bio = bio;

      const updatedUser = await storage.updateUser(token, updates);
      res.json({ user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mesaj sayısını getir
  app.get("/api/messages/count", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      const { receiverId } = req.query;

      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      if (!receiverId || typeof receiverId !== "string") {
        return res.status(400).json({ error: "Alıcı ID gereklidir" });
      }

      const count = storage.getMessageCount(token, receiverId);
      res.json(count);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mesaj sil
  app.delete("/api/messages/:messageId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      const { messageId } = req.params;
      const { receiverId } = req.query;

      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      if (!receiverId || typeof receiverId !== "string") {
        return res.status(400).json({ error: "Alıcı ID gereklidir" });
      }

      await storage.deleteMessage(token, receiverId, messageId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tüm konuşmayı sil
  app.delete("/api/messages/chat/:receiverId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      const { receiverId } = req.params;

      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      await storage.deleteAllMessages(token, receiverId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Kullanıcı engelle
  app.post("/api/users/block", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      const { blockedUserId } = req.body;

      if (!token) {
        return res.status(401).json({ error: "Yetkisiz erişim" });
      }

      if (!blockedUserId) {
        return res.status(400).json({ error: "Engellenecek kullanıcı ID gereklidir" });
      }

      await storage.blockUser(token, blockedUserId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mesajları getir
  app.get("/api/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      const { receiverId } = req.query;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!receiverId || typeof receiverId !== "string") {
        return res.status(400).json({ error: "receiverId is required" });
      }

      const messages = await storage.getMessages(token, receiverId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mesaj gönder (limit kontrolü ile)
  app.post("/api/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      const { receiverId, content, useDiamonds } = req.body;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!receiverId || !content) {
        return res.status(400).json({ error: "Alıcı ID ve mesaj içeriği gereklidir" });
      }

      const sender = await storage.getUser(token);
      if (!sender) {
        return res.status(401).json({ error: "Sender not found" });
      }

      const messageCount = storage.getMessageCount(token, receiverId);
      const FREE_MESSAGE_LIMIT = 3;
      
      // VIP mesaj limitleri
      const VIP_LIMITS: Record<string, number> = {
        bronze: 20,
        silver: 40,
        gold: 60
      };

      const vipLimit = sender.vipStatus && sender.vipStatus !== 'none' 
        ? VIP_LIMITS[sender.vipStatus] || 0 
        : 0;
      
      const totalFreeMessages = messageCount.freeMessagesSent;
      const totalPaidMessages = messageCount.paidMessagesSent;
      const totalMessages = totalFreeMessages + totalPaidMessages;

      let isPaid = false;
      let requiresDiamonds = false;

      // Ücretsiz mesaj kontrolü
      if (totalFreeMessages < FREE_MESSAGE_LIMIT) {
        // Ücretsiz mesaj gönderebilir
        storage.incrementFreeMessageCount(token, receiverId);
      } else {
        // VIP limit kontrolü
        if (vipLimit > 0 && totalMessages < vipLimit) {
          // VIP mesaj hakkı var
          storage.incrementFreeMessageCount(token, receiverId);
        } else {
          // Elmas gerekiyor
          if (useDiamonds && sender.diamonds >= 1) {
            // Elmas ile gönder
            isPaid = true;
            await storage.updateUser(token, { diamonds: sender.diamonds - 1 });
            storage.incrementPaidMessageCount(token, receiverId);
          } else {
            requiresDiamonds = true;
            return res.status(402).json({ 
              error: "Elmas gerekiyor", 
              requiresDiamonds: true,
              diamondsNeeded: 1,
              currentDiamonds: sender.diamonds
            });
          }
        }
      }

      const message = await storage.createMessage({
        senderId: token,
        receiverId,
        content,
        isPaid
      });

      // WebSocket ile hem gönderen hem de alan kullanıcıya bildir
      broadcastMessage(receiverId, { type: "new_message", message });
      broadcastMessage(token, { type: "new_message", message });

      res.json({ message, isPaid, remainingFree: Math.max(0, FREE_MESSAGE_LIMIT - totalFreeMessages - 1) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket bağlantıları için map
  const wsClients = new Map<string, WebSocket>();

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws: WebSocket, req) => {
    // WebSocket URL'den token'ı al
    let token: string | null = null;
    if (req.url) {
      try {
        // WebSocket URL formatı: ws://host/path?token=xxx
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        token = url.searchParams.get("token");
      } catch (error) {
        // URL parse hatası, manuel parse dene
        const match = req.url.match(/[?&]token=([^&]+)/);
        token = match ? match[1] : null;
      }
    }

    if (!token) {
      ws.close(1008, "Token required");
      return;
    }

    wsClients.set(token, ws);
    console.log(`WebSocket connected: ${token}`);

    // Kullanıcıyı online yap
    storage.getUser(token).then(user => {
      if (user) {
        storage.updateUser(token, { isOnline: true, lastActive: new Date() });
        broadcastUserUpdate({ type: "user_online", userId: token });
      }
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      wsClients.delete(token);
      console.log(`WebSocket disconnected: ${token}`);
      
      // Kullanıcıyı offline yap
      storage.getUser(token).then(user => {
        if (user) {
          storage.updateUser(token, { isOnline: false, lastActive: new Date() });
          broadcastUserUpdate({ type: "user_offline", userId: token });
        }
      });
    });
  });

  // Mesaj broadcast fonksiyonu
  function broadcastMessage(userId: string, data: any) {
    const ws = wsClients.get(userId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Kullanıcı güncelleme broadcast
  function broadcastUserUpdate(data: any) {
    wsClients.forEach((ws, userId) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  return httpServer;
}
