import { findUrlByShortCode } from "../../lib/db";

export async function GET(request, { params }) {
  const { shortCode } = await params;

  const originalUrl = await findUrlByShortCode(shortCode);

  if (!originalUrl) {
    return new Response("단축 URL을 찾을 수 없습니다.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: originalUrl,
      "Cache-Control": "no-store",
    },
  });
}
