import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Temel Express Ayarları
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loglama Mekanizması
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [${source}] ${message}`);
}

(async () => {
  try {
    // 1. Rotaları ve HTTP Server'ı birlikte kaydet (Socket.io için kritik!)
    // Bu işlem Mesajlaşma ve Veritabanı bağlantılarını başlatır
    log("Backend rotaları ve Socket.io başlatılıyor...");
    await registerRoutes(httpServer, app);

    const isProd = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
    
    if (isProd) {
      const publicPath = path.resolve(process.cwd(), "dist", "public");
      
      if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        
        // React Router ve API Çakışmasını Önleme
        app.get("*", (req, res, next) => {
          // Eğer istek /api ile başlıyorsa React'e yönlendirme, backend'e bırak
          if (req.path.startsWith("/api")) {
            return next();
          }
          res.sendFile(path.join(publicPath, "index.html"));
        });
        log("Frontend dosyaları başarıyla bağlandı.");
      }
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // Hata Yönetimi
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Sistem Hatası:", err);
      res.status(err.status || 500).json({ 
        message: err.message || "Bir hata oluştu.",
        error: isProd ? null : err 
      });
    });

    // Railway Port Ayarı
    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`Sohbet Sunucusu ${port} portunda aktiftir.`);
    });

  } catch (error) {
    console.error("Kritik Başlatma Hatası:", error);
  }
})();

export default app;