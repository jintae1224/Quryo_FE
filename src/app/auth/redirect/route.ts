import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 현재 요청의 호스트와 프로토콜을 가져옵니다.
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${forwardedHost}`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // 새로운 API를 사용하여 사용자 정보 확인
  try {
    const { error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 등록되지 않은 사용자 -> 회원가입 페이지로
        return NextResponse.redirect(`${origin}/signup`);
      }
      console.error("사용자 정보 조회 오류:", error);
      return NextResponse.redirect(`${origin}/error`);
    }

    // 등록된 사용자 -> 메인 페이지로
    return NextResponse.redirect(`${origin}/main`);
  } catch (error) {
    console.error("리다이렉트 처리 오류:", error);
    return NextResponse.redirect(`${origin}/error`);
  }
}
