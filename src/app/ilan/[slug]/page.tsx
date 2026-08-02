import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import CollapsibleDescription from "@/components/CollapsibleDescription";
import { getListingBySlug } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import {
  PHONE_LINK,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    media?: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const result =
    await getListingBySlug(slug);

  if (!result) {
    return {
      title: "Ä°lan bulunamadÄ±",
    };
  }

  const { listing } = result;

  return {
    title: listing.title,
    description:
      listing.short_description ||
      `${listing.neighborhood}, ` +
        `${listing.district} bÃ¶lgesinde ` +
        `${listing.room_count || ""} daire.`,
    openGraph: {
      title: listing.title,
      description:
        listing.short_description ||
        `${listing.neighborhood} Â· ` +
          `${listing.room_count || ""} Â· ` +
          `${formatPrice(listing.price)}`,
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
  const [{ slug }, query] =
    await Promise.all([
      params,
      searchParams ??
        Promise.resolve({}),
    ]);
  const result =
    await getListingBySlug(slug);

  if (!result) {
    notFound();
  }

  const { listing, images } = result;

  const galleryImages =
    images.length > 0
      ? images.map(
          (image) => image.image_url,
        )
      : listing.cover_image_url
        ? [listing.cover_image_url]
        : [];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const message = encodeURIComponent(
    `Merhaba, ${listing.title} ilanÄ± ` +
      `hakkÄ±nda bilgi almak istiyorum.` +
      `\n\n${siteUrl}/ilan/${listing.slug}`,
  );

  const facts = [
    ["Oda", listing.room_count],
    [
      "Metrekare",
      listing.area_m2
        ? `${listing.area_m2} mÂ²`
        : null,
    ],
    ["Kat", listing.floor],
    ["Cephe", listing.facade],
    ["Mutfak", listing.kitchen_type],
  ].filter((item) => item[1]);

  const features =
    listing.features ?? [];

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
              â† PortfÃ¶ye DÃ¶n
            </Link>

            <FavoriteButton
              slug={listing.slug}
            />
          </div>

          <div className="ap-detail-grid">
            <div className="ap-media-column">
              <ListingGallery
                images={galleryImages}
                title={listing.title}
                videoUrl={
                  listing.listing_video_url
                }
                initialMode={
                  (query as { media?: string }).media === "video" &&
                  listing.listing_video_url
                    ? "video"
                    : "photo"
                }
              />
            </div>

            <aside className="ap-detail-panel ap-glass">
              <p className="ap-kicker">
                {listing.project_name ||
                  "AYDEMÄ°R PORTFÃ–Y"}
              </p>

              <h1 className="ap-detail-title">
                {listing.title}
              </h1>

              <p className="ap-detail-location">
                {listing.neighborhood} Â·{" "}
                {listing.district} Â·{" "}
                {listing.city}
              </p>

              {listing.short_description ? (
                <p className="ap-detail-description">
                  {
                    listing.short_description
                  }
                </p>
              ) : null}

              <div className="ap-detail-price-card">
                <small>SatÄ±ÅŸ FiyatÄ±</small>
                <strong>
                  {formatPrice(
                    listing.price,
                  )}
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
                  href={
                    `https://wa.me/` +
                    `${WHATSAPP_NUMBER}` +
                    `?text=${message}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="ap-success-button"
                >
                  WhatsApp
                </a>
              </div>
            </aside>
          </div>

          <section className="ap-compact-facts ap-glass">
            {facts.map(
              ([label, value]) => (
                <div
                  className="ap-compact-fact"
                  key={String(label)}
                >
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ),
            )}
          </section>

          <section className="ap-premium-detail-cards">
            <article className="ap-premium-info-card ap-glass">
              <p className="ap-kicker">
                Ä°LAN DETAYLARI
              </p>
              <h2>AÃ§Ä±klama</h2>

              {listing.description ? (
                <CollapsibleDescription
                  text={listing.description}
                />
              ) : (
                <p className="ap-muted">
                  Bu ilan iÃ§in henÃ¼z aÃ§Ä±klama
                  eklenmemiÅŸ.
                </p>
              )}
            </article>

            <article className="ap-premium-info-card ap-glass">
              <p className="ap-kicker">
                Ã–NE Ã‡IKANLAR
              </p>
              <h2>Ã–zellikler</h2>

              {features.length > 0 ? (
                <div className="ap-premium-feature-grid">
                  {features.map(
                    (feature) => (
                      <div
                        className="ap-premium-feature"
                        key={feature}
                      >
                        <span>âœ“</span>
                        {feature}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="ap-muted">
                  Ã–zellik bilgisi bulunmuyor.
                </p>
              )}
            </article>

            <article className="ap-premium-info-card ap-glass">
              <p className="ap-kicker">
                BÃ–LGE VE SATIÅ
              </p>
              <h2>Konum</h2>

              <div className="ap-location-stack">
                <div>
                  <span>Mahalle</span>
                  <strong>
                    {listing.neighborhood}
                  </strong>
                </div>
                <div>
                  <span>Ä°lÃ§e</span>
                  <strong>
                    {listing.district}
                  </strong>
                </div>
                <div>
                  <span>Åehir</span>
                  <strong>
                    {listing.city}
                  </strong>
                </div>
              </div>

              <div className="ap-premium-sales">
                {listing.credit_available ? (
                  <span>âœ“ Kredi</span>
                ) : null}

                {listing.exchange_available ? (
                  <span>âœ“ Takas</span>
                ) : null}

                {listing.commission_free ? (
                  <span>âœ“ Komisyonsuz</span>
                ) : null}
              </div>
            </article>
          </section>
        </div>

        <div className="ap-mobile-contact">
          <a
            href={`tel:${PHONE_LINK}`}
            className="ap-primary-button"
          >
            Ara
          </a>

          <a
            href={
              `https://wa.me/` +
              `${WHATSAPP_NUMBER}` +
              `?text=${message}`
            }
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

