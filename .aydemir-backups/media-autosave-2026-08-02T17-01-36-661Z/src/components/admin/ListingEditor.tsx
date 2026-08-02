"use client";

import {
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEATURE_OPTIONS } from "@/lib/constants";
import { safeFileName, slugify } from "@/lib/format";
import type {
  Listing,
  ListingImage,
  ListingStatus,
} from "@/lib/types";

type ExistingImage = ListingImage & {
  removed?: boolean;
};

type Props = {
  mode: "create" | "edit";
  userId: string;
  initialListing?: Listing;
  initialImages?: ListingImage[];
};

const FACADE_OPTIONS = [
  "Güney",
  "Doğu",
  "Batı",
  "Kuzey",
] as const;

const emptyForm = {
  project_name: "",
  title: "",
  city: "Antalya",
  district: "Kepez",
  neighborhood: "",
  room_count: "",
  area_m2: "",
  floor: "",
  kitchen_type: "",
  price: "",
  short_description: "",
  description: "",
  status: "draft" as ListingStatus,
  credit_available: false,
  exchange_available: false,
  commission_free: true,
};

type FormState = typeof emptyForm;

type DraftData = {
  form?: Partial<FormState>;
  features?: string[];
  facades?: string[];
  savedAt?: string;
};

type Notice = {
  type: "error" | "info";
  text: string;
};

function toNumber(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  const normalized = cleaned
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function withTimeout<T>(
  promise: PromiseLike<T>,
  milliseconds: number,
  message: string,
) {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(message));
      }, milliseconds);
    }),
  ]);
}

export default function ListingEditor({
  mode,
  userId,
  initialListing,
  initialImages = [],
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() =>
    initialListing
      ? {
          project_name:
            initialListing.project_name ?? "",
          title: initialListing.title,
          city: initialListing.city ?? "Antalya",
          district:
            initialListing.district ?? "Kepez",
          neighborhood:
            initialListing.neighborhood ?? "",
          room_count:
            initialListing.room_count ?? "",
          area_m2:
            initialListing.area_m2?.toString() ?? "",
          floor: initialListing.floor ?? "",
          kitchen_type:
            initialListing.kitchen_type ?? "",
          price:
            initialListing.price?.toString() ?? "",
          short_description:
            initialListing.short_description ?? "",
          description:
            initialListing.description ?? "",
          status: initialListing.status,
          credit_available:
            initialListing.credit_available,
          exchange_available:
            initialListing.exchange_available,
          commission_free:
            initialListing.commission_free,
        }
      : { ...emptyForm },
  );

  const [features, setFeatures] = useState<string[]>(
    initialListing?.features ?? [],
  );

  const [facades, setFacades] = useState<string[]>(
    initialListing?.facade
      ? initialListing.facade
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  );

  const [existingImages, setExistingImages] =
    useState<ExistingImage[]>(initialImages);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [
    removeExistingVideo,
    setRemoveExistingVideo,
  ] = useState(false);

  const [
    draggedExisting,
    setDraggedExisting,
  ] = useState<number | null>(null);

  const [draggedNew, setDraggedNew] =
    useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [draftReady, setDraftReady] =
    useState(false);

  const [lastSavedAt, setLastSavedAt] =
    useState<string>("");

  const draftKey =
    mode === "create"
      ? "aydemir-new-listing-draft-v3"
      : `aydemir-edit-listing-draft-v3-${
          initialListing?.id ?? "unknown"
        }`;

  const activeExisting = useMemo(
    () =>
      existingImages.filter(
        (image) => !image.removed,
      ),
    [existingImages],
  );

  const newImagePreviews = useMemo(
    () =>
      newFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newFiles],
  );

  const videoPreview = useMemo(
    () =>
      videoFile
        ? URL.createObjectURL(videoFile)
        : null,
    [videoFile],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [newImagePreviews]);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);

      if (saved) {
        const parsed = JSON.parse(
          saved,
        ) as DraftData;

        if (parsed.form) {
          setForm((current) => ({
            ...current,
            ...parsed.form,
          }));
        }

        if (Array.isArray(parsed.features)) {
          setFeatures(parsed.features);
        }

        if (Array.isArray(parsed.facades)) {
          setFacades(parsed.facades);
        }

        if (parsed.savedAt) {
          setLastSavedAt(parsed.savedAt);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || saving) {
      return;
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();

      const draft: DraftData = {
        form,
        features,
        facades,
        savedAt,
      };

      localStorage.setItem(
        draftKey,
        JSON.stringify(draft),
      );

      setLastSavedAt(savedAt);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    draftReady,
    draftKey,
    facades,
    features,
    form,
    saving,
  ]);

  function setField<K extends keyof FormState>(
    name: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter(
            (item) => item !== feature,
          )
        : [...current, feature],
    );
  }

  function toggleFacade(facade: string) {
    setFacades((current) =>
      current.includes(facade)
        ? current.filter(
            (item) => item !== facade,
          )
        : [...current, facade],
    );
  }

  function selectFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const accepted = Array.from(files).filter(
      (file) => {
        const validType = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type);

        const validSize =
          file.size <= 10 * 1024 * 1024;

        return validType && validSize;
      },
    );

    const rejectedCount =
      files.length - accepted.length;

    if (rejectedCount > 0) {
      setNotice({
        type: "error",
        text:
          "Bazı fotoğraflar uygun formatta değildi " +
          "veya 10 MB sınırını aşıyordu.",
      });
    }

    setNewFiles((current) => [
      ...current,
      ...accepted,
    ]);
  }

  function selectVideo(file: File | null) {
    if (!file) {
      return;
    }

    const validType = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-m4v",
    ].includes(file.type);

    const validSize =
      file.size <= 150 * 1024 * 1024;

    if (!validType || !validSize) {
      setNotice({
        type: "error",
        text:
          "İlan klibi MP4, WEBM, MOV veya M4V " +
          "formatında ve en fazla 150 MB olmalıdır.",
      });
      return;
    }

    setVideoFile(file);
    setRemoveExistingVideo(false);
    setNotice({
      type: "info",
      text: "İlan klibi seçildi.",
    });
  }

  function reorderExisting(
    targetIndex: number,
  ) {
    if (
      draggedExisting === null ||
      draggedExisting === targetIndex
    ) {
      return;
    }

    setExistingImages((current) => {
      const visible = current.filter(
        (image) => !image.removed,
      );

      const removed = current.filter(
        (image) => image.removed,
      );

      const [moved] = visible.splice(
        draggedExisting,
        1,
      );

      visible.splice(targetIndex, 0, moved);

      return [...visible, ...removed];
    });

    setDraggedExisting(null);
  }

  function reorderNew(targetIndex: number) {
    if (
      draggedNew === null ||
      draggedNew === targetIndex
    ) {
      return;
    }

    setNewFiles((current) => {
      const next = [...current];
      const [moved] = next.splice(
        draggedNew,
        1,
      );

      next.splice(targetIndex, 0, moved);

      return next;
    });

    setDraggedNew(null);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setNotice(null);

    if (
      !form.title.trim() ||
      !form.neighborhood.trim() ||
      !form.room_count.trim()
    ) {
      setNotice({
        type: "error",
        text:
          "Başlık, mahalle ve oda sayısı zorunludur.",
      });
      return;
    }

    setSaving(true);
    setNotice({
      type: "info",
      text: "İlan kaydı hazırlanıyor...",
    });

    const supabase = createClient();

    let listingId =
      initialListing?.id ?? "";

    let slug =
      initialListing?.slug ?? "";

    const payload = {
      project_name:
        form.project_name.trim() || null,
      title: form.title.trim(),
      city: form.city.trim() || "Antalya",
      district:
        form.district.trim() || "Kepez",
      neighborhood:
        form.neighborhood.trim(),
      room_count: form.room_count.trim(),
      area_m2: toNumber(form.area_m2),
      floor: form.floor.trim() || null,
      facade:
        facades.length > 0
          ? facades.join(", ")
          : null,
      kitchen_type:
        form.kitchen_type.trim() || null,
      price: toNumber(form.price),
      short_description:
        form.short_description.trim() || null,
      description:
        form.description.trim() || null,
      features,
      credit_available:
        form.credit_available,
      exchange_available:
        form.exchange_available,
      commission_free:
        form.commission_free,
      status: form.status,
    };

    try {
      if (mode === "create") {
        slug = `${
          slugify(
            form.project_name || form.title,
          ) || "ilan"
        }-${Math.random()
          .toString(36)
          .slice(2, 7)}`;

        const result = await withTimeout(
          supabase
            .from("listings")
            .insert({
              ...payload,
              slug,
              created_by: userId,
            })
            .select("id")
            .single(),
          25000,
          "Supabase ilan kaydına zamanında cevap vermedi.",
        );

        if (result.error || !result.data) {
          throw new Error(
            result.error?.message ??
              "İlan kaydı oluşturulamadı.",
          );
        }

        listingId = result.data.id;
      } else {
        const result = await withTimeout(
          supabase
            .from("listings")
            .update(payload)
            .eq("id", listingId),
          25000,
          "Supabase ilan güncellemesine zamanında cevap vermedi.",
        );

        if (result.error) {
          throw new Error(result.error.message);
        }
      }

      const removedImages =
        existingImages.filter(
          (image) => image.removed,
        );

      if (removedImages.length > 0) {
        const storagePaths = removedImages
          .map((image) => image.storage_path)
          .filter(Boolean) as string[];

        if (storagePaths.length > 0) {
          await withTimeout(
            supabase.storage
              .from("listing-images")
              .remove(storagePaths),
            30000,
            "Silinen fotoğraflar temizlenirken süre aşıldı.",
          );
        }

        const deleteResult =
          await withTimeout(
            supabase
              .from("listing_images")
              .delete()
              .in(
                "id",
                removedImages.map(
                  (image) => image.id,
                ),
              ),
            25000,
            "Fotoğraf kayıtları silinirken süre aşıldı.",
          );

        if (deleteResult.error) {
          throw new Error(
            deleteResult.error.message,
          );
        }
      }

      const keptExisting =
        existingImages.filter(
          (image) => !image.removed,
        );

      for (
        let index = 0;
        index < keptExisting.length;
        index += 1
      ) {
        const positionResult =
          await withTimeout(
            supabase
              .from("listing_images")
              .update({ position: index })
              .eq(
                "id",
                keptExisting[index].id,
              ),
            20000,
            "Fotoğraf sırası kaydedilirken süre aşıldı.",
          );

        if (positionResult.error) {
          throw new Error(
            positionResult.error.message,
          );
        }
      }

      const uploadedRows: Array<{
        listing_id: string;
        image_url: string;
        storage_path: string;
        position: number;
      }> = [];

      for (
        let index = 0;
        index < newFiles.length;
        index += 1
      ) {
        const file = newFiles[index];

        setNotice({
          type: "info",
          text:
            `Fotoğraflar yükleniyor ` +
            `(${index + 1}/${newFiles.length})...`,
        });

        const storagePath =
          `${listingId}/` +
          `${crypto.randomUUID()}-` +
          `${safeFileName(file.name)}`;

        const uploadResult =
          await withTimeout(
            supabase.storage
              .from("listing-images")
              .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
              }),
            90000,
            `${file.name} yüklenirken süre aşıldı.`,
          );

        if (uploadResult.error) {
          throw new Error(
            uploadResult.error.message,
          );
        }

        const { data: publicUrl } =
          supabase.storage
            .from("listing-images")
            .getPublicUrl(storagePath);

        uploadedRows.push({
          listing_id: listingId,
          image_url: publicUrl.publicUrl,
          storage_path: storagePath,
          position:
            keptExisting.length + index,
        });
      }

      if (uploadedRows.length > 0) {
        const imageInsertResult =
          await withTimeout(
            supabase
              .from("listing_images")
              .insert(uploadedRows),
            30000,
            "Fotoğraf bilgileri kaydedilirken süre aşıldı.",
          );

        if (imageInsertResult.error) {
          throw new Error(
            imageInsertResult.error.message,
          );
        }
      }

      let listingVideoUrl =
        removeExistingVideo
          ? null
          : initialListing
              ?.listing_video_url ?? null;

      let listingVideoStoragePath =
        removeExistingVideo
          ? null
          : initialListing
              ?.listing_video_storage_path ??
            null;

      if (
        removeExistingVideo &&
        initialListing
          ?.listing_video_storage_path
      ) {
        await withTimeout(
          supabase.storage
            .from("listing-media")
            .remove([
              initialListing
                .listing_video_storage_path,
            ]),
          30000,
          "Eski ilan klibi silinirken süre aşıldı.",
        );
      }

      if (videoFile) {
        setNotice({
          type: "info",
          text: "İlan klibi yükleniyor...",
        });

        if (
          initialListing
            ?.listing_video_storage_path
        ) {
          await supabase.storage
            .from("listing-media")
            .remove([
              initialListing
                .listing_video_storage_path,
            ]);
        }

        const videoStoragePath =
          `${listingId}/ilan-klibi-` +
          `${crypto.randomUUID()}-` +
          `${safeFileName(videoFile.name)}`;

        const videoUploadResult =
          await withTimeout(
            supabase.storage
              .from("listing-media")
              .upload(
                videoStoragePath,
                videoFile,
                {
                  cacheControl: "3600",
                  upsert: false,
                },
              ),
            180000,
            "İlan klibi yüklenirken süre aşıldı.",
          );

        if (videoUploadResult.error) {
          throw new Error(
            videoUploadResult.error.message,
          );
        }

        const { data: videoPublicUrl } =
          supabase.storage
            .from("listing-media")
            .getPublicUrl(videoStoragePath);

        listingVideoUrl =
          videoPublicUrl.publicUrl;

        listingVideoStoragePath =
          videoStoragePath;
      }

      const cover =
        keptExisting[0]?.image_url ??
        uploadedRows[0]?.image_url ??
        null;

      setNotice({
        type: "info",
        text: "Son bilgiler kaydediliyor...",
      });

      const finalResult = await withTimeout(
        supabase
          .from("listings")
          .update({
            cover_image_url: cover,
            listing_video_url:
              listingVideoUrl,
            listing_video_storage_path:
              listingVideoStoragePath,
          })
          .eq("id", listingId),
        30000,
        "İlan sonlandırılırken süre aşıldı.",
      );

      if (finalResult.error) {
        throw new Error(
          finalResult.error.message,
        );
      }

      localStorage.removeItem(draftKey);

      router.push("/yonetim/ilanlar");
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? `İlan kaydedilemedi: ${error.message}`
            : "İlan kaydedilemedi.",
      });
    } finally {
      setSaving(false);
    }
  }

  const formattedSavedAt = lastSavedAt
    ? new Intl.DateTimeFormat("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(lastSavedAt))
    : "";

  const visibleVideoUrl =
    videoPreview ??
    (!removeExistingVideo
      ? initialListing?.listing_video_url
      : null);

  return (
    <form
      className="ap-admin-page"
      onSubmit={submit}
    >
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">
            {mode === "create"
              ? "YENİ PORTFÖY"
              : "İLAN DÜZENLE"}
          </p>

          <h1>
            {mode === "create"
              ? "Yeni İlan Ekle"
              : form.title}
          </h1>

          <p className="ap-muted">
            Bilgileri düzenleyin,
            fotoğrafları doğrudan tutup
            sürükleyerek sıralayın.
          </p>

          <p className="ap-autosave-note">
            <span>●</span>
            Bilgiler otomatik saklanıyor
            {formattedSavedAt
              ? ` · Son kayıt ${formattedSavedAt}`
              : ""}
          </p>
        </div>

        <button
          type="submit"
          className="ap-primary-button"
          disabled={saving}
        >
          {saving
            ? "Kaydediliyor..."
            : mode === "create"
              ? "İlanı Kaydet"
              : "Değişiklikleri Kaydet"}
        </button>
      </section>

      {notice ? (
        <div
          className={
            notice.type === "info"
              ? "ap-form-message success"
              : "ap-form-message"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <div className="ap-editor-layout">
        <section className="ap-form-card ap-glass">
          <h2>Temel Bilgiler</h2>

          <div className="ap-form-grid">
            <label className="ap-field span-2">
              <span>Proje Adı</span>
              <input
                value={form.project_name}
                onChange={(event) =>
                  setField(
                    "project_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>İlan Başlığı *</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setField(
                    "title",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Şehir</span>
              <input
                value={form.city}
                onChange={(event) =>
                  setField(
                    "city",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>İlçe</span>
              <input
                value={form.district}
                onChange={(event) =>
                  setField(
                    "district",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Mahalle *</span>
              <input
                value={form.neighborhood}
                onChange={(event) =>
                  setField(
                    "neighborhood",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Oda Sayısı *</span>
              <input
                placeholder="3+1"
                value={form.room_count}
                onChange={(event) =>
                  setField(
                    "room_count",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Metrekare</span>
              <input
                inputMode="decimal"
                placeholder="120"
                value={form.area_m2}
                onChange={(event) =>
                  setField(
                    "area_m2",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Kat</span>
              <input
                value={form.floor}
                onChange={(event) =>
                  setField(
                    "floor",
                    event.target.value,
                  )
                }
              />
            </label>

            <fieldset className="ap-field span-2">
              <legend>Cephe Seçenekleri</legend>

              <div className="ap-facade-picker">
                {FACADE_OPTIONS.map(
                  (facade) => (
                    <button
                      type="button"
                      key={facade}
                      className={
                        facades.includes(facade)
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        toggleFacade(facade)
                      }
                    >
                      <span>
                        {facades.includes(facade)
                          ? "✓"
                          : "+"}
                      </span>
                      {facade}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <label className="ap-field">
              <span>Mutfak Tipi</span>
              <select
                value={form.kitchen_type}
                onChange={(event) =>
                  setField(
                    "kitchen_type",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Seçiniz
                </option>
                <option value="Ayrı mutfak">
                  Ayrı mutfak
                </option>
                <option value="Açık mutfak">
                  Açık mutfak
                </option>
              </select>
            </label>

            <label className="ap-field">
              <span>Fiyat</span>
              <input
                inputMode="numeric"
                placeholder="5500000"
                value={form.price}
                onChange={(event) =>
                  setField(
                    "price",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>Kısa Açıklama</span>
              <textarea
                rows={3}
                value={
                  form.short_description
                }
                onChange={(event) =>
                  setField(
                    "short_description",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>Detaylı Açıklama</span>
              <textarea
                rows={7}
                value={form.description}
                onChange={(event) =>
                  setField(
                    "description",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </section>

        <aside className="ap-form-card ap-glass">
          <h2>Yayın ve Satış</h2>

          <label className="ap-field">
            <span>İlan Durumu</span>
            <select
              value={form.status}
              onChange={(event) =>
                setField(
                  "status",
                  event.target
                    .value as ListingStatus,
                )
              }
            >
              <option value="draft">
                Taslak
              </option>
              <option value="active">
                Aktif
              </option>
              <option value="reserved">
                Rezerve
              </option>
              <option value="sold">
                Satıldı
              </option>
            </select>
          </label>

          <div className="ap-toggle-list">
            <label className="ap-switch-row">
              <span>Kredi imkânı</span>
              <input
                type="checkbox"
                checked={
                  form.credit_available
                }
                onChange={(event) =>
                  setField(
                    "credit_available",
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="ap-switch-row">
              <span>Takas imkânı</span>
              <input
                type="checkbox"
                checked={
                  form.exchange_available
                }
                onChange={(event) =>
                  setField(
                    "exchange_available",
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="ap-switch-row">
              <span>
                Komisyonsuz firma satışı
              </span>
              <input
                type="checkbox"
                checked={
                  form.commission_free
                }
                onChange={(event) =>
                  setField(
                    "commission_free",
                    event.target.checked,
                  )
                }
              />
            </label>
          </div>

          <h2 className="ap-subsection-title">
            Özellikler
          </h2>

          <div className="ap-feature-picker">
            {FEATURE_OPTIONS.map(
              (feature) => (
                <button
                  type="button"
                  key={feature}
                  className={
                    features.includes(feature)
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    toggleFeature(feature)
                  }
                >
                  <span>
                    {features.includes(feature)
                      ? "✓"
                      : "+"}
                  </span>
                  {feature}
                </button>
              ),
            )}
          </div>
        </aside>
      </div>

      <section
        className="ap-form-card ap-glass"
        style={{ marginTop: 16 }}
      >
        <div className="ap-section-heading-row">
          <div>
            <h2>Fotoğraf Yönetimi</h2>
            <p className="ap-muted">
              Fotoğrafın herhangi bir
              yerinden tutup sürükleyin.
              İlk fotoğraf kapak olur.
            </p>
          </div>

          <label className="ap-upload-button">
            Fotoğraf Seç
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) =>
                selectFiles(
                  event.target.files,
                )
              }
            />
          </label>
        </div>

        {activeExisting.length === 0 &&
        newFiles.length === 0 ? (
          <div className="ap-upload-empty">
            JPG, PNG veya WEBP fotoğrafları
            seçin. Dosya başına en fazla
            10 MB.
          </div>
        ) : (
          <div className="ap-photo-grid">
            {activeExisting.map(
              (image, index) => (
                <article
                  key={image.id}
                  className="ap-photo-card"
                  draggable
                  onDragStart={() =>
                    setDraggedExisting(index)
                  }
                  onDragOver={(
                    event: DragEvent,
                  ) =>
                    event.preventDefault()
                  }
                  onDrop={() =>
                    reorderExisting(index)
                  }
                >
                  <img
                    src={image.image_url}
                    alt=""
                  />

                  <span className="ap-photo-order">
                    {index + 1}
                  </span>

                  {index === 0 ? (
                    <span className="ap-cover-badge">
                      Kapak
                    </span>
                  ) : null}

                  <button
                    type="button"
                    className="ap-photo-delete"
                    onClick={() =>
                      setExistingImages(
                        (current) =>
                          current.map(
                            (item) =>
                              item.id ===
                              image.id
                                ? {
                                    ...item,
                                    removed:
                                      true,
                                  }
                                : item,
                          ),
                      )
                    }
                  >
                    Sil
                  </button>
                </article>
              ),
            )}

            {newImagePreviews.map(
              ({ file, url }, index) => {
                const position =
                  activeExisting.length +
                  index;

                return (
                  <article
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="ap-photo-card"
                    draggable
                    onDragStart={() =>
                      setDraggedNew(index)
                    }
                    onDragOver={(
                      event: DragEvent,
                    ) =>
                      event.preventDefault()
                    }
                    onDrop={() =>
                      reorderNew(index)
                    }
                  >
                    <img src={url} alt="" />

                    <span className="ap-photo-order">
                      {position + 1}
                    </span>

                    {position === 0 ? (
                      <span className="ap-cover-badge">
                        Kapak
                      </span>
                    ) : null}

                    <button
                      type="button"
                      className="ap-photo-delete"
                      onClick={() =>
                        setNewFiles(
                          (current) =>
                            current.filter(
                              (
                                _,
                                fileIndex,
                              ) =>
                                fileIndex !==
                                index,
                            ),
                        )
                      }
                    >
                      Sil
                    </button>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section
        className="ap-video-editor ap-glass"
      >
        <div className="ap-video-editor-copy">
          <p className="ap-kicker">
            YENİ NESİL SUNUM
          </p>

          <h2>İlan Klibi</h2>

          <p>
            Dairenin akışını tek videoda
            gösterin. İlan sayfasında
            fotoğraf galerisinin hemen
            altında özel bir klip kartı
            olarak görünür.
          </p>

          <label className="ap-upload-button">
            {visibleVideoUrl
              ? "Klibi Değiştir"
              : "Video Seç"}

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              onChange={(event) =>
                selectVideo(
                  event.target.files?.[0] ??
                    null,
                )
              }
            />
          </label>
        </div>

        <div className="ap-video-editor-preview">
          {visibleVideoUrl ? (
            <>
              <video
                src={visibleVideoUrl}
                controls
                preload="metadata"
              />

              <button
                type="button"
                className="ap-danger-button"
                onClick={() => {
                  setVideoFile(null);
                  setRemoveExistingVideo(
                    true,
                  );
                }}
              >
                Klibi Kaldır
              </button>
            </>
          ) : (
            <div className="ap-video-placeholder">
              <span>▶</span>
              <strong>
                İlan klibi eklenmedi
              </strong>
              <small>
                MP4, WEBM, MOV veya M4V
                · En fazla 150 MB
              </small>
            </div>
          )}
        </div>
      </section>

      <p className="ap-media-security-note">
        Metinler, seçimler ve özellikler
        otomatik saklanır. Tarayıcı
        güvenliği nedeniyle henüz
        yüklenmemiş fotoğraf ve video
        dosyaları sayfa yenilenirse yeniden
        seçilmelidir.
      </p>

      <div className="ap-mobile-save-bar">
        <button
          type="submit"
          className="ap-primary-button"
          disabled={saving}
        >
          {saving
            ? "Kaydediliyor..."
            : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
