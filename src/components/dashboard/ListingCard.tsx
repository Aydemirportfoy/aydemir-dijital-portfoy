"use client";

import Image from "next/image";
import { Eye, Heart, MapPin, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import type { Listing } from "@/lib/data/listings";

type ListingCardProps = {
  listing: Listing;
  index: number;
};

export function ListingCard({ listing, index }: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article
      className="animate-fade-up card-listing card-surface-light motion-safe-transition group flex flex-col overflow-hidden transition-[transform,box-shadow] duration-[280ms] ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-listing-hover)] active:scale-[0.995]"
      style={{ animationDelay: `${200 + index * 60}ms` }}
    >
      <div className="p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[26px]">
          <Image
            src={listing.imageUrl}
            alt={listing.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-[320ms] ease-out motion-safe-transition group-hover:scale-[1.02]"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-anthracite/8" />

          <span className="absolute bottom-3 left-3 rounded-[18px] bg-orange px-3 py-1.5 text-xs font-semibold text-anthracite shadow-[var(--shadow-orange)]">
            {listing.rooms}
          </span>

          <button
            type="button"
            aria-label="Favori"
            onClick={() => setIsFavorite((prev) => !prev)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-anthracite shadow-[0_4px_16px_rgb(42_42_42_/_0.12)] backdrop-blur-sm transition-[transform,background-color] duration-[260ms] ease-out hover:scale-105 active:scale-95"
          >
            <Heart
              className="h-4 w-4"
              strokeWidth={1.75}
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4 sm:p-6 sm:pt-5">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight text-anthracite sm:text-2xl">
            {listing.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-anthracite/55">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {listing.neighborhood}
          </p>
        </div>

        <p className="mb-6 text-2xl font-bold tracking-tight text-anthracite sm:text-[1.65rem]">
          {listing.price}
        </p>

        <div className="mt-auto flex items-center gap-2.5">
          <IconActionButton label="Önizle" icon={Eye} />
          <IconActionButton label="Düzenle" icon={Pencil} />
          <IconActionButton label="Paylaş" icon={Share2} />
        </div>
      </div>
    </article>
  );
}

type IconActionButtonProps = {
  label: string;
  icon: typeof Eye;
};

function IconActionButton({ label, icon: Icon }: IconActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="motion-safe-transition flex h-11 flex-1 items-center justify-center gap-2 rounded-[20px] bg-anthracite/5 text-anthracite/70 transition-[transform,background-color,color,box-shadow] duration-[260ms] ease-out hover:bg-orange/15 hover:text-anthracite active:scale-[0.96]"
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      <span className="text-xs font-semibold sm:text-sm">{label}</span>
    </button>
  );
}
