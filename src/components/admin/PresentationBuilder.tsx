"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatPrice,
  slugify,
} from "@/lib/format";
import type { Listing } from "@/lib/types";

const NOTE_OPTIONS = [
  {
    label: "İlk Sunum",
    text:
      "Talep ettiğiniz kriterlere uygun güncel portföyleri sizin için bir araya getirdik. Beğendiğiniz seçenekler için detaylı bilgi paylaşabiliriz.",
  },
  {
    label: "Yeni Alternatifler",
    text:
      "Daha önce paylaştığımız seçeneklere ek olarak değerlendirebileceğiniz yeni portföyleri sizin için hazırladık.",
  },
  {
    label: "Fiyat Avantajı",
    text:
      "Bütçenize ve beklentilerinize uygun, fiyat avantajıyla öne çıkan seçenekleri sizin için seçtik.",
  },
  {
    label: "Konum Odaklı",
    text:
      "Tercih ettiğiniz bölgede öne çıkan güncel daireleri incelemeniz için bir araya getirdik.",
  },
  {
    label: "Güncel Seçenekler",
    text:
      "Güncel durumları ve uygun seçenekleri sizin için yeniden derledik. Beğendiğiniz ilan üzerinden bizimle iletişime geçebilirsiniz.",
  },
];

export default function PresentationBuilder({
  listings,
  userId,
}: {
  listings: Listing[];
  userId: string;
}) {
  const [customerName, setCustomerName] =
    useState("");
  const [title, setTitle] =
    useState("");
  const [note, setNote] =
    useState("");
  const [query, setQuery] =
    useState("");
  const [selected, setSelected] =
    useState<string[]>([]);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!normalized) {
      return listings;
    }

    return listings.filter((listing) =>
      [
        listing.title,
        listing.project_name,
        listing.neighborhood,
        listing.room_count,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalized),
    );
  }, [listings, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id,
          )
        : [...current, id],
    );
  }

  function useNote(text: string) {
    setNote(text);
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setMessage("");

    if (
      !customerName.trim() ||
      selected.length === 0
    ) {
      setMessage(
        "Müşteri adı ve en az bir ilan seçimi zorunludur.",
      );
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const slug =
      `${
        slugify(customerName) ||
        "musteri"
      }-${
        Math.random()
          .toString(36)
          .slice(2, 8)
      }`;

    const {
      data: presentation,
      error,
    } = await supabase
      .from("presentations")
      .insert({
        slug,
        customer_name:
          customerName.trim(),
        title:
          title.trim() ||
          `${customerName.trim()} için özel portföy`,
        note:
          note.trim() || null,
        status: "active",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error || !presentation) {
      setMessage(
        `Sunum oluşturulamadı: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );
      setSaving(false);
      return;
    }

    const {
      error: linkError,
    } = await supabase
      .from("presentation_listings")
      .insert(
        selected.map(
          (listingId, position) => ({
            presentation_id:
              presentation.id,
            listing_id: listingId,
            position,
          }),
        ),
      );

    if (linkError) {
      await supabase
        .from("presentations")
        .delete()
        .eq(
          "id",
          presentation.id,
        );

      setMessage(
        `İlanlar sunuma eklenemedi: ${linkError.message}`,
      );
      setSaving(false);
      return;
    }

    router.push(
      "/yonetim/sunumlar",
    );
    router.refresh();
  }

  return (
    <form
      className="ap-admin-page"
      onSubmit={submit}
    >
      <section className="ap-admin-hero ap-presentation-builder-hero">
        <div>
          <p className="ap-kicker">
            MÜŞTERİYE ÖZEL
          </p>

          <h1>
            Yeni Sunum Oluştur
          </h1>

          <p className="ap-muted">
            Müşteri bilgilerini yazın ve
            göstermek istediğiniz ilanları
            seçin.
          </p>
        </div>
      </section>

      {message ? (
        <div className="ap-form-message">
          {message}
        </div>
      ) : null}

      <div className="ap-presentation-builder">
        <aside className="ap-form-card ap-glass ap-sticky ap-presentation-info-panel">
          <h2>Sunum Bilgileri</h2>

          <label className="ap-field">
            <span>Müşteri Adı *</span>

            <input
              value={customerName}
              onChange={(event) =>
                setCustomerName(
                  event.target.value,
                )
              }
              placeholder="Mehmet Bey"
            />
          </label>

          <label className="ap-field">
            <span>Sunum Başlığı</span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Boş bırakılabilir"
            />
          </label>

          <div className="ap-field">
            <span>Müşteriye Not</span>

            <textarea
              rows={6}
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value,
                )
              }
              placeholder="Hazır notlardan birini seçebilir veya kendi notunuzu yazabilirsiniz."
            />

            <div className="ap-note-suggestions">
              {NOTE_OPTIONS.map(
                (option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={
                      note === option.text
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      useNote(
                        option.text,
                      )
                    }
                  >
                    {option.label}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className="ap-note-clear"
              onClick={() =>
                setNote("")
              }
              disabled={!note}
            >
              Notu Temizle
            </button>
          </div>

          <div className="ap-selection-counter">
            <span>
              {selected.length}
            </span>
            ilan seçildi
          </div>

          <button
            type="submit"
            className="ap-primary-button ap-presentation-submit"
            disabled={saving}
          >
            {saving
              ? "Oluşturuluyor..."
              : "Sunumu Oluştur"}
          </button>

          <p className="ap-presentation-submit-note">
            Sunum oluşturulduktan sonra
            müşteriye özel paylaşım linki
            hazırlanır.
          </p>
        </aside>

        <section className="ap-form-card ap-glass">
          <div className="ap-section-heading-row">
            <div>
              <h2>İlanları Seç</h2>

              <p className="ap-muted">
                Kartlara tıklama sırası
                sunumdaki sıralamadır.
              </p>
            </div>

            <button
              type="button"
              className="ap-soft-button"
              onClick={() =>
                setSelected([])
              }
              disabled={
                selected.length === 0
              }
            >
              Temizle
            </button>
          </div>

          <input
            className="ap-input"
            type="search"
            placeholder="Proje, mahalle veya oda ara..."
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
          />

          <div className="ap-selection-grid">
            {filtered.map(
              (listing) => {
                const selectedIndex =
                  selected.indexOf(
                    listing.id,
                  );

                const active =
                  selectedIndex !== -1;

                return (
                  <button
                    type="button"
                    key={listing.id}
                    className={
                      `ap-selection-card ${
                        active
                          ? "is-active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      toggle(
                        listing.id,
                      )
                    }
                  >
                    <div className="ap-selection-card-image">
                      {listing.cover_image_url ? (
                        <img
                          src={
                            listing.cover_image_url
                          }
                          alt={
                            listing.title
                          }
                        />
                      ) : (
                        <div className="ap-image-empty">
                          Fotoğraf yok
                        </div>
                      )}

                      <span>
                        {active
                          ? selectedIndex +
                            1
                          : "+"}
                      </span>
                    </div>

                    <div>
                      <p className="ap-kicker">
                        {listing.project_name ||
                          "PROJE"}
                      </p>

                      <strong>
                        {listing.title}
                      </strong>

                      <small>
                        {
                          listing.neighborhood
                        }{" "}
                        ·{" "}
                        {
                          listing.room_count
                        }
                      </small>

                      <b>
                        {formatPrice(
                          listing.price,
                        )}
                      </b>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
