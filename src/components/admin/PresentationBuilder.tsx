"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, slugify } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default function PresentationBuilder({
  listings,
  userId,
}: {
  listings: Listing[];
  userId: string;
}) {
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return listings;

    return listings.filter((listing) =>
      [listing.title, listing.project_name, listing.neighborhood, listing.room_count]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalized),
    );
  }, [listings, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!customerName.trim() || selected.length === 0) {
      setMessage("Müşteri adı ve en az bir ilan seçimi zorunludur.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const slug = `${slugify(customerName) || "musteri"}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: presentation, error } = await supabase
      .from("presentations")
      .insert({
        slug,
        customer_name: customerName.trim(),
        title: title.trim() || `${customerName.trim()} için özel portföy`,
        note: note.trim() || null,
        status: "active",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error || !presentation) {
      setMessage(`Sunum oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
      setSaving(false);
      return;
    }

    const { error: linkError } = await supabase
      .from("presentation_listings")
      .insert(
        selected.map((listingId, position) => ({
          presentation_id: presentation.id,
          listing_id: listingId,
          position,
        })),
      );

    if (linkError) {
      await supabase.from("presentations").delete().eq("id", presentation.id);
      setMessage(`İlanlar sunuma eklenemedi: ${linkError.message}`);
      setSaving(false);
      return;
    }

    router.push("/yonetim/sunumlar");
    router.refresh();
  }

  return (
    <form className="ap-admin-page" onSubmit={submit}>
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">MÜŞTERİYE ÖZEL</p>
          <h1>Yeni Sunum Oluştur</h1>
          <p className="ap-muted">Müşteri bilgilerini yazın ve göstermek istediğiniz ilanları seçin.</p>
        </div>
        <button type="submit" className="ap-primary-button" disabled={saving}>
          {saving ? "Oluşturuluyor..." : "Sunumu Oluştur"}
        </button>
      </section>

      {message ? <div className="ap-form-message">{message}</div> : null}

      <div className="ap-presentation-builder">
        <aside className="ap-form-card ap-glass ap-sticky">
          <h2>Sunum Bilgileri</h2>

          <label className="ap-field">
            <span>Müşteri Adı *</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Mehmet Bey" />
          </label>

          <label className="ap-field">
            <span>Sunum Başlığı</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Boş bırakılabilir" />
          </label>

          <label className="ap-field">
            <span>Müşteriye Not</span>
            <textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          <div className="ap-selection-counter">{selected.length} ilan seçildi</div>
        </aside>

        <section className="ap-form-card ap-glass">
          <div className="ap-section-heading-row">
            <div>
              <h2>İlanları Seç</h2>
              <p className="ap-muted">Kartlara tıklama sırası sunumdaki sıralamadır.</p>
            </div>
            <button type="button" className="ap-soft-button" onClick={() => setSelected([])}>
              Temizle
            </button>
          </div>

          <input
            className="ap-input"
            type="search"
            placeholder="Proje, mahalle veya oda ara..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="ap-selection-grid">
            {filtered.map((listing) => {
              const selectedIndex = selected.indexOf(listing.id);
              const active = selectedIndex !== -1;

              return (
                <button
                  type="button"
                  key={listing.id}
                  className={`ap-selection-card ${active ? "is-active" : ""}`}
                  onClick={() => toggle(listing.id)}
                >
                  <div className="ap-selection-card-image">
                    {listing.cover_image_url ? (
                      <img src={listing.cover_image_url} alt={listing.title} />
                    ) : (
                      <div className="ap-image-empty">Fotoğraf yok</div>
                    )}
                    <span>{active ? selectedIndex + 1 : "+"}</span>
                  </div>
                  <div>
                    <p className="ap-kicker">{listing.project_name || "PROJE"}</p>
                    <strong>{listing.title}</strong>
                    <small>{listing.neighborhood} · {listing.room_count}</small>
                    <b>{formatPrice(listing.price)}</b>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </form>
  );
}
