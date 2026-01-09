import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js"; // '..' yerine '.' yaptık, dosyaların api klasöründe olduğunu varsayıyoruz
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Temel Express Ayarları
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loglama Fonksiyonu
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// İstek İzleyici (Hata ayıklama için)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  try {
    // 1. API Rotalarını (Mesajlar, Mağaza, Profil vb.) Kaydet
    // Eğer dosyaları henüz api klasörüne taşımadıysan buradaki yolu "./routes.js" yerine "../server/routes.js" yapmalısın.
    await registerRoutes(httpServer, app);

    // 2. Statik Dosya ve Frontend Ayarları
    const isProd = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
    
    if (isProd) {
      // Railway/Vercel üzerinde derlenmiş frontend dosyalarının yolu
      const publicPath = path.resolve(process.cwd(), "dist", "public");
      
      if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        
        // ÖNEMLİ: API dışındaki tüm istekleri React'e yönlendir (Sekmelerin çalışması için)
        app.get("*", (req, res, next) => {
          if (req.path.startsWith("/api")) {
            return next();
          }
          res.sendFile(path.join(publicPath, "index.html"));
        });
        log("Statik dosyalar sunuluyor: " + publicPath);
      } else {
        log("UYARI: Statik klasör (dist/public) bulunamadı!", "error");
      }
    } else {
      // Geliştirme (Local) modu için Vite kurulumu
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // 3. Hata Yönetimi
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Server Error:", err);
    });

    // 4. Sunucuyu Başlat (Railway için 5000 portu)
    if (process.env.VERCEL !== '1') {
      const port = Number(process.env.PORT) || 5000;
      httpServer.listen(port, "0.0.0.0", () => {
        log(`Sunucu ${port} portunda başarıyla başlatıldı.`);
      });
    }
  } catch (error) {
    console.error("Kritik başlatma hatası:", error);
  }
})();

export default app;
