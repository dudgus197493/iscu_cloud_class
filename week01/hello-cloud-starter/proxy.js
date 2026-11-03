// 관리자 페이지가 표시되기 전에 인증과 인가를 검사합니다.

import { NextResponse } from "next/server";
import { authenticate } from "./lib/auth";
import { authorize } from "./lib/authorization";

function authenticationRequiredResponse() {
  return new NextResponse("관리자 인증이 필요합니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
      "Cache-Control": "no-store",
    },
  });
}

function forbiddenResponse() {
  return new NextResponse("접근 권한이 없습니다.", {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(request) {
  const user = authenticate(request);

  if (!user) {
    return authenticationRequiredResponse();
  }

  if (!authorize(user, "admin:page")) {
    return forbiddenResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
