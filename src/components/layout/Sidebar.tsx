"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/lib/constants/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-[17.5rem] lg:flex-col lg:bg-cream lg:px-6 lg:py-10">
      <div className="mb-12 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-anthracite/45">
          Aydemir İnşaat
        </p>
        <p className="mt-2 text-xl font-bold tracking-tight text-anthracite">
          Dijital Portföy
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href && item.href === "/";
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`motion-safe-transition flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-sm font-semibold transition-[transform,background-color,box-shadow,color] duration-[260ms] ease-out ${
                isActive
                  ? "bg-orange text-anthracite shadow-[var(--shadow-orange)]"
                  : "text-anthracite/55 hover:bg-anthracite/5 hover:text-anthracite"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
