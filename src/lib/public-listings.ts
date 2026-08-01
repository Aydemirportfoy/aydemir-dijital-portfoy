import { createClient } from "@supabase/supabase-js";

export type PublicListing = {
  id: string;
  project_name: string | null;
  slug: string;
  title: string;
  neighborhood: string;
  district: string | null;
  city: string | null;
  short_description: string | null;
  description: string | null;
  room_count: string | null;
  area_m2: number | null;
  floor: string | null;
  facade: string | null;
  price: number | null;
  status: "active";
  kitchen_type: string | null;
  features: string[];
  credit_available: boolean;
  exchange_available: boolean;
  commission_free: boolean;
  cover_image_url: string | null;
  created_at: string | null;
};

export type PublicListingImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  position: number;
  is_cover: boolean;
};

function getPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase ortam değişkenleri bulunamadı. .env.local dosyasını kontrol edin.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function normalizeListing(row: Record<string, unknown>): PublicListing {
  return {
    id: String(row.id ?? ""),
    project_name:
      typeof row.project_name === "string"
        ? row.project_name
        : null,
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    neighborhood: String(row.neighborhood ?? ""),
    district:
      typeof row.district === "string" ? row.district : null,
    city: typeof row.city === "string" ? row.city : null,
    short_description:
      typeof row.short_description === "string"
        ? row.short_description
        : null,
    description:
      typeof row.description === "string"
        ? row.description
        : null,
    room_count:
      typeof row.room_count === "string"
        ? row.room_count
        : null,
    area_m2:
      typeof row.area_m2 === "number"
        ? row.area_m2
        : row.area_m2
          ? Number(row.area_m2)
          : null,
    floor:
      typeof row.floor === "string" ? row.floor : null,
    facade:
      typeof row.facade === "string" ? row.facade : null,
    price:
      typeof row.price === "number"
        ? row.price
        : row.price
          ? Number(row.price)
          : null,
    status: "active",
    kitchen_type:
      typeof row.kitchen_type === "string"
        ? row.kitchen_type
        : null,
    features: normalizeFeatures(row.features),
    credit_available: Boolean(row.credit_available),
    exchange_available: Boolean(row.exchange_available),
    commission_free: Boolean(row.commission_free),
    cover_image_url:
      typeof row.cover_image_url === "string"
        ? row.cover_image_url
        : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : null,
  };
}

export async function getActiveListings(): Promise<PublicListing[]> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Aktif ilanlar alınamadı: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    normalizeListing(row as Record<string, unknown>),
  );
}

export async function getActiveListingBySlug(
  slug: string,
): Promise<PublicListing | null> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`İlan alınamadı: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeListing(data as Record<string, unknown>);
}

export async function getPublicListingImages(
  listingId: string,
): Promise<PublicListingImage[]> {
  const supabase = getPublicSupabaseClient();

  const { data, error } = await supabase
    .from("listing_images")
    .select("id, image_url, alt_text, position, is_cover")
    .eq("listing_id", listingId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`İlan fotoğrafları alınamadı: ${error.message}`);
  }

  return (data ?? []).map((image) => ({
    id: String(image.id ?? ""),
    image_url: String(image.image_url ?? ""),
    alt_text:
      typeof image.alt_text === "string"
        ? image.alt_text
        : null,
    position:
      typeof image.position === "number"
        ? image.position
        : Number(image.position ?? 0),
    is_cover: Boolean(image.is_cover),
  }));
}

export function formatListingPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Fiyat bilgisi için iletişime geçin";
  }

  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value)} TL`;
}
