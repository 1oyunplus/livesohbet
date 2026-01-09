import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [${source}] ${message}`);
}

(async () => {
  try {
    // 1. Önce API Rotalarını ve Socket.io'yu Kaydet
    log("Backend hizmetleri başlatılıyor...");
    await registerRoutes(httpServer, app);

    // 2. Statik Dosyalar (Vite/React Çıktısı)
    const publicPath = path.resolve(process.cwd(), "dist", "public");
    
    if (fs.existsSync(publicPath)) {
      // Statik dosyaları servis et
      app.use(express.static(publicPath));

      // 3. KRİTİK AYAR: API dışındaki tüm rotaları React'e yönlendir
      app.get("*", (req, res, next) => {
        // API isteklerini atla
        if (req.path.startsWith("/api")) {
          return next();
        }
        
        // Statik dosya kontrolü (eğer dosya varsa express.static zaten handle etti)
        const filePath = path.join(publicPath, req.path);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return next();
        }
        
        // Tüm diğer rotaları index.html'e yönlendir (SPA routing)
        res.sendFile(path.join(publicPath, "index.html"));
      });
      
      log("Frontend-Backend köprüsü kuruldu.");
    } else {
      log("⚠️ Frontend build dosyası bulunamadı. 'npm run build' komutunu çalıştırın.", "warning");
    }

    // Hata Yönetimi
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || 500;
      const message = err.message || "Sunucu Hatası";
      log(`Error ${status}: ${message}`, "error");
      res.status(status).json({ message });
    });

    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`🚀 Uygulama ${port} portunda yayında.`);
      log(`📡 API: http://localhost:${port}/api`);
      log(`🌐 Frontend: http://localhost:${port}`);
    });

  } catch (error) {
    console.error("❌ Başlatma hatası:", error);
    process.exit(1);
  }
})();

export default app;