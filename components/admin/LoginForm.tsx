"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/auth/callback` },
    });
    if (error) {
      setState("error");
      setMsg(error.message);
    } else setState("sent");
  };

  if (state === "sent") return <p className="mt-4 rounded bg-cream-deep p-3 text-sm">Listo, revisá tu email y tocá el link para entrar.</p>;

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <Field label="Email" htmlFor="email" error={state === "error" ? msg : undefined}>
        <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Enviarme el link"}
      </Button>
    </form>
  );
}
