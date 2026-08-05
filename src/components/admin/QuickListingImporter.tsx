"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  parseSahibindenText,
  type ImportedListingDraft,
} from "@/lib/sahibindenParser";
import {
  PROJECT_TEMPLATES,
  type ProjectTemplate,
} from "@/lib/projectTemplates";

const TRANSFER_KEY =
  "aydemir-quick-listing-transfer-v1";

const QUICK_DRAFT_KEY =
  "aydemir-quick-listing-work-v1";

const LISTING_DRAFT_KEY =
  "aydemir-new-listing-draft-v4";

const LAST_PROJECT_TEMPLATE_KEY =
  "aydemir-last-project-template-v1";

type DuplicateListing = {
  id: string;
  title: string;
  neighborhood: string;
  room_count: string | null;
  price: number | null;
  status: string;
};

function formatPrice(
  value: number | null,
) {
  if (!value) {
    return "Fiyat girilmemiş";
  }

  return new Intl.NumberFormat(
    "tr-TR",
    {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(
      /[^a-z0-9çğıöşü]+/gi,
      " ",
    )
    .trim();
}

function similarTitle(
  first: string,
  second: string,
) {
  const firstWords =
    new Set(
      normalizeText(first)
        .split(" ")
        .filter(
          (word) =>
            word.length >= 3,
        ),
    );

  const secondWords =
    normalizeText(second)
      .split(" ")
      .filter(
        (word) =>
          word.length >= 3,
      );

  if (
    firstWords.size === 0 ||
    secondWords.length === 0
  ) {
    return false;
  }

  const common =
    secondWords.filter(
      (word) =>
        firstWords.has(word),
    ).length;

  return (
    common /
      Math.max(
        firstWords.size,
        secondWords.length,
      ) >=
    0.45
  );
}

function statusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      draft: "Taslak",
      active: "Aktif",
      reserved: "Rezerve",
      sold: "Satıldı",
    };

  return labels[status] ?? status;
}

function templateDraft(
  roomCount: string,
  kitchenType: string,
) {
  const draft =
    parseSahibindenText(
      [
        `${roomCount} Satılık Daire`,
        "Oda Sayısı",
        roomCount,
        "Mutfak",
        kitchenType,
      ].join("\n"),
    );

  return {
    ...draft,
    form: {
      ...draft.form,
      title:
        `${roomCount} Satılık Daire`,
      room_count:
        roomCount,
      kitchen_type:
        kitchenType,
      city: "Antalya",
      district: "Kepez",
    },
    confidence: 30,
    detectedFields: [
      "Başlık",
      "Oda",
      "Mutfak",
    ],
    warnings: [
      "Mahalle ve fiyatı formda tamamlayın.",
    ],
  };
}

function projectTemplateDraft(
  template: ProjectTemplate,
): ImportedListingDraft {
  return {
    form: {
      project_name:
        template.projectName,
      title:
        template.title,
      city: "Antalya",
      district: "Kepez",
      neighborhood:
        template.neighborhood,
      room_count:
        template.roomCount,
      area_m2: "",
      floor: "",
      kitchen_type:
        template.kitchenType,
      price: "",
      short_description:
        template.shortDescription,
      description:
        template.description,
      status: "draft",
      credit_available:
        template.creditAvailable,
      exchange_available:
        template.exchangeAvailable,
      commission_free:
        template.commissionFree,
    },
    privateDetails: {
      seller_name: "",
      seller_phone: "",
      available_credit_amount: "",
      maps_url: "",
      location_note: "",
    },
    features: [
      ...template.features,
    ],
    facades: [],
    source: {
      platform: "other",
      url: "",
      listingId: "",
    },
    confidence: 72,
    detectedFields: [
      "Proje",
      "Başlık",
      "Şehir",
      "İlçe",
      "Mahalle",
      "Oda",
      "Mutfak",
      "Açıklama",
      "Özellikler",
      "Kredi",
      "Takas",
      "Komisyon",
    ],
    warnings: [
      template.note,
    ],
  };
}

export default function QuickListingImporter() {
  const router = useRouter();

  const [rawText, setRawText] =
    useState("");

  const [sourceUrl, setSourceUrl] =
    useState("");

  const [
    selectedProjectTemplateId,
    setSelectedProjectTemplateId,
  ] = useState(
    PROJECT_TEMPLATES[0]?.id ?? "",
  );

  const [result, setResult] =
    useState<
      ImportedListingDraft | null
    >(null);

  const [notice, setNotice] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [
    duplicates,
    setDuplicates,
  ] = useState<
    DuplicateListing[]
  >([]);

  const [
    duplicateBusy,
    setDuplicateBusy,
  ] = useState(false);

  useEffect(() => {
    const savedTemplate =
      localStorage.getItem(
        LAST_PROJECT_TEMPLATE_KEY,
      );

    if (
      savedTemplate &&
      PROJECT_TEMPLATES.some(
        (template) =>
          template.id ===
          savedTemplate,
      )
    ) {
      setSelectedProjectTemplateId(
        savedTemplate,
      );
    }
  }, []);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          QUICK_DRAFT_KEY,
        );

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(
        saved,
      ) as {
        rawText?: string;
        sourceUrl?: string;
      };

      setRawText(
        parsed.rawText ?? "",
      );

      setSourceUrl(
        parsed.sourceUrl ?? "",
      );
    } catch {
      localStorage.removeItem(
        QUICK_DRAFT_KEY,
      );
    }
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        localStorage.setItem(
          QUICK_DRAFT_KEY,
          JSON.stringify({
            rawText,
            sourceUrl,
          }),
        );
      }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    rawText,
    sourceUrl,
  ]);

  async function findDuplicates(
    draft: ImportedListingDraft,
  ) {
    const neighborhood =
      draft.form.neighborhood
        .replace(
          /\bMahallesi\b/gi,
          "",
        )
        .trim();

    const roomCount =
      draft.form.room_count.trim();

    if (
      !neighborhood ||
      !roomCount
    ) {
      setDuplicates([]);
      return;
    }

    setDuplicateBusy(true);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase
        .from("listings")
        .select(
          "id,title,neighborhood,room_count,price,status",
        )
        .ilike(
          "neighborhood",
          `%${neighborhood}%`,
        )
        .eq(
          "room_count",
          roomCount,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(12);

      if (error) {
        setDuplicates([]);
        return;
      }

      const importedPrice =
        Number(
          draft.form.price.replace(
            /\D/g,
            "",
          ),
        ) || null;

      const possible =
        (
          (data ?? []) as
            DuplicateListing[]
        ).filter((item) => {
          const closePrice =
            importedPrice &&
            item.price
              ? Math.abs(
                  item.price -
                    importedPrice,
                ) /
                  importedPrice <=
                0.08
              : false;

          return (
            closePrice ||
            similarTitle(
              item.title,
              draft.form.title,
            )
          );
        });

      setDuplicates(possible);
    } finally {
      setDuplicateBusy(false);
    }
  }

  async function analyze(
    text = rawText,
  ) {
    if (
      text.trim().length < 20
    ) {
      setNotice(
        "İlan sayfasından kopyaladığınız metni kutuya yapıştırın.",
      );
      setResult(null);
      setDuplicates([]);
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const parsed =
        parseSahibindenText(
          text,
          sourceUrl,
        );

      setResult(parsed);

      await findDuplicates(
        parsed,
      );

      setNotice(
        parsed.warnings.length > 0
          ? "Bilgiler çıkarıldı. Eksik görünen alanları formda tamamlayabilirsiniz."
          : "İlan bilgileri başarıyla hazırlandı.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function pasteFromClipboard() {
    setNotice("");

    try {
      const text =
        await navigator.clipboard
          .readText();

      if (!text.trim()) {
        setNotice(
          "Panoda metin bulunamadı.",
        );
        return;
      }

      setRawText(text);
      await analyze(text);
    } catch {
      setNotice(
        "Tarayıcı panoya izin vermedi. Metni kutuya normal şekilde yapıştırın.",
      );
    }
  }

  function applyTemplate(
    roomCount: string,
    kitchenType: string,
  ) {
    const draft =
      templateDraft(
        roomCount,
        kitchenType,
      );

    setRawText("");
    setSourceUrl("");
    setDuplicates([]);
    setResult(draft);
    setNotice(
      "Hızlı şablon hazırlandı. Forma geçip mahalle, fiyat ve fotoğrafları ekleyin.",
    );
  }

  function transferDraftToForm(
    draft: ImportedListingDraft,
    source:
      | "import"
      | "template"
      | "duplicate" = "import",
  ) {
    const existingDraft =
      localStorage.getItem(
        LISTING_DRAFT_KEY,
      );

    if (existingDraft) {
      const backupKey =
        `${LISTING_DRAFT_KEY}-` +
        `before-${source}-` +
        `${Date.now()}`;

      localStorage.setItem(
        backupKey,
        existingDraft,
      );
    }

    localStorage.removeItem(
      LISTING_DRAFT_KEY,
    );

    sessionStorage.setItem(
      TRANSFER_KEY,
      JSON.stringify(draft),
    );

    localStorage.removeItem(
      QUICK_DRAFT_KEY,
    );

    router.push(
      source === "template"
        ? "/yonetim/yeni-ilan?sablon=1"
        : "/yonetim/yeni-ilan?aktarim=1",
    );
  }

  function sendToForm() {
    if (!result) {
      setNotice(
        "Önce ilan metnini çözümleyin veya hızlı şablon seçin.",
      );
      return;
    }

    transferDraftToForm(
      result,
      "import",
    );
  }

  function openProjectTemplate() {
    if (!selectedProjectTemplate) {
      setNotice(
        "Lütfen bir proje seçin.",
      );
      return;
    }

    localStorage.setItem(
      LAST_PROJECT_TEMPLATE_KEY,
      selectedProjectTemplate.id,
    );

    transferDraftToForm(
      projectTemplateDraft(
        selectedProjectTemplate,
      ),
      "template",
    );
  }

  function resetAll() {
    setRawText("");
    setSourceUrl("");
    setResult(null);
    setDuplicates([]);
    setNotice("");
    localStorage.removeItem(
      QUICK_DRAFT_KEY,
    );
  }

  const selectedProjectTemplate =
    useMemo(
      () =>
        PROJECT_TEMPLATES.find(
          (template) =>
            template.id ===
            selectedProjectTemplateId,
        ) ??
        PROJECT_TEMPLATES[0] ??
        null,
      [selectedProjectTemplateId],
    );

  const preview = useMemo(
    () =>
      result
        ? [
            {
              label: "Başlık",
              value:
                result.form.title ||
                "Bulunamadı",
            },
            {
              label: "Konum",
              value:
                [
                  result.form
                    .district,
                  result.form
                    .neighborhood,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                "Bulunamadı",
            },
            {
              label: "Oda",
              value:
                result.form
                  .room_count ||
                "Bulunamadı",
            },
            {
              label: "Metrekare",
              value:
                result.form.area_m2
                  ? `${result.form.area_m2} m²`
                  : "Bulunamadı",
            },
            {
              label: "Kat",
              value:
                result.form.floor ||
                "Bulunamadı",
            },
            {
              label: "Fiyat",
              value:
                result.form.price
                  ? `${result.form.price} TL`
                  : "Bulunamadı",
            },
          ]
        : [],
    [result],
  );

  return (
    <main className="ap-admin-page ap-v3-quick-page">
      <section className="ap-v3-quick-hero">
        <div>
          <span className="ap-v3-eyebrow">
            AYDEMİR AKILLI PORTFÖY
          </span>

          <h1>
            İlanı yapıştır,
            <br />
            form kendisi dolsun.
          </h1>

          <p>
            Sahibinden ilan sayfasındaki
            metni kopyalayın. Başlık,
            fiyat, mahalle, oda, metrekare,
            kat ve özellikler otomatik
            hazırlanır.
          </p>
        </div>

        <div className="ap-v3-hero-meter">
          <span>V3</span>
          <strong>
            Hızlı Giriş
          </strong>
          <small>
            Eski ilan formu korunur
          </small>
        </div>
      </section>

      <section className="ap-v3-step-strip">
        <div className="is-active">
          <b>1</b>
          <span>
            Sahibinden&apos;de ilanı aç
          </span>
        </div>

        <div>
          <b>2</b>
          <span>
            Ctrl + A ve Ctrl + C
          </span>
        </div>

        <div>
          <b>3</b>
          <span>
            Buraya yapıştır
          </span>
        </div>
      </section>

      <div className="ap-v3-quick-layout">
        <section className="ap-v3-import-card">
          <div className="ap-v3-card-head">
            <div>
              <span className="ap-v3-mini-label">
                OTOMATİK AYIKLAMA
              </span>

              <h2>
                Sahibinden metni
              </h2>
            </div>

            <button
              type="button"
              className="ap-v3-clipboard-button"
              onClick={
                pasteFromClipboard
              }
            >
              Panodan Al
            </button>
          </div>

          <label className="ap-v3-source-field">
            <span>
              İlan linki
              <small>
                isteğe bağlı
              </small>
            </span>

            <input
              type="url"
              placeholder={
                "https://www.sahibinden.com/ilan/..."
              }
              value={sourceUrl}
              onChange={(
                event:
                  ChangeEvent<HTMLInputElement>,
              ) =>
                setSourceUrl(
                  event.target.value,
                )
              }
            />
          </label>

          <label className="ap-v3-paste-field">
            <span>
              Kopyaladığınız ilan metni
            </span>

            <textarea
              rows={15}
              placeholder={
                "Sahibinden ilan sayfasında Ctrl + A ve Ctrl + C yapın. Sonra bu alana Ctrl + V ile yapıştırın."
              }
              value={rawText}
              onChange={(
                event:
                  ChangeEvent<HTMLTextAreaElement>,
              ) =>
                setRawText(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="ap-v3-import-actions">
            <button
              type="button"
              className="ap-v3-primary-action"
              onClick={() =>
                analyze()
              }
              disabled={busy}
            >
              {busy
                ? "Bilgiler ayıklanıyor..."
                : "İlanı Çözümle"}
            </button>

            <button
              type="button"
              className="ap-v3-quiet-action"
              onClick={resetAll}
            >
              Temizle
            </button>
          </div>

          {notice ? (
            <p className="ap-v3-notice">
              {notice}
            </p>
          ) : null}
        </section>

        <aside className="ap-v3-side-stack">
          <section className="ap-v3-project-template-card">
            <span className="ap-v3-mini-label">
              PROJE ŞABLONLARI
            </span>

            <h2>
              Projeyi seç, form hazır açılsın
            </h2>

            <p>
              Standart proje bilgileri ve
              özellikleri otomatik gelir.
              Sadece daireye özel alanları
              tamamlayın.
            </p>

            <label className="ap-v3-project-select">
              <span>Proje</span>

              <select
                value={
                  selectedProjectTemplateId
                }
                onChange={(event) => {
                  setSelectedProjectTemplateId(
                    event.target.value,
                  );
                }}
              >
                {PROJECT_TEMPLATES.map(
                  (template) => (
                    <option
                      key={template.id}
                      value={template.id}
                    >
                      {template.projectName}
                      {" · "}
                      {template.roomCount}
                    </option>
                  ),
                )}
              </select>
            </label>

            {selectedProjectTemplate ? (
              <div className="ap-v3-project-template-preview">
                <div>
                  <small>Konum</small>
                  <strong>
                    {
                      selectedProjectTemplate
                        .neighborhood
                    }
                  </strong>
                </div>

                <div>
                  <small>Daire</small>
                  <strong>
                    {
                      selectedProjectTemplate
                        .roomCount
                    }
                    {selectedProjectTemplate
                      .kitchenType
                      ? ` · ${
                          selectedProjectTemplate
                            .kitchenType
                        }`
                      : ""}
                  </strong>
                </div>

                <div className="ap-v3-project-template-features">
                  {selectedProjectTemplate
                    .features
                    .slice(0, 5)
                    .map((feature) => (
                      <span key={feature}>
                        {feature}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="ap-v3-project-open-button"
              onClick={openProjectTemplate}
            >
              Şablonla Formu Aç
              <span>→</span>
            </button>

            <small className="ap-v3-project-helper">
              Fiyat, kat, cephe, metrekare
              ve fotoğrafları sonraki
              ekranda ekleyin.
            </small>
          </section>

          <section className="ap-v3-template-card">
            <span className="ap-v3-mini-label">
              METİN YOKSA
            </span>

            <h2>
              10 saniyelik başlangıç
            </h2>

            <p>
              Sahibinden metni olmadan
              sadece daire tipini seçerek
              formu açın.
            </p>

            <div className="ap-v3-template-grid">
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    "1+1",
                    "Açık mutfak",
                  )
                }
              >
                <strong>1+1</strong>
                <span>Açık mutfak</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    "2+1",
                    "Ayrı mutfak",
                  )
                }
              >
                <strong>2+1</strong>
                <span>Ayrı mutfak</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    "3+1",
                    "Ayrı mutfak",
                  )
                }
              >
                <strong>3+1</strong>
                <span>Ayrı mutfak</span>
              </button>
            </div>

            <Link
              href="/yonetim/yeni-ilan"
              className="ap-v3-manual-link"
            >
              Eski formu boş aç
            </Link>
          </section>

          <section className="ap-v3-trust-card">
            <span>✓</span>

            <div>
              <strong>
                Güvenli geçiş
              </strong>

              <p>
                Mevcut çalışan ilan formu
                silinmedi. Bu ekran yalnızca
                bilgileri hazırlayıp eski
                forma aktarır.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {result ? (
        <section className="ap-v3-result-card">
          <div className="ap-v3-result-head">
            <div>
              <span className="ap-v3-mini-label">
                HAZIR ÖN İZLEME
              </span>

              <h2>
                {result.detectedFields
                  .length} alan bulundu
              </h2>
            </div>

            <div className="ap-v3-confidence">
              <span>
                Ayıklama
              </span>

              <strong>
                %{result.confidence}
              </strong>
            </div>
          </div>

          <div className="ap-v3-preview-grid">
            {preview.map((item) => (
              <div key={item.label}>
                <span>
                  {item.label}
                </span>

                <strong>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>

          {result.features.length > 0 ? (
            <div className="ap-v3-feature-preview">
              {result.features.map(
                (feature) => (
                  <span key={feature}>
                    {feature}
                  </span>
                ),
              )}
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <div className="ap-v3-warning-row">
              {result.warnings.map(
                (warning) => (
                  <span key={warning}>
                    {warning}
                  </span>
                ),
              )}
            </div>
          ) : null}

          <div className="ap-v3-duplicate-block">
            <div>
              <span className="ap-v3-mini-label">
                MÜKERRER KONTROLÜ
              </span>

              <h3>
                {duplicateBusy
                  ? "Portföy taranıyor..."
                  : duplicates.length > 0
                    ? `${duplicates.length} benzer ilan bulundu`
                    : "Belirgin bir benzer ilan bulunmadı"}
              </h3>
            </div>

            {duplicates.length > 0 ? (
              <div className="ap-v3-duplicate-list">
                {duplicates.map(
                  (item) => (
                    <Link
                      key={item.id}
                      href={
                        `/yonetim/ilan-duzenle/${item.id}`
                      }
                    >
                      <span>
                        {statusLabel(
                          item.status,
                        )}
                      </span>

                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.neighborhood}
                        {" · "}
                        {item.room_count}
                        {" · "}
                        {formatPrice(
                          item.price,
                        )}
                      </small>
                    </Link>
                  ),
                )}
              </div>
            ) : null}
          </div>

          <div className="ap-v3-result-actions">
            <button
              type="button"
              className="ap-v3-primary-action"
              onClick={sendToForm}
            >
              Forma Aktar ve Tamamla
            </button>

            <small>
              Fotoğrafları sonraki ekranda
              toplu seçebilirsiniz.
            </small>
          </div>
        </section>
      ) : null}
    </main>
  );
}
