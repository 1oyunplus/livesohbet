import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage.js";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // WebSocket bağlantıları için güvenli bir Map
  const wsClients = new Map<string, WebSocket>();

  // Yardımcı Fonksiyonlar
  function broadcastMessage(userId: string, data: any) {
    const ws = wsClients.get(userId);
    if (ws && ws.readyState === 1) {
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development"
    });
  });

  app.get("/api/status", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
  });

  // 🔥 FIREBASE LOGIN ENDPOINT
  app.post("/api/auth/firebase-login", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "UID ve email gerekli" });
      }

      // Kullanıcıyı Firebase UID ile bul
      let user = await storage.getUserByGoogleId(uid);
      let isNewUser = false;

      if (!user) {
        // 🔥 Random username oluştur
        const randomUsername = `Kullanıcı${Math.floor(Math.random() * 10000)}`;
        
        // Yeni kullanıcı oluştur
        user = await storage.createUser({
          username: randomUsername, // 🔥 Random username
          email: email.toLowerCase(),
          password: null, // Firebase kullanıcıları şifresiz
          googleId: uid,
          photoUrl: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`,
          diamonds: 10,
          vipStatus: "none",
          isOnline: true,
          location: { lat: 40.7128, lng: -74.006 },
        });

        isNewUser = true;
        console.log(`✅ New Firebase user created: ${email}`);
      } else {
        // Mevcut kullanıcıyı online yap
        user = await storage.updateUser(user.id, {
          isOnline: true,
          lastActive: new Date(),
        });

        console.log(`✅ Firebase user logged in: ${user.email}`);
      }

      res.json({ 
        user, 
        token: user.id,
        isNewUser 
      });
    } catch (error: any) {
      console.error("❌ Firebase Login Error:", error);
      res.status(500).json({ error: error.message || "Giriş başarısız" });
    }
  });

  // --- KULLANICI BİLGİLERİNİ GETİR ---
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      
      if (!token) {
        return res.status(401).json({ error: "Token eksik" });
      }

      const user = await storage.getUser(token);
      
      if (!user) {
        return res.status(401).json({ error: "Kullanıcı bulunamadı" });
      }

      // Kullanıcı bilgilerini güncellerken lastActive'i güncelle
      const updatedUser = await storage.updateUser(user.id, { 
        lastActive: new Date() 
      });

      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("❌ Auth Me Error:", error);
      res.status(500).json({ error: error.message || "Kullanıcı bilgileri alınamadı" });
    }
  });

  // --- TÜM KULLANICILARI GETİR ---
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

      const userLocation = currentUser.location as { lat: number; lng: number } | null;
      const users = await storage.getAllUsers(token, userLocation || undefined);
      
      res.json(users);
    } catch (error: any) {
      console.error("❌ Get Users Error:", error);
      res.status(500).json({ error: error.message || "Kullanıcılar getirilemedi" });
    }
  });

  // --- MESAJLARI GETİR ---
  app.get("/api/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
      const receiverId = req.query.receiverId as string;
      
      if (!token) {
        return res.status(400).json({ error: "Token gerekli" });
      }

      // 🔥 YENİ: Eğer receiverId "ALL" ise, tüm mesajları getir
      if (receiverId === "ALL") {
        const allMessages = await storage.getAllMessages(token);
        return res.json(allMessages);
      }

      // Belirli bir kullanıcı için mesajları getir
      if (!receiverId) {
        return res.status(400).json({ error: "receiverId gerekli" });
      }

      const messages = await storage.getMessages(token, receiverId);
      res.json(messages);
    } catch (error: any) {
      console.error("❌ Get Messages Error:", error);
      res.status(500).json({ error: error.message || "Mesajlar getirilemedi" });
    }
  });

  // --- MESAJ GÖNDER ---
  app.post("/api/messages", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      const { receiverId, content, useDiamonds } = req.body;

      if (!token || !receiverId || !content) {
        return res.status(400).json({ error: "Eksik bilgi" });
      }

      const sender = await storage.getUser(token);
      
      if (!sender) {
        return res.status(401).json({ error: "Gönderici bulunamadı" });
      }

      const messageCount = await storage.getMessageCount(token, receiverId);
      const FREE_MESSAGE_LIMIT = 3;
      
      let isPaid = false;
      if (messageCount.freeMessagesSent < FREE_MESSAGE_LIMIT) {
        await storage.incrementFreeMessageCount(token, receiverId);
      } else if (useDiamonds && sender.diamonds >= 1) {
        isPaid = true;
        await storage.updateUser(token, { diamonds: sender.diamonds - 1 });
        await storage.incrementPaidMessageCount(token, receiverId);
      } else {
        return res.status(402).json({ error: "Elmas gerekiyor", requiresDiamonds: true });
      }

      const message = await storage.createMessage({
        senderId: token,
        receiverId,
        content,
        isPaid
      });

      broadcastMessage(receiverId, { type: "new_message", message });
      broadcastMessage(token, { type: "new_message", message });

      res.json({ message, isPaid });
    } catch (error: any) {
      console.error("❌ Message Error:", error);
      res.status(500).json({ error: error.message || "Mesaj gönderilemedi" });
    }
  });

  // --- PROFİL GÜNCELLEME ---
  app.put("/api/users/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      
      if (!token) {
        return res.status(401).json({ error: "Token gerekli" });
      }

      const user = await storage.getUser(token);
      
      if (!user) {
        return res.status(401).json({ error: "Kullanıcı bulunamadı" });
      }

      const { username, photoUrl, age, gender, birthDate, bio, hobbies, location } = req.body;

      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;
      if (age !== undefined) updates.age = age;
      if (gender !== undefined) updates.gender = gender;
      if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;
      if (bio !== undefined) updates.bio = bio;
      if (hobbies !== undefined) updates.hobbies = hobbies;
      if (location !== undefined) updates.location = location;

      const updatedUser = await storage.updateUser(token, updates);

      console.log(`✅ Profile updated: ${updatedUser.username}`);
      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("❌ Profile Update Error:", error);
      res.status(500).json({ error: error.message || "Profil güncellenemedi" });
    }
  });

  // --- FOTOĞRAF YÜKLEME (Opsiyonel, base64 için) ---
  app.post("/api/users/upload-photo", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      
      if (!token) {
        return res.status(401).json({ error: "Token gerekli" });
      }

      const { photoBase64 } = req.body;

      if (!photoBase64) {
        return res.status(400).json({ error: "Fotoğraf verisi eksik" });
      }

      // Base64'ü olduğu gibi kaydet (veya cloud storage'a yükle)
      const photoUrl = photoBase64;

      res.json({ photoUrl });
    } catch (error: any) {
      console.error("❌ Photo Upload Error:", error);
      res.status(500).json({ error: error.message || "Fotoğraf yüklenemedi" });
    }
  });

  // --- WEBSOCKET KURULUMU ---
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  wss.on("connection", (ws: WebSocket, req) => {
    let token: string | null = null;
    if (req.url) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      token = urlParams.get('token');
    }

    if (!token) {
      ws.close(1008, "Token required");
      return;
    }

    wsClients.set(token, ws);
    console.log(`🔌 WebSocket connected: ${token}`);
    
    storage.updateUser(token, { isOnline: true, lastActive: new Date() }).then(() => {
      broadcastUserUpdate({ type: "user_online", userId: token });
    }).catch(err => {
      console.error("WebSocket user update error:", err);
    });

    ws.on("close", () => {
      if (token) {
        wsClients.delete(token);
        console.log(`🔌 WebSocket disconnected: ${token}`);
        storage.updateUser(token, { isOnline: false, lastActive: new Date() }).then(() => {
          broadcastUserUpdate({ type: "user_offline", userId: token });
        }).catch(err => {
          console.error("WebSocket disconnect error:", err);
        });
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("✅ WebSocket server initialized");

  return httpServer;
}