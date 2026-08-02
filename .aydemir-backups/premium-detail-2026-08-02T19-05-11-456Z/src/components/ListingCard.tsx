import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default function ListingCard({
  listing,
  index,
}: {
  listing: Listing;
  index?: number;
}) {
  const detailUrl =
    `/ilan/${listing.slug}`;

  const videoUrl =
    `${detailUrl}?media=video`;

  return (
    <article className="ap-listing-card">
      <Link
        href={detailUrl}
        className="ap-listing-card-link"
        aria-label={`${listing.title} ilanını aç`}
      >
        <div className="ap-listing-card-media">
          {listing.cover_image_url ? (
            <img
              src={listing.cover_image_url}
              alt={listing.title}
              loading="lazy"
            />
          ) : (
            <div className="ap-image-empty">
              Kapak fotoğrafı yok
            </div>
          )}

          {typeof index === "number" ? (
            <span className="ap-card-index">
              {index + 1}
            </span>
          ) : null}

          {listing.commission_free ? (
            <span className="ap-card-chip">
              Komisyonsuz
            </span>
          ) : null}
        </div>

        <div className="ap-listing-card-body">
          <p className="ap-kicker">
            {listing.project_name ||
              "AYDEMİR PORTFÖY"}
          </p>

          <h2>{listing.title}</h2>

          <p className="ap-muted">
            {listing.neighborhood} ·{" "}
            {listing.district} ·{" "}
            {listing.city}
          </p>

          <div className="ap-pill-row">
            {listing.room_count ? (
              <span className="ap-pill">
                {listing.room_count}
              </span>
            ) : null}

            {listing.area_m2 ? (
              <span className="ap-pill">
                {listing.area_m2} m²
              </span>
            ) : null}

            {listing.kitchen_type ? (
              <span className="ap-pill">
                {listing.kitchen_type}
              </span>
            ) : null}
          </div>

          <div className="ap-card-price-row">
            <strong>
              {formatPrice(listing.price)}
            </strong>

            <span className="ap-round-arrow">
              ↗
            </span>
          </div>
        </div>
      </Link>

      {listing.listing_video_url ? (
        <Link
          href={videoUrl}
          className="ap-card-video-link"
          aria-label={`${listing.title} ilan klibini aç`}
        >
          <span>▶</span>
          İlan Klibi
        </Link>
      ) : null}
    </article>
  );
}
