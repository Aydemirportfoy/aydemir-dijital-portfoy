"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type {
  AdminListing,
  ListingStatus,
} from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";

type SortMode =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "title";

const STATUS_OPTIONS: Array<{
  value: "all" | ListingStatus;
  label: string;
}> = [
  { value: "all", label: "Tüm durumlar" },
  { value: "active", label: "Aktif" },
  { value: "draft", label: "Taslak" },
  { value: "reserved", label: "Rezerve" },
  { value: "sold", label: "Satıldı" },
];

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatGrouped(value: string) {
  const clean = digits(value).replace(
    /^0+(?=\d)/,
    "",
  );

  return clean.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );
}

function numberValue(value: string) {
  const clean = digits(value);
  return clean ? Number(clean) : null;
}

function phoneHref(value: string | null) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(
    /[^\d+]/g,
    "",
  );

  return `tel:${normalized}`;
}

function mapsHref(value: string | null) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return (
    "https://www.google.com/maps/search/" +
    `?api=1&query=${encodeURIComponent(trimmed)}`
  );
}

export default function ListingsManager({
  initialListings,
}: {
  initialListings: AdminListing[];
}) {
  const [listings, setListings] =
    useState(initialListings);

  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<"all" | ListingStatus>("all");

  const [neighborhood, setNeighborhood] =
    useState("all");

  const [roomCount, setRoomCount] =
    useState("all");

  const [priceMin, setPriceMin] =
    useState("");

  const [priceMax, setPriceMax] =
    useState("");

  const [sort, setSort] =
    useState<SortMode>("newest");

  const [working, setWorking] =
    useState("");

  const router = useRouter();

  const neighborhoods = useMemo(
    () =>
      Array.from(
        new Set(
          listings
            .map(
              (listing) =>
                listing.neighborhood,
            )
            .filter(Boolean),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [listings],
  );

  const roomCounts = useMemo(
    () =>
      Array.from(
        new Set(
          listings
            .map(
              (listing) =>
                listing.room_count,
            )
            .filter(Boolean) as string[],
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "tr", {
          numeric: true,
        }),
      ),
    [listings],
  );

  const filtered = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase("tr-TR");

    const minimum =
      numberValue(priceMin);

    const maximum =
      numberValue(priceMax);

    const result = listings.filter(
      (listing) => {
        const matchesStatus =
          status === "all" ||
          listing.status === status;

        const matchesNeighborhood =
          neighborhood === "all" ||
          listing.neighborhood ===
            neighborhood;

        const matchesRoom =
          roomCount === "all" ||
          listing.room_count ===
            roomCount;

        const matchesMinimum =
          minimum === null ||
          (listing.price ?? 0) >= minimum;

        const matchesMaximum =
          maximum === null ||
          (listing.price ?? 0) <= maximum;

        const privateDetails =
          listing.private_details;

        const haystack = [
          listing.title,
          listing.project_name,
          listing.neighborhood,
          listing.room_count,
          listing.facade,
          privateDetails?.seller_name,
          privateDetails?.seller_phone,
          privateDetails?.location_note,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return (
          matchesStatus &&
          matchesNeighborhood &&
          matchesRoom &&
          matchesMinimum &&
          matchesMaximum &&
          (!normalized ||
            haystack.includes(normalized))
        );
      },
    );

    return [...result].sort((a, b) => {
      if (sort === "price-asc") {
        return (
          (a.price ?? 0) -
          (b.price ?? 0)
        );
      }

      if (sort === "price-desc") {
        return (
          (b.price ?? 0) -
          (a.price ?? 0)
        );
      }

      if (sort === "title") {
        return a.title.localeCompare(
          b.title,
          "tr",
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    listings,
    neighborhood,
    priceMax,
    priceMin,
    query,
    roomCount,
    sort,
    status,
  ]);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setNeighborhood("all");
    setRoomCount("all");
    setPriceMin("");
    setPriceMax("");
    setSort("newest");
  }

  async function changeStatus(
    id: string,
    nextStatus: ListingStatus,
  ) {
    setWorking(id);

    const supabase = createClient();

    const { error } = await supabase
      .from("listings")
      .update({
        status: nextStatus,
      })
      .eq("id", id);

    if (error) {
      alert(
        `Durum değiştirilemedi: ${error.message}`,
      );
    } else {
      setListings((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );

      router.refresh();
    }

    setWorking("");
  }

  async function removeListing(
    listing: AdminListing,
  ) {
    const approved = window.confirm(
      `"${listing.title}" ilanını ve ` +
        "medyalarını kalıcı olarak silmek " +
        "istiyor musunuz?",
    );

    if (!approved) {
      return;
    }

    setWorking(listing.id);

    const supabase = createClient();

    const { data: images } =
      await supabase
        .from("listing_images")
        .select("storage_path")
        .eq("listing_id", listing.id);

    const imagePaths = (images ?? [])
      .map((item) => item.storage_path)
      .filter(Boolean) as string[];

    if (imagePaths.length > 0) {
      await supabase.storage
        .from("listing-images")
        .remove(imagePaths);
    }

    if (
      listing.listing_video_storage_path
    ) {
      await supabase.storage
        .from("listing-media")
        .remove([
          listing
            .listing_video_storage_path,
        ]);
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

    if (error) {
      alert(
        `İlan silinemedi: ${error.message}`,
      );
    } else {
      setListings((current) =>
        current.filter(
          (item) =>
            item.id !== listing.id,
        ),
      );
    }

    setWorking("");
  }

  const hasFilters =
    query ||
    status !== "all" ||
    neighborhood !== "all" ||
    roomCount !== "all" ||
    priceMin ||
    priceMax ||
    sort !== "newest";

  return (
    <div className="ap-admin-page">
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">
            HIZLI PORTFÖY BULUCU
          </p>

          <h1>Kayıtlı İlanlar</h1>

          <p className="ap-muted">
            Yüzlerce ilan arasından
            müşterinize uygun seçeneği
            saniyeler içinde bulun.
          </p>
        </div>

        <Link
          href="/yonetim/yeni-ilan"
          className="ap-primary-button"
        >
          + Yeni İlan
        </Link>
      </section>

      <section className="ap-smart-filter ap-glass">
        <div className="ap-filter-search">
          <span>⌕</span>

          <input
            type="search"
            placeholder={
              "Proje, mahalle, satıcı veya " +
              "telefon ara..."
            }
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <div className="ap-filter-grid">
          <label>
            <span>Durum</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as typeof status,
                )
              }
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Mahalle</span>
            <select
              value={neighborhood}
              onChange={(event) =>
                setNeighborhood(
                  event.target.value,
                )
              }
            >
              <option value="all">
                Tüm mahalleler
              </option>

              {neighborhoods.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Oda</span>
            <select
              value={roomCount}
              onChange={(event) =>
                setRoomCount(
                  event.target.value,
                )
              }
            >
              <option value="all">
                Tüm odalar
              </option>

              {roomCounts.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>En düşük fiyat</span>
            <input
              inputMode="numeric"
              placeholder="3.000.000"
              value={priceMin}
              onChange={(event) =>
                setPriceMin(
                  formatGrouped(
                    event.target.value,
                  ),
                )
              }
            />
          </label>

          <label>
            <span>En yüksek fiyat</span>
            <input
              inputMode="numeric"
              placeholder="8.000.000"
              value={priceMax}
              onChange={(event) =>
                setPriceMax(
                  formatGrouped(
                    event.target.value,
                  ),
                )
              }
            />
          </label>

          <label>
            <span>Sıralama</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target
                    .value as SortMode,
                )
              }
            >
              <option value="newest">
                En yeni
              </option>
              <option value="price-asc">
                Fiyat artan
              </option>
              <option value="price-desc">
                Fiyat azalan
              </option>
              <option value="title">
                Başlığa göre
              </option>
            </select>
          </label>
        </div>

        <div className="ap-filter-footer">
          <strong>
            {filtered.length} uygun ilan
          </strong>

          <span>
            Toplam {listings.length} kayıt
          </span>

          {hasFilters ? (
            <button
              type="button"
              className="ap-filter-reset"
              onClick={resetFilters}
            >
              Filtreleri Temizle
            </button>
          ) : null}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="ap-empty-state ap-glass">
          <h2>Uygun ilan bulunamadı</h2>
          <p>
            Fiyat aralığını veya diğer
            filtreleri değiştirin.
          </p>
        </div>
      ) : (
        <section className="ap-compact-listing-grid">
          {filtered.map((listing) => {
            const privateDetails =
              listing.private_details;

            const mapLink = mapsHref(
              privateDetails?.maps_url ??
                null,
            );

            return (
              <article
                className="ap-compact-card ap-glass"
                key={listing.id}
              >
                <div className="ap-compact-card-media">
                  {listing.cover_image_url ? (
                    <img
                      src={
                        listing.cover_image_url
                      }
                      alt={listing.title}
                    />
                  ) : (
                    <div className="ap-image-empty">
                      Fotoğraf yok
                    </div>
                  )}

                  <StatusBadge
                    status={listing.status}
                  />

                  {listing.listing_video_url ? (
                    <span className="ap-media-badge">
                      ▶ Klip
                    </span>
                  ) : null}
                </div>

                <div className="ap-compact-card-body">
                  <div className="ap-compact-card-top">
                    <div>
                      <p className="ap-kicker">
                        {listing.project_name ||
                          "PROJE"}
                      </p>

                      <h2>
                        {listing.title}
                      </h2>
                    </div>

                    <strong>
                      {formatPrice(
                        listing.price,
                      )}
                    </strong>
                  </div>

                  <div className="ap-compact-meta">
                    <span>
                      {listing.neighborhood}
                    </span>

                    {listing.room_count ? (
                      <span>
                        {listing.room_count}
                      </span>
                    ) : null}

                    {listing.area_m2 ? (
                      <span>
                        {listing.area_m2} m²
                      </span>
                    ) : null}

                    {listing.facade ? (
                      <span>
                        {listing.facade}
                      </span>
                    ) : null}
                  </div>

                  {privateDetails ? (
                    <details className="ap-private-details">
                      <summary>
                        Özel Bilgiler
                      </summary>

                      <div className="ap-private-grid">
                        <div>
                          <small>
                            Satıcı
                          </small>
                          <strong>
                            {privateDetails
                              .seller_name ||
                              "Girilmedi"}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Telefon
                          </small>
                          {privateDetails
                            .seller_phone ? (
                            <a
                              href={phoneHref(
                                privateDetails
                                  .seller_phone,
                              )}
                            >
                              {
                                privateDetails
                                  .seller_phone
                              }
                            </a>
                          ) : (
                            <strong>
                              Girilmedi
                            </strong>
                          )}
                        </div>

                        <div>
                          <small>
                            Çıkabilecek kredi
                          </small>
                          <strong>
                            {privateDetails
                              .available_credit_amount !==
                            null
                              ? formatPrice(
                                  privateDetails
                                    .available_credit_amount,
                                )
                              : "Girilmedi"}
                          </strong>
                        </div>

                        <div>
                          <small>
                            Konum notu
                          </small>
                          <strong>
                            {privateDetails
                              .location_note ||
                              "Girilmedi"}
                          </strong>
                        </div>
                      </div>

                      <div className="ap-private-actions">
                        {privateDetails
                          .seller_phone ? (
                          <a
                            href={phoneHref(
                              privateDetails
                                .seller_phone,
                            )}
                            className="ap-soft-button"
                          >
                            Satıcıyı Ara
                          </a>
                        ) : null}

                        {mapLink ? (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="ap-success-button"
                          >
                            Google Maps
                          </a>
                        ) : null}
                      </div>
                    </details>
                  ) : null}

                  <label className="ap-compact-status">
                    <span>Durum</span>

                    <select
                      value={listing.status}
                      disabled={
                        working === listing.id
                      }
                      onChange={(event) =>
                        changeStatus(
                          listing.id,
                          event.target
                            .value as ListingStatus,
                        )
                      }
                    >
                      <option value="active">
                        Aktif
                      </option>
                      <option value="draft">
                        Taslak
                      </option>
                      <option value="reserved">
                        Rezerve
                      </option>
                      <option value="sold">
                        Satıldı
                      </option>
                    </select>
                  </label>

                  <div className="ap-compact-actions">
                    <Link
                      href={
                        `/yonetim/` +
                        `ilan-duzenle/` +
                        `${listing.id}`
                      }
                      className="ap-primary-button small"
                    >
                      Düzenle
                    </Link>

                    <Link
                      href={`/ilan/${listing.slug}`}
                      target="_blank"
                      className="ap-soft-button"
                    >
                      Gör
                    </Link>

                    {mapLink ? (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ap-soft-button"
                      >
                        Konum
                      </a>
                    ) : null}

                    <button
                      type="button"
                      className="ap-danger-button"
                      disabled={
                        working === listing.id
                      }
                      onClick={() =>
                        removeListing(listing)
                      }
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
