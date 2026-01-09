-- Mevcut tabloları temizleyelim (Hata almamak için)
DROP TABLE IF EXISTS message_counts;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

-- Senin schema.ts dosyana birebir uyumlu tablolar
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    photo_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    diamonds INTEGER DEFAULT 10,
    vip_status TEXT DEFAULT 'none',
    location JSONB,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    age INTEGER,
    gender TEXT,
    birth_date TIMESTAMP,
    hobbies JSONB,
    bio TEXT
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE
);

CREATE TABLE message_counts (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    free_messages_sent INTEGER DEFAULT 0,
    paid_messages_sent INTEGER DEFAULT 0
);

CREATE TABLE friendships (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT NOT NULL
);
