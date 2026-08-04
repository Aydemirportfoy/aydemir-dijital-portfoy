"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

type Density = 2 | 4 | 6 | 8;

export default function PortfolioGrid({
  listings,
}: {
  listings: Listing[];
}) {
  const [density, setDensity] =
    useState<Density>(4);

  const [isMobile, setIsMobile] =
    useState(false);

  useEffect(() => {
    const query = window.matchMedia(
      "(max-width: 640px)",
    );

    function syncView() {
      const mobile = query.matches;
      setIsMobile(mobile);

      const storageKey = mobile
        ? "aydemir-public-density-mobile"
        : "aydemir-public-density-desktop";

      const saved =
        window.localStorage.getItem(
          storageKey,
        );

      if (mobile) {
        setDensity(
          saved === "4" ? 4 : 2,
        );
      } else {
        setDensity(
          saved === "4" ||
          saved === "6" ||
          saved === "8"
            ? (Number(saved) as Density)
            : 6,
        );
      }
    }

    syncView();
    query.addEventListener(
      "change",
      syncView,
    );

    return () => {
      query.removeEventListener(
        "change",
        syncView,
      );
    };
  }, []);

  function choose(value: Density) {
    setDensity(value);

    const storageKey = isMobile
      ? "aydemir-public-density-mobile"
      : "aydemir-public-density-desktop";

    window.localStorage.setItem(
      storageKey,
      String(value),
    );
  }

  const options: Density[] = isMobile
    ? [2, 4]
    : [4, 6, 8];

  return (
    <>
      <div className="ap-public-grid-toolbar">
        <span>Görünüm</span>

        <div className="ap-public-density-switch">
          {options.map((value) => (
            <button
              type="button"
              key={value}
              className={
                density === value
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                choose(value)
              }
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div
        className={
          `ap-public-grid ` +
          `ap-public-grid-${density}`
        }
      >
        {listings.map(
          (listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={index}
            />
          ),
        )}
      </div>
    </>
  );
}
