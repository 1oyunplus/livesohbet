import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import { createServer } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

const setupPromise = (async () => {
  // Rotaları kaydet
  await registerRoutes(httpServer, app);

  // Hata yakalama
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // STATİK DOSYA SUNUMU (Railway ve Vercel Uyumu)
  if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT) {
    // api klasöründen bir üst dizine çıkıp dist/public'e ulaşıyoruz
    const publicPath = path.resolve(__dirname, "..", "dist", "public");
    
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
      });
      log("Static files being served from: " + publicPath);
    } else {
      log("Warning: Static path not found: " + publicPath, "error");
    }
  } else {
    // Development (Vite) modu
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Sunucuyu başlat (Railway için)
  if (process.env.VERCEL !== '1') {
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  }
})();

export default app;
