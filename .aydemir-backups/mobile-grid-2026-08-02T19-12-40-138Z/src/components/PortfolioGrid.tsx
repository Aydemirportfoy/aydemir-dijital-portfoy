"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

type Density = 4 | 6 | 8;

export default function PortfolioGrid({
  listings,
}: {
  listings: Listing[];
}) {
  const [density, setDensity] =
    useState<Density>(6);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "aydemir-public-density",
      );

    if (
      saved === "4" ||
      saved === "6" ||
      saved === "8"
    ) {
      setDensity(Number(saved) as Density);
    }
  }, []);

  function choose(value: Density) {
    setDensity(value);

    window.localStorage.setItem(
      "aydemir-public-density",
      String(value),
    );
  }

  return (
    <>
      <div className="ap-public-grid-toolbar">
        <span>Görünüm</span>

        <div className="ap-public-density-switch">
          {([4, 6, 8] as Density[]).map(
            (value) => (
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
            ),
          )}
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
