"use client";

import { DragEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEATURE_OPTIONS } from "@/lib/constants";
import { safeFileName, slugify } from "@/lib/format";
import type { Listing, ListingImage, ListingStatus } from "@/lib/types";

type ExistingImage = ListingImage & { removed?: boolean };

type Props = {
  mode: "create" | "edit";
  userId: string;
  initialListing?: Listing;
  initialImages?: ListingImage[];
};

const emptyForm = {
  project_name: "",
  title: "",
  city: "Antalya",
  district: "Kepez",
  neighborhood: "",
  room_count: "",
  area_m2: "",
  gross_area_m2: "",
  floor: "",
  facade: "",
  kitchen_type: "",
  price: "",
  short_description: "",
  description: "",
  status: "draft" as ListingStatus,
  credit_available: false,
  exchange_available: false,
  commission_free: true,
};

function toNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ListingEditor({
  mode,
  userId,
  initialListing,
  initialImages = [],
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() =>
    initialListing
      ? {
          project_name: initialListing.project_name ?? "",
          title: initialListing.title,
          city: initialListing.city,
          district: initialListing.district,
          neighborhood: initialListing.neighborhood,
          room_count: initialListing.room_count ?? "",
          area_m2: initialListing.area_m2?.toString() ?? "",
          gross_area_m2: initialListing.gross_area_m2?.toString() ?? "",
          floor: initialListing.floor ?? "",
          facade: initialListing.facade ?? "",
          kitchen_type: initialListing.kitchen_type ?? "",
          price: initialListing.price?.toString() ?? "",
          short_description: initialListing.short_description ?? "",
          description: initialListing.description ?? "",
          status: initialListing.status,
          credit_available: initialListing.credit_available,
          exchange_available: initialListing.exchange_available,
          commission_free: initialListing.commission_free,
        }
      : emptyForm,
  );
  const [features, setFeatures] = useState<string[]>(initialListing?.features ?? []);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [draggedExisting, setDraggedExisting] = useState<number | null>(null);
  const [draggedNew, setDraggedNew] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeExisting = useMemo(
    () => existingImages.filter((image) => !image.removed),
    [existingImages],
  );

  function setField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
  }

  function selectFiles(files: FileList | null) {
    if (!files) return;

    const accepted = Array.from(files).filter((file) => {
      const validType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      const validSize = file.size <= 10 * 1024 * 1024;
      return validType && validSize;
    });

    setNewFiles((current) => [...current, ...accepted]);
  }

  function reorderExisting(targetIndex: number) {
    if (draggedExisting === null || draggedExisting === targetIndex) return;
    setExistingImages((current) => {
      const visible = current.filter((image) => !image.removed);
      const removed = current.filter((image) => image.removed);
      const [moved] = visible.splice(draggedExisting, 1);
      visible.splice(targetIndex, 0, moved);
      return [...visible, ...removed];
    });
    setDraggedExisting(null);
  }

  function reorderNew(targetIndex: number) {
    if (draggedNew === null || draggedNew === targetIndex) return;
    setNewFiles((current) => {
      const next = [...current];
      const [moved] = next.splice(draggedNew, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedNew(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim() || !form.neighborhood.trim() || !form.room_count.trim()) {
      setMessage("Başlık, mahalle ve oda sayısı zorunludur.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    let listingId = initialListing?.id ?? "";
    let slug = initialListing?.slug ?? "";

    const payload = {
      project_name: form.project_name.trim() || null,
      title: form.title.trim(),
      city: form.city.trim() || "Antalya",
      district: form.district.trim() || "Kepez",
      neighborhood: form.neighborhood.trim(),
      room_count: form.room_count.trim(),
      area_m2: toNumber(form.area_m2),
      gross_area_m2: toNumber(form.gross_area_m2),
      floor: form.floor.trim() || null,
      facade: form.facade.trim() || null,
      kitchen_type: form.kitchen_type.trim() || null,
      price: toNumber(form.price),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      features,
      credit_available: form.credit_available,
      exchange_available: form.exchange_available,
      commission_free: form.commission_free,
      status: form.status,
    };

    if (mode === "create") {
      slug = `${slugify(form.project_name || form.title) || "ilan"}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      const { data, error } = await supabase
        .from("listings")
        .insert({
          ...payload,
          slug,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error || !data) {
        setMessage(`İlan oluşturulamadı: ${error?.message ?? "Bilinmeyen hata"}`);
        setSaving(false);
        return;
      }

      listingId = data.id;
    } else {
      const { error } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listingId);

      if (error) {
        setMessage(`İlan güncellenemedi: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    const removedImages = existingImages.filter((image) => image.removed);

    if (removedImages.length > 0) {
      const storagePaths = removedImages
        .map((image) => image.storage_path)
        .filter(Boolean) as string[];

      if (storagePaths.length > 0) {
        await supabase.storage.from("listing-images").remove(storagePaths);
      }

      await supabase
        .from("listing_images")
        .delete()
        .in("id", removedImages.map((image) => image.id));
    }

    const keptExisting = existingImages.filter((image) => !image.removed);

    for (let index = 0; index < keptExisting.length; index += 1) {
      await supabase
        .from("listing_images")
        .update({ position: index })
        .eq("id", keptExisting[index].id);
    }

    const uploadedRows: Array<{
      listing_id: string;
      image_url: string;
      storage_path: string;
      position: number;
    }> = [];

    for (let index = 0; index < newFiles.length; index += 1) {
      const file = newFiles[index];
      const path = `${listingId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);

      uploadedRows.push({
        listing_id: listingId,
        image_url: publicUrl.publicUrl,
        storage_path: path,
        position: keptExisting.length + index,
      });
    }

    if (uploadedRows.length > 0) {
      const { error: imageError } = await supabase
        .from("listing_images")
        .insert(uploadedRows);

      if (imageError) {
        setMessage(`Fotoğraf kayıtları oluşturulamadı: ${imageError.message}`);
        setSaving(false);
        return;
      }
    }

    const cover =
      keptExisting[0]?.image_url ??
      uploadedRows[0]?.image_url ??
      null;

    await supabase
      .from("listings")
      .update({ cover_image_url: cover })
      .eq("id", listingId);

    router.push("/yonetim/ilanlar");
    router.refresh();
  }

  return (
    <form className="ap-admin-page" onSubmit={submit}>
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">{mode === "create" ? "YENİ PORTFÖY" : "İLAN DÜZENLE"}</p>
          <h1>{mode === "create" ? "Yeni İlan Ekle" : form.title}</h1>
          <p className="ap-muted">
            Bilgileri düzenleyin, fotoğrafları doğrudan tutup sürükleyerek sıralayın.
          </p>
        </div>

        <button type="submit" className="ap-primary-button" disabled={saving}>
          {saving ? "Kaydediliyor..." : mode === "create" ? "İlanı Kaydet" : "Değişiklikleri Kaydet"}
        </button>
      </section>

      {message ? <div className="ap-form-message">{message}</div> : null}

      <div className="ap-editor-layout">
        <section className="ap-form-card ap-glass">
          <h2>Temel Bilgiler</h2>

          <div className="ap-form-grid">
            <label className="ap-field span-2">
              <span>Proje Adı</span>
              <input value={form.project_name} onChange={(e) => setField("project_name", e.target.value)} />
            </label>

            <label className="ap-field span-2">
              <span>İlan Başlığı *</span>
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Şehir</span>
              <input value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>İlçe</span>
              <input value={form.district} onChange={(e) => setField("district", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Mahalle *</span>
              <input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Oda Sayısı *</span>
              <input placeholder="3+1" value={form.room_count} onChange={(e) => setField("room_count", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Net m²</span>
              <input inputMode="decimal" value={form.area_m2} onChange={(e) => setField("area_m2", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Brüt m²</span>
              <input inputMode="decimal" value={form.gross_area_m2} onChange={(e) => setField("gross_area_m2", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Kat</span>
              <input value={form.floor} onChange={(e) => setField("floor", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Cephe</span>
              <input placeholder="Güney, Doğu" value={form.facade} onChange={(e) => setField("facade", e.target.value)} />
            </label>

            <label className="ap-field">
              <span>Mutfak Tipi</span>
              <select value={form.kitchen_type} onChange={(e) => setField("kitchen_type", e.target.value)}>
                <option value="">Seçiniz</option>
                <option value="Ayrı mutfak">Ayrı mutfak</option>
                <option value="Açık mutfak">Açık mutfak</option>
              </select>
            </label>

            <label className="ap-field">
              <span>Fiyat</span>
              <input inputMode="numeric" placeholder="5500000" value={form.price} onChange={(e) => setField("price", e.target.value)} />
            </label>

            <label className="ap-field span-2">
              <span>Kısa Açıklama</span>
              <textarea rows={3} value={form.short_description} onChange={(e) => setField("short_description", e.target.value)} />
            </label>

            <label className="ap-field span-2">
              <span>Detaylı Açıklama</span>
              <textarea rows={7} value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </label>
          </div>
        </section>

        <aside className="ap-form-card ap-glass">
          <h2>Yayın ve Satış</h2>

          <label className="ap-field">
            <span>İlan Durumu</span>
            <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option value="draft">Taslak</option>
              <option value="active">Aktif</option>
              <option value="reserved">Rezerve</option>
              <option value="sold">Satıldı</option>
            </select>
          </label>

          <div className="ap-toggle-list">
            <label className="ap-switch-row">
              <span>Kredi imkânı</span>
              <input
                type="checkbox"
                checked={form.credit_available}
                onChange={(e) => setField("credit_available", e.target.checked)}
              />
            </label>
            <label className="ap-switch-row">
              <span>Takas imkânı</span>
              <input
                type="checkbox"
                checked={form.exchange_available}
                onChange={(e) => setField("exchange_available", e.target.checked)}
              />
            </label>
            <label className="ap-switch-row">
              <span>Komisyonsuz firma satışı</span>
              <input
                type="checkbox"
                checked={form.commission_free}
                onChange={(e) => setField("commission_free", e.target.checked)}
              />
            </label>
          </div>

          <h2 className="ap-subsection-title">Özellikler</h2>
          <div className="ap-feature-picker">
            {FEATURE_OPTIONS.map((feature) => (
              <button
                type="button"
                key={feature}
                className={features.includes(feature) ? "is-active" : ""}
                onClick={() => toggleFeature(feature)}
              >
                <span>{features.includes(feature) ? "✓" : "+"}</span>
                {feature}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="ap-form-card ap-glass" style={{ marginTop: 16 }}>
        <div className="ap-section-heading-row">
          <div>
            <h2>Fotoğraf Yönetimi</h2>
            <p className="ap-muted">
              Fotoğrafın herhangi bir yerinden tutup sürükleyin. İlk fotoğraf kapak olur.
            </p>
          </div>

          <label className="ap-upload-button">
            Fotoğraf Seç
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => selectFiles(event.target.files)}
            />
          </label>
        </div>

        {activeExisting.length === 0 && newFiles.length === 0 ? (
          <div className="ap-upload-empty">
            JPG, PNG veya WEBP fotoğrafları seçin. Dosya başına en fazla 10 MB.
          </div>
        ) : (
          <div className="ap-photo-grid">
            {activeExisting.map((image, index) => (
              <article
                key={image.id}
                className="ap-photo-card"
                draggable
                onDragStart={() => setDraggedExisting(index)}
                onDragOver={(event: DragEvent) => event.preventDefault()}
                onDrop={() => reorderExisting(index)}
              >
                <img src={image.image_url} alt="" />
                <span className="ap-photo-order">{index + 1}</span>
                {index === 0 ? <span className="ap-cover-badge">Kapak</span> : null}
                <button
                  type="button"
                  className="ap-photo-delete"
                  onClick={() =>
                    setExistingImages((current) =>
                      current.map((item) =>
                        item.id === image.id ? { ...item, removed: true } : item,
                      ),
                    )
                  }
                >
                  Sil
                </button>
              </article>
            ))}

            {newFiles.map((file, index) => {
              const position = activeExisting.length + index;
              return (
                <article
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="ap-photo-card"
                  draggable
                  onDragStart={() => setDraggedNew(index)}
                  onDragOver={(event: DragEvent) => event.preventDefault()}
                  onDrop={() => reorderNew(index)}
                >
                  <img src={URL.createObjectURL(file)} alt="" />
                  <span className="ap-photo-order">{position + 1}</span>
                  {position === 0 ? <span className="ap-cover-badge">Kapak</span> : null}
                  <button
                    type="button"
                    className="ap-photo-delete"
                    onClick={() =>
                      setNewFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
                    }
                  >
                    Sil
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="ap-mobile-save-bar">
        <button type="submit" className="ap-primary-button" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
