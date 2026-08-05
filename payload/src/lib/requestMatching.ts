import type { Listing } from "@/lib/types";
import type { CustomerRequest } from "@/lib/requestTypes";

export type RequestCriteria = Pick<
  CustomerRequest,
  | "min_budget"
  | "max_budget"
  | "neighborhoods"
  | "room_counts"
  | "min_area"
  | "max_area"
  | "floor_preferences"
  | "kitchen_type"
  | "credit_required"
  | "exchange_required"
  | "commission_free_only"
  | "required_features"
>;

export type ListingMatch = {
  listing: Listing;
  score: number;
  reasons: string[];
  gaps: string[];
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/\bmahallesi\b/g, "")
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .trim();
}

function roomKey(value: string | null | undefined) {
  return normalize(value)
    .replace(/\s+/g, "")
    .replace(",", ".");
}

function includesNormalized(
  source: string | null | undefined,
  target: string,
) {
  const sourceValue = normalize(source);
  const targetValue = normalize(target);

  if (!sourceValue || !targetValue) {
    return false;
  }

  return (
    sourceValue.includes(targetValue) ||
    targetValue.includes(sourceValue)
  );
}

function featureMatch(
  listingFeatures: string[],
  requestedFeature: string,
) {
  const requested = normalize(requestedFeature);

  return listingFeatures.some((feature) => {
    const current = normalize(feature);

    return (
      current.includes(requested) ||
      requested.includes(current)
    );
  });
}

function budgetResult(
  criteria: RequestCriteria,
  listing: Listing,
) {
  const min = criteria.min_budget;
  const max = criteria.max_budget;
  const price = listing.price;

  if (!min && !max) {
    return null;
  }

  if (!price) {
    return {
      ratio: 0,
      reason: "",
      gap: "Fiyat bilgisi yok",
    };
  }

  if (min && max) {
    if (price >= min && price <= max) {
      return {
        ratio: 1,
        reason: "Bütçe aralığında",
        gap: "",
      };
    }

    if (price < min) {
      return {
        ratio: 0.82,
        reason: "Bütçenin altında",
        gap: "",
      };
    }

    const overRatio =
      (price - max) / max;

    if (overRatio <= 0.08) {
      return {
        ratio: 0.52,
        reason: "",
        gap: "Bütçeyi az aşıyor",
      };
    }

    return {
      ratio: 0,
      reason: "",
      gap: "Bütçeyi aşıyor",
    };
  }

  if (max) {
    if (price <= max) {
      return {
        ratio: 1,
        reason: "Bütçeye uygun",
        gap: "",
      };
    }

    const overRatio =
      (price - max) / max;

    if (overRatio <= 0.08) {
      return {
        ratio: 0.5,
        reason: "",
        gap: "Bütçeyi az aşıyor",
      };
    }

    return {
      ratio: 0,
      reason: "",
      gap: "Bütçeyi aşıyor",
    };
  }

  if (min) {
    if (price >= min) {
      return {
        ratio: 1,
        reason: "Bütçe seviyesine uygun",
        gap: "",
      };
    }

    return {
      ratio: 0.7,
      reason: "Daha uygun fiyatlı",
      gap: "",
    };
  }

  return null;
}

export function scoreListingForRequest(
  criteria: RequestCriteria,
  listing: Listing,
): ListingMatch {
  let earned = 0;
  let possible = 0;

  const reasons: string[] = [];
  const gaps: string[] = [];

  const add = (
    weight: number,
    ratio: number,
    reason?: string,
    gap?: string,
  ) => {
    possible += weight;
    earned += weight * ratio;

    if (reason) {
      reasons.push(reason);
    }

    if (gap) {
      gaps.push(gap);
    }
  };

  const budget =
    budgetResult(
      criteria,
      listing,
    );

  if (budget) {
    add(
      30,
      budget.ratio,
      budget.reason,
      budget.gap,
    );
  }

  if (
    criteria.neighborhoods.length > 0
  ) {
    const match =
      criteria.neighborhoods.some(
        (item) =>
          includesNormalized(
            listing.neighborhood,
            item,
          ),
      );

    add(
      22,
      match ? 1 : 0,
      match
        ? "Tercih edilen mahalle"
        : "",
      match
        ? ""
        : "Mahalle tercihi dışında",
    );
  }

  if (
    criteria.room_counts.length > 0
  ) {
    const match =
      criteria.room_counts.some(
        (item) =>
          roomKey(item) ===
          roomKey(
            listing.room_count,
          ),
      );

    add(
      18,
      match ? 1 : 0,
      match
        ? "Oda sayısı uygun"
        : "",
      match
        ? ""
        : "Oda sayısı farklı",
    );
  }

  if (
    criteria.min_area ||
    criteria.max_area
  ) {
    const area =
      listing.area_m2;

    if (!area) {
      add(
        10,
        0,
        "",
        "Metrekare bilgisi yok",
      );
    } else {
      const min =
        criteria.min_area ?? 0;
      const max =
        criteria.max_area ??
        Number.POSITIVE_INFINITY;

      if (
        area >= min &&
        area <= max
      ) {
        add(
          10,
          1,
          "Metrekare uygun",
        );
      } else {
        const nearMin =
          min > 0 &&
          area >= min * 0.9;

        const nearMax =
          Number.isFinite(max) &&
          area <= max * 1.1;

        add(
          10,
          nearMin || nearMax
            ? 0.45
            : 0,
          "",
          "Metrekare tercihi dışında",
        );
      }
    }
  }

  if (
    criteria.floor_preferences
      ?.trim()
  ) {
    const wanted =
      criteria.floor_preferences
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const match =
      wanted.some((item) =>
        includesNormalized(
          listing.floor,
          item,
        ),
      );

    add(
      7,
      match ? 1 : 0,
      match ? "Kat tercihi uygun" : "",
      match ? "" : "Kat tercihi farklı",
    );
  }

  if (
    criteria.kitchen_type?.trim()
  ) {
    const match =
      includesNormalized(
        listing.kitchen_type,
        criteria.kitchen_type,
      );

    add(
      6,
      match ? 1 : 0,
      match ? "Mutfak tipi uygun" : "",
      match ? "" : "Mutfak tipi farklı",
    );
  }

  if (
    criteria.credit_required
  ) {
    add(
      5,
      listing.credit_available ? 1 : 0,
      listing.credit_available
        ? "Kredi imkânı var"
        : "",
      listing.credit_available
        ? ""
        : "Kredi imkânı belirtilmemiş",
    );
  }

  if (
    criteria.exchange_required
  ) {
    add(
      4,
      listing.exchange_available ? 1 : 0,
      listing.exchange_available
        ? "Takas imkânı var"
        : "",
      listing.exchange_available
        ? ""
        : "Takas imkânı yok",
    );
  }

  if (
    criteria.commission_free_only
  ) {
    add(
      4,
      listing.commission_free ? 1 : 0,
      listing.commission_free
        ? "Komisyonsuz"
        : "",
      listing.commission_free
        ? ""
        : "Komisyon bilgisi uygun değil",
    );
  }

  if (
    criteria.required_features.length > 0
  ) {
    const matched =
      criteria.required_features.filter(
        (feature) =>
          featureMatch(
            listing.features ?? [],
            feature,
          ),
      );

    const ratio =
      matched.length /
      criteria.required_features.length;

    add(
      15,
      ratio,
      matched.length > 0
        ? `${matched.length} özellik eşleşti`
        : "",
      ratio === 1
        ? ""
        : "Bazı özellikler eksik",
    );
  }

  const score =
    possible === 0
      ? 50
      : Math.round(
          (earned / possible) * 100,
        );

  return {
    listing,
    score,
    reasons:
      reasons.slice(0, 4),
    gaps:
      gaps.slice(0, 3),
  };
}

export function rankListingsForRequest(
  criteria: RequestCriteria,
  listings: Listing[],
) {
  return listings
    .filter(
      (listing) =>
        listing.status === "active",
    )
    .map((listing) =>
      scoreListingForRequest(
        criteria,
        listing,
      ),
    )
    .sort((first, second) => {
      if (
        second.score !== first.score
      ) {
        return (
          second.score - first.score
        );
      }

      return (
        (first.listing.price ?? 0) -
        (second.listing.price ?? 0)
      );
    });
}

export function matchTone(
  score: number,
) {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "possible";
  }

  return "weak";
}

export function matchLabel(
  score: number,
) {
  if (score >= 85) {
    return "Çok uygun";
  }

  if (score >= 70) {
    return "Uygun";
  }

  if (score >= 50) {
    return "Alternatif";
  }

  return "Zayıf eşleşme";
}
