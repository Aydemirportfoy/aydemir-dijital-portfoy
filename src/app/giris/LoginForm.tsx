"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage("E-posta veya şifre hatalı.");
        return;
      }

      router.replace("/yonetim");
      router.refresh();
    } catch {
      setMessage("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 text-left"
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
          E-posta
        </span>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          placeholder="ornek@aydemirinsaat.com"
          className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-[#F8F6F2] px-5 py-4 text-[#2A2A2A] outline-none transition focus:border-[#F6A04D] focus:ring-4 focus:ring-[#F6A04D]/20"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
          Şifre
        </span>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          placeholder="Şifrenizi girin"
          className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-[#F8F6F2] px-5 py-4 text-[#2A2A2A] outline-none transition focus:border-[#F6A04D] focus:ring-4 focus:ring-[#F6A04D]/20"
        />
      </label>

      {message ? (
        <p
          role="alert"
          className="rounded-[16px] bg-[#2A2A2A] px-4 py-3 text-sm text-[#F8F6F2]"
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[20px] bg-[#F6A04D] px-6 py-4 font-semibold text-[#2A2A2A] shadow-[0_16px_40px_rgba(42,42,42,0.14)] transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Giriş yapılıyor..." : "Yönetici Girişi"}
      </button>
    </form>
  );
}
