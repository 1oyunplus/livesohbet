import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

// Serverless ortamlarda WebSocket yerine HTTP üzerinden sorgu göndermek 
// bağlantı hatalarını ve "asılı kalma" sorunlarını önler.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL bulunamadı. Lütfen Vercel dashboard üzerinden Environment Variables kısmına ekleyin."
  );
}

// Neon yapılandırması
const sql = neon(process.env.DATABASE_URL);

// Drizzle'ı neon-http sürücüsüyle başlatıyoruz
export const db = drizzle(sql, { schema });
