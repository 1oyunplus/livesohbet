import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js"; 
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Loglama fonksiyonu
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  try {
    // 1. Rotaları Kaydet (Artık her şey api klasöründe olduğu için ./routes.js)
    await registerRoutes(httpServer, app);

    // 2. Statik Dosyalar (Railway için kritik ayar)
    // process.cwd() bizi projenin ana dizinine götürür, oradan dist/public'e bakarız
    const publicPath = path.resolve(process.cwd(), "dist", "public");
    
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      
      // ÖNEMLİ: Sayfa yenilendiğinde veya sekmeler arasında gezerken 
      // API olmayan her şeyi React'in index.html dosyasına yönlendir
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        res.sendFile(path.join(publicPath, "index.html"));
      });
      log("Statik dosyalar aktif: " + publicPath);
    } else {
      log("HATA: dist/public klasörü bulunamadı!", "error");
    }

    // 3. Hata Yakalama
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    // 4. Port Dinleme (Railway için)
    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`Sunucu ${port} portunda çalışıyor.`);
    });
  } catch (error) {
    console.error("Kritik Hata:", error);
  }
})();

export default app;
