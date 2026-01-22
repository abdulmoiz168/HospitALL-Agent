import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error from OAuth provider
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    const redirectUrl = new URL("/auth/signin", origin);
    redirectUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      const redirectUrl = new URL("/auth/signin", origin);
      redirectUrl.searchParams.set("error", "Failed to authenticate");
      return NextResponse.redirect(redirectUrl);
    }

    // Successful authentication
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (isLocalEnv) {
      // In development, redirect directly
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      // In production with proxy
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(`${origin}/auth/signin`);
}
