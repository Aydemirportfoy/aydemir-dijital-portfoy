import { Heart, LayoutGrid, Plus, Presentation } from "lucide-react";

const actions = [
  { label: "Yeni İlan", icon: Plus },
  { label: "Tüm İlanlar", icon: LayoutGrid },
  { label: "Sunum Oluştur", icon: Presentation },
  { label: "Favoriler", icon: Heart },
] as const;

export function QuickActions() {
  return (
    <section
      className="animate-fade-up mb-12 lg:mb-14"
      style={{ animationDelay: "140ms" }}
      aria-label="Hızlı işlemler"
    >
      <h2 className="mb-5 text-xl font-bold tracking-tight text-anthracite sm:text-2xl">
        Hızlı İşlemler
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              className="card-surface card-surface-light motion-safe-transition group flex flex-col items-start gap-5 p-5 text-left transition-[transform,box-shadow] duration-[260ms] ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.97] sm:p-6"
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-[20px] bg-orange text-anthracite shadow-[var(--shadow-orange)] transition-transform duration-[260ms] ease-out group-hover:scale-[1.04]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold leading-snug text-anthracite sm:text-base">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
