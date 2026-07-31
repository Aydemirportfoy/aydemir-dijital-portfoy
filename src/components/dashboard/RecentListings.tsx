import { recentListings } from "@/lib/data/listings";
import { ListingCard } from "./ListingCard";

export function RecentListings() {
  return (
    <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-anthracite sm:text-2xl">
          Son Eklenen İlanlar
        </h2>
        <button
          type="button"
          className="motion-safe-transition text-sm font-semibold text-anthracite/50 transition-colors duration-[260ms] ease-out hover:text-anthracite"
        >
          Tümünü Gör
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recentListings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} index={index} />
        ))}
      </div>
    </section>
  );
}
