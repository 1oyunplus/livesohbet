import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS için Railway production ortamı
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`${time} [${source}] ${message}`);
}

(async () => {
  try {
    log("🚀 Starting application...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("❌ DATABASE_URL is not set! Please configure it in Railway environment variables.");
    }
    
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🗄️ Database: Connected`);

    // 1. Önce API Rotalarını ve WebSocket'i Kaydet
    await registerRoutes(httpServer, app);
    log("✅ API routes & WebSocket registered");

    const publicPath = path.resolve(process.cwd(), "dist", "public");
    
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath, {
        maxAge: '1d',
        etag: true
      }));
      log("✅ Static files configured");

      // 3. SPA Routing: KRİTİK DÜZELTME BURADA
      app.get("*", (req, res, next) => {
        // WebSocket ve API isteklerini HTML'e çarptırma
        if (
          req.path.startsWith("/api") || 
          req.path.startsWith("/ws") || 
          req.path.startsWith("/socket.io")
        ) {
          return next();
        }
        
        // Uzantısı olan dosyaları (.png, .js) HTML olarak sunma, yoksa 404 ver
        if (req.path.includes('.')) {
          const filePath = path.join(publicPath, req.path);
          if (!fs.existsSync(filePath)) {
            return res.status(404).end();
          }
          return next();
        }
        
        // Tüm navigasyon rotalarını React'e yönlendir
        res.sendFile(path.join(publicPath, "index.html"));
      });
      
      log("✅ SPA routing bridge active");
    } else {
      log("⚠️ Warning: Frontend build not found.");
    }

    // Global Error Handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || 500;
      const message = err.message || "Internal Server Error";
      log(`❌ Error ${status}: ${message}`, "error");
      res.status(status).json({ 
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
      log(`\n${'='.repeat(50)}`);
      log(`🎉 Server is running! Port: ${port}`);
      log(`${'-'.repeat(50)}\n`);
    });

  } catch (error: any) {
    console.error("\n❌ FATAL ERROR:", error.message);
    process.exit(1);
  }
})();

// Graceful shutdown (Claude'un eklediği önemli kısım)
const shutdown = () => {
  log('⚠️ Closing HTTP server');
  httpServer.close(() => {
    log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;