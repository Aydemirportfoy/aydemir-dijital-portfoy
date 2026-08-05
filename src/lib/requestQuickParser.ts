import type {
  CustomerRequest,
} from "@/lib/requestTypes";

type ParsedQuickRequest = Partial<
  Pick<
    CustomerRequest,
    | "phone"
    | "min_budget"
    | "max_budget"
    | "neighborhoods"
    | "room_counts"
    | "floor_preferences"
    | "kitchen_type"
    | "credit_required"
    | "exchange_required"
    | "commission_free_only"
    | "required_features"
  >
>;

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/\bmahallesi\b/g, "")
    .replace(/[^\p{L}\p{N}+.,₺]+/gu, " ")
    .trim();
}

function unique(values: string[]) {
  return Array.from(
    new Set(
      values.filter(Boolean),
    ),
  );
}

function parsePhone(text: string) {
  const candidates =
    text.match(
      /(?:\+?90\s*)?(?:0\s*)?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g,
    ) ?? [];

  if (
    candidates.length === 0
  ) {
    return null;
  }

  const candidate =
    candidates[0];

  if (!candidate) {
    return null;
  }

  const digits =
    candidate.replace(
      /\D/g,
      "",
    );

  const normalized =
    digits.startsWith("90")
      ? digits.slice(2)
      : digits;

  const local =
    normalized.startsWith("0")
      ? normalized
      : `0${normalized}`;

  if (local.length !== 11) {
    return candidate.trim();
  }

  return [
    local.slice(0, 4),
    local.slice(4, 7),
    local.slice(7, 9),
    local.slice(9, 11),
  ].join(" ");
}

function parseBudgetValues(
  text: string,
) {
  const normalized =
    text
      .toLocaleLowerCase("tr-TR");

  const values: number[] = [];

  const millionRangePattern =
    /(\d+(?:[.,]\d+)?)\s*(?:-|–|ile|ila)\s*(\d+(?:[.,]\d+)?)\s*(?:milyon|mn)\b/g;

  for (
    const match of
      normalized.matchAll(
        millionRangePattern,
      )
  ) {
    const first =
      Number(
        match[1].replace(
          ",",
          ".",
        ),
      );

    const second =
      Number(
        match[2].replace(
          ",",
          ".",
        ),
      );

    if (
      Number.isFinite(first) &&
      Number.isFinite(second)
    ) {
      values.push(
        Math.round(
          first * 1_000_000,
        ),
        Math.round(
          second * 1_000_000,
        ),
      );
    }
  }

  const millionPattern =
    /(\d+(?:[.,]\d+)?)\s*(?:milyon|mn)\b/g;

  for (
    const match of
      normalized.matchAll(
        millionPattern,
      )
  ) {
    const amount =
      Number(
        match[1].replace(
          ",",
          ".",
        ),
      );

    if (
      Number.isFinite(amount)
    ) {
      values.push(
        Math.round(
          amount * 1_000_000,
        ),
      );
    }
  }

  const tlPattern =
    /(\d{1,3}(?:[.\s]\d{3}){2,}|\d{7,9})\s*(?:tl|₺)\b/g;

  for (
    const match of
      normalized.matchAll(
        tlPattern,
      )
  ) {
    const amount =
      Number(
        match[1].replace(
          /\D/g,
          "",
        ),
      );

    if (
      Number.isFinite(amount) &&
      amount >= 500_000 &&
      amount <= 200_000_000
    ) {
      values.push(amount);
    }
  }

  return unique(
    values.map(String),
  )
    .map(Number)
    .sort(
      (first, second) =>
        first - second,
    );
}

function canonicalFeature(
  label: string,
  knownFeatures: string[],
) {
  const normalized =
    normalize(label);

  const known =
    knownFeatures.find(
      (item) => {
        const current =
          normalize(item);

        return (
          current.includes(
            normalized,
          ) ||
          normalized.includes(
            current,
          )
        );
      },
    );

  return known ?? label;
}

export function parseQuickRequest(
  source: string,
  knownNeighborhoods: string[],
  knownFeatures: string[],
): ParsedQuickRequest {
  const text =
    normalize(source);

  const phone =
    parsePhone(source);

  const roomCounts =
    unique(
      Array.from(
        source.matchAll(
          /\b([1-6](?:[,.]5)?\s*\+\s*[01])\b/g,
        ),
      ).map((match) =>
        match[1]
          .replace(/\s+/g, "")
          .replace(",", "."),
      ),
    );

  const neighborhoods =
    knownNeighborhoods.filter(
      (item) => {
        const normalized =
          normalize(item);

        return (
          normalized.length >= 3 &&
          text.includes(
            normalized,
          )
        );
      },
    );

  const budgets =
    parseBudgetValues(
      source,
    );

  let minBudget:
    number | null = null;

  let maxBudget:
    number | null = null;

  if (budgets.length >= 2) {
    minBudget = budgets[0];
    maxBudget =
      budgets[
        budgets.length - 1
      ];
  } else if (
    budgets.length === 1
  ) {
    const amount = budgets[0];

    const minimumLanguage =
      /\b(en az|alt sınır|üzeri|üstü|başlayan)\b/.test(
        text,
      );

    if (minimumLanguage) {
      minBudget = amount;
    } else {
      maxBudget = amount;
    }
  }

  const aliases = [
    {
      keys: [
        "havuz",
        "yüzme havuzu",
      ],
      label: "Havuz",
    },
    {
      keys: [
        "kapalı otopark",
        "kapali otopark",
      ],
      label: "Kapalı Otopark",
    },
    {
      keys: [
        "açık otopark",
        "acik otopark",
      ],
      label: "Açık Otopark",
    },
    {
      keys: [
        "ebeveyn banyo",
        "ebeveyn banyosu",
      ],
      label: "Ebeveyn Banyosu",
    },
    {
      keys: [
        "yerden ısıtma",
        "yerden isitma",
      ],
      label: "Yerden Isıtma",
    },
    {
      keys: [
        "asansör",
        "asansor",
      ],
      label: "Asansör",
    },
    {
      keys: [
        "çocuk parkı",
        "cocuk parki",
      ],
      label: "Çocuk Parkı",
    },
    {
      keys: [
        "kamelya",
      ],
      label: "Kamelya",
    },
    {
      keys: [
        "ankastre",
      ],
      label: "Ankastre Set",
    },
    {
      keys: [
        "elektrikli panjur",
      ],
      label: "Elektrikli Panjur",
    },
    {
      keys: [
        "giyinme odası",
        "giyinme odasi",
      ],
      label: "Giyinme Odası",
    },
  ];

  const requiredFeatures =
    unique(
      aliases
        .filter((item) =>
          item.keys.some(
            (key) =>
              text.includes(
                normalize(key),
              ),
          ),
        )
        .map((item) =>
          canonicalFeature(
            item.label,
            knownFeatures,
          ),
        ),
    );

  let kitchenType:
    string | null = null;

  if (
    text.includes(
      "ayrı mutfak",
    ) ||
    text.includes(
      "ayri mutfak",
    )
  ) {
    kitchenType =
      "Ayrı Mutfak";
  } else if (
    text.includes(
      "açık mutfak",
    ) ||
    text.includes(
      "acik mutfak",
    )
  ) {
    kitchenType =
      "Açık Mutfak";
  }

  const floorMatches =
    [
      "giriş kat",
      "zemin kat",
      "ara kat",
      "üst kat",
      "çatı katı",
      "bahçe katı",
    ].filter(
      (item) =>
        text.includes(
          normalize(item),
        ),
    );

  return {
    phone,
    min_budget:
      minBudget,
    max_budget:
      maxBudget,
    neighborhoods,
    room_counts:
      roomCounts,
    floor_preferences:
      floorMatches.length > 0
        ? floorMatches.join(", ")
        : null,
    kitchen_type:
      kitchenType,
    credit_required:
      /\b(kredi|krediye uygun|yüksek kredi)\b/.test(
        text,
      ),
    exchange_required:
      /\b(takas|takaslı|takas olur)\b/.test(
        text,
      ),
    commission_free_only:
      /\b(komisyonsuz|komisyon yok)\b/.test(
        text,
      ),
    required_features:
      requiredFeatures,
  };
}

export function compactRequestSummary(
  request: Pick<
    CustomerRequest,
    | "neighborhoods"
    | "room_counts"
    | "min_budget"
    | "max_budget"
    | "required_features"
  >,
) {
  const parts: string[] = [];

  if (
    request.neighborhoods.length > 0
  ) {
    parts.push(
      request.neighborhoods
        .slice(0, 2)
        .join(", "),
    );
  }

  if (
    request.room_counts.length > 0
  ) {
    parts.push(
      request.room_counts.join(
        " / ",
      ),
    );
  }

  if (
    request.min_budget ||
    request.max_budget
  ) {
    const formatter =
      new Intl.NumberFormat(
        "tr-TR",
        {
          maximumFractionDigits: 0,
        },
      );

    if (
      request.min_budget &&
      request.max_budget
    ) {
      parts.push(
        `${formatter.format(
          request.min_budget,
        )} - ${formatter.format(
          request.max_budget,
        )} TL`,
      );
    } else if (
      request.max_budget
    ) {
      parts.push(
        `${formatter.format(
          request.max_budget,
        )} TL altı`,
      );
    } else if (
      request.min_budget
    ) {
      parts.push(
        `${formatter.format(
          request.min_budget,
        )} TL üzeri`,
      );
    }
  }

  if (
    request.required_features.length > 0
  ) {
    parts.push(
      request.required_features
        .slice(0, 2)
        .join(", "),
    );
  }

  return (
    parts.join(" · ") ||
    "Kriterler henüz girilmedi"
  );
}
