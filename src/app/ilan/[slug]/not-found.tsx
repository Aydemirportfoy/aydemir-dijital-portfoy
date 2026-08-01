import Link from "next/link";

export default function ListingNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-5 text-[#2A2A2A]">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-8 text-center shadow-[0_24px_75px_rgba(42,42,42,0.12)] sm:p-12">
        <p className="text-sm font-semibold tracking-[0.20em] text-[#2A2A2A]/45">
          AYDEMİR İNŞAAT
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          İlan bulunamadı
        </h1>
        <p className="mt-4 leading-7 text-[#2A2A2A]/60">
          Bu ilan yayından kaldırılmış, satılmış veya henüz aktif hale getirilmemiş olabilir.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-[18px] bg-[#F6A04D] px-6 py-4 font-semibold"
        >
          Aktif İlanlara Dön
        </Link>
      </div>
    </main>
  );
}
