export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "Fiyat bilgisi için arayın";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
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
}

export function safeFileName(value: string) {
  const extension = value.includes(".") ? value.split(".").pop() : "jpg";
  const base = value.replace(/\.[^/.]+$/, "");
  return `${slugify(base) || "gorsel"}.${extension?.toLowerCase() || "jpg"}`;
}
