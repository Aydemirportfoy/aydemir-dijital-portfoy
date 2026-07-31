"use client";

import { useEffect, useState } from "react";

const PHONE_NUMBER = "+905404175353";
const WHATSAPP_NUMBER = "905404175353";

const listings = [
  {
    id: 1,
    title: "Yakut Konutları",
    neighborhood: "Demirel Mahallesi",
    rooms: "2+1",
    price: "5.500.000 TL",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 2,
    title: "Safir Konutları",
    neighborhood: "Aydoğmuş Mahallesi",
    rooms: "2+1",
    price: "6.250.000 TL",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: 3,
    title: "Aydemir Konsept",
    neighborhood: "Ayanoğlu Mahallesi",
    rooms: "3+1",
    price: "8.750.000 TL",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  },
];

export default function CustomerPresentationPage() {
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aydemir-favorites");

    if (!savedFavorites) {
      return;
    }

    try {
      const parsedFavorites = JSON.parse(savedFavorites);

      if (Array.isArray(parsedFavorites)) {
        setFavorites(parsedFavorites);
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  function openPresentation() {
    setLeaving(true);

    window.setTimeout(() => {
      setStarted(true);
    }, 350);
  }

  function toggleFavorite(id: number) {
    setFavorites((currentFavorites) => {
      const nextFavorites = currentFavorites.includes(id)
        ? currentFavorites.filter((favoriteId) => favoriteId !== id)
        : [...currentFavorites, id];

      localStorage.setItem(
        "aydemir-favorites",
        JSON.stringify(nextFavorites),
      );

      return nextFavorites;
    });
  }

  async function shareListing(title: string) {
    const url = window.location.href;

    const shareData = {
      title,
      text: `${title} - Aydemir İnşaat`,
      url,
    };

    const isMobile = /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    );

    try {
      if (isMobile && typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);
      window.alert("Sunum bağlantısı kopyalandı.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      window.prompt("Sunum bağlantısını kopyalayın:", url);
    }
  }

  function openWhatsApp(listingTitle: string) {
    const message = encodeURIComponent(
      `${listingTitle} hakkında bilgi almak istiyorum.`,
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function callPhone() {
    window.location.href = `tel:${PHONE_NUMBER}`;
  }

  const visibleListings = showFavorites
    ? listings.filter((listing) => favorites.includes(listing.id))
    : listings;

  if (!started) {
    return (
      <main
        className={`flex min-h-[100svh] items-center justify-center bg-[#F8F6F2] px-6 py-12 text-[#2A2A2A] transition-all duration-[350ms] ${
          leaving
            ? "translate-y-2 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <section className="w-full max-w-xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F6A04D] shadow-[0_22px_55px_rgba(42,42,42,0.14)]">
            <span className="text-3xl font-semibold">A</span>
          </div>

          <p className="mb-5 text-sm font-semibold tracking-[0.28em] text-[#2A2A2A]/55">
            AYDEMİR İNŞAAT
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Size Özel Portföy
          </h1>

          <div className="mx-auto mt-8 max-w-md space-y-4 text-base leading-8 text-[#2A2A2A]/65 sm:text-lg">
            <p>Merhaba Ahmet Bey,</p>

            <p>
              Talep ettiğiniz kriterlere uygun portföyler sizin için özenle
              seçilmiştir.
            </p>

            <p>Keyifli incelemeler dileriz.</p>
          </div>

          <button
            type="button"
            onClick={openPresentation}
            className="mt-10 w-full rounded-[22px] bg-[#F6A04D] px-7 py-5 text-base font-semibold text-[#2A2A2A] shadow-[0_18px_45px_rgba(42,42,42,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(42,42,42,0.17)] active:scale-[0.98]"
          >
            Portföyü Görüntüle
          </button>

          <p className="mt-7 text-sm text-[#2A2A2A]/45">
            Aydemir İnşaat güvencesiyle
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-8 text-[#2A2A2A] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 rounded-[32px] bg-[#F6A04D] p-7 shadow-[0_24px_70px_rgba(42,42,42,0.13)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.22em] text-[#2A2A2A]/60">
            AYDEMİR İNŞAAT
          </p>

          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Ahmet Bey için hazırlanan portföy
              </h1>

              <p className="mt-4 text-[#2A2A2A]/65">
                Talebinize uygun 3 özel seçenek
              </p>
            </div>

            <button
              type="button"
              onClick={() => shareListing("Ahmet Bey için özel portföy")}
              className="rounded-[20px] bg-[#F8F6F2] px-6 py-4 font-semibold shadow-[0_14px_35px_rgba(42,42,42,0.10)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
            >
              Sunumu Paylaş
            </button>
          </div>
        </header>

        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Portföy Seçenekleri
          </h2>

          <button
            type="button"
            onClick={() => setShowFavorites((current) => !current)}
            className={`rounded-[18px] px-5 py-3 text-sm font-semibold transition-all duration-300 ${
              showFavorites
                ? "bg-[#F6A04D] shadow-[0_12px_30px_rgba(42,42,42,0.12)]"
                : "bg-[#F8F6F2] shadow-[0_12px_30px_rgba(42,42,42,0.09)]"
            }`}
          >
            {showFavorites
              ? "Tümünü Göster"
              : `Favorilerim (${favorites.length})`}
          </button>
        </div>

        {visibleListings.length === 0 ? (
          <div className="rounded-[32px] bg-[#F8F6F2] px-6 py-16 text-center shadow-[0_22px_65px_rgba(42,42,42,0.10)]">
            <p className="text-xl font-semibold">
              Henüz favori portföyünüz bulunmuyor.
            </p>
          </div>
        ) : (
          <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {visibleListings.map((listing) => {
              const isFavorite = favorites.includes(listing.id);

              return (
                <article
                  key={listing.id}
                  className="group overflow-hidden rounded-[32px] bg-[#F8F6F2] p-4 shadow-[0_24px_70px_rgba(42,42,42,0.12)] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden rounded-[26px]">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />

                    <span className="absolute bottom-4 left-4 rounded-full bg-[#F6A04D] px-4 py-2 text-sm font-semibold shadow-[0_10px_25px_rgba(42,42,42,0.12)]">
                      {listing.rooms}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(listing.id)}
                      aria-label={
                        isFavorite
                          ? "Favorilerden kaldır"
                          : "Favoriye ekle"
                      }
                      aria-pressed={isFavorite}
                      className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F2] text-2xl shadow-[0_12px_30px_rgba(42,42,42,0.14)] transition-transform duration-300 hover:scale-105 active:scale-95"
                    >
                      {isFavorite ? "♥" : "♡"}
                    </button>
                  </div>

                  <div className="px-2 pb-2 pt-6">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                      {listing.title}
                    </h3>

                    <p className="mt-2 text-[#2A2A2A]/55">
                      {listing.neighborhood}
                    </p>

                    <p className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
                      {listing.price}
                    </p>

                    <button
                      type="button"
                      className="mt-6 w-full rounded-[20px] bg-[#F6A04D] px-5 py-4 font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      Detayları Gör
                    </button>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => openWhatsApp(listing.title)}
                        className="rounded-[18px] bg-[#F8F6F2] px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(42,42,42,0.09)] transition-transform duration-300 active:scale-95"
                      >
                        WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={callPhone}
                        className="rounded-[18px] bg-[#F8F6F2] px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(42,42,42,0.09)] transition-transform duration-300 active:scale-95"
                      >
                        Ara
                      </button>

                      <button
                        type="button"
                        onClick={() => shareListing(listing.title)}
                        className="rounded-[18px] bg-[#F8F6F2] px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(42,42,42,0.09)] transition-transform duration-300 active:scale-95"
                      >
                        Paylaş
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="py-12 text-center text-sm text-[#2A2A2A]/45">
          Aydemir İnşaat güvencesiyle
        </footer>
      </div>
    </main>
  );
}