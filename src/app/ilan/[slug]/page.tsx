import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import PremiumDetailCards from "@/components/PremiumDetailCards";
import { getListingBySlug } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import {
  PHONE_LINK,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  media?: string;
};

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<SearchParams>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getListingBySlug(slug);

  if (!result) {
    return {
      title: "İlan bulunamadı",
    };
  }

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
      images: listing.cover_image_url
        ? [listing.cover_image_url]
        : [],
      type: "website",
    },
  };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;

  const query: SearchParams = searchParams
    ? await searchParams
    : {};

  const result = await getListingBySlug(slug);

  if (!result) {
    notFound();
  }

  const { listing, images } = result;

  const galleryImages =
    images.length > 0
      ? images.map((image) => image.image_url)
      : listing.cover_image_url
        ? [listing.cover_image_url]
        : [];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const message = encodeURIComponent(
    `Merhaba, ${listing.title} ilanı hakkında bilgi almak istiyorum.\n\n${siteUrl}/ilan/${listing.slug}`,
  );

  const facts = [
    ["Oda", listing.room_count],
    [
      "Metrekare",
      listing.area_m2
        ? `${listing.area_m2} m²`
        : null,
    ],
    ["Kat", listing.floor],
    ["Mutfak", listing.kitchen_type],
  ].filter((item) => item[1]);

  const features = listing.features ?? [];

  return (
    <>
      <PublicHeader />

      <main className="ap-detail-page">
        <div className="ap-shell">
          <div className="ap-detail-topbar">
            <Link
              href="/"
              className="ap-soft-button"
            >
              ← Portföye Dön
            </Link>

            <FavoriteButton slug={listing.slug} />
          </div>

          <div className="ap-detail-grid">
            <div className="ap-media-column">
              <ListingGallery
                images={galleryImages}
                title={listing.title}
                videoUrl={listing.listing_video_url}
                initialMode={
                  query.media === "video" &&
                  listing.listing_video_url
                    ? "video"
                    : "photo"
                }
              />
            </div>

            <aside className="ap-detail-panel ap-glass">
              <p className="ap-kicker">
                {listing.project_name ||
                  "AYDEMİR PORTFÖY"}
              </p>

              <h1 className="ap-detail-title">
                {listing.title}
              </h1>

              <section className="ap-title-facts">
                {facts.map(([label, value]) => (
                  <div
                    className="ap-title-fact"
                    key={String(label)}
                  >
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </section>

              <div className="ap-detail-location-box">
                <span>Konum</span>
                <strong>
                  {listing.neighborhood} ·{" "}
                  {listing.district} ·{" "}
                  {listing.city}
                </strong>
              </div>

              {listing.short_description ? (
                <div className="ap-short-summary-card">
                  <span>Kısa Bilgi</span>
                  <p>{listing.short_description}</p>
                </div>
              ) : null}

              <div className="ap-main-sales-badges">
                {listing.credit_available ? (
                  <span>✓ Kredi İmkânı</span>
                ) : null}

                {listing.exchange_available ? (
                  <span>✓ Takas İmkânı</span>
                ) : null}

                {listing.commission_free ? (
                  <span>✓ Komisyonsuz Firma Satışı</span>
                ) : null}
              </div>

              <div className="ap-detail-price-card">
                <small>Satış Fiyatı</small>
                <strong>
                  {formatPrice(listing.price)}
                </strong>
              </div>

              <div className="ap-action-grid">
                <a
                  href={`tel:${PHONE_LINK}`}
                  className="ap-primary-button"
                >
                  Ara
                </a>

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

          <PremiumDetailCards
            description={listing.description}
            features={features}
            neighborhood={listing.neighborhood}
            district={listing.district}
            city={listing.city}
            facade={listing.facade}
          />
        </div>

        <div className="ap-mobile-contact">
          <a
            href={`tel:${PHONE_LINK}`}
            className="ap-primary-button"
          >
            Ara
          </a>

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
