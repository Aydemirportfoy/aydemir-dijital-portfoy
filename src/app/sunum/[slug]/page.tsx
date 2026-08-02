import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import ListingCard from "@/components/ListingCard";
import { getPresentationBySlug } from "@/lib/data";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPresentationBySlug(slug);

  if (!result) return { title: "Sunum bulunamadı" };

  return {
    title: result.presentation.title || `${result.presentation.customer_name} için özel portföy`,
    description:
      result.presentation.note ||
      "Aydemir İnşaat tarafından hazırlanan özel gayrimenkul sunumu.",
    openGraph: {
      title: result.presentation.title || `${result.presentation.customer_name} için özel portföy`,
      description: result.presentation.note || "Size özel seçilmiş gayrimenkul portföyleri.",
      images: result.listings[0]?.cover_image_url ? [result.listings[0].cover_image_url] : [],
    },
  };
}

export default async function PresentationPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPresentationBySlug(slug);

  if (!result) notFound();

  const { presentation, listings } = result;

  return (
    <>
      <PublicHeader />

      <main className="ap-presentation-page">
        <div className="ap-shell">
          <section className="ap-presentation-hero ap-glass">
            <p className="ap-kicker">AYDEMİR İNŞAAT · ÖZEL SUNUM</p>
            <h1>{presentation.title || `${presentation.customer_name} için özel portföy`}</h1>
            <span className="ap-presentation-customer">Sayın {presentation.customer_name}</span>
            <p className="ap-muted">
              {presentation.note ||
                "Sizin için seçtiğimiz güncel gayrimenkul seçeneklerini aşağıda inceleyebilirsiniz."}
            </p>

            <div className="ap-home-cta-row">
              <span className="ap-pill">{listings.length} özel seçenek</span>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="ap-primary-button"
              >
                Danışmanla İletişim
              </a>
            </div>
          </section>

          <div className="ap-section-head">
            <div>
              <p className="ap-kicker">SİZE ÖZEL SEÇİMLER</p>
              <h2>Portföyler</h2>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="ap-empty-state ap-glass">
              <h2>Bu sunumda aktif ilan bulunmuyor</h2>
              <p>Güncel seçenekler için danışmanınızla iletişime geçebilirsiniz.</p>
            </div>
          ) : (
            <div className="ap-listing-grid">
              {listings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
