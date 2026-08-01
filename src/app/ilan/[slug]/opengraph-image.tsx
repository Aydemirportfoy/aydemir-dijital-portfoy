import { ImageResponse } from "next/og";
import { getActiveListingBySlug } from "../../../lib/public-listings";

export const alt = "Aydemir İnşaat ilan görseli";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OpenGraphImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OpenGraphImage({
  params,
}: OpenGraphImageProps) {
  const { slug } = await params;
  const listing = await getActiveListingBySlug(slug);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8F6F2",
            color: "#2A2A2A",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          Aydemir İnşaat
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#F8F6F2",
          color: "#2A2A2A",
        }}
      >
        {listing.cover_image_url ? (
          <img
            src={listing.cover_image_url}
            alt=""
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(42,42,42,0.08) 10%, rgba(42,42,42,0.88) 100%)",
          }}
        />

        {listing.commission_free ? (
          <div
            style={{
              position: "absolute",
              left: 56,
              top: 44,
              display: "flex",
              borderRadius: 999,
              background: "#F6A04D",
              padding: "12px 22px",
              color: "#2A2A2A",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Komisyonsuz Firma Satışı
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 48,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              borderRadius: 999,
              background: "#F6A04D",
              padding: "12px 22px",
              color: "#2A2A2A",
              fontSize: 23,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            AYDEMİR İNŞAAT
          </div>

          <div
            style={{
              display: "flex",
              color: "#F8F6F2",
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {listing.title}
          </div>

          <div
            style={{
              display: "flex",
              color: "#F8F6F2",
              fontSize: 29,
              fontWeight: 600,
            }}
          >
            {listing.neighborhood}
            {listing.room_count
              ? ` • ${listing.room_count}`
              : ""}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
