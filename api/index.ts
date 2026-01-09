import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Temel Express Ayarları
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Ana Başlatma Fonksiyonu
(async () => {
  try {
    // Rotaları kaydet
    await registerRoutes(httpServer, app);

    // Statik Dosyalar (Railway ve Üretim Ortamı İçin)
    const isProd = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
    
    if (isProd) {
      // En güvenli yol tanımı: Mevcut çalışma dizininden dist/public'e git
      const publicPath = path.resolve(process.cwd(), "dist", "public");
      
      if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        app.get("*", (req, res) => {
          // API isteklerini dışla, geri kalan her şeyi React'e yönlendir
          if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(publicPath, "index.html"));
          }
        });
        log("Statik dosyalar sunuluyor: " + publicPath);
      } else {
        log("HATA: Statik klasör bulunamadı: " + publicPath);
      }
    } else {
      // Geliştirme modu (Vite)
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Hata Yakalayıcı
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
      console.error("Server Error:", err);
    });

    // Railway Port Dinleme
    if (process.env.VERCEL !== '1') {
      const port = Number(process.env.PORT) || 5000;
      httpServer.listen(port, "0.0.0.0", () => {
        log(`Sunucu ${port} portunda aktif.`);
      });
    }
  } catch (error) {
    console.error("Kritik başlatma hatası:", error);
  }
})();

export default app;
