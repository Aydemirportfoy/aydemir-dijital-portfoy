"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/lib/constants/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      aria-label="Ana navigasyon"
    >
      <div className="mx-auto max-w-md rounded-[28px] bg-cream/92 px-2 py-2 shadow-[var(--shadow-nav)] backdrop-blur-xl">
        <ul className="flex items-end justify-between gap-0.5">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href && item.href === "/";
            const isNewListing = item.label === "Yeni İlan";
            const Icon = item.icon;

            return (
              <li key={item.label} className="flex-1">
                <Link
                  href={item.href}
                  className={`motion-safe-transition flex flex-col items-center gap-1 rounded-[20px] px-1 py-1.5 text-[10px] font-semibold transition-[transform,color] duration-[260ms] ease-out active:scale-95 ${
                    isActive
                      ? "text-orange"
                      : "text-anthracite/45"
                  }`}
                >
                  <span
                    className={`motion-safe-transition flex items-center justify-center rounded-[18px] transition-[transform,background-color,box-shadow] duration-[260ms] ease-out ${
                      isNewListing
                        ? "h-11 w-11 bg-orange text-anthracite shadow-[var(--shadow-orange)]"
                        : isActive
                          ? "h-10 w-10 bg-orange/18 text-orange"
                          : "h-10 w-10 bg-transparent text-anthracite/45"
                    }`}
                  >
                    <Icon
                      className={isNewListing ? "h-5 w-5" : "h-[18px] w-[18px]"}
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="max-w-[4.5rem] truncate leading-none">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
