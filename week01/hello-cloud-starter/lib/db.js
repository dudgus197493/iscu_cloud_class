import { neon } from "@neondatabase/serverless";

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return neon(databaseUrl);
}

export async function saveUrl(shortCode, originalUrl) {
  const sql = getSql();

  const existing = await sql`
    SELECT short_code
    FROM urls
    WHERE original_url = ${originalUrl}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return existing[0].short_code;
  }

  const inserted = await sql`
    INSERT INTO urls (short_code, original_url)
    VALUES (${shortCode}, ${originalUrl})
    ON CONFLICT (short_code) DO NOTHING
    RETURNING short_code
  `;

  if (inserted.length > 0) {
    return inserted[0].short_code;
  }

  const conflict = await sql`
    SELECT original_url
    FROM urls
    WHERE short_code = ${shortCode}
    LIMIT 1
  `;

  if (conflict[0]?.original_url === originalUrl) {
    return shortCode;
  }

  throw new Error("다른 URL과 단축 코드가 충돌했습니다.");
}

export async function findUrlByShortCode(shortCode) {
  const sql = getSql();
  const rows = await sql`
    SELECT original_url
    FROM urls
    WHERE short_code = ${shortCode}
    LIMIT 1
  `;

  return rows[0]?.original_url ?? null;
}
