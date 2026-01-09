import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Temel ayarlar
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loglama fonksiyonu
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [${source}] ${message}`);
}

(async () => {
  try {
    // 1. Önce Rotaları Kaydet (API istekleri burada karşılanır)
    log("Rotalar yükleniyor...");
    await registerRoutes(httpServer, app);

    const isProd = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
    
    if (isProd) {
      // 2. Statik dosyalar için ana dizine güvenli erişim
      const publicPath = path.resolve(process.cwd(), "dist", "public");
      
      if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        
        // 3. React Router Desteği: API dışındaki her şeyi index.html'e yönlendir
        app.get("*", (req, res, next) => {
          if (req.path.startsWith("/api")) {
            return next(); // API isteğiyse dokunma, hataya düşür
          }
          res.sendFile(path.join(publicPath, "index.html"));
        });
      }
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // 4. Hata Yönetimi
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server Hatası:", err);
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    // 5. Port Dinleme (Railway)
    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`Canlı yayın ${port} portunda başladı.`);
    });
  } catch (error) {
    console.error("Başlatma sırasında kritik hata:", error);
  }
})();

export default app;