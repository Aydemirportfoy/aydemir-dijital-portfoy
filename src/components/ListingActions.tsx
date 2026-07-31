"use client";

type ListingActionsProps = {
  slug: string;
  title: string;
  neighborhood: string;
  rooms: string;
  price: string;
};

const PHONE_NUMBER = "+905404175353";
const WHATSAPP_NUMBER = "905404175353";

export default function ListingActions({
  slug,
  title,
  neighborhood,
  rooms,
  price,
}: ListingActionsProps) {
  function getListingUrl() {
    return `${window.location.origin}/ilan/${slug}`;
  }

  function openWhatsApp() {
    const message = encodeURIComponent(
      [
        `Merhaba, ${title} hakkında bilgi almak istiyorum.`,
        "",
        `Konum: ${neighborhood}`,
        `Oda Sayısı: ${rooms}`,
        `Fiyat: ${price}`,
        "",
        "İlanı görüntülemek için:",
        getListingUrl(),
      ].join("\n"),
    );

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function callPhone() {
    window.location.href = `tel:${PHONE_NUMBER}`;
  }

  async function shareListing() {
    const url = getListingUrl();
    const shareData = {
      title: `${title} | Aydemir İnşaat`,
      text: `${title} - ${neighborhood} - ${rooms} - ${price}`,
      url,
    };

    const isMobile = /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    );

    try {
      if (isMobile && typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);
      window.alert("İlan bağlantısı kopyalandı.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      window.prompt("İlan bağlantısını kopyalayın:", url);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={openWhatsApp}
        className="rounded-[20px] bg-[#F6A04D] px-5 py-4 font-semibold text-[#2A2A2A] shadow-[0_14px_35px_rgba(42,42,42,0.12)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      >
        WhatsApp
      </button>

      <button
        type="button"
        onClick={callPhone}
        className="rounded-[20px] bg-[#F8F6F2] px-5 py-4 font-semibold text-[#2A2A2A] shadow-[0_14px_35px_rgba(42,42,42,0.10)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      >
        Ara
      </button>

      <button
        type="button"
        onClick={shareListing}
        className="rounded-[20px] bg-[#F8F6F2] px-5 py-4 font-semibold text-[#2A2A2A] shadow-[0_14px_35px_rgba(42,42,42,0.10)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
      >
        Paylaş
      </button>
    </div>
  );
}
