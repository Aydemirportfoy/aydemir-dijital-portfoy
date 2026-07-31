import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingActions from "../../../components/ListingActions";
import {
  getListingBySlug,
  listings,
} from "../../../lib/listings";

const SITE_URL = "https://aydemir-dijital-portfoy.vercel.app";

type ListingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return listings.map((listing) => ({
    slug: listing.slug,
  }));
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) {
    return {
      title: "İlan Bulunamadı | Aydemir İnşaat",
    };
  }

  const title = `${listing.title} | ${listing.neighborhood}`;
  const description = `${listing.rooms} • ${listing.price} • ${listing.description}`;
  const url = `${SITE_URL}/ilan/${listing.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: "Aydemir İnşaat",
      title,
      description,
      images: [
        {
          url: listing.image,
          width: 1200,
          height: 630,
          alt: `${listing.title} kapak görseli`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [listing.image],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: ListingPageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-6 text-[#2A2A2A] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <a
          href="/sunum/ahmet-bey"
          className="mb-6 inline-flex rounded-[18px] bg-[#F8F6F2] px-5 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(42,42,42,0.09)] transition-all duration-300 hover:-translate-y-0.5"
        >
          Portföye Dön
        </a>

        <article className="overflow-hidden rounded-[32px] bg-[#F8F6F2] p-4 shadow-[0_28px_85px_rgba(42,42,42,0.13)] sm:p-6">
          <div className="overflow-hidden rounded-[28px]">
            <img
              src={listing.image}
              alt={listing.title}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>

          <div className="grid gap-10 px-2 pb-3 pt-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-[#2A2A2A]/55">
                AYDEMİR İNŞAAT
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                {listing.title}
              </h1>

              <p className="mt-4 text-lg text-[#2A2A2A]/60">
                {listing.neighborhood}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F6A04D] px-5 py-3 font-semibold">
                  {listing.rooms}
                </span>

                {listing.features.slice(1).map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-[#F8F6F2] px-5 py-3 text-sm font-semibold shadow-[0_10px_25px_rgba(42,42,42,0.08)]"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-[#2A2A2A]/65">
                {listing.description}
              </p>
            </div>

            <aside className="rounded-[28px] bg-[#F6A04D] p-6 shadow-[0_22px_60px_rgba(42,42,42,0.12)]">
              <p className="text-sm font-semibold tracking-[0.18em] text-[#2A2A2A]/55">
                FİYAT
              </p>

              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                {listing.price}
              </p>

              <div className="mt-7">
                <ListingActions
                  slug={listing.slug}
                  title={listing.title}
                  neighborhood={listing.neighborhood}
                  rooms={listing.rooms}
                  price={listing.price}
                />
              </div>
            </aside>
          </div>
        </article>

        <footer className="py-10 text-center text-sm text-[#2A2A2A]/45">
          Aydemir İnşaat güvencesiyle
        </footer>
      </div>
    </main>
  );
}
