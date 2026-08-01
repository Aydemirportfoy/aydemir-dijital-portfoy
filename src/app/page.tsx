import type { Metadata } from "next";
import Link from "next/link";
import {
  formatListingPrice,
  getActiveListings,
} from "../lib/public-listings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Aydemir İnşaat | Dijital Portföy",
  description:
    "Aydemir İnşaat aktif satılık daire ve proje portföyü.",
};

export default async function HomePage() {
  const listings = await getActiveListings();

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-6 text-[#2A2A2A] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[34px] bg-[#F6A04D] p-7 shadow-[0_26px_80px_rgba(42,42,42,0.14)] sm:p-10 lg:p-12">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#2A2A2A]/60">
            AYDEMİR İNŞAAT
          </p>

          <div className="mt-6 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Güncel Gayrimenkul Portföyü
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#2A2A2A]/65">
                Antalya Kepez bölgesindeki aktif daire ve proje seçeneklerini inceleyin.
              </p>
            </div>

            <a
              href="https://wa.me/905404175353"
              target="_blank"
              rel="noreferrer"
              className="inline-flex justify-center rounded-[20px] bg-white px-7 py-4 font-semibold text-[#2A2A2A] shadow-[0_16px_40px_rgba(42,42,42,0.12)] transition hover:-translate-y-1"
            >
              WhatsApp ile İletişim
            </a>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.20em] text-[#2A2A2A]/45">
                AKTİF İLANLAR
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Satıştaki Portföyler
              </h2>
            </div>

            <p className="text-[#2A2A2A]/55">
              {listings.length} aktif ilan
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-[30px] bg-white p-8 text-center shadow-[0_20px_60px_rgba(42,42,42,0.10)]">
              <h3 className="text-2xl font-semibold">
                Şu anda aktif ilan bulunmuyor
              </h3>

              <p className="mt-3 text-[#2A2A2A]/60">
                Yeni portföyler eklendiğinde burada görüntülenecektir.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/ilan/${listing.slug}`}
                  className="group overflow-hidden rounded-[30px] bg-white shadow-[0_22px_65px_rgba(42,42,42,0.11)] transition duration-300 hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    {listing.cover_image_url ? (
                      <img
                        src={listing.cover_image_url}
                        alt={listing.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-[#2A2A2A]/5 text-[#2A2A2A]/45">
                        Kapak fotoğrafı yok
                      </div>
                    )}

                    {listing.commission_free ? (
                      <span className="absolute left-4 top-4 rounded-full bg-[#F6A04D] px-4 py-2 text-xs font-semibold text-[#2A2A2A] shadow-[0_10px_28px_rgba(42,42,42,0.18)]">
                        Komisyonsuz Firma Satışı
                      </span>
                    ) : null}
                  </div>

                  <div className="p-6">
                    {listing.project_name ? (
                      <p className="text-sm font-semibold tracking-[0.14em] text-[#2A2A2A]/45">
                        {listing.project_name}
                      </p>
                    ) : null}

                    <h3 className="mt-2 text-2xl font-semibold leading-tight">
                      {listing.title}
                    </h3>

                    <p className="mt-3 text-[#2A2A2A]/60">
                      {listing.neighborhood}
                      {listing.district
                        ? ` • ${listing.district}`
                        : ""}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {listing.room_count ? (
                        <span className="rounded-full bg-[#F6A04D]/20 px-3 py-2 text-sm font-semibold">
                          {listing.room_count}
                        </span>
                      ) : null}

                      {listing.area_m2 ? (
                        <span className="rounded-full bg-[#2A2A2A]/5 px-3 py-2 text-sm font-semibold">
                          {listing.area_m2} m²
                        </span>
                      ) : null}

                      {listing.kitchen_type ? (
                        <span className="rounded-full bg-[#2A2A2A]/5 px-3 py-2 text-sm font-semibold">
                          {listing.kitchen_type}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-6 text-2xl font-semibold">
                      {formatListingPrice(listing.price)}
                    </p>

                    <div className="mt-6 rounded-[18px] bg-[#F6A04D] px-5 py-4 text-center font-semibold">
                      İlanı İncele
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <footer className="py-12 text-center text-sm text-[#2A2A2A]/45">
          Aydemir İnşaat güvencesiyle
        </footer>
      </div>
    </main>
  );
}
