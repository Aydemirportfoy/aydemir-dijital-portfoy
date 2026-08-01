"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type Listing = {
  id: string;
  project_name: string | null;
  slug: string;
  title: string;
  neighborhood: string;
  district: string | null;
  city: string | null;
  room_count: string | null;
  area_m2: number | null;
  price: number | null;
  status: "draft" | "active" | "reserved" | "sold";
  cover_image_url: string | null;
  created_at: string | null;
  commission_free: boolean | null;
};

type ListingImage = {
  storage_path: string;
};

const statusLabels: Record<Listing["status"], string> = {
  draft: "Taslak",
  active: "Aktif",
  reserved: "Rezerve",
  sold: "Satıldı",
};

const statusClasses: Record<Listing["status"], string> = {
  draft: "bg-[#2A2A2A]/10 text-[#2A2A2A]",
  active: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-rose-100 text-rose-800",
};

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return "Fiyat belirtilmedi";
  }

  return `${new Intl.NumberFormat("tr-TR").format(value)} TL`;
}

export default function ListingsManager() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadListings() {
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, project_name, slug, title, neighborhood, district, city, room_count, area_m2, price, status, cover_image_url, created_at, commission_free",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`İlanlar yüklenemedi: ${error.message}`);
      setListings([]);
    } else {
      setListings((data ?? []) as Listing[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadListings();
  }, []);

  async function deleteListing(listing: Listing) {
    const approved = window.confirm(
      `"${listing.title}" ilanını kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve fotoğraflar da silinir.`,
    );

    if (!approved) {
      return;
    }

    setDeletingId(listing.id);
    setMessage("");

    const supabase = createClient();

    try {
      const { data: imageRows, error: imageReadError } = await supabase
        .from("listing_images")
        .select("storage_path")
        .eq("listing_id", listing.id);

      if (imageReadError) {
        throw new Error(
          `Fotoğraf kayıtları okunamadı: ${imageReadError.message}`,
        );
      }

      const storagePaths = ((imageRows ?? []) as ListingImage[])
        .map((image) => image.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("listing-images")
          .remove(storagePaths);

        if (storageError) {
          throw new Error(
            `Fotoğraflar silinemedi: ${storageError.message}`,
          );
        }
      }

      const { error: privateError } = await supabase
        .from("listing_private_details")
        .delete()
        .eq("listing_id", listing.id);

      if (privateError) {
        throw new Error(
          `Gizli konum bilgisi silinemedi: ${privateError.message}`,
        );
      }

      const { error: imagesError } = await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", listing.id);

      if (imagesError) {
        throw new Error(
          `Fotoğraf kayıtları silinemedi: ${imagesError.message}`,
        );
      }

      const { error: listingError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);

      if (listingError) {
        throw new Error(`İlan silinemedi: ${listingError.message}`);
      }

      setListings((current) =>
        current.filter((item) => item.id !== listing.id),
      );
      setMessage("İlan ve fotoğrafları başarıyla silindi.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "İlan silinirken bilinmeyen bir hata oluştu.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-8 text-[#2A2A2A] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[32px] bg-[#F6A04D] p-7 shadow-[0_24px_70px_rgba(42,42,42,0.13)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.22em] text-[#2A2A2A]/60">
            AYDEMİR İNŞAAT
          </p>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Kayıtlı İlanlar
              </h1>
              <p className="mt-4 text-[#2A2A2A]/65">
                Supabase’e kaydedilen tüm ilanları buradan yönetebilirsiniz.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/yonetim")}
                className="rounded-[20px] bg-[#F8F6F2] px-6 py-4 font-semibold shadow-[0_14px_35px_rgba(42,42,42,0.10)]"
              >
                Yönetim Alanı
              </button>

              <button
                type="button"
                onClick={() => router.push("/yonetim/yeni-ilan")}
                className="rounded-[20px] bg-[#2A2A2A] px-6 py-4 font-semibold text-[#F8F6F2] shadow-[0_14px_35px_rgba(42,42,42,0.14)]"
              >
                Yeni İlan Ekle
              </button>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-6 rounded-[22px] bg-[#2A2A2A] px-5 py-4 text-[#F8F6F2]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <section className="mt-8 rounded-[30px] bg-white p-8 text-center shadow-[0_20px_60px_rgba(42,42,42,0.10)]">
            İlanlar yükleniyor...
          </section>
        ) : listings.length === 0 ? (
          <section className="mt-8 rounded-[30px] bg-white p-8 text-center shadow-[0_20px_60px_rgba(42,42,42,0.10)]">
            <h2 className="text-2xl font-semibold">Henüz kayıtlı ilan yok</h2>
            <p className="mt-3 text-[#2A2A2A]/60">
              Yeni İlan Ekle butonundan ilk ilanınızı oluşturabilirsiniz.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-[30px] bg-white shadow-[0_22px_65px_rgba(42,42,42,0.11)]"
              >
                <div className="relative">
                  {listing.cover_image_url ? (
                    <img
                      src={listing.cover_image_url}
                      alt={listing.title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#2A2A2A]/5 text-[#2A2A2A]/45">
                      Kapak fotoğrafı yok
                    </div>
                  )}

                  {listing.commission_free ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#F6A04D] px-3 py-1.5 text-xs font-semibold shadow-[0_8px_22px_rgba(42,42,42,0.18)]">
                      Komisyonsuz Firma Satışı
                    </span>
                  ) : null}

                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[listing.status]}`}
                  >
                    {statusLabels[listing.status]}
                  </span>
                </div>

                <div className="p-6">
                  {listing.project_name ? (
                    <p className="text-sm font-semibold tracking-[0.14em] text-[#2A2A2A]/45">
                      {listing.project_name}
                    </p>
                  ) : null}

                  <h2 className="mt-2 text-2xl font-semibold leading-tight">
                    {listing.title}
                  </h2>

                  <p className="mt-3 text-[#2A2A2A]/60">
                    {listing.neighborhood}
                    {listing.district ? ` • ${listing.district}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
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
                  </div>

                  <p className="mt-5 text-2xl font-semibold">
                    {formatPrice(listing.price)}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/yonetim/ilan-duzenle/${listing.id}`,
                        )
                      }
                      className="rounded-[18px] bg-[#F6A04D] px-4 py-3 font-semibold"
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteListing(listing)}
                      disabled={deletingId === listing.id}
                      className="rounded-[18px] border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 shadow-[0_10px_25px_rgba(42,42,42,0.08)] transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === listing.id
                        ? "Siliniyor..."
                        : "Sil"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
