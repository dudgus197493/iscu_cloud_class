import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_URL_LENGTH = 2048;

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/*
 * createShortCode()
 *
 * 원본 URL을 입력받아 SHA-256 해시를 생성하고,
 * 그 값을 이용해 6자리 단축 코드를 만듭니다.
 */
function createShortCode(originalUrl, length = 6) {
  const hex = createHash("sha256")
    .update(originalUrl)
    .digest("hex");

  let code = "";

  for (let i = 0; i < length; i++) {
    const value = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );

    code += ALPHABET[value % ALPHABET.length];
  }

  return code;
}

/*
 * POST()
 *
 * 클라이언트가 보낸 URL을 검사하고,
 * 문제가 없으면 단축 URL을 생성하여 반환합니다.
 */
export async function POST(request) {
  try {

    /*
     * 1. 요청 본문 읽기
     *
     * 클라이언트가 보낸 JSON에서
     * originalUrl 값을 가져옵니다.
     */
    const body = await request.json().catch(() => null);

    const raw = body?.originalUrl;
    const originalUrl =
      typeof raw === "string" ? raw.trim() : "";


    /*
     * 2. URL이 입력되지 않은 경우
     *
     * 클라이언트가 필요한 값을 보내지 않은 상황입니다.
     *
     * 잘못된 요청이므로 400을 반환합니다.
     */
    if (!originalUrl) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_URL",
            message: "원본 URL을 입력해 주세요.",
          },
        },
        { status: 400 }
      );
    }


    /*
     * 3. URL이 너무 긴 경우
     *
     * 서버가 허용하는 최대 길이보다
     * 긴 URL을 클라이언트가 보낸 상황입니다.
     *
     * 잘못된 요청이므로 400을 반환합니다.
     */
    if (originalUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "URL_TOO_LONG",
            message:
              `URL은 ${MAX_URL_LENGTH}자 이하로 입력해 주세요.`,
          },
        },
        { status: 400 }
      );
    }


    /*
     * 4. URL 형식 검사
     *
     * new URL()을 이용하여
     * 올바른 URL 형식인지 검사합니다.
     */
    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {

      /*
       * 올바른 URL 형식이 아닌 경우
       *
       * 잘못된 요청이므로 400을 반환합니다.
       */
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message:
              "올바른 URL 형식을 입력해 주세요.",
          },
        },
        { status: 400 }
      );
    }


    /*
     * 5. 프로토콜 검사
     *
     * http 또는 https만 허용합니다.
     */
    if (
      !/^https?:\/\//i.test(originalUrl) ||
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname
    ) {

      /*
       * 허용하지 않는 URL을 보낸 경우
       *
       * 잘못된 요청이므로 400을 반환합니다.
       */
      return NextResponse.json(
        {
          error: {
            code: "INVALID_URL",
            message:
              "URL은 http:// 또는 https://로 시작해야 합니다.",
          },
        },
        { status: 400 }
      );
    }


    /*
     * 6. 단축 URL 생성
     *
     * 모든 검사를 통과했으므로
     * 단축 코드와 단축 URL을 생성합니다.
     */
    const shortCode = createShortCode(originalUrl);
    const baseUrl = new URL(request.url).origin;


    /*
     * URL 생성 성공
     *
     * 생성에 성공했으므로 201을 반환합니다.
     */
    return NextResponse.json(
      {
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl,
      },
      { status: 201 }
    );

  } catch {

    /*
     * 7. 서버 내부 오류
     *
     * 예상하지 못한 오류가 발생한 경우입니다.
     *
     * 서버 내부 오류이므로 500을 반환합니다.
     */
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "단축 URL을 생성하지 못했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
