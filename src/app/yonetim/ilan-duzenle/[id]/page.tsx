"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";

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

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<EditForm>(initialForm);
  const [images, setImages] = useState<
    Array<{
      image_url: string;
      is_cover: boolean;
      position: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const listingId = params.id;

  useEffect(() => {
    async function loadListing() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (listingError || !listing) {
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

      const { data: imageRows } = await supabase
        .from("listing_images")
        .select("image_url, is_cover, position")
        .eq("listing_id", listingId)
        .order("position", { ascending: true });

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

      setImages(imageRows ?? []);
      setIsLoading(false);
    }

    void loadListing();
  }, [listingId, router]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (
      !form.title.trim() ||
      !form.neighborhood.trim() ||
      !form.roomCount.trim() ||
      !form.price.trim()
    ) {
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

      setMessage("İlan başarıyla güncellendi.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "İlan güncellenirken bilinmeyen bir hata oluştu.",
      );
    } finally {
      setIsSaving(false);
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
    <main className="min-h-screen bg-[#F8F6F2] px-5 py-8 text-[#2A2A2A] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[32px] bg-[#F6A04D] p-7 shadow-[0_24px_70px_rgba(42,42,42,0.13)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.22em] text-[#2A2A2A]/60">
            AYDEMİR İNŞAAT
          </p>

          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                İlanı Düzenle
              </h1>
              <p className="mt-4 text-[#2A2A2A]/65">
                İlan bilgilerini ve yayın durumunu güncelleyin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/yonetim/ilanlar")}
              className="rounded-[20px] bg-[#F8F6F2] px-6 py-4 font-semibold shadow-[0_14px_35px_rgba(42,42,42,0.10)]"
            >
              Kayıtlı İlanlara Dön
            </button>
          </div>
        </header>

        {images.length > 0 ? (
          <section className="mt-8 rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(42,42,42,0.10)]">
            <h2 className="text-2xl font-semibold">
              Mevcut Fotoğraflar
            </h2>
            <p className="mt-2 text-[#2A2A2A]/55">
              Fotoğraf ekleme, silme ve kapak değiştirme özelliğini sonraki aşamada ekleyeceğiz.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={`${image.image_url}-${index}`}
                  className="relative overflow-hidden rounded-[22px]"
                >
                  <img
                    src={image.image_url}
                    alt={`İlan fotoğrafı ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {image.is_cover ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#F6A04D] px-3 py-1.5 text-xs font-semibold">
                      Kapak Fotoğrafı
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section className="rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(42,42,42,0.10)] sm:p-8">
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

          <section className="rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(42,42,42,0.10)] sm:p-8">
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

          {message ? (
            <div className="rounded-[22px] bg-[#F6A04D] px-5 py-4 font-semibold text-[#2A2A2A] shadow-[0_14px_35px_rgba(42,42,42,0.10)]">
              {message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/yonetim/ilanlar")}
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(event.target.value)}
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
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#F6A04D]"
      />
      {label}
    </label>
  );
}
