import { findUrlByShortCode } from "../../lib/db";
import { recordClick } from "../../lib/stats";

export async function GET(request, { params }) {
  const { shortCode } = await params;

  const originalUrl = await findUrlByShortCode(shortCode);

  if (!originalUrl) {
    console.warn("단축 URL을 찾을 수 없습니다.", { shortCode });

    return new Response("단축 URL을 찾을 수 없습니다.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    await recordClick(shortCode);
  } catch (error) {
    console.error("클릭 기록에 실패했습니다.", { shortCode, error });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: originalUrl,
      "Cache-Control": "no-store",
    },
  });
}
