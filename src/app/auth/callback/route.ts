import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = "/auth/redirect";

  const supabase = await createClient();

  // `code`가 있을 때의 처리
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const host = forwardedHost || request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv && host) {
        return NextResponse.redirect(`${protocol}://${host}${next}`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${protocol}://${host}${next}`);
    }
  }

  // `access_token`이 있을 때의 처리
  if (accessToken) {
    // 여기서는 `access_token`을 사용하여 Supabase 세션을 수동으로 설정하거나 사용자 인증 상태를 확인할 수 있습니다.
    // Supabase에서 `access_token`을 직접 사용하여 인증된 세션을 설정하는 메서드가 있는 경우 사용할 수 있습니다.

    // 예: Supabase 세션 설정 또는 사용자 정보 가져오기
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "", // refresh_token이 없을 경우 빈 문자열로 설정
    });

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = forwardedHost || request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv && host) {
        return NextResponse.redirect(`${protocol}://${host}${next}`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${protocol}://${host}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
