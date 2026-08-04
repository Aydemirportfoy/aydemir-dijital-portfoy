"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PresentationOrderList from "@/components/admin/PresentationOrderList";
import { createClient } from "@/lib/supabase/client";
import {
  formatPrice,
} from "@/lib/format";
import type {
  Listing,
  Presentation,
  PresentationStatus,
} from "@/lib/types";

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

export default function PresentationEditor({
  presentation,
  listings,
  initialSelected,
}: {
  presentation: Presentation;
  listings: Listing[];
  initialSelected: string[];
}) {
  const [customerName, setCustomerName] =
    useState(
      presentation.customer_name,
    );
  const [title, setTitle] =
    useState(
      presentation.title || "",
    );
  const [note, setNote] =
    useState(
      presentation.note || "",
    );
  const [status, setStatus] =
    useState<PresentationStatus>(
      presentation.status,
    );
  const [query, setQuery] =
    useState("");
  const [selected, setSelected] =
    useState<string[]>(
      initialSelected,
    );
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const router = useRouter();

  const listingMap = useMemo(
    () =>
      new Map(
        listings.map(
          (listing) => [
            listing.id,
            listing,
          ],
        ),
      ),
    [listings],
  );

  const selectedListings =
    useMemo(
      () =>
        selected
          .map((id) =>
            listingMap.get(id),
          )
          .filter(
            (
              listing,
            ): listing is Listing =>
              Boolean(listing),
          ),
      [selected, listingMap],
    );

  const filtered = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!normalized) {
      return listings;
    }

    return listings.filter(
      (listing) =>
        [
          listing.title,
          listing.project_name,
          listing.neighborhood,
          listing.room_count,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(
            "tr-TR",
          )
          .includes(normalized),
    );
  }, [listings, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) =>
              item !== id,
          )
        : [...current, id],
    );
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setMessage("");

    if (
      !customerName.trim()
    ) {
      setMessage(
        "Müşteri adı zorunludur.",
      );
      return;
    }

    if (
      selected.length === 0
    ) {
      setMessage(
        "Sunumda en az bir ilan bulunmalıdır.",
      );
      return;
    }

    setSaving(true);

    const supabase =
      createClient();

    const {
      error: updateError,
    } = await supabase
      .from("presentations")
      .update({
        customer_name:
          customerName.trim(),
        title:
          title.trim() || null,
        note:
          note.trim() || null,
        status,
      })
      .eq(
        "id",
        presentation.id,
      );

    if (updateError) {
      setMessage(
        `Sunum güncellenemedi: ${updateError.message}`,
      );
      setSaving(false);
      return;
    }

    const {
      error: deleteError,
    } = await supabase
      .from(
        "presentation_listings",
      )
      .delete()
      .eq(
        "presentation_id",
        presentation.id,
      );

    if (deleteError) {
      setMessage(
        `Eski ilan sırası temizlenemedi: ${deleteError.message}`,
      );
      setSaving(false);
      return;
    }

    const {
      error: insertError,
    } = await supabase
      .from(
        "presentation_listings",
      )
      .insert(
        selected.map(
          (
            listingId,
            position,
          ) => ({
            presentation_id:
              presentation.id,
            listing_id:
              listingId,
            position,
          }),
        ),
      );

    if (insertError) {
      setMessage(
        `İlanlar kaydedilemedi: ${insertError.message}`,
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
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">
            SUNUM DÜZENLE
          </p>

          <h1>
            {presentation.customer_name}
          </h1>

          <p className="ap-muted">
            Müşteri bilgilerini,
            ilanları ve sıralamayı
            güncelleyin.
          </p>
        </div>

        <div className="ap-presentation-edit-top-actions">
          <a
            href={`/sunum/${presentation.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ap-soft-button"
          >
            Sunumu Aç
          </a>

          <Link
            href="/yonetim/sunumlar"
            className="ap-soft-button"
          >
            Sunumlara Dön
          </Link>
        </div>
      </section>

      {message ? (
        <div className="ap-form-message">
          {message}
        </div>
      ) : null}

      <div className="ap-presentation-editor-layout">
        <aside className="ap-form-card ap-glass ap-sticky ap-presentation-edit-form">
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
              rows={5}
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value,
                )
              }
              placeholder="Müşteriye gösterilecek not"
            />

            <div className="ap-note-suggestions">
              {NOTE_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.label
                    }
                    type="button"
                    className={
                      note ===
                      option.text
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setNote(
                        option.text,
                      )
                    }
                  >
                    {option.label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="ap-field">
            <span>Sunum Durumu</span>

            <div className="ap-presentation-status-choice">
              <button
                type="button"
                className={
                  status === "active"
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setStatus("active")
                }
              >
                Aktif
              </button>

              <button
                type="button"
                className={
                  status ===
                  "archived"
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setStatus(
                    "archived",
                  )
                }
              >
                Arşivde
              </button>
            </div>
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
              ? "Kaydediliyor..."
              : "Değişiklikleri Kaydet"}
          </button>
        </aside>

        <div className="ap-presentation-edit-content">
          <section className="ap-form-card ap-glass">
            <div className="ap-section-heading-row">
              <div>
                <p className="ap-kicker">
                  SUNUM SIRASI
                </p>

                <h2>
                  Seçilen İlanlar
                </h2>

                <p className="ap-muted">
                  Kartı tutup sürükleyerek
                  istediğiniz sıraya taşıyın.
                </p>
              </div>
            </div>

            {selectedListings.length ===
            0 ? (
              <div className="ap-empty-state">
                Henüz ilan seçilmedi.
              </div>
            ) : (
              <PresentationOrderList
                listings={selectedListings}
                onReorder={setSelected}
                onRemove={toggle}
              />
            )}
          </section>

          <section className="ap-form-card ap-glass">
            <div className="ap-section-heading-row">
              <div>
                <p className="ap-kicker">
                  PORTFÖY
                </p>

                <h2>
                  İlan Ekle veya Çıkar
                </h2>
              </div>

              <button
                type="button"
                className="ap-soft-button"
                onClick={() =>
                  setSelected([])
                }
                disabled={
                  selected.length ===
                  0
                }
              >
                Tümünü Temizle
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
                    selectedIndex !==
                    -1;

                  return (
                    <button
                      type="button"
                      key={
                        listing.id
                      }
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
                          {
                            listing.title
                          }
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
      </div>
    </form>
  );
}
