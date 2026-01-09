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
      app.use(express.static(publicPath));

      // 3. KRİTİK AYAR: Siyah ekranı ve eksik sekmeleri çözen kısım
      // API dışındaki tüm istekleri React'in ana dosyasına yönlendir
      app.get("*", (req, res, next) => {
        // Eğer istek /api ile başlıyorsa bu bir backend isteğidir, dokunma
        if (req.path.startsWith("/api")) {
          return next();
        }
        // Değilse (mesajlar, profil, mağaza vb. ise) index.html'i gönder
        res.sendFile(path.join(publicPath, "index.html"));
      });
      log("Frontend-Backend köprüsü kuruldu.");
    }

    // Hata Yönetimi
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Sunucu Hatası" });
    });

    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`Uygulama ${port} portunda yayında.`);
    });

  } catch (error) {
    console.error("Başlatma hatası:", error);
  }
})();

export default app;