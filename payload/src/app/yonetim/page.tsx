import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import StatusBadge from "@/components/admin/StatusBadge";
import type {
  Listing,
  ListingStatus,
} from "@/lib/types";

function countStatus(
  rows: Listing[],
  status: ListingStatus,
) {
  return rows.filter(
    (item) => item.status === status,
  ).length;
}

export default async function ManagementDashboard() {
  const supabase =
    await createClient();

  const [
    {
      data: listings,
    },
    {
      count: presentationsCount,
    },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .order("created_at", {
        ascending: false,
      }),
    supabase
      .from("presentations")
      .select("*", {
        count: "exact",
        head: true,
      }),
  ]);

  const rows =
    (listings ?? []) as Listing[];

  const recent = rows.slice(0, 6);

  const activeCount =
    countStatus(rows, "active");

  const draftCount =
    countStatus(rows, "draft");

  const reservedCount =
    countStatus(rows, "reserved");

  const soldCount =
    countStatus(rows, "sold");

  return (
    <div className="ap-admin-page">
      <section className="ap-dashboard-hero ap-glass">
        <div className="ap-dashboard-hero-copy">
          <p className="ap-kicker">
            AYDEMİR İNŞAAT
          </p>

          <h1>Yönetim Merkezi</h1>

          <p>
            Portföyü yönetin, doğru ilanı
            bulun ve müşteriye özel
            sunumları tek yerden hazırlayın.
          </p>
        </div>

        <div className="ap-dashboard-hero-actions">
          <Link
            href="/yonetim/hizli-ilan"
            className="ap-primary-button"
          >
            ✦ Hızlı İlan Girişi
          </Link>

          <Link
            href="/yonetim/ilanlar"
            className="ap-soft-button"
          >
            Portföyü Aç
          </Link>
        </div>

        <div className="ap-dashboard-metrics">
          <div>
            <span>Toplam</span>
            <strong>{rows.length}</strong>
          </div>

          <div>
            <span>Aktif</span>
            <strong>{activeCount}</strong>
          </div>

          <div>
            <span>Taslak</span>
            <strong>{draftCount}</strong>
          </div>

          <div>
            <span>Rezerve</span>
            <strong>{reservedCount}</strong>
          </div>

          <div>
            <span>Satıldı</span>
            <strong>{soldCount}</strong>
          </div>

          <div>
            <span>Sunum</span>
            <strong>
              {presentationsCount ?? 0}
            </strong>
          </div>
        </div>
      </section>

      <section className="ap-dashboard-command-grid">
        <Link
          href="/yonetim/hizli-ilan"
          className="ap-command-card ap-command-card-smart ap-glass"
        >
          <span className="ap-command-icon">
            ✦
          </span>

          <div>
            <p className="ap-kicker">
              AKILLI GİRİŞ
            </p>

            <h2>İlanı Yapıştır</h2>

            <p>
              Sahibinden metnini yapıştırın;
              temel bilgiler otomatik
              hazırlansın.
            </p>
          </div>

          <b>↗</b>
        </Link>

        <Link
          href="/yonetim/talepler"
          className="ap-command-card ap-command-card-demand ap-glass"
        >
          <span className="ap-command-icon">
            ◎
          </span>

          <div>
            <p className="ap-kicker">
              TALEP MOTORU
            </p>

            <h2>Talebi Eşleştir</h2>

            <p>
              Müşteri talebini kaydedin;
              uygun ilanlar otomatik
              sıralansın.
            </p>
          </div>

          <b>↗</b>
        </Link>

        <Link
          href="/yonetim/takip"
          className="ap-command-card ap-command-card-follow ap-glass"
        >
          <span className="ap-command-icon">
            ◷
          </span>

          <div>
            <p className="ap-kicker">
              GÜNLÜK TAKİP
            </p>

            <h2>Müşteriyi Unutma</h2>

            <p>
              Bugün aranacakları, geciken
              görüşmeleri ve satış aşamalarını
              tek ekranda yönetin.
            </p>
          </div>

          <b>↗</b>
        </Link>

        <Link
          href="/yonetim/ilanlar"
          className="ap-command-card ap-glass"
        >
          <span className="ap-command-icon">
            ▦
          </span>

          <div>
            <p className="ap-kicker">
              HIZLI BULUCU
            </p>

            <h2>İlanları Filtrele</h2>

            <p>
              Mahalle, oda ve fiyat
              aralığına göre uygun daireyi
              bulun.
            </p>
          </div>

          <b>↗</b>
        </Link>

        <Link
          href="/yonetim/sunumlar/yeni"
          className="ap-command-card ap-glass"
        >
          <span className="ap-command-icon">
            ◇
          </span>

          <div>
            <p className="ap-kicker">
              MÜŞTERİYE ÖZEL
            </p>

            <h2>Sunum Hazırla</h2>

            <p>
              Seçilen ilanlardan hızlıca
              özel portföy bağlantısı
              oluşturun.
            </p>
          </div>

          <b>↗</b>
        </Link>
      </section>

      <section className="ap-dashboard-recent ap-glass">
        <div className="ap-dashboard-section-head">
          <div>
            <p className="ap-kicker">
              SON HAREKETLER
            </p>

            <h2>Son İlanlar</h2>
          </div>

          <Link
            href="/yonetim/ilanlar"
            className="ap-soft-button"
          >
            Tümünü Gör
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="ap-empty-state">
            <h2>Henüz ilan yok</h2>

            <p>
              İlk portföyünüzü ekleyerek
              başlayın.
            </p>
          </div>
        ) : (
          <div className="ap-recent-list">
            {recent.map((listing) => (
              <Link
                key={listing.id}
                href={
                  `/yonetim/` +
                  `ilan-duzenle/` +
                  `${listing.id}`
                }
                className="ap-recent-row"
              >
                <div className="ap-recent-image">
                  {listing.cover_image_url ? (
                    <img
                      src={
                        listing
                          .cover_image_url
                      }
                      alt={
                        listing.title
                      }
                    />
                  ) : (
                    <div className="ap-image-empty">
                      Fotoğraf yok
                    </div>
                  )}
                </div>

                <div className="ap-recent-main">
                  <p>
                    {listing.project_name ||
                      "AYDEMİR PORTFÖY"}
                  </p>

                  <strong>
                    {listing.title}
                  </strong>

                  <span>
                    {listing.neighborhood}
                    {listing.room_count
                      ? ` · ${listing.room_count}`
                      : ""}
                    {listing.area_m2
                      ? ` · ${listing.area_m2} m²`
                      : ""}
                  </span>
                </div>

                <strong className="ap-recent-price">
                  {formatPrice(
                    listing.price,
                  )}
                </strong>

                <StatusBadge
                  status={listing.status}
                />

                <span className="ap-recent-arrow">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
