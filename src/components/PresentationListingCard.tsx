"use client";

import Link from "next/link";
import {
  formatPrice,
} from "@/lib/format";
import type {
  Listing,
} from "@/lib/types";
import PresentationCardGallery from "@/components/PresentationCardGallery";

export default function PresentationListingCard({
  listing,
  index,
}: {
  listing: Listing;
  index: number;
}) {
  const detailUrl =
    `/ilan/${listing.slug}`;

  const rawVideoUrl =
    listing.listing_video_url ||
    (
      listing as Listing & {
        video_url?: string | null;
      }
    ).video_url ||
    null;

  const videoUrl =
    rawVideoUrl
      ? `${detailUrl}?media=video`
      : null;

  return (
    <article className="ap-presentation-listing-card ap-presentation-card-v2">
      <div className="ap-presentation-card-glow" />

      <PresentationCardGallery
        listingId={listing.id}
        title={listing.title}
        coverImageUrl={
          listing.cover_image_url
        }
        index={index}
        commissionFree={
          listing.commission_free
        }
        videoUrl={videoUrl}
      />

      <Link
        href={detailUrl}
        className="ap-presentation-card-link"
        aria-label={`${listing.title} ilanını aç`}
      >
        <div className="ap-presentation-card-body">
          <div className="ap-presentation-title-panel">
            <p className="ap-presentation-card-project">
              {listing.project_name ||
                "AYDEMİR PORTFÖY"}
            </p>

            <h2>
              {listing.title}
            </h2>

            <p className="ap-presentation-card-location">
              {listing.neighborhood} ·{" "}
              {listing.district} ·{" "}
              {listing.city}
            </p>
          </div>

          <div className="ap-presentation-card-facts">
            {listing.room_count ? (
              <span>
                <small>Oda</small>
                <strong>
                  {listing.room_count}
                </strong>
              </span>
            ) : null}

            {listing.area_m2 ? (
              <span>
                <small>Alan</small>
                <strong>
                  {listing.area_m2} m²
                </strong>
              </span>
            ) : null}

            {listing.kitchen_type ? (
              <span>
                <small>Mutfak</small>
                <strong>
                  {listing.kitchen_type}
                </strong>
              </span>
            ) : null}
          </div>

          <div className="ap-presentation-card-footer">
            <div>
              <small>
                Satış Fiyatı
              </small>

              <strong>
                {formatPrice(
                  listing.price,
                )}
              </strong>
            </div>

            <span className="ap-presentation-card-arrow">
              ↗
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
