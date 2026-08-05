export type ImportedListingDraft = {
  form: {
    project_name: string;
    title: string;
    city: string;
    district: string;
    neighborhood: string;
    room_count: string;
    area_m2: string;
    floor: string;
    kitchen_type: string;
    price: string;
    short_description: string;
    description: string;
    status: "draft";
    credit_available: boolean;
    exchange_available: boolean;
    commission_free: boolean;
  };
  privateDetails: {
    seller_name: string;
    seller_phone: string;
    available_credit_amount: string;
    maps_url: string;
    location_note: string;
  };
  features: string[];
  facades: string[];
  source: {
    platform: "sahibinden" | "other";
    url: string;
    listingId: string;
  };
  confidence: number;
  detectedFields: string[];
  warnings: string[];
};

const KNOWN_PROJECTS = [
  "AYDEMİR PREMIUM",
  "SAFİR KONUTLARI",
  "AYDEMİR KONSEPT",
  "YAKUT KONUTLARI",
  "ORMAN PALACE",
  "AYDEMİR SUIT",
  "DOĞA SİTESİ",
  "LUNA KONUTLARI",
  "AYDEMİR VİLLALARI",
  "AYDEMİR CADDE",
  "İNCİ KONUTLARI",
  "THE AYDEMİR",
] as const;

const STOP_DESCRIPTION_HEADINGS = [
  "KONUM",
  "ÖZELLİKLER",
  "İLAN BİLGİLERİ",
  "İLAN DETAYLARI",
  "BENZER İLANLAR",
  "FİYAT BİLGİLERİ",
  "EMLAK ENDEKSİ",
  "KREDİ HESAPLAMA",
  "MESAJ GÖNDER",
  "İLAN SAHİBİ",
  "UYARILAR",
];

function cleanLine(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function fold(value: string) {
  return cleanLine(value)
    .toLocaleUpperCase("tr-TR")
    .replace(/[’`´]/g, "'");
}

function escapeRegExp(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function grouped(value: string | number) {
  const clean = digitsOnly(String(value));

  if (!clean) {
    return "";
  }

  return clean.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );
}

function normalizeNeighborhood(value: string) {
  return cleanLine(value)
    .replace(
      /\bM(?:AH)?\.?\s*$/i,
      "Mahallesi",
    )
    .replace(
      /\bMH\.?\s*$/i,
      "Mahallesi",
    )
    .replace(
      /\bMAH\.\s*$/i,
      "Mahallesi",
    );
}

function nextMeaningfulLine(
  lines: string[],
  start: number,
) {
  for (
    let index = start + 1;
    index < lines.length &&
    index <= start + 3;
    index += 1
  ) {
    const candidate = cleanLine(
      lines[index],
    );

    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function valueAfterLabels(
  lines: string[],
  labels: string[],
) {
  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const line = cleanLine(lines[index]);
    const upper = fold(line);

    for (const label of labels) {
      const labelUpper = fold(label);

      if (upper === labelUpper) {
        return nextMeaningfulLine(
          lines,
          index,
        );
      }

      if (
        upper.startsWith(
          `${labelUpper}:`,
        ) ||
        upper.startsWith(
          `${labelUpper} `,
        ) ||
        upper.startsWith(
          `${labelUpper}-`,
        )
      ) {
        const direct = line.replace(
          new RegExp(
            `^${escapeRegExp(label)}\\s*[:\\-]?\\s*`,
            "i",
          ),
          "",
        );

        if (
          cleanLine(direct) &&
          fold(direct) !== labelUpper
        ) {
          return cleanLine(direct);
        }
      }
    }
  }

  return "";
}

function findPrice(rawText: string) {
  const matches = [
    ...rawText.matchAll(
      /(?:₺\s*)?(\d{1,3}(?:[.\s]\d{3})+|\d{6,})\s*(?:TL|₺)/gi,
    ),
  ]
    .map((match) =>
      Number(
        digitsOnly(
          match[1] ?? "",
        ),
      ),
    )
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value >= 100000 &&
        value <= 500000000,
    );

  if (matches.length === 0) {
    return "";
  }

  return grouped(
    Math.max(...matches),
  );
}

function findLocation(lines: string[]) {
  for (const line of lines) {
    if (
      !/[\/›>]/.test(line)
    ) {
      continue;
    }

    const parts = line
      .split(/[\/›>]+/)
      .map(cleanLine)
      .filter(Boolean);

    const antalyaIndex =
      parts.findIndex(
        (item) =>
          fold(item) === "ANTALYA",
      );

    if (
      antalyaIndex >= 0 &&
      parts.length >
        antalyaIndex + 2
    ) {
      return {
        city:
          parts[antalyaIndex],
        district:
          parts[antalyaIndex + 1],
        neighborhood:
          normalizeNeighborhood(
            parts[antalyaIndex + 2],
          ),
      };
    }
  }

  const neighborhoodLine =
    lines.find((line) =>
      /\b(?:Mahallesi|Mah\.|Mh\.)\b/i.test(
        line,
      ),
    );

  return {
    city: "Antalya",
    district: "Kepez",
    neighborhood:
      neighborhoodLine
        ? normalizeNeighborhood(
            neighborhoodLine
              .split(/[\/›>]+/)
              .at(-1) ?? "",
          )
        : "",
  };
}

function findTitle(
  lines: string[],
  fallback: string,
) {
  const blocked = [
    "SAHİBİNDEN.COM",
    "İLAN NO",
    "İLAN TARİHİ",
    "EMLAK TİPİ",
    "M²",
    "ODA SAYISI",
    "BİNA YAŞI",
    "BULUNDUĞU KAT",
    "ISITMA",
    "BANYO SAYISI",
    "MUTFAK",
    "BALKON",
    "ASANSÖR",
    "OTOPARK",
    "EŞYALI",
    "KULLANIM DURUMU",
    "SİTE İÇERİSİNDE",
    "KREDİYE UYGUN",
    "TAPU DURUMU",
    "KİMDEN",
    "TAKAS",
    "AÇIKLAMA",
    "KONUM",
  ];

  const candidates = lines
    .map((line, index) => {
      const value = cleanLine(line);
      const upper = fold(value);

      if (
        value.length < 12 ||
        value.length > 170 ||
        blocked.some(
          (item) =>
            upper === item ||
            upper.startsWith(
              `${item}:`,
            ),
        ) ||
        /^https?:\/\//i.test(value) ||
        /^\d[\d.\s]*\s*(?:TL|₺)$/i.test(
          value,
        )
      ) {
        return null;
      }

      let score = 0;

      if (
        /(SATILIK|KİRALIK)/.test(
          upper,
        )
      ) {
        score += 8;
      }

      if (
        /(DAİRE|VİLLA|DUBLEKS|İŞYERİ|DÜKKAN|OFİS)/.test(
          upper,
        )
      ) {
        score += 6;
      }

      if (
        /\b\d+\s*\+\s*\d+\b/.test(
          value,
        )
      ) {
        score += 4;
      }

      if (
        /(AYDEMİR|KONUTLARI|SİTESİ|PALACE|PREMİUM|KONSEPT)/.test(
          upper,
        )
      ) {
        score += 4;
      }

      if (
        value ===
        value.toLocaleUpperCase(
          "tr-TR",
        )
      ) {
        score += 2;
      }

      if (index < 35) {
        score += 2;
      }

      return {
        value,
        score,
      };
    })
    .filter(
      (
        item,
      ): item is {
        value: string;
        score: number;
      } => Boolean(item),
    )
    .sort(
      (first, second) =>
        second.score -
        first.score,
    );

  if (
    candidates[0] &&
    candidates[0].score >= 6
  ) {
    return candidates[0].value;
  }

  return fallback;
}

function findDescription(
  lines: string[],
) {
  const start =
    lines.findIndex(
      (line) =>
        fold(line) === "AÇIKLAMA" ||
        fold(line) ===
          "İLAN AÇIKLAMASI",
    );

  if (start < 0) {
    return "";
  }

  const collected: string[] = [];

  for (
    let index = start + 1;
    index < lines.length;
    index += 1
  ) {
    const line = cleanLine(
      lines[index],
    );

    if (!line) {
      if (
        collected.length > 0 &&
        collected.at(-1) !== ""
      ) {
        collected.push("");
      }
      continue;
    }

    const upper = fold(line);

    if (
      collected.length > 0 &&
      STOP_DESCRIPTION_HEADINGS.includes(
        upper,
      )
    ) {
      break;
    }

    if (
      /^İLAN NO\b/.test(upper) ||
      /^İLAN TARİHİ\b/.test(upper)
    ) {
      break;
    }

    collected.push(line);

    if (
      collected.join("\n")
        .length > 4500
    ) {
      break;
    }
  }

  return collected
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shortFromDescription(
  description: string,
) {
  if (!description) {
    return "";
  }

  const firstParagraph =
    description
      .split(/\n{2,}/)
      .map(cleanLine)
      .find(Boolean) ?? "";

  if (
    firstParagraph.length <= 240
  ) {
    return firstParagraph;
  }

  return `${firstParagraph.slice(
    0,
    236,
  ).trim()}…`;
}

function findProject(rawFolded: string) {
  return (
    KNOWN_PROJECTS.find(
      (project) =>
        rawFolded.includes(
          fold(project),
        ),
    ) ?? ""
  );
}

function positiveValue(
  value: string,
) {
  const upper = fold(value);

  return (
    upper === "EVET" ||
    upper === "VAR" ||
    upper.includes("UYGUN") ||
    upper.includes("MEVCUT")
  );
}

function addFeature(
  list: string[],
  feature: string,
  condition: boolean,
) {
  if (
    condition &&
    !list.includes(feature)
  ) {
    list.push(feature);
  }
}

export function parseSahibindenText(
  rawText: string,
  providedUrl = "",
): ImportedListingDraft {
  const normalizedRaw =
    rawText.replace(/\r\n?/g, "\n");

  const lines = normalizedRaw
    .split(/\n|\t/)
    .map(cleanLine)
    .filter(
      (line, index, all) =>
        line ||
        (
          index > 0 &&
          index < all.length - 1
        ),
    );

  const rawFolded =
    fold(normalizedRaw);

  const location =
    findLocation(lines);

  const roomCount =
    valueAfterLabels(
      lines,
      [
        "Oda Sayısı",
        "Oda",
      ],
    ).match(
      /\d+\s*\+\s*\d+/,
    )?.[0]
      ?.replace(/\s/g, "") ??
    normalizedRaw.match(
      /\b\d+\s*\+\s*\d+\b/,
    )?.[0]
      ?.replace(/\s/g, "") ??
    "";

  const areaValue =
    valueAfterLabels(
      lines,
      [
        "m² (Brüt)",
        "m2 (Brüt)",
        "Brüt m²",
        "Brüt Metrekare",
        "Metrekare",
      ],
    );

  const area =
    grouped(
      areaValue.match(
        /\d[\d.\s]*/,
      )?.[0] ?? "",
    );

  const floor =
    cleanLine(
      valueAfterLabels(
        lines,
        [
          "Bulunduğu Kat",
          "Dairenin Katı",
          "Kat",
        ],
      ),
    );

  const kitchenRaw =
    valueAfterLabels(
      lines,
      [
        "Mutfak",
        "Mutfak Tipi",
      ],
    );

  const kitchenFolded =
    fold(kitchenRaw);

  const kitchenType =
    kitchenFolded.includes(
      "AÇIK",
    ) ||
    kitchenFolded.includes(
      "AMERİKAN",
    )
      ? "Açık mutfak"
      : kitchenFolded.includes(
            "AYRI",
          ) ||
          kitchenFolded.includes(
            "KAPALI",
          )
        ? "Ayrı mutfak"
        : "";

  const description =
    findDescription(lines);

  const projectName =
    findProject(rawFolded);

  const fallbackTitle = [
    projectName,
    location.neighborhood,
    roomCount,
    "Satılık Daire",
  ]
    .filter(Boolean)
    .join(" ");

  const title =
    findTitle(
      lines,
      fallbackTitle,
    );

  const price =
    findPrice(normalizedRaw);

  const facadeRaw =
    valueAfterLabels(
      lines,
      [
        "Cephe",
        "Cepheler",
      ],
    );

  const facadeSource =
    fold(
      facadeRaw ||
        normalizedRaw,
    );

  const facades = [
    "Güney",
    "Doğu",
    "Batı",
    "Kuzey",
  ].filter((facade) =>
    facadeSource.includes(
      fold(facade),
    ),
  );

  const features: string[] = [];

  const balconyValue =
    valueAfterLabels(
      lines,
      ["Balkon"],
    );

  const elevatorValue =
    valueAfterLabels(
      lines,
      ["Asansör"],
    );

  const parkingValue =
    valueAfterLabels(
      lines,
      ["Otopark"],
    );

  addFeature(
    features,
    "Ebeveyn banyosu",
    /(EBEVEYN BANYO)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Asansör",
    (
      positiveValue(
        elevatorValue,
      ) ||
      /ASANSÖRLÜ/.test(
        rawFolded,
      )
    ) &&
      !/ASANSÖR\s*(?:YOK|HAYIR)/.test(
        rawFolded,
      ),
  );

  addFeature(
    features,
    "Yerden ısıtma",
    /YERDEN ISITMA/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Görüntülü diafon",
    /(GÖRÜNTÜLÜ DİA[FV]ON)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Elektrikli panjur",
    /(ELEKTRİKLİ PANJUR|OTOMATİK PANJUR)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Kapalı otopark",
    /KAPALI OTOPARK/.test(
      fold(parkingValue) ||
        rawFolded,
    ),
  );

  addFeature(
    features,
    "Açık otopark",
    /AÇIK OTOPARK/.test(
      fold(parkingValue) ||
        rawFolded,
    ),
  );

  addFeature(
    features,
    "Giyinme odası",
    /GİYİNME ODASI/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Havuz",
    /(YÜZME HAVUZU|AÇIK HAVUZ|KAPALI HAVUZ|HAVUZLU)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Balkon",
    (
      positiveValue(
        balconyValue,
      ) ||
      /\bBALKONLU\b/.test(
        rawFolded,
      )
    ) &&
      !/BALKON\s*(?:YOK|HAYIR)/.test(
        rawFolded,
      ),
  );

  addFeature(
    features,
    "Çocuk parkı",
    /(ÇOCUK PARKI|ÇOCUK OYUN PARKI)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Ankastre set",
    /ANKASTRE/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Kamelya",
    /KAMELYA/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Güvenlik",
    /(GÜVENLİK|KAMERA SİSTEMİ|GÜVENLİK KAMERASI)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Sauna",
    /SAUNA/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Hamam",
    /HAMAM/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Spor salonu",
    /(SPOR SALONU|FİTNESS)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Klima altyapısı",
    /(KLİMA ALTYAPISI|KLİMA TESİSATI)/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Duşakabin",
    /DUŞAKABİN/.test(
      rawFolded,
    ),
  );

  addFeature(
    features,
    "Duvar kağıdı",
    /DUVAR KAĞIDI/.test(
      rawFolded,
    ),
  );

  const creditRaw =
    valueAfterLabels(
      lines,
      [
        "Krediye Uygun",
        "Kredi",
      ],
    );

  const exchangeRaw =
    valueAfterLabels(
      lines,
      ["Takas"],
    );

  const sourceUrl =
    providedUrl.trim() ||
    normalizedRaw.match(
      /https?:\/\/(?:www\.)?sahibinden\.com\/[^\s]+/i,
    )?.[0] ||
    "";

  const sourceListingId =
    digitsOnly(
      valueAfterLabels(
        lines,
        [
          "İlan No",
          "İlan Numarası",
        ],
      ),
    ) ||
    sourceUrl.match(
      /(\d{7,})/,
    )?.[1] ||
    "";

  const sourceNote = [
    sourceUrl
      ? `Kaynak ilan: ${sourceUrl}`
      : "",
    sourceListingId
      ? `Kaynak ilan no: ${sourceListingId}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const detectedFields: string[] = [];

  const track = (
    label: string,
    value:
      | string
      | boolean
      | string[],
  ) => {
    const present =
      Array.isArray(value)
        ? value.length > 0
        : typeof value === "boolean"
          ? value
          : Boolean(
              String(value).trim(),
            );

    if (present) {
      detectedFields.push(label);
    }
  };

  track("Başlık", title);
  track("Konum", location.neighborhood);
  track("Oda", roomCount);
  track("Metrekare", area);
  track("Kat", floor);
  track("Mutfak", kitchenType);
  track("Fiyat", price);
  track("Açıklama", description);
  track("Özellikler", features);
  track("Cephe", facades);
  track("İlan numarası", sourceListingId);

  const confidence =
    Math.min(
      100,
      Math.round(
        (
          detectedFields.length /
          11
        ) *
          100,
      ),
    );

  const warnings: string[] = [];

  if (!title) {
    warnings.push(
      "İlan başlığı bulunamadı.",
    );
  }

  if (!location.neighborhood) {
    warnings.push(
      "Mahalle bulunamadı.",
    );
  }

  if (!roomCount) {
    warnings.push(
      "Oda sayısı bulunamadı.",
    );
  }

  if (!price) {
    warnings.push(
      "Fiyat bulunamadı.",
    );
  }

  return {
    form: {
      project_name:
        projectName,
      title,
      city:
        location.city ||
        "Antalya",
      district:
        location.district ||
        "Kepez",
      neighborhood:
        location.neighborhood,
      room_count:
        roomCount,
      area_m2:
        area,
      floor,
      kitchen_type:
        kitchenType,
      price,
      short_description:
        shortFromDescription(
          description,
        ),
      description,
      status: "draft",
      credit_available:
        positiveValue(
          creditRaw,
        ) ||
        /KREDİYE UYGUN/.test(
          rawFolded,
        ),
      exchange_available:
        positiveValue(
          exchangeRaw,
        ),
      commission_free:
        true,
    },
    privateDetails: {
      seller_name: "",
      seller_phone: "",
      available_credit_amount:
        "",
      maps_url: "",
      location_note:
        sourceNote,
    },
    features,
    facades,
    source: {
      platform:
        sourceUrl.includes(
          "sahibinden.com",
        ) ||
        rawFolded.includes(
          "SAHİBİNDEN",
        )
          ? "sahibinden"
          : "other",
      url: sourceUrl,
      listingId:
        sourceListingId,
    },
    confidence,
    detectedFields,
    warnings,
  };
}
