import { redirect } from "next/navigation";
import LoginForm from "@/app/giris/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/yonetim");

  return (
    <main className="ap-login-page">
      <section className="ap-login-card ap-glass">
        <div className="ap-detail-topbar">
          <div className="ap-brand">
            <span className="ap-brand-mark">A</span>
            <span><strong>AYDEMİR İNŞAAT</strong><small>Yönetim Girişi</small></span>
          </div>
          <ThemeToggle />
        </div>

        <h1>Hoş geldiniz.</h1>
        <p className="ap-muted">Portföylerinizi ve müşteri sunumlarınızı tek yerden yönetin.</p>
        <LoginForm />
      </section>
    </main>
  );
}
