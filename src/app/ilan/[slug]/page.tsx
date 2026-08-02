import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ListingGallery from "./ListingGallery";
import {
  formatListingPrice,
  getActiveListingBySlug,
  getPublicListingImages,
} from "../../../lib/public-listings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://aydemir-dijital-portfoy.vercel.app";

type ListingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing =
    await getActiveListingBySlug(slug);

  if (!listing) {
    return {
      title: "İlan Bulunamadı | Aydemir İnşaat",
    };
  }

  const price =
    formatListingPrice(listing.price);

  const description =
    listing.short_description ??
    `${listing.neighborhood} bölgesinde ${listing.room_count ?? ""} satılık daire. ${price}`;

  const url =
    `${SITE_URL}/ilan/${listing.slug}`;

  return {
    title: `${listing.title} | Aydemir İnşaat`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: "Aydemir İnşaat",
      title: listing.title,
      description,
      images: listing.cover_image_url
        ? [
            {
              url: listing.cover_image_url,
              alt: listing.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description,
      images: listing.cover_image_url
        ? [listing.cover_image_url]
        : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingPageProps) {
  const { slug } = await params;
  const listing =
    await getActiveListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const images =
    await getPublicListingImages(listing.id);

  const orderedImages =
    images.length > 0
      ? images
      : listing.cover_image_url
        ? [
            {
              id: "cover",
              image_url: listing.cover_image_url,
              alt_text: listing.title,
              position: 0,
              is_cover: true,
            },
          ]
        : [];

  const price =
    formatListingPrice(listing.price);

  const whatsappMessage =
    encodeURIComponent(
      `Merhaba, ${listing.title} ilanı hakkında bilgi almak istiyorum. ${SITE_URL}/ilan/${listing.slug}`,
    );

  const detailItems = [
    listing.room_count
      ? {
          label: "Oda Sayısı",
          value: listing.room_count,
        }
      : null,
    listing.area_m2
      ? {
          label: "Metrekare",
          value: `${listing.area_m2} m²`,
        }
      : null,
    listing.floor
      ? {
          label: "Kat",
          value: listing.floor,
        }
      : null,
    listing.facade
      ? {
          label: "Cephe",
          value: listing.facade,
        }
      : null,
    listing.kitchen_type
      ? {
          label: "Mutfak Tipi",
          value: listing.kitchen_type,
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
    } => Boolean(item),
  );

  const salesOptions = [
    listing.credit_available
      ? "Kredi İmkânı"
      : null,
    listing.exchange_available
      ? "Takas İmkânı"
      : null,
    listing.commission_free
      ? "Komisyonsuz Firma Satışı"
      : null,
  ].filter(
    (item): item is string =>
      Boolean(item),
  );

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-5 text-[#2A2A2A] sm:px-8 sm:py-9 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center rounded-[16px] border border-[#F6A04D]/25 bg-[#F6A04D]/10 px-4 py-2.5 text-sm font-semibold text-[#2A2A2A] shadow-[0_10px_26px_rgba(42,42,42,0.07)] transition hover:bg-[#F6A04D]/15"
        >
          Portföye Dön
        </Link>

        <article className="overflow-hidden rounded-[30px] bg-white p-3 shadow-[0_28px_85px_rgba(42,42,42,0.13)] sm:p-5">
          <ListingGallery
            images={orderedImages}
            title={listing.title}
            commissionFree={
              listing.commission_free
            }
          />

          <div className="grid gap-8 px-1 pb-2 pt-8 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <p className="inline-flex rounded-[14px] border border-[#F6A04D]/25 bg-[#F6A04D]/10 px-3 py-2 text-xs font-semibold tracking-[0.16em] text-[#2A2A2A]/65">
                {listing.project_name ??
                  "AYDEMİR İNŞAAT"}
              </p>

              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {listing.title}
              </h1>

              <p className="mt-2.5 text-sm text-[#2A2A2A]/60 sm:text-base">
                {listing.neighborhood}
                {listing.district
                  ? ` • ${listing.district}`
                  : ""}
                {listing.city
                  ? ` • ${listing.city}`
                  : ""}
              </p>

              {listing.short_description ? (
                <p className="mt-5 text-base leading-7 text-[#2A2A2A]/70">
                  {
                    listing.short_description
                  }
                </p>
              ) : null}

              {detailItems.length > 0 ? (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold">
                    İlan Detayları
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-2 [min-width:430px]:grid-cols-3">
                    {detailItems.map(
                      (item) => (
                        <div
                          key={item.label}
                          className="rounded-[16px] border border-[#F6A04D]/25 bg-[#F6A04D]/10 p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2A2A2A]/45">
                            {item.label}
                          </p>

                          <p className="mt-1.5 text-sm font-semibold sm:text-base">
                            {item.value}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              ) : null}

              {listing.description ? (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold">
                    İlan Açıklaması
                  </h2>

                  <div className="mt-4 rounded-[18px] bg-[#F8F6F2] p-4">
                    <p className="whitespace-pre-line text-sm leading-7 text-[#2A2A2A]/65 sm:text-base">
                      {listing.description}
                    </p>
                  </div>
                </section>
              ) : null}

              {listing.features.length >
              0 ? (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold">
                    Özellikler
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-2 [min-width:430px]:grid-cols-3">
                    {listing.features.map(
                      (feature) => (
                        <div
                          key={feature}
                          className="flex min-h-[54px] items-center gap-2 rounded-[15px] border border-[#2A2A2A]/8 bg-[#F8F6F2] px-3 py-2.5"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6A04D]/20 text-xs font-semibold text-[#D97716]">
                            ✓
                          </span>

                          <span className="text-xs font-medium leading-4 sm:text-sm">
                            {feature}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              ) : null}

              {salesOptions.length > 0 ? (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold">
                    Satış İmkânları
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-2 [min-width:430px]:grid-cols-3">
                    {salesOptions.map(
                      (option) => (
                        <div
                          key={option}
                          className="flex min-h-[54px] items-center gap-2 rounded-[15px] border border-[#F6A04D]/25 bg-[#F6A04D]/10 px-3 py-2.5"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6A04D] text-xs font-semibold text-[#2A2A2A]">
                            ✓
                          </span>

                          <span className="text-xs font-semibold leading-4 sm:text-sm">
                            {option}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="rounded-[24px] border border-[#F6A04D]/55 bg-white/80 p-5 shadow-[0_20px_58px_rgba(42,42,42,0.10)] lg:sticky lg:top-6">
              <div className="h-1 w-12 rounded-full bg-[#F6A04D]" />

              <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-[#2A2A2A]/45">
                FİYAT
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                {price}
              </p>

              <div className="mt-6 grid gap-3">
                <a
                  href={`https://wa.me/905404175353?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[17px] bg-[#F6A04D] px-5 py-4 text-center font-semibold text-[#2A2A2A] shadow-[0_14px_34px_rgba(246,160,77,0.24)]"
                >
                  WhatsApp’tan Bilgi Al
                </a>

                <a
                  href="tel:+905404175353"
                  className="rounded-[17px] bg-[#F8F6F2] px-5 py-4 text-center font-semibold"
                >
                  0540 417 53 53
                </a>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#2A2A2A]/50">
                Detaylı bilgi ve yerinde görmek için bizimle iletişime geçebilirsiniz.
              </p>
            </aside>
          </div>
        </article>

        <footer className="py-9 text-center text-sm text-[#2A2A2A]/45">
          Aydemir İnşaat güvencesiyle
        </footer>
      </div>
    </main>
  );
}
