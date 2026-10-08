import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (supabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/admin/login", new URL(req.url).origin), { status: 303 });
}
