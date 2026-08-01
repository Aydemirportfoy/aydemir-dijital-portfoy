import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { createClient } from "../../lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/yonetim");
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#F8F6F2] px-6 py-12 text-[#2A2A2A]">
      <section className="w-full max-w-md rounded-[32px] bg-[#F8F6F2] p-7 text-center shadow-[0_28px_90px_rgba(42,42,42,0.14)] sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F6A04D] text-3xl font-semibold shadow-[0_18px_45px_rgba(42,42,42,0.14)]">
          A
        </div>

        <p className="mt-7 text-sm font-semibold tracking-[0.24em] text-[#2A2A2A]/55">
          AYDEMİR İNŞAAT
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
          Yönetici Girişi
        </h1>

        <p className="mt-4 leading-7 text-[#2A2A2A]/60">
          İlanları ve müşteri sunumlarını yönetmek için giriş yapın.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
