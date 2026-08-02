import PublicHeader from "@/components/PublicHeader";
import PortfolioGrid from "@/components/PortfolioGrid";
import { getActiveListings } from "@/lib/data";
import { PHONE_LINK, WHATSAPP_NUMBER } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const listings = await getActiveListings();

  return (
    <>
      <PublicHeader />

      <main className="ap-home">
        <div className="ap-shell">
          <section className="ap-home-hero ap-glass">
            <div className="ap-home-copy">
              <p className="ap-kicker">ANTALYA · KEPEZ</p>
              <h1>Gayrimenkul portföyünün en sade hali.</h1>
              <p>
                Güncel daire ve proje seçeneklerini hızlıca inceleyin. Aracı yok,
                gereksiz bilgi yok; yalnızca doğru portföy ve doğrudan firma iletişimi.
              </p>

              <div className="ap-home-cta-row">
                <a href="#portfoyler" className="ap-primary-button">Portföyleri İncele</a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ap-soft-button"
                >
                  WhatsApp
                </a>
                <a href={`tel:${PHONE_LINK}`} className="ap-soft-button">Ara</a>
              </div>
            </div>

            <div className="ap-home-stats">
              <div className="ap-stat-card">
                <strong>{listings.length}</strong>
                <span>Aktif portföy</span>
              </div>
              <div className="ap-stat-card">
                <strong>0%</strong>
                <span>Komisyon</span>
              </div>
              <div className="ap-stat-card">
                <strong>1:1</strong>
                <span>Doğrudan firma</span>
              </div>
            </div>
          </section>

          <section id="portfoyler">
            <div className="ap-section-head">
              <div>
                <p className="ap-kicker">GÜNCEL İLANLAR</p>
                <h2>Satıştaki Portföyler</h2>
              </div>
              <p className="ap-muted">{listings.length} aktif ilan</p>
            </div>

            {listings.length === 0 ? (
              <div className="ap-empty-state ap-glass">
                <h2>Henüz aktif ilan bulunmuyor</h2>
                <p>Yönetim panelinden yeni ilan ekleyebilirsiniz.</p>
              </div>
            ) : (
              <PortfolioGrid listings={listings} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
