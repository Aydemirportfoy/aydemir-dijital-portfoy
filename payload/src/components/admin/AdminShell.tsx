"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/yonetim", label: "Panel", icon: "⌂" },
  { href: "/yonetim/hizli-ilan", label: "Hızlı Giriş", icon: "✦" },
  { href: "/yonetim/talepler", label: "Talepler", icon: "◎" },
  { href: "/yonetim/takip", label: "Takip", icon: "◷" },
  { href: "/yonetim/ilanlar", label: "İlanlar", icon: "▦" },
  { href: "/yonetim/yeni-ilan", label: "Yeni İlan", icon: "+" },
  { href: "/yonetim/sunumlar", label: "Sunumlar", icon: "◇" },
];

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/giris");
    router.refresh();
  }

  return (
    <div className="ap-admin-root">
      <aside className="ap-admin-sidebar">
        <Link href="/yonetim" className="ap-admin-logo">
          <span>A</span>
          <div>
            <strong>AYDEMİR</strong>
            <small>Yönetim</small>
          </div>
        </Link>

        <nav className="ap-admin-nav">
          {links.map((link) => {
            const active =
              link.href === "/yonetim"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "is-active" : ""}
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ap-admin-sidebar-bottom">
          <p>{email}</p>
          <div className="ap-admin-utility-row">
            <ThemeToggle />
            <button type="button" className="ap-soft-button" onClick={logout}>
              Çıkış
            </button>
          </div>
        </div>
      </aside>

      <div className="ap-admin-content">
        <div className="ap-admin-mobile-top">
          <Link href="/yonetim" className="ap-brand">
            <span className="ap-brand-mark">A</span>
            <span><strong>AYDEMİR</strong><small>Yönetim</small></span>
          </Link>
          <ThemeToggle />
        </div>

        {children}
      </div>

      <nav className="ap-admin-bottom-nav">
        {links.map((link) => {
          const active =
            link.href === "/yonetim"
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "is-active" : ""}
            >
              <span>{link.icon}</span>
              <small>{link.label}</small>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
