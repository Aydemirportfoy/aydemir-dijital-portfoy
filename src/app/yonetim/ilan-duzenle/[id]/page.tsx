"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { createClient } from "../../../../lib/supabase/client";
import SortableImageCard, {
  SortableListingImage,
} from "./SortableImageCard";
import AdminThemeToggle from "./AdminThemeToggle";

const featureOptions = [
  "Ebeveyn banyosu",
  "Giyinme odası",
  "Balkon",
  "Asansör",
  "Havuz",
  "Çocuk parkı",
  "Kamelya",
  "Açık otopark",
  "Kapalı otopark",
  "Yerden ısıtma",
  "Elektrikli panjur",
  "Ankastre set",
  "Görüntülü diafon",
];

const facadeOptions = ["Kuzey", "Güney", "Doğu", "Batı"];

type Status = "draft" | "active" | "reserved" | "sold";

type EditForm = {
  projectName: string;
  title: string;
  neighborhood: string;
  district: string;
  city: string;
  privateLocation: string;
  shortDescription: string;
  description: string;
  roomCount: string;
  areaM2: string;
  floor: string;
  price: string;
  status: Status;
  kitchenType: string;
  facades: string[];
  features: string[];
  creditAvailable: boolean;
  exchangeAvailable: boolean;
  commissionFree: boolean;
};

const initialForm: EditForm = {
  projectName: "",
  title: "",
  neighborhood: "",
  district: "",
  city: "",
  privateLocation: "",
  shortDescription: "",
  description: "",
  roomCount: "",
  areaM2: "",
  floor: "",
  price: "",
  status: "draft",
  kitchenType: "",
  facades: [],
  features: [],
  creditAvailable: false,
  exchangeAvailable: false,
  commissionFree: false,
};

function toNumberOrNull(value: string) {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeFileName(fileName: string) {
  const extension =
    fileName.split(".").pop()?.toLowerCase() || "jpg";

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "ilan-fotografi"}.${extension}`;
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;

  const [form, setForm] = useState<EditForm>(initialForm);
  const [images, setImages] =
    useState<SortableListingImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [workingImageId, setWorkingImageId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function loadListing() {
    setIsLoading(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/giris");
      return;
    }

    const { data: listing, error: listingError } =
      await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

    if (listingError || !listing) {
      setMessageType("error");
      setMessage(
        `İlan yüklenemedi: ${
          listingError?.message || "Kayıt bulunamadı."
        }`,
      );
      setIsLoading(false);
      return;
    }

    const { data: privateDetails } = await supabase
      .from("listing_private_details")
      .select("location_text")
      .eq("listing_id", listingId)
      .maybeSingle();

    const { data: imageRows, error: imageError } =
      await supabase
        .from("listing_images")
        .select(
          "id, image_url, storage_path, alt_text, is_cover, position",
        )
        .eq("listing_id", listingId)
        .order("position", { ascending: true });

    if (imageError) {
      setMessageType("error");
      setMessage(
        `Fotoğraflar yüklenemedi: ${imageError.message}`,
      );
    }

    setForm({
      projectName: listing.project_name ?? "",
      title: listing.title ?? "",
      neighborhood: listing.neighborhood ?? "",
      district: listing.district ?? "",
      city: listing.city ?? "",
      privateLocation: privateDetails?.location_text ?? "",
      shortDescription: listing.short_description ?? "",
      description: listing.description ?? "",
      roomCount: listing.room_count ?? "",
      areaM2:
        listing.area_m2 === null ||
        listing.area_m2 === undefined
          ? ""
          : String(listing.area_m2),
      floor: listing.floor ?? "",
      price:
        listing.price === null ||
        listing.price === undefined
          ? ""
          : String(listing.price),
      status: listing.status as Status,
      kitchenType: listing.kitchen_type ?? "",
      facades:
        typeof listing.facade === "string" &&
        listing.facade.trim()
          ? listing.facade
              .split(",")
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [],
      features: Array.isArray(listing.features)
        ? listing.features
        : [],
      creditAvailable: Boolean(listing.credit_available),
      exchangeAvailable: Boolean(listing.exchange_available),
      commissionFree: Boolean(listing.commission_free),
    });

    setImages(
      ((imageRows ?? []) as SortableListingImage[]).map(
        (image, index) => ({
          ...image,
          position: index,
        }),
      ),
    );

    setIsLoading(false);
  }

  useEffect(() => {
    void loadListing();
  }, [listingId]);

  function updateField<K extends keyof EditForm>(
    key: K,
    value: EditForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleFacade(facade: string) {
    setForm((current) => ({
      ...current,
      facades: current.facades.includes(facade)
        ? current.facades.filter((item) => item !== facade)
        : [...current.facades, facade],
    }));
  }

  function toggleFeature(feature: string) {
    setForm((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  }

  function handleNewImages(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selected = Array.from(event.target.files ?? []);

    const valid = selected.filter((file) => {
      const validType = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type);

      const validSize = file.size <= 10 * 1024 * 1024;
      return validType && validSize;
    });

    if (valid.length !== selected.length) {
      setMessageType("error");
      setMessage(
        "Yalnızca JPG, PNG veya WEBP ve en fazla 10 MB fotoğraflar kabul edilir.",
      );
    } else {
      setMessage("");
    }

    setNewImages(valid);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage("");

    if (
      !form.title.trim() ||
      !form.neighborhood.trim() ||
      !form.roomCount.trim() ||
      !form.price.trim()
    ) {
      setMessageType("error");
      setMessage(
        "İlan başlığı, mahalle, oda sayısı ve fiyat alanları zorunludur.",
      );
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error: listingError } = await supabase
        .from("listings")
        .update({
          project_name: form.projectName.trim() || null,
          title: form.title.trim(),
          neighborhood: form.neighborhood.trim(),
          district: form.district.trim() || null,
          city: form.city.trim() || null,
          short_description:
            form.shortDescription.trim() || null,
          description: form.description.trim() || null,
          room_count: form.roomCount.trim(),
          area_m2: toNumberOrNull(form.areaM2),
          floor: form.floor.trim() || null,
          facade:
            form.facades.length > 0
              ? form.facades.join(", ")
              : null,
          price: toNumberOrNull(form.price),
          status: form.status,
          kitchen_type: form.kitchenType || null,
          features: form.features,
          credit_available: form.creditAvailable,
          exchange_available: form.exchangeAvailable,
          commission_free: form.commissionFree,
        })
        .eq("id", listingId);

      if (listingError) {
        throw new Error(
          `İlan güncellenemedi: ${listingError.message}`,
        );
      }

      if (form.privateLocation.trim()) {
        const { error: privateError } = await supabase
          .from("listing_private_details")
          .upsert(
            {
              listing_id: listingId,
              location_text: form.privateLocation.trim(),
            },
            {
              onConflict: "listing_id",
            },
          );

        if (privateError) {
          throw new Error(
            `Konum güncellenemedi: ${privateError.message}`,
          );
        }
      } else {
        const { error: privateDeleteError } = await supabase
          .from("listing_private_details")
          .delete()
          .eq("listing_id", listingId);

        if (privateDeleteError) {
          throw new Error(
            `Konum temizlenemedi: ${privateDeleteError.message}`,
          );
        }
      }

      setMessageType("success");
      setMessage("İlan bilgileri başarıyla güncellendi.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "İlan güncellenirken bilinmeyen bir hata oluştu.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadNewImages() {
    if (newImages.length === 0) {
      setMessageType("error");
      setMessage("Önce yüklenecek fotoğrafları seçin.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      const startPosition = images.length;
      const rows = [];

      for (let index = 0; index < newImages.length; index += 1) {
        const file = newImages[index];
        const storagePath = `${listingId}/${Date.now()}-${index}-${safeFileName(
          file.name,
        )}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Fotoğraf yüklenemedi: ${uploadError.message}`,
          );
        }

        uploadedPaths.push(storagePath);

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("listing-images")
          .getPublicUrl(storagePath);

        rows.push({
          listing_id: listingId,
          storage_path: storagePath,
          image_url: publicUrl,
          alt_text: `${form.projectName || form.title} fotoğrafı ${
            startPosition + index + 1
          }`,
          position: startPosition + index,
          is_cover: images.length === 0 && index === 0,
        });
      }

      const { data: insertedImages, error: insertError } =
        await supabase
          .from("listing_images")
          .insert(rows)
          .select(
            "id, image_url, storage_path, alt_text, is_cover, position",
          );

      if (insertError) {
        throw new Error(
          `Fotoğraf kayıtları oluşturulamadı: ${insertError.message}`,
        );
      }

      if (images.length === 0 && insertedImages?.[0]) {
        const { error: coverError } = await supabase
          .from("listings")
          .update({
            cover_image_url: insertedImages[0].image_url,
          })
          .eq("id", listingId);

        if (coverError) {
          throw new Error(
            `Kapak fotoğrafı kaydedilemedi: ${coverError.message}`,
          );
        }
      }

      setNewImages([]);
      setMessageType("success");
      setMessage("Yeni fotoğraflar başarıyla yüklendi.");
      await loadListing();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("listing-images")
          .remove(uploadedPaths);
      }

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Fotoğraflar yüklenirken bilinmeyen bir hata oluştu.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function setCoverImage(
    image: SortableListingImage,
  ) {
    if (image.is_cover) return;

    setWorkingImageId(image.id);
    setMessage("");

    const supabase = createClient();

    try {
      const { error: clearError } = await supabase
        .from("listing_images")
        .update({ is_cover: false })
        .eq("listing_id", listingId);

      if (clearError) {
        throw new Error(
          `Eski kapak kaldırılamadı: ${clearError.message}`,
        );
      }

      const { error: imageError } = await supabase
        .from("listing_images")
        .update({ is_cover: true })
        .eq("id", image.id);

      if (imageError) {
        throw new Error(
          `Yeni kapak seçilemedi: ${imageError.message}`,
        );
      }

      const { error: listingError } = await supabase
        .from("listings")
        .update({
          cover_image_url: image.image_url,
        })
        .eq("id", listingId);

      if (listingError) {
        throw new Error(
          `İlan kapağı güncellenemedi: ${listingError.message}`,
        );
      }

      setImages((current) =>
        current.map((item) => ({
          ...item,
          is_cover: item.id === image.id,
        })),
      );

      setMessageType("success");
      setMessage("Kapak fotoğrafı değiştirildi.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Kapak değiştirilirken hata oluştu.",
      );
    } finally {
      setWorkingImageId("");
    }
  }

  async function deleteImage(
    image: SortableListingImage,
  ) {
    const approved = window.confirm(
      "Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?",
    );

    if (!approved) return;

    setWorkingImageId(image.id);
    setMessage("");

    const supabase = createClient();

    try {
      const { error: storageError } = await supabase.storage
        .from("listing-images")
        .remove([image.storage_path]);

      if (storageError) {
        throw new Error(
          `Fotoğraf dosyası silinemedi: ${storageError.message}`,
        );
      }

      const { error: deleteError } = await supabase
        .from("listing_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw new Error(
          `Fotoğraf kaydı silinemedi: ${deleteError.message}`,
        );
      }

      const remaining = images.filter(
        (item) => item.id !== image.id,
      );

      const normalizedRemaining = remaining.map(
        (item, index) => ({
          ...item,
          position: index,
          is_cover:
            image.is_cover && index === 0
              ? true
              : item.is_cover,
        }),
      );

      if (image.is_cover) {
        const newCover = normalizedRemaining[0] ?? null;

        if (newCover) {
          await supabase
            .from("listing_images")
            .update({ is_cover: true })
            .eq("id", newCover.id);
        }

        const { error: listingError } = await supabase
          .from("listings")
          .update({
            cover_image_url: newCover?.image_url ?? null,
          })
          .eq("id", listingId);

        if (listingError) {
          throw new Error(
            `Yeni kapak kaydedilemedi: ${listingError.message}`,
          );
        }
      }

      await Promise.all(
        normalizedRemaining.map((item, index) =>
          supabase
            .from("listing_images")
            .update({ position: index })
            .eq("id", item.id),
        ),
      );

      setImages(normalizedRemaining);
      setMessageType("success");
      setMessage("Fotoğraf başarıyla silindi.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Fotoğraf silinirken hata oluştu.",
      );
    } finally {
      setWorkingImageId("");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || isReordering) {
      return;
    }

    const oldIndex = images.findIndex(
      (image) => image.id === active.id,
    );

    const newIndex = images.findIndex(
      (image) => image.id === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousImages = images;

    const reordered = arrayMove(
      images,
      oldIndex,
      newIndex,
    ).map((image, index) => ({
      ...image,
      position: index,
    }));

    setImages(reordered);
    setIsReordering(true);
    setMessage("");

    const supabase = createClient();

    try {
      const results = await Promise.all(
        reordered.map((image, index) =>
          supabase
            .from("listing_images")
            .update({ position: index })
            .eq("id", image.id),
        ),
      );

      const failedResult = results.find(
        (result) => result.error,
      );

      if (failedResult?.error) {
        throw new Error(failedResult.error.message);
      }

      setMessageType("success");
      setMessage(
        "Fotoğraf sırası başarıyla güncellendi.",
      );
    } catch (error) {
      setImages(previousImages);
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? `Fotoğraf sırası kaydedilemedi: ${error.message}`
          : "Fotoğraf sırası kaydedilemedi.",
      );
    } finally {
      setIsReordering(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8F6F2] p-8 text-center text-[#2A2A2A]">
        İlan yükleniyor...
      </main>
    );
  }

  return (
    <main className="admin-premium-shell min-h-screen px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
<AdminThemeToggle />

        <header className="admin-premium-header">
          <div>
            <p className="admin-premium-eyebrow">
              AYDEMİR İNŞAAT
            </p>

            <h1 className="admin-premium-title">
              İlanı Düzenle
            </h1>

            <p className="admin-premium-subtitle">
              Fotoğrafları hızlıca sırala, bilgileri güncelle ve yayına hazırla.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/yonetim/ilanlar")}
            className="admin-premium-back"
          >
            Kayıtlı İlanlar
          </button>
        </header>

        <nav className="admin-premium-tabs" aria-label="İlan düzenleme bölümleri">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("fotograflar")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            Fotoğraflar
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("ilan-bilgileri")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            İlan Bilgileri
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("ozellikler")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            Özellikler
          </button>
        </nav>

        {message ? (
          <div
            className={`mt-6 rounded-[22px] px-5 py-4 font-semibold ${
              messageType === "success"
                ? "bg-[#F6A04D] text-[#2A2A2A]"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section id="fotograflar" className="admin-premium-section mt-6 scroll-mt-28">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Fotoğraf Yönetimi
              </h2>


            </div>

            <span className="rounded-full bg-[#F6A04D]/15 px-4 py-2 text-sm font-semibold">
              {isReordering
                ? "Sıra kaydediliyor..."
                : `${images.length} fotoğraf`}
            </span>
          </div>

          {images.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((image) => image.id)}
                strategy={rectSortingStrategy}
              >
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => (
                    <SortableImageCard
                      key={image.id}
                      image={image}
                      index={index}
                      workingImageId={workingImageId}
                      onSetCover={setCoverImage}
                      onDelete={deleteImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="mt-6 rounded-[22px] bg-[#F8F6F2] p-6 text-center text-[#2A2A2A]/55">
              Bu ilanda henüz fotoğraf bulunmuyor.
            </div>
          )}

          <div className="mt-8 rounded-[24px] border-2 border-dashed border-[#F6A04D] p-6">
            <h3 className="text-lg font-semibold">
              Yeni Fotoğraf Ekle
            </h3>

            <p className="mt-2 text-sm text-[#2A2A2A]/55">
              JPG, PNG veya WEBP • Her fotoğraf en fazla 10 MB
            </p>

            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleNewImages}
              className="mt-5 block w-full text-sm"
            />

            {newImages.length > 0 ? (
              <div className="mt-4 rounded-[16px] bg-[#F8F6F2] p-4 text-sm">
                {newImages.length} fotoğraf seçildi.
              </div>
            ) : null}

            <button
              type="button"
              onClick={uploadNewImages}
              disabled={
                isUploading || newImages.length === 0
              }
              className="mt-5 rounded-[17px] bg-[#F6A04D] px-6 py-3.5 font-semibold disabled:opacity-45"
            >
              {isUploading
                ? "Fotoğraflar yükleniyor..."
                : "Seçilen Fotoğrafları Yükle"}
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section id="ilan-bilgileri" className="admin-premium-section scroll-mt-28">
            <h2 className="text-2xl font-semibold">
              Temel Bilgiler
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <TextField
                label="Proje Adı"
                value={form.projectName}
                onChange={(value) =>
                  updateField("projectName", value)
                }
              />

              <TextField
                label="İlan Başlığı"
                value={form.title}
                onChange={(value) =>
                  updateField("title", value)
                }
                required
              />

              <TextField
                label="Mahalle"
                value={form.neighborhood}
                onChange={(value) =>
                  updateField("neighborhood", value)
                }
                required
              />

              <TextField
                label="İlçe"
                value={form.district}
                onChange={(value) =>
                  updateField("district", value)
                }
              />

              <TextField
                label="Şehir"
                value={form.city}
                onChange={(value) =>
                  updateField("city", value)
                }
              />

              <TextField
                label="Oda Sayısı"
                value={form.roomCount}
                onChange={(value) =>
                  updateField("roomCount", value)
                }
                required
              />

              <TextField
                label="Metrekare"
                value={form.areaM2}
                onChange={(value) =>
                  updateField("areaM2", value)
                }
              />

              <TextField
                label="Kat"
                value={form.floor}
                onChange={(value) =>
                  updateField("floor", value)
                }
              />

              <TextField
                label="Fiyat"
                value={form.price}
                onChange={(value) =>
                  updateField("price", value)
                }
                required
              />

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
                  İlan Durumu
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as Status,
                    )
                  }
                  className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-white px-5 py-4 outline-none"
                >
                  <option value="draft">Taslak</option>
                  <option value="active">Aktif</option>
                  <option value="reserved">Rezerve</option>
                  <option value="sold">Satıldı</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
                  Gizli Konum
                </span>

                <input
                  type="text"
                  value={form.privateLocation}
                  onChange={(event) =>
                    updateField(
                      "privateLocation",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-white px-5 py-4 outline-none"
                />

                <span className="mt-2 block text-sm text-[#2A2A2A]/45">
                  Bu bilgi müşterilere gösterilmez.
                </span>
              </label>
            </div>

            <div className="mt-5">
              <TextArea
                label="Kısa Açıklama"
                value={form.shortDescription}
                onChange={(value) =>
                  updateField("shortDescription", value)
                }
                rows={3}
              />
            </div>

            <div className="mt-5">
              <TextArea
                label="Detaylı Açıklama"
                value={form.description}
                onChange={(value) =>
                  updateField("description", value)
                }
                rows={6}
              />
            </div>
          </section>

          <section id="ozellikler" className="admin-premium-section scroll-mt-28">
            <h2 className="text-2xl font-semibold">
              Daire Özellikleri
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-[#2A2A2A]/70">
                  Cephe
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {facadeOptions.map((facade) => (
                    <label
                      key={facade}
                      className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#2A2A2A]/10 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={form.facades.includes(facade)}
                        onChange={() => toggleFacade(facade)}
                        className="h-5 w-5 accent-[#F6A04D]"
                      />

                      {facade}
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-3 block text-sm font-semibold text-[#2A2A2A]/70">
                  Mutfak Tipi
                </span>

                <select
                  value={form.kitchenType}
                  onChange={(event) =>
                    updateField(
                      "kitchenType",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-white px-5 py-4 outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value="Açık mutfak">
                    Açık mutfak
                  </option>
                  <option value="Ayrı mutfak">
                    Ayrı mutfak
                  </option>
                </select>
              </label>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureOptions.map((feature) => (
                <label
                  key={feature}
                  className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#2A2A2A]/10 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={form.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="h-5 w-5 accent-[#F6A04D]"
                  />

                  {feature}
                </label>
              ))}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <BooleanField
                label="Kredi İmkânı"
                checked={form.creditAvailable}
                onChange={(checked) =>
                  updateField("creditAvailable", checked)
                }
              />

              <BooleanField
                label="Takas İmkânı"
                checked={form.exchangeAvailable}
                onChange={(checked) =>
                  updateField("exchangeAvailable", checked)
                }
              />

              <BooleanField
                label="Komisyonsuz Firma Satışı"
                checked={form.commissionFree}
                onChange={(checked) =>
                  updateField("commissionFree", checked)
                }
              />
            </div>
          </section>

          <div className="admin-premium-savebar flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/yonetim/ilanlar")
              }
              className="rounded-[20px] bg-white px-6 py-4 font-semibold shadow-[0_14px_35px_rgba(42,42,42,0.10)]"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-[20px] bg-[#F6A04D] px-8 py-4 font-semibold disabled:opacity-60"
            >
              {isSaving
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

function TextField({
  label,
  value,
  onChange,
  required = false,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type="text"
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-[18px] border border-[#2A2A2A]/10 bg-white px-5 py-4 outline-none"
      />
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
};

function TextArea({
  label,
  value,
  onChange,
  rows,
}: TextAreaProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#2A2A2A]/70">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={rows}
        className="w-full resize-y rounded-[18px] border border-[#2A2A2A]/10 bg-white px-5 py-4 outline-none"
      />
    </label>
  );
}

type BooleanFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function BooleanField({
  label,
  checked,
  onChange,
}: BooleanFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#2A2A2A]/10 px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-5 w-5 accent-[#F6A04D]"
      />

      {label}
    </label>
  );
}
