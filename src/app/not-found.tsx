import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ap-login-page">
      <section className="ap-login-card ap-glass">
        <p className="ap-kicker">404</p>
        <h1>Sayfa bulunamadı.</h1>
        <p className="ap-muted">Aradığınız ilan veya sunum yayından kaldırılmış olabilir.</p>
        <Link href="/" className="ap-primary-button" style={{ marginTop: 20 }}>Ana Sayfaya Dön</Link>
      </section>
    </main>
  );
}
