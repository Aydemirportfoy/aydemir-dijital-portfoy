import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import { getListingBySlug } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { PHONE_LINK, WHATSAPP_NUMBER } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getListingBySlug(slug);

  if (!result) return { title: "İlan bulunamadı" };

  const { listing } = result;

  return {
    title: listing.title,
    description:
      listing.short_description ||
      `${listing.neighborhood}, ${listing.district} bölgesinde ${listing.room_count || ""} daire.`,
    openGraph: {
      title: listing.title,
      description:
        listing.short_description ||
        `${listing.neighborhood} · ${listing.room_count || ""} · ${formatPrice(listing.price)}`,
      images: listing.cover_image_url ? [listing.cover_image_url] : [],
      type: "website",
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await getListingBySlug(slug);

  if (!result) notFound();

  const { listing, images } = result;
  const galleryImages =
    images.length > 0
      ? images.map((image) => image.image_url)
      : listing.cover_image_url
        ? [listing.cover_image_url]
        : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const message = encodeURIComponent(
    `Merhaba, ${listing.title} ilanı hakkında bilgi almak istiyorum.

${siteUrl}/ilan/${listing.slug}`,
  );

  const facts = [
    ["Oda", listing.room_count],
    ["Net Alan", listing.area_m2 ? `${listing.area_m2} m²` : null],
    ["Brüt Alan", listing.gross_area_m2 ? `${listing.gross_area_m2} m²` : null],
    ["Kat", listing.floor],
    ["Cephe", listing.facade],
    ["Mutfak", listing.kitchen_type],
  ].filter((item) => item[1]);

  return (
    <>
      <PublicHeader />

      <main className="ap-detail-page">
        <div className="ap-shell">
          <div className="ap-detail-topbar">
            <Link href="/" className="ap-soft-button">← Portföye Dön</Link>
            <FavoriteButton slug={listing.slug} />
          </div>

          <div className="ap-detail-grid">
            <ListingGallery images={galleryImages} title={listing.title} />

            <aside className="ap-detail-panel ap-glass">
              <p className="ap-kicker">{listing.project_name || "AYDEMİR PORTFÖY"}</p>
              <h1 className="ap-detail-title">{listing.title}</h1>
              <p className="ap-detail-location">
                {listing.neighborhood} · {listing.district} · {listing.city}
              </p>

              {listing.short_description ? (
                <p className="ap-detail-description">{listing.short_description}</p>
              ) : null}

              <div className="ap-detail-price-card">
                <small>Satış Fiyatı</small>
                <strong>{formatPrice(listing.price)}</strong>
              </div>

              <div className="ap-action-grid">
                <a href={`tel:${PHONE_LINK}`} className="ap-primary-button">Ara</a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ap-success-button"
                >
                  WhatsApp
                </a>
              </div>
            </aside>
          </div>

          <section className="ap-detail-section ap-glass">
            <h2>İlan Bilgileri</h2>
            <div className="ap-facts-grid">
              {facts.map(([label, value]) => (
                <div className="ap-fact" key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          {listing.description ? (
            <section className="ap-detail-section ap-glass">
              <h2>Açıklama</h2>
              <p className="ap-detail-description">{listing.description}</p>
            </section>
          ) : null}

          {listing.features.length > 0 ? (
            <section className="ap-detail-section ap-glass">
              <h2>Özellikler</h2>
              <div className="ap-features-grid">
                {listing.features.map((feature) => (
                  <div className="ap-feature" key={feature}>
                    <span>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="ap-detail-section ap-glass">
            <h2>Satış İmkânları</h2>
            <div className="ap-sales-grid">
              {listing.credit_available ? <div className="ap-sales-item">✓ Kredi imkânı</div> : null}
              {listing.exchange_available ? <div className="ap-sales-item">✓ Takas imkânı</div> : null}
              {listing.commission_free ? <div className="ap-sales-item">✓ Komisyonsuz firma satışı</div> : null}
            </div>
          </section>
        </div>

        <div className="ap-mobile-contact">
          <a href={`tel:${PHONE_LINK}`} className="ap-primary-button">Ara</a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="ap-success-button"
          >
            WhatsApp
          </a>
        </div>
      </main>
    </>
  );
}
