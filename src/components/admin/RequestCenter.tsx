"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  compactRequestSummary,
  parseQuickRequest,
} from "@/lib/requestQuickParser";
import {
  matchLabel,
  matchTone,
  rankListingsForRequest,
  type RequestCriteria,
} from "@/lib/requestMatching";
import {
  REQUEST_STATUS_OPTIONS,
  requestStatusLabel,
  type CustomerRequest,
  type CustomerRequestStatus,
} from "@/lib/requestTypes";
import type { Listing } from "@/lib/types";
import {
  formatPrice,
} from "@/lib/format";

const REQUEST_DRAFT_KEY =
  "aydemir-request-draft-v1";

type RequestFormState = {
  customerName: string;
  phone: string;
  quickText: string;
  minBudget: string;
  maxBudget: string;
  neighborhoods: string[];
  roomCounts: string[];
  minArea: string;
  maxArea: string;
  floorPreferences: string;
  kitchenType: string;
  creditRequired: boolean;
  exchangeRequired: boolean;
  commissionFreeOnly: boolean;
  requiredFeatures: string[];
  note: string;
  followUpAt: string;
};

const EMPTY_FORM:
  RequestFormState = {
    customerName: "",
    phone: "",
    quickText: "",
    minBudget: "",
    maxBudget: "",
    neighborhoods: [],
    roomCounts: [],
    minArea: "",
    maxArea: "",
    floorPreferences: "",
    kitchenType: "",
    creditRequired: false,
    exchangeRequired: false,
    commissionFreeOnly: false,
    requiredFeatures: [],
    note: "",
    followUpAt: "",
  };

function digits(value: string) {
  return value.replace(
    /\D/g,
    "",
  );
}

function numericValue(
  value: string,
) {
  const parsed =
    Number(
      digits(value),
    );

  return parsed > 0
    ? parsed
    : null;
}

function groupedInput(
  value: string,
) {
  const clean = digits(value);

  if (!clean) {
    return "";
  }

  return new Intl.NumberFormat(
    "tr-TR",
  ).format(
    Number(clean),
  );
}

function phoneHref(
  value: string,
) {
  return `tel:${value.replace(
    /[^\d+]/g,
    "",
  )}`;
}

function whatsappHref(
  value: string,
  customerName: string,
) {
  let phone =
    value.replace(
      /\D/g,
      "",
    );

  if (
    phone.startsWith("0")
  ) {
    phone =
      `90${phone.slice(1)}`;
  } else if (
    !phone.startsWith("90")
  ) {
    phone =
      `90${phone}`;
  }

  const text =
    encodeURIComponent(
      `Merhaba ${customerName}, talebinizle ilgili sizinle iletişime geçiyoruz.`,
    );

  return `https://wa.me/${phone}?text=${text}`;
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Takip tarihi yok";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function toggleValue(
  values: string[],
  value: string,
) {
  return values.includes(value)
    ? values.filter(
        (item) => item !== value,
      )
    : [...values, value];
}

function criteriaFromForm(
  form: RequestFormState,
): RequestCriteria {
  return {
    min_budget:
      numericValue(
        form.minBudget,
      ),
    max_budget:
      numericValue(
        form.maxBudget,
      ),
    neighborhoods:
      form.neighborhoods,
    room_counts:
      form.roomCounts,
    min_area:
      numericValue(
        form.minArea,
      ),
    max_area:
      numericValue(
        form.maxArea,
      ),
    floor_preferences:
      form.floorPreferences ||
      null,
    kitchen_type:
      form.kitchenType ||
      null,
    credit_required:
      form.creditRequired,
    exchange_required:
      form.exchangeRequired,
    commission_free_only:
      form.commissionFreeOnly,
    required_features:
      form.requiredFeatures,
  };
}

export default function RequestCenter({
  initialRequests,
  listings,
  userId,
  setupError,
}: {
  initialRequests:
    CustomerRequest[];
  listings: Listing[];
  userId: string;
  setupError:
    string | null;
}) {
  const router =
    useRouter();

  const [rows, setRows] =
    useState(
      initialRequests,
    );

  const [form, setForm] =
    useState<RequestFormState>(
      EMPTY_FORM,
    );

  const [query, setQuery] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" |
    CustomerRequestStatus
  >("all");

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    advancedOpen,
    setAdvancedOpen,
  ] = useState(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          REQUEST_DRAFT_KEY,
        );

      if (saved) {
        setForm({
          ...EMPTY_FORM,
          ...JSON.parse(saved),
        });
      }
    } catch {
      localStorage.removeItem(
        REQUEST_DRAFT_KEY,
      );
    }
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        localStorage.setItem(
          REQUEST_DRAFT_KEY,
          JSON.stringify(form),
        );
      }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form]);

  const neighborhoods =
    useMemo(
      () =>
        Array.from(
          new Set(
            listings
              .map(
                (listing) =>
                  listing.neighborhood,
              )
              .filter(Boolean),
          ),
        ).sort(
          (first, second) =>
            first.localeCompare(
              second,
              "tr",
            ),
        ),
      [listings],
    );

  const roomCounts =
    useMemo(
      () =>
        Array.from(
          new Set(
            listings
              .map(
                (listing) =>
                  listing.room_count,
              )
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(value),
              ),
          ),
        ).sort(),
      [listings],
    );

  const knownFeatures =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      listings.forEach(
        (listing) => {
          (
            listing.features ??
            []
          ).forEach(
            (feature) => {
              counts.set(
                feature,
                (
                  counts.get(
                    feature,
                  ) ?? 0
                ) + 1,
              );
            },
          );
        },
      );

      return Array.from(
        counts.entries(),
      )
        .sort(
          (
            first,
            second,
          ) =>
            second[1] -
            first[1],
        )
        .slice(0, 18)
        .map(
          ([feature]) =>
            feature,
        );
    }, [listings]);

  const draftCriteria =
    useMemo(
      () =>
        criteriaFromForm(
          form,
        ),
      [form],
    );

  const previewMatches =
    useMemo(
      () =>
        rankListingsForRequest(
          draftCriteria,
          listings,
        )
          .filter(
            (item) =>
              item.score >= 45,
          )
          .slice(0, 3),
      [
        draftCriteria,
        listings,
      ],
    );

  const filteredRows =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      return rows.filter(
        (row) => {
          if (
            statusFilter !==
              "all" &&
            row.status !==
              statusFilter
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          return [
            row.customer_name,
            row.phone,
            row.source_text,
            row.note,
            row.neighborhoods.join(
              " ",
            ),
            row.room_counts.join(
              " ",
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR",
            )
            .includes(
              normalized,
            );
        },
      );
    }, [
      query,
      rows,
      statusFilter,
    ]);

  const activeCount =
    rows.filter(
      (row) =>
        ![
          "won",
          "lost",
          "archived",
        ].includes(
          row.status,
        ),
    ).length;

  const todayCount =
    rows.filter(
      (row) => {
        if (
          !row.follow_up_at
        ) {
          return false;
        }

        const follow =
          new Date(
            row.follow_up_at,
          );

        const now =
          new Date();

        return (
          follow.getFullYear() ===
            now.getFullYear() &&
          follow.getMonth() ===
            now.getMonth() &&
          follow.getDate() ===
            now.getDate()
        );
      },
    ).length;

  function updateForm<
    K extends keyof RequestFormState,
  >(
    key: K,
    value:
      RequestFormState[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  function smartFill() {
    if (
      form.quickText
        .trim()
        .length < 6
    ) {
      setMessage(
        "Talebi bir cümleyle yazın.",
      );
      return;
    }

    const parsed =
      parseQuickRequest(
        form.quickText,
        neighborhoods,
        knownFeatures,
      );

    setForm(
      (current) => ({
        ...current,
        phone:
          current.phone ||
          parsed.phone ||
          "",
        minBudget:
          parsed.min_budget
            ? groupedInput(
                String(
                  parsed.min_budget,
                ),
              )
            : current.minBudget,
        maxBudget:
          parsed.max_budget
            ? groupedInput(
                String(
                  parsed.max_budget,
                ),
              )
            : current.maxBudget,
        neighborhoods:
          parsed.neighborhoods
            ?.length
            ? parsed.neighborhoods
            : current.neighborhoods,
        roomCounts:
          parsed.room_counts
            ?.length
            ? parsed.room_counts
            : current.roomCounts,
        floorPreferences:
          parsed.floor_preferences ||
          current.floorPreferences,
        kitchenType:
          parsed.kitchen_type ||
          current.kitchenType,
        creditRequired:
          parsed.credit_required ??
          current.creditRequired,
        exchangeRequired:
          parsed.exchange_required ??
          current.exchangeRequired,
        commissionFreeOnly:
          parsed.commission_free_only ??
          current.commissionFreeOnly,
        requiredFeatures:
          parsed.required_features
            ?.length
            ? Array.from(
                new Set([
                  ...current.requiredFeatures,
                  ...parsed.required_features,
                ]),
              )
            : current.requiredFeatures,
      }),
    );

    setAdvancedOpen(true);

    setMessage(
      "Talep çözümlendi. Portföy eşleşmeleri aşağıda hazır.",
    );
  }

  async function saveRequest(
    openAfterSave:
      boolean,
  ) {
    setMessage("");

    if (
      !form.customerName
        .trim()
    ) {
      setMessage(
        "Müşteri adı zorunludur.",
      );
      return;
    }

    if (setupError) {
      setMessage(
        "Önce Supabase talep merkezi SQL dosyasını çalıştırın.",
      );
      return;
    }

    const normalizedPhone =
      form.phone.replace(
        /\D/g,
        "",
      );

    const samePhone =
      normalizedPhone
        ? rows.find(
            (row) =>
              (
                row.phone ??
                ""
              ).replace(
                /\D/g,
                "",
              ) ===
              normalizedPhone,
          )
        : null;

    if (
      samePhone &&
      !window.confirm(
        `${samePhone.customer_name} adına aynı telefonla kayıt var. Yine de yeni talep oluşturulsun mu?`,
      )
    ) {
      return;
    }

    setSaving(true);

    const supabase =
      createClient();

    const payload = {
      customer_name:
        form.customerName.trim(),
      phone:
        form.phone.trim() ||
        null,
      source_text:
        form.quickText.trim() ||
        null,
      min_budget:
        numericValue(
          form.minBudget,
        ),
      max_budget:
        numericValue(
          form.maxBudget,
        ),
      neighborhoods:
        form.neighborhoods,
      room_counts:
        form.roomCounts,
      min_area:
        numericValue(
          form.minArea,
        ),
      max_area:
        numericValue(
          form.maxArea,
        ),
      floor_preferences:
        form.floorPreferences
          .trim() ||
        null,
      kitchen_type:
        form.kitchenType ||
        null,
      credit_required:
        form.creditRequired,
      exchange_required:
        form.exchangeRequired,
      commission_free_only:
        form.commissionFreeOnly,
      required_features:
        form.requiredFeatures,
      note:
        form.note.trim() ||
        null,
      status: "new",
      follow_up_at:
        form.followUpAt ||
        null,
      created_by:
        userId,
    };

    const {
      data,
      error,
    } = await supabase
      .from(
        "customer_requests",
      )
      .insert(payload)
      .select("*")
      .single();

    if (
      error ||
      !data
    ) {
      setMessage(
        `Talep kaydedilemedi: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );
      setSaving(false);
      return;
    }

    const created =
      data as CustomerRequest;

    setRows(
      (current) => [
        created,
        ...current,
      ],
    );

    setForm(
      EMPTY_FORM,
    );

    localStorage.removeItem(
      REQUEST_DRAFT_KEY,
    );

    setMessage(
      "Talep kaydedildi ve eşleşmeler hazırlandı.",
    );

    setSaving(false);

    if (
      openAfterSave
    ) {
      router.push(
        `/yonetim/talepler/${created.id}`,
      );
      router.refresh();
    }
  }

  async function changeStatus(
    id: string,
    status:
      CustomerRequestStatus,
  ) {
    const previous =
      rows;

    setRows(
      (current) =>
        current.map(
          (row) =>
            row.id === id
              ? {
                  ...row,
                  status,
                }
              : row,
        ),
    );

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from(
          "customer_requests",
        )
        .update({
          status,
        })
        .eq(
          "id",
          id,
        );

    if (error) {
      setRows(previous);

      setMessage(
        `Durum değiştirilemedi: ${error.message}`,
      );
    }
  }

  return (
    <main className="ap-admin-page ap-request-center">
      <section className="ap-request-hero">
        <div>
          <span className="ap-v3-eyebrow">
            AYDEMİR TALEP MOTORU
          </span>

          <h1>
            Talebi yaz,
            <br />
            portföyü bulsun.
          </h1>

          <p>
            Defterdeki notu tek cümleyle
            girin. Bütçe, mahalle, oda ve
            özellikler çözümlensin; uygun
            ilanlar anında sıralansın.
          </p>
        </div>

        <div className="ap-request-hero-metrics">
          <div>
            <span>Aktif talep</span>
            <strong>
              {activeCount}
            </strong>
          </div>

          <div>
            <span>Bugün takip</span>
            <strong>
              {todayCount}
            </strong>
          </div>

          <div>
            <span>Aktif portföy</span>
            <strong>
              {
                listings.filter(
                  (listing) =>
                    listing.status ===
                    "active",
                ).length
              }
            </strong>
          </div>
        </div>
      </section>

      {setupError ? (
        <section className="ap-request-setup-warning">
          <strong>
            Talep veritabanı henüz kurulmadı
          </strong>

          <p>
            Projedeki
            <code>
              supabase/aydemir-v3-talep-merkezi.sql
            </code>
            dosyasını Supabase SQL Editor
            içinde bir kez çalıştırın.
          </p>
        </section>
      ) : null}

      {message ? (
        <div className="ap-form-message success">
          {message}
        </div>
      ) : null}

      <section className="ap-request-capture ap-glass">
        <div className="ap-request-capture-head">
          <div>
            <p className="ap-kicker">
              30 SANİYELİK KAYIT
            </p>

            <h2>
              Yeni müşteri talebi
            </h2>
          </div>

          <span>
            Taslak otomatik kaydolur
          </span>
        </div>

        <div className="ap-request-identity-grid">
          <label>
            <span>Müşteri adı</span>

            <input
              autoFocus
              placeholder="Örn. Ayşe Hanım"
              value={
                form.customerName
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "customerName",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>Telefon</span>

            <input
              inputMode="tel"
              placeholder="05xx xxx xx xx"
              value={
                form.phone
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "phone",
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <label className="ap-request-sentence">
          <span>
            Talebi bir cümleyle yaz
          </span>

          <textarea
            placeholder="Örn. Aktoprak veya Aydoğmuş'ta 2+1, 5-6 milyon arası, havuzlu, ayrı mutfak ve krediye uygun daire arıyor."
            value={
              form.quickText
            }
            onChange={(
              event,
            ) =>
              updateForm(
                "quickText",
                event.target.value,
              )
            }
          />
        </label>

        <div className="ap-request-smart-row">
          <button
            type="button"
            className="ap-request-smart-button"
            onClick={
              smartFill
            }
          >
            ✦ Akıllı Doldur
          </button>

          <p>
            Mahalle, oda, bütçe, mutfak ve
            önemli özellikleri metinden
            otomatik çıkarır.
          </p>
        </div>

        <details
          className="ap-request-advanced"
          open={advancedOpen}
          onToggle={(
            event,
          ) =>
            setAdvancedOpen(
              event.currentTarget.open,
            )
          }
        >
          <summary>
            <span>
              Kriterleri kontrol et
            </span>

            <b>
              {
                form.neighborhoods
                  .length +
                form.roomCounts
                  .length +
                form.requiredFeatures
                  .length
              }{" "}
              seçim
            </b>
          </summary>

          <div className="ap-request-advanced-body">
            <div className="ap-request-budget-grid">
              <label>
                <span>
                  En düşük bütçe
                </span>

                <input
                  inputMode="numeric"
                  placeholder="4.000.000"
                  value={
                    form.minBudget
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "minBudget",
                      groupedInput(
                        event.target
                          .value,
                      ),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  En yüksek bütçe
                </span>

                <input
                  inputMode="numeric"
                  placeholder="6.000.000"
                  value={
                    form.maxBudget
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "maxBudget",
                      groupedInput(
                        event.target
                          .value,
                      ),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Minimum m²
                </span>

                <input
                  inputMode="numeric"
                  placeholder="90"
                  value={
                    form.minArea
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "minArea",
                      digits(
                        event.target
                          .value,
                      ),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Maksimum m²
                </span>

                <input
                  inputMode="numeric"
                  placeholder="140"
                  value={
                    form.maxArea
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "maxArea",
                      digits(
                        event.target
                          .value,
                      ),
                    )
                  }
                />
              </label>
            </div>

            <div className="ap-request-choice-section">
              <span>Mahalleler</span>

              <div className="ap-request-choice-grid">
                {neighborhoods.map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        form.neighborhoods.includes(
                          item,
                        )
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        updateForm(
                          "neighborhoods",
                          toggleValue(
                            form.neighborhoods,
                            item,
                          ),
                        )
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="ap-request-choice-section">
              <span>Oda tipi</span>

              <div className="ap-request-choice-grid compact">
                {roomCounts.map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        form.roomCounts.includes(
                          item,
                        )
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        updateForm(
                          "roomCounts",
                          toggleValue(
                            form.roomCounts,
                            item,
                          ),
                        )
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="ap-request-inline-grid">
              <label>
                <span>Kat tercihi</span>

                <input
                  placeholder="Ara kat, üst kat..."
                  value={
                    form.floorPreferences
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "floorPreferences",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>Mutfak</span>

                <select
                  value={
                    form.kitchenType
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "kitchenType",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Fark etmez
                  </option>

                  <option value="Ayrı Mutfak">
                    Ayrı Mutfak
                  </option>

                  <option value="Açık Mutfak">
                    Açık Mutfak
                  </option>
                </select>
              </label>

              <label>
                <span>Takip tarihi</span>

                <input
                  type="datetime-local"
                  value={
                    form.followUpAt
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "followUpAt",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <div className="ap-request-toggle-grid">
              <label>
                <input
                  type="checkbox"
                  checked={
                    form.creditRequired
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "creditRequired",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Kredi gerekli
                </span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.exchangeRequired
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "exchangeRequired",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Takas gerekli
                </span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.commissionFreeOnly
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "commissionFreeOnly",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Sadece komisyonsuz
                </span>
              </label>
            </div>

            <div className="ap-request-choice-section">
              <span>
                Olmazsa olmaz özellikler
              </span>

              <div className="ap-request-choice-grid">
                {knownFeatures.map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        form.requiredFeatures.includes(
                          item,
                        )
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        updateForm(
                          "requiredFeatures",
                          toggleValue(
                            form.requiredFeatures,
                            item,
                          ),
                        )
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            <label className="ap-request-note-field">
              <span>
                Müşteri notu
              </span>

              <textarea
                placeholder="Özel beklenti, görüşme notu, ulaşılacak saat..."
                value={
                  form.note
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "note",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </details>

        <section className="ap-request-live-match">
          <div className="ap-request-live-head">
            <div>
              <span>
                CANLI EŞLEŞME
              </span>

              <strong>
                {previewMatches.length > 0
                  ? `${previewMatches.length} güçlü başlangıç seçeneği`
                  : "Kriterleri girince sonuçlar burada görünür"}
              </strong>
            </div>

            <small>
              Aktif ilanlar taranıyor
            </small>
          </div>

          {previewMatches.length > 0 ? (
            <div className="ap-request-live-list">
              {previewMatches.map(
                (match) => (
                  <article
                    key={
                      match.listing.id
                    }
                  >
                    <div className="ap-request-live-score">
                      <strong>
                        %{match.score}
                      </strong>

                      <span>
                        {matchLabel(
                          match.score,
                        )}
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          match.listing
                            .title
                        }
                      </strong>

                      <span>
                        {
                          match.listing
                            .neighborhood
                        }{" "}
                        ·{" "}
                        {
                          match.listing
                            .room_count
                        }{" "}
                        ·{" "}
                        {formatPrice(
                          match.listing
                            .price,
                        )}
                      </span>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : null}
        </section>

        <div className="ap-request-save-row">
          <button
            type="button"
            className="ap-soft-button"
            disabled={saving}
            onClick={() =>
              saveRequest(
                false,
              )
            }
          >
            Sadece Kaydet
          </button>

          <button
            type="button"
            className="ap-primary-button"
            disabled={saving}
            onClick={() =>
              saveRequest(
                true,
              )
            }
          >
            {saving
              ? "Kaydediliyor..."
              : "Kaydet ve Eşleşmeleri Aç"}
          </button>
        </div>
      </section>

      <section className="ap-request-list-head">
        <div>
          <p className="ap-kicker">
            TALEP HAVUZU
          </p>

          <h2>
            Güncel müşteri talepleri
          </h2>
        </div>

        <div className="ap-request-list-tools">
          <input
            type="search"
            placeholder="İsim, telefon, mahalle ara..."
            value={query}
            onChange={(
              event,
            ) =>
              setQuery(
                event.target.value,
              )
            }
          />

          <select
            value={statusFilter}
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | "all"
                  | CustomerRequestStatus,
              )
            }
          >
            <option value="all">
              Tüm durumlar
            </option>

            {REQUEST_STATUS_OPTIONS.map(
              (item) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {item.label}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {filteredRows.length === 0 ? (
        <section className="ap-empty-state ap-glass">
          <h2>
            Henüz talep yok
          </h2>

          <p>
            İlk müşteri talebini yukarıdaki
            hızlı alandan kaydedin.
          </p>
        </section>
      ) : (
        <section className="ap-request-card-grid">
          {filteredRows.map(
            (row) => {
              const matches =
                rankListingsForRequest(
                  row,
                  listings,
                );

              const strongMatches =
                matches.filter(
                  (item) =>
                    item.score >=
                    60,
                );

              const best =
                matches[0];

              return (
                <article
                  className="ap-request-card ap-glass"
                  key={row.id}
                >
                  <div className="ap-request-card-top">
                    <span
                      className={
                        `ap-request-status status-${row.status}`
                      }
                    >
                      {requestStatusLabel(
                        row.status,
                      )}
                    </span>

                    <select
                      aria-label="Talep durumu"
                      value={
                        row.status
                      }
                      onChange={(
                        event,
                      ) =>
                        changeStatus(
                          row.id,
                          event.target
                            .value as CustomerRequestStatus,
                        )
                      }
                    >
                      {REQUEST_STATUS_OPTIONS.map(
                        (item) => (
                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {item.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="ap-request-card-customer">
                    <div>
                      <strong>
                        {row.customer_name}
                      </strong>

                      <span>
                        {row.phone ||
                          "Telefon girilmedi"}
                      </span>
                    </div>

                    {best ? (
                      <div
                        className={
                          `ap-request-score ${matchTone(
                            best.score,
                          )}`
                        }
                      >
                        <strong>
                          %{best.score}
                        </strong>

                        <span>
                          en iyi
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <p className="ap-request-card-summary">
                    {compactRequestSummary(
                      row,
                    )}
                  </p>

                  {row.note ? (
                    <p className="ap-request-card-note">
                      {row.note}
                    </p>
                  ) : null}

                  <div className="ap-request-card-stats">
                    <div>
                      <span>
                        Uygun ilan
                      </span>

                      <strong>
                        {
                          strongMatches.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Takip
                      </span>

                      <strong>
                        {formatDateTime(
                          row.follow_up_at,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="ap-request-card-actions">
                    <Link
                      href={
                        `/yonetim/talepler/${row.id}`
                      }
                      className="ap-primary-button"
                    >
                      Eşleşmeleri Aç
                    </Link>

                    {row.phone ? (
                      <>
                        <a
                          href={phoneHref(
                            row.phone,
                          )}
                          className="ap-soft-button"
                        >
                          Ara
                        </a>

                        <a
                          href={whatsappHref(
                            row.phone,
                            row.customer_name,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="ap-success-button"
                        >
                          WhatsApp
                        </a>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            },
          )}
        </section>
      )}
    </main>
  );
}
