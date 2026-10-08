import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isAllowed } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const supabase = await supabaseServer();
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
      : null;
  if (!result || result.error) {
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent("No pudimos validar el link")}`, url.origin));
  }
  const email = result.data.user?.email?.toLowerCase();
  if (!email || !(await isAllowed(email))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent("Ese email no tiene acceso al panel")}`, url.origin));
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
