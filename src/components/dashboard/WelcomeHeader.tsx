import { Plus } from "lucide-react";

export function WelcomeHeader() {
  return (
    <header className="animate-fade-up mb-12 lg:mb-14">
      <div className="lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-anthracite/45">
          Aydemir İnşaat
        </p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-anthracite sm:text-4xl">
          Dijital Portföy
        </h1>
      </div>

      <p className="mt-5 max-w-xl text-base leading-relaxed text-anthracite/60 sm:text-lg sm:leading-8">
        Portföylerinizi yönetin ve müşterilerinize özel sunumlar hazırlayın.
      </p>

      <button
        type="button"
        className="motion-safe-transition mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-orange px-7 py-4 text-base font-bold text-anthracite shadow-[var(--shadow-orange)] transition-[transform,box-shadow] duration-[260ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(246_160_77_/_0.38)] active:translate-y-0 active:scale-[0.98] sm:w-auto sm:min-w-[260px]"
      >
        <Plus className="h-5 w-5" strokeWidth={2} />
        Yeni İlan Ekle
      </button>
    </header>
  );
}
