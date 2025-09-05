"use server";

import { Provider } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "./server";

export default async function oAuthSignIn({
  provider,
}: {
  provider: Provider;
}) {
  if (!provider) {
    return redirect("/login?message=No provider selected");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // redirect 할 주소
      redirectTo: `${process.env.NEXT_PUBLIC_ROUTE}/auth/callback`,
      queryParams: {
        // access_type : 'offline' 일 경우 리프레시 토큰 요청
        access_type: "offline",
        // prompt: 'consent' 일 경우 사용자가 항상 동의 화면을 보도록 강제
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect("/error?message=Could not authenticate user");
  }

  return redirect(data.url);
}
