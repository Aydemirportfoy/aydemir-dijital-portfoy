"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-posta veya şifre hatalı.");
      setWorking(false);
      return;
    }

    router.replace("/yonetim");
    router.refresh();
  }

  return (
    <form className="ap-login-form" onSubmit={submit}>
      <label className="ap-field">
        <span>E-posta</span>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label className="ap-field">
        <span>Şifre</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>

      {error ? <div className="ap-login-error">{error}</div> : null}

      <button type="submit" className="ap-primary-button" disabled={working}>
        {working ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
