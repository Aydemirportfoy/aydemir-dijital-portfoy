import {
  Building2,
  CheckCircle2,
  LayoutGrid,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { stats } from "@/lib/data/listings";

const statIcons: Record<(typeof stats)[number]["label"], LucideIcon> = {
  "Toplam İlan": LayoutGrid,
  "Aktif İlan": Building2,
  Satılan: CheckCircle2,
  "Müşteri Sunumu": Presentation,
};

export function StatsGrid() {
  return (
    <section
      className="animate-fade-up mb-12 grid grid-cols-2 gap-4 sm:gap-5 lg:mb-14 lg:grid-cols-4"
      style={{ animationDelay: "80ms" }}
      aria-label="İstatistikler"
    >
      {stats.map((stat) => {
        const Icon = statIcons[stat.label];

        return (
          <article
            key={stat.label}
            className="card-surface card-surface-light motion-safe-transition group relative p-5 transition-[transform,box-shadow] duration-[260ms] ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:p-6"
          >
            <div className="relative flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-anthracite/45 sm:text-xs">
                {stat.label}
              </p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] bg-orange/18 text-orange transition-transform duration-[260ms] ease-out group-hover:scale-105">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="relative mt-5 text-4xl font-bold tracking-tight text-anthracite sm:mt-6 sm:text-[2.75rem] sm:leading-none">
              {stat.value}
            </p>
            <span
              className="absolute bottom-0 left-6 h-[3px] w-8 rounded-full bg-orange/35 sm:left-7"
              aria-hidden
            />
          </article>
        );
      })}
    </section>
  );
}
