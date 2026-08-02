"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { Listing, ListingStatus } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";

type SortMode = "newest" | "price-asc" | "price-desc" | "title";

export default function ListingsManager({ initialListings }: { initialListings: Listing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ListingStatus>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [working, setWorking] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");

    const result = listings.filter((listing) => {
      const matchesStatus = status === "all" || listing.status === status;
      const haystack = [
        listing.title,
        listing.project_name,
        listing.neighborhood,
        listing.room_count,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return matchesStatus && (!normalized || haystack.includes(normalized));
    });

    return [...result].sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "title") return a.title.localeCompare(b.title, "tr");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [listings, query, status, sort]);

  async function changeStatus(id: string, nextStatus: ListingStatus) {
    setWorking(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      alert(`Durum değiştirilemedi: ${error.message}`);
    } else {
      setListings((current) =>
        current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
      );
      router.refresh();
    }

    setWorking("");
  }

  async function removeListing(listing: Listing) {
    const approved = window.confirm(
      `"${listing.title}" ilanını ve fotoğraflarını kalıcı olarak silmek istiyor musunuz?`,
    );
    if (!approved) return;

    setWorking(listing.id);
    const supabase = createClient();

    const { data: images } = await supabase
      .from("listing_images")
      .select("storage_path")
      .eq("listing_id", listing.id);

    const paths = (images ?? [])
      .map((item) => item.storage_path)
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }

    const { error } = await supabase.from("listings").delete().eq("id", listing.id);

    if (error) {
      alert(`İlan silinemedi: ${error.message}`);
    } else {
      setListings((current) => current.filter((item) => item.id !== listing.id));
    }

    setWorking("");
  }

  return (
    <div className="ap-admin-page">
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">PORTFÖY YÖNETİMİ</p>
          <h1>Kayıtlı İlanlar</h1>
          <p className="ap-muted">
            İlanları bulun, durumunu değiştirin, düzenleyin veya yayından kaldırın.
          </p>
        </div>

        <Link href="/yonetim/yeni-ilan" className="ap-primary-button">
          + Yeni İlan
        </Link>
      </section>

      <section className="ap-toolbar ap-glass">
        <input
          type="search"
          className="ap-input"
          placeholder="Proje, başlık, mahalle veya oda ara..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select className="ap-select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="draft">Taslak</option>
          <option value="reserved">Rezerve</option>
          <option value="sold">Satıldı</option>
        </select>

        <select className="ap-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="newest">En yeni</option>
          <option value="price-asc">Fiyat artan</option>
          <option value="price-desc">Fiyat azalan</option>
          <option value="title">Başlığa göre</option>
        </select>
      </section>

      <div className="ap-result-row">
        <strong>{filtered.length} ilan</strong>
        <span className="ap-muted">Toplam {listings.length} kayıt</span>
      </div>

      {filtered.length === 0 ? (
        <div className="ap-empty-state ap-glass">
          <h2>İlan bulunamadı</h2>
          <p>Arama veya filtreleri değiştirin.</p>
        </div>
      ) : (
        <section className="ap-admin-listing-grid">
          {filtered.map((listing) => (
            <article className="ap-admin-listing-card ap-glass" key={listing.id}>
              <div className="ap-admin-card-image">
                {listing.cover_image_url ? (
                  <img src={listing.cover_image_url} alt={listing.title} />
                ) : (
                  <div className="ap-image-empty">Fotoğraf yok</div>
                )}
                <StatusBadge status={listing.status} />
              </div>

              <div className="ap-admin-card-body">
                <p className="ap-kicker">{listing.project_name || "PROJE"}</p>
                <h2>{listing.title}</h2>
                <p className="ap-muted">
                  {listing.neighborhood} · {listing.room_count || "Oda bilgisi yok"}
                </p>
                <strong className="ap-admin-card-price">{formatPrice(listing.price)}</strong>

                <label className="ap-mini-field">
                  <span>Durum</span>
                  <select
                    value={listing.status}
                    disabled={working === listing.id}
                    onChange={(event) =>
                      changeStatus(listing.id, event.target.value as ListingStatus)
                    }
                  >
                    <option value="active">Aktif</option>
                    <option value="draft">Taslak</option>
                    <option value="reserved">Rezerve</option>
                    <option value="sold">Satıldı</option>
                  </select>
                </label>

                <div className="ap-admin-card-actions">
                  <Link href={`/yonetim/ilan-duzenle/${listing.id}`} className="ap-primary-button small">
                    Düzenle
                  </Link>
                  <Link href={`/ilan/${listing.slug}`} target="_blank" className="ap-soft-button">
                    Görüntüle
                  </Link>
                  <button
                    type="button"
                    className="ap-danger-button"
                    disabled={working === listing.id}
                    onClick={() => removeListing(listing)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
