import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default async function ManagementDashboard() {
  const supabase = await createClient();

  const [{ data: listings }, { count: presentationsCount }] = await Promise.all([
    supabase.from("listings").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("presentations").select("*", { count: "exact", head: true }),
  ]);

  const rows = (listings ?? []) as Listing[];
  const activeCount = rows.filter((item) => item.status === "active").length;

  return (
    <div className="ap-admin-page">
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">AYDEMİR İNŞAAT</p>
          <h1>Yönetim Alanı</h1>
          <p className="ap-muted">İlanları yükleyin, düzenleyin ve müşteriye özel sunumlar hazırlayın.</p>
        </div>
        <Link href="/yonetim/yeni-ilan" className="ap-primary-button">+ Yeni İlan Ekle</Link>
      </section>

      <section className="ap-home-stats" style={{ marginTop: 18 }}>
        <div className="ap-stat-card ap-glass">
          <strong>{rows.length}</strong>
          <span>Son kayıtlar</span>
        </div>
        <div className="ap-stat-card ap-glass">
          <strong>{activeCount}</strong>
          <span>Aktif ilan</span>
        </div>
        <div className="ap-stat-card ap-glass">
          <strong>{presentationsCount ?? 0}</strong>
          <span>Müşteri sunumu</span>
        </div>
      </section>

      <div className="ap-section-head">
        <div>
          <p className="ap-kicker">HIZLI ERİŞİM</p>
          <h2>Son İlanlar</h2>
        </div>
        <Link href="/yonetim/ilanlar" className="ap-soft-button">Tümünü Gör</Link>
      </div>

      {rows.length === 0 ? (
        <div className="ap-empty-state ap-glass">
          <h2>Henüz ilan yok</h2>
          <p>İlk portföyünüzü ekleyerek başlayın.</p>
        </div>
      ) : (
        <section className="ap-admin-listing-grid">
          {rows.map((listing) => (
            <Link
              key={listing.id}
              href={`/yonetim/ilan-duzenle/${listing.id}`}
              className="ap-admin-listing-card ap-glass"
              style={{ textDecoration: "none" }}
            >
              <div className="ap-admin-card-image">
                {listing.cover_image_url ? (
                  <img src={listing.cover_image_url} alt={listing.title} />
                ) : (
                  <div className="ap-image-empty">Fotoğraf yok</div>
                )}
              </div>
              <div className="ap-admin-card-body">
                <p className="ap-kicker">{listing.project_name || "PROJE"}</p>
                <h2>{listing.title}</h2>
                <p className="ap-muted">{listing.neighborhood} · {listing.room_count}</p>
                <strong className="ap-admin-card-price">{formatPrice(listing.price)}</strong>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
