import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function PublicHeader() {
  return (
    <header className="ap-public-header">
      <div className="ap-shell ap-public-header-inner">
        <Link href="/" className="ap-brand">
          <span className="ap-brand-mark">A</span>
          <span>
            <strong>AYDEMİR İNŞAAT</strong>
            <small>Dijital Portföy</small>
          </span>
        </Link>

        <nav className="ap-header-actions">
          <Link href="/" className="ap-soft-button">
            Portföy
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
