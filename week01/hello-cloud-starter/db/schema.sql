CREATE TABLE IF NOT EXISTS urls (
    short_code VARCHAR(6) PRIMARY KEY,
    original_url VARCHAR(2048) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
