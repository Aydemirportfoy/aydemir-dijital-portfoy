"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  compactRequestSummary,
} from "@/lib/requestQuickParser";
import {
  matchLabel,
  matchTone,
  rankListingsForRequest,
} from "@/lib/requestMatching";
import {
  REQUEST_STATUS_OPTIONS,
  requestStatusLabel,
  type CustomerRequest,
  type CustomerRequestNote,
  type CustomerRequestStatus,
  type RequestPresentationLink,
} from "@/lib/requestTypes";
import type {
  Listing,
  Presentation,
} from "@/lib/types";
import {
  formatPrice,
  slugify,
} from "@/lib/format";

function formatDateTime(
  value: string,
) {
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

function phoneHref(
  value: string,
) {
  return `tel:${value.replace(
    /[^\d+]/g,
    "",
  )}`;
}

function whatsappPhone(
  value: string,
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

  return phone;
}

function numericValue(
  value: string,
) {
  const parsed =
    Number(
      value.replace(
        /\D/g,
        "",
      ),
    );

  return parsed > 0
    ? parsed
    : null;
}

function groupedInput(
  value: string,
) {
  const clean =
    value.replace(
      /\D/g,
      "",
    );

  if (!clean) {
    return "";
  }

  return new Intl.NumberFormat(
    "tr-TR",
  ).format(
    Number(clean),
  );
}

type EditState = {
  customerName: string;
  phone: string;
  minBudget: string;
  maxBudget: string;
  neighborhoods: string;
  roomCounts: string;
  minArea: string;
  maxArea: string;
  floorPreferences: string;
  kitchenType: string;
  requiredFeatures: string;
  note: string;
  followUpAt: string;
  status: CustomerRequestStatus;
  creditRequired: boolean;
  exchangeRequired: boolean;
  commissionFreeOnly: boolean;
};

function toLocalDateTime(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
      offset * 60_000,
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function editStateFromRequest(
  request: CustomerRequest,
): EditState {
  return {
    customerName:
      request.customer_name,
    phone:
      request.phone ?? "",
    minBudget:
      request.min_budget
        ? groupedInput(
            String(
              request.min_budget,
            ),
          )
        : "",
    maxBudget:
      request.max_budget
        ? groupedInput(
            String(
              request.max_budget,
            ),
          )
        : "",
    neighborhoods:
      request.neighborhoods.join(
        ", ",
      ),
    roomCounts:
      request.room_counts.join(
        ", ",
      ),
    minArea:
      request.min_area
        ? String(
            request.min_area,
          )
        : "",
    maxArea:
      request.max_area
        ? String(
            request.max_area,
          )
        : "",
    floorPreferences:
      request.floor_preferences ??
      "",
    kitchenType:
      request.kitchen_type ??
      "",
    requiredFeatures:
      request.required_features.join(
        ", ",
      ),
    note:
      request.note ?? "",
    followUpAt:
      toLocalDateTime(
        request.follow_up_at,
      ),
    status:
      request.status,
    creditRequired:
      request.credit_required,
    exchangeRequired:
      request.exchange_required,
    commissionFreeOnly:
      request.commission_free_only,
  };
}

function splitComma(
  value: string,
) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  );
}

export default function RequestDetailManager({
  initialRequest,
  listings,
  initialNotes,
  initialPresentations,
  userId,
}: {
  initialRequest:
    CustomerRequest;
  listings: Listing[];
  initialNotes:
    CustomerRequestNote[];
  initialPresentations:
    RequestPresentationLink[];
  userId: string;
}) {
  const router =
    useRouter();

  const [
    request,
    setRequest,
  ] = useState(
    initialRequest,
  );

  const [
    notes,
    setNotes,
  ] = useState(
    initialNotes,
  );

  const [
    presentations,
    setPresentations,
  ] = useState(
    initialPresentations,
  );

  const [
    edit,
    setEdit,
  ] = useState(
    editStateFromRequest(
      initialRequest,
    ),
  );

  const [
    selected,
    setSelected,
  ] = useState<string[]>(
    () =>
      rankListingsForRequest(
        initialRequest,
        listings,
      )
        .filter(
          (item) =>
            item.score >= 60,
        )
        .slice(0, 4)
        .map(
          (item) =>
            item.listing.id,
        ),
  );

  const [threshold, setThreshold] =
    useState(40);

  const [query, setQuery] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    noteText,
    setNoteText,
  ] = useState("");

  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);

  const [
    creatingPresentation,
    setCreatingPresentation,
  ] = useState(false);

  const [
    createdPresentation,
    setCreatedPresentation,
  ] = useState<
    Presentation | null
  >(null);

  const matches =
    useMemo(
      () =>
        rankListingsForRequest(
          request,
          listings,
        ),
      [
        request,
        listings,
      ],
    );

  const visibleMatches =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLocaleLowerCase(
            "tr-TR",
          );

      return matches.filter(
        (match) => {
          if (
            match.score <
            threshold
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          return [
            match.listing.title,
            match.listing.project_name,
            match.listing.neighborhood,
            match.listing.room_count,
            ...(match.listing
              .features ?? []),
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
      matches,
      query,
      threshold,
    ]);

  function toggleSelected(
    id: string,
  ) {
    setSelected(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id,
            )
          : [...current, id],
    );
  }

  function selectTop(
    count: number,
  ) {
    setSelected(
      matches
        .slice(0, count)
        .map(
          (item) =>
            item.listing.id,
        ),
    );
  }

  async function saveEdit() {
    if (
      !edit.customerName
        .trim()
    ) {
      setMessage(
        "Müşteri adı zorunludur.",
      );
      return;
    }

    setSavingEdit(true);
    setMessage("");

    const payload = {
      customer_name:
        edit.customerName.trim(),
      phone:
        edit.phone.trim() ||
        null,
      min_budget:
        numericValue(
          edit.minBudget,
        ),
      max_budget:
        numericValue(
          edit.maxBudget,
        ),
      neighborhoods:
        splitComma(
          edit.neighborhoods,
        ),
      room_counts:
        splitComma(
          edit.roomCounts,
        ),
      min_area:
        numericValue(
          edit.minArea,
        ),
      max_area:
        numericValue(
          edit.maxArea,
        ),
      floor_preferences:
        edit.floorPreferences
          .trim() ||
        null,
      kitchen_type:
        edit.kitchenType ||
        null,
      required_features:
        splitComma(
          edit.requiredFeatures,
        ),
      note:
        edit.note.trim() ||
        null,
      follow_up_at:
        edit.followUpAt ||
        null,
      status:
        edit.status,
      credit_required:
        edit.creditRequired,
      exchange_required:
        edit.exchangeRequired,
      commission_free_only:
        edit.commissionFreeOnly,
    };

    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "customer_requests",
      )
      .update(payload)
      .eq(
        "id",
        request.id,
      )
      .select("*")
      .single();

    if (
      error ||
      !data
    ) {
      setMessage(
        `Talep güncellenemedi: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );
    } else {
      setRequest(
        data as CustomerRequest,
      );

      setMessage(
        "Talep güncellendi, eşleşmeler yeniden hesaplandı.",
      );
    }

    setSavingEdit(false);
  }

  async function addNote() {
    if (
      noteText.trim()
        .length < 2
    ) {
      return;
    }

    setSavingNote(true);
    setMessage("");

    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "customer_request_notes",
      )
      .insert({
        request_id:
          request.id,
        note:
          noteText.trim(),
        created_by:
          userId,
      })
      .select("*")
      .single();

    if (
      error ||
      !data
    ) {
      setMessage(
        `Not eklenemedi: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );
    } else {
      setNotes(
        (current) => [
          data as CustomerRequestNote,
          ...current,
        ],
      );

      setNoteText("");

      setMessage(
        "Görüşme notu eklendi.",
      );
    }

    setSavingNote(false);
  }

  async function createPresentation() {
    if (
      selected.length === 0
    ) {
      setMessage(
        "Sunuma eklemek için en az bir ilan seçin.",
      );
      return;
    }

    setCreatingPresentation(
      true,
    );

    setMessage("");

    const supabase =
      createClient();

    const slug =
      `${
        slugify(
          request.customer_name,
        ) || "musteri"
      }-${
        Math.random()
          .toString(36)
          .slice(2, 8)
      }`;

    const {
      data: presentation,
      error,
    } = await supabase
      .from("presentations")
      .insert({
        slug,
        customer_name:
          request.customer_name,
        title:
          `${request.customer_name} için uygun portföyler`,
        note:
          `Talebinize uygun güncel seçenekleri sizin için bir araya getirdik. ${compactRequestSummary(
            request,
          )}`,
        status: "active",
        created_by:
          userId,
      })
      .select("*")
      .single();

    if (
      error ||
      !presentation
    ) {
      setMessage(
        `Sunum oluşturulamadı: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );

      setCreatingPresentation(
        false,
      );

      return;
    }

    const {
      error: listingError,
    } = await supabase
      .from(
        "presentation_listings",
      )
      .insert(
        selected.map(
          (
            listingId,
            position,
          ) => ({
            presentation_id:
              presentation.id,
            listing_id:
              listingId,
            position,
          }),
        ),
      );

    if (listingError) {
      await supabase
        .from(
          "presentations",
        )
        .delete()
        .eq(
          "id",
          presentation.id,
        );

      setMessage(
        `İlanlar sunuma eklenemedi: ${listingError.message}`,
      );

      setCreatingPresentation(
        false,
      );

      return;
    }

    const {
      data: relation,
      error: relationError,
    } = await supabase
      .from(
        "customer_request_presentations",
      )
      .insert({
        request_id:
          request.id,
        presentation_id:
          presentation.id,
      })
      .select(
        "id,request_id,presentation_id,created_at",
      )
      .single();

    await supabase
      .from(
        "customer_requests",
      )
      .update({
        status:
          request.status === "new"
            ? "contacted"
            : request.status,
      })
      .eq(
        "id",
        request.id,
      );

    const created =
      presentation as Presentation;

    setCreatedPresentation(
      created,
    );

    setRequest(
      (current) => ({
        ...current,
        status:
          current.status === "new"
            ? "contacted"
            : current.status,
      }),
    );

    setPresentations(
      (current) => [
        {
          id:
            relation?.id ??
            `local-${created.id}`,
          request_id:
            request.id,
          presentation_id:
            created.id,
          created_at:
            relation?.created_at ??
            created.created_at,
          presentation: {
            id:
              created.id,
            slug:
              created.slug,
            customer_name:
              created.customer_name,
            title:
              created.title,
            status:
              created.status,
            created_at:
              created.created_at,
          },
        },
        ...current,
      ],
    );

    setMessage(
      relationError
        ? "Sunum oluşturuldu. Talep bağlantısı kaydedilemedi ancak sunum kullanılabilir."
        : "Sunum hazırlandı. Linki şimdi paylaşabilirsiniz.",
    );

    setCreatingPresentation(
      false,
    );

    router.refresh();
  }

  async function copyPresentation(
    slug: string,
  ) {
    const url =
      `${window.location.origin}/sunum/${slug}`;

    try {
      await navigator.clipboard.writeText(
        url,
      );

      setMessage(
        "Sunum linki kopyalandı.",
      );
    } catch {
      setMessage(
        "Link kopyalanamadı.",
      );
    }
  }

  function sendPresentation(
    slug: string,
  ) {
    const url =
      `${window.location.origin}/sunum/${slug}`;

    const text =
      encodeURIComponent(
        `Merhaba ${request.customer_name}, talebinize uygun hazırladığımız özel portföy sunumunu aşağıdaki bağlantıdan inceleyebilirsiniz:\n\n${url}`,
      );

    const phone =
      request.phone
        ? whatsappPhone(
            request.phone,
          )
        : "";

    window.open(
      `https://wa.me/${phone}?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function removeRequest() {
    if (
      !window.confirm(
        `${request.customer_name} talebini ve görüşme notlarını kalıcı olarak silmek istiyor musunuz?`,
      )
    ) {
      return;
    }

    const supabase =
      createClient();

    const { error } =
      await supabase
        .from(
          "customer_requests",
        )
        .delete()
        .eq(
          "id",
          request.id,
        );

    if (error) {
      setMessage(
        `Talep silinemedi: ${error.message}`,
      );
      return;
    }

    router.push(
      "/yonetim/talepler",
    );

    router.refresh();
  }

  return (
    <main className="ap-admin-page ap-request-detail-page">
      <section className="ap-request-detail-hero">
        <div>
          <Link
            href="/yonetim/talepler"
            className="ap-request-back-link"
          >
            ← Taleplere dön
          </Link>

          <p className="ap-kicker">
            MÜŞTERİ TALEBİ
          </p>

          <h1>
            {request.customer_name}
          </h1>

          <p>
            {compactRequestSummary(
              request,
            )}
          </p>
        </div>

        <div className="ap-request-detail-actions">
          <span
            className={
              `ap-request-status status-${request.status}`
            }
          >
            {requestStatusLabel(
              request.status,
            )}
          </span>

          {request.phone ? (
            <>
              <a
                href={phoneHref(
                  request.phone,
                )}
                className="ap-soft-button"
              >
                Ara
              </a>

              <a
                href={
                  `https://wa.me/${whatsappPhone(
                    request.phone,
                  )}`
                }
                target="_blank"
                rel="noreferrer"
                className="ap-success-button"
              >
                WhatsApp
              </a>
            </>
          ) : null}
        </div>
      </section>

      {message ? (
        <div className="ap-form-message success">
          {message}
        </div>
      ) : null}

      {createdPresentation ? (
        <section className="ap-request-created-presentation">
          <div>
            <span>
              SUNUM HAZIR
            </span>

            <strong>
              {
                createdPresentation.title
              }
            </strong>
          </div>

          <div>
            <a
              href={
                `/sunum/${createdPresentation.slug}`
              }
              target="_blank"
              rel="noreferrer"
              className="ap-primary-button"
            >
              Sunumu Aç
            </a>

            <button
              type="button"
              className="ap-soft-button"
              onClick={() =>
                copyPresentation(
                  createdPresentation.slug,
                )
              }
            >
              Linki Kopyala
            </button>

            <button
              type="button"
              className="ap-success-button"
              onClick={() =>
                sendPresentation(
                  createdPresentation.slug,
                )
              }
            >
              WhatsApp
            </button>
          </div>
        </section>
      ) : null}

      <div className="ap-request-detail-layout">
        <aside className="ap-request-detail-sidebar">
          <section className="ap-request-profile-card ap-glass">
            <div className="ap-request-profile-head">
              <div>
                <span>
                  MÜŞTERİ
                </span>

                <strong>
                  {
                    request.customer_name
                  }
                </strong>

                <small>
                  {request.phone ||
                    "Telefon girilmedi"}
                </small>
              </div>

              <div className="ap-request-profile-score">
                <strong>
                  %
                  {matches[0]
                    ?.score ?? 0}
                </strong>

                <span>
                  en iyi eşleşme
                </span>
              </div>
            </div>

            <div className="ap-request-profile-grid">
              <div>
                <span>
                  Bütçe
                </span>

                <strong>
                  {request.min_budget
                    ? formatPrice(
                        request.min_budget,
                      )
                    : "Alt sınır yok"}
                  {" — "}
                  {request.max_budget
                    ? formatPrice(
                        request.max_budget,
                      )
                    : "Üst sınır yok"}
                </strong>
              </div>

              <div>
                <span>
                  Mahalle
                </span>

                <strong>
                  {request.neighborhoods
                    .join(", ") ||
                    "Fark etmez"}
                </strong>
              </div>

              <div>
                <span>
                  Oda
                </span>

                <strong>
                  {request.room_counts
                    .join(" / ") ||
                    "Fark etmez"}
                </strong>
              </div>

              <div>
                <span>
                  Takip
                </span>

                <strong>
                  {request.follow_up_at
                    ? formatDateTime(
                        request.follow_up_at,
                      )
                    : "Tarih yok"}
                </strong>
              </div>
            </div>

            {request.source_text ? (
              <div className="ap-request-original-note">
                <span>
                  İlk talep notu
                </span>

                <p>
                  {request.source_text}
                </p>
              </div>
            ) : null}

            {request.note ? (
              <div className="ap-request-original-note">
                <span>
                  Özel not
                </span>

                <p>
                  {request.note}
                </p>
              </div>
            ) : null}
          </section>

          <details className="ap-request-edit-card ap-glass">
            <summary>
              Talebi Düzenle
            </summary>

            <div className="ap-request-edit-body">
              <label>
                <span>
                  Müşteri adı
                </span>

                <input
                  value={
                    edit.customerName
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        customerName:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Telefon
                </span>

                <input
                  value={
                    edit.phone
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        phone:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <div className="ap-request-edit-two">
                <label>
                  <span>
                    Min. bütçe
                  </span>

                  <input
                    inputMode="numeric"
                    value={
                      edit.minBudget
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          minBudget:
                            groupedInput(
                              event.target
                                .value,
                            ),
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Maks. bütçe
                  </span>

                  <input
                    inputMode="numeric"
                    value={
                      edit.maxBudget
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          maxBudget:
                            groupedInput(
                              event.target
                                .value,
                            ),
                        }),
                      )
                    }
                  />
                </label>
              </div>

              <label>
                <span>
                  Mahalleler
                </span>

                <input
                  placeholder="Aktoprak, Aydoğmuş"
                  value={
                    edit.neighborhoods
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        neighborhoods:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Oda tipleri
                </span>

                <input
                  placeholder="2+1, 3+1"
                  value={
                    edit.roomCounts
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        roomCounts:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <div className="ap-request-edit-two">
                <label>
                  <span>
                    Min. m²
                  </span>

                  <input
                    inputMode="numeric"
                    value={
                      edit.minArea
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          minArea:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Maks. m²
                  </span>

                  <input
                    inputMode="numeric"
                    value={
                      edit.maxArea
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          maxArea:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

              <label>
                <span>
                  Kat tercihi
                </span>

                <input
                  value={
                    edit.floorPreferences
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        floorPreferences:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Mutfak
                </span>

                <select
                  value={
                    edit.kitchenType
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        kitchenType:
                          event.target
                            .value,
                      }),
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
                <span>
                  Özellikler
                </span>

                <input
                  placeholder="Havuz, asansör..."
                  value={
                    edit.requiredFeatures
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        requiredFeatures:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Takip tarihi
                </span>

                <input
                  type="datetime-local"
                  value={
                    edit.followUpAt
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        followUpAt:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Durum
                </span>

                <select
                  value={
                    edit.status
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        status:
                          event.target
                            .value as CustomerRequestStatus,
                      }),
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
              </label>

              <div className="ap-request-edit-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      edit.creditRequired
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          creditRequired:
                            event.target
                              .checked,
                        }),
                      )
                    }
                  />
                  Kredi
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      edit.exchangeRequired
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          exchangeRequired:
                            event.target
                              .checked,
                        }),
                      )
                    }
                  />
                  Takas
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      edit.commissionFreeOnly
                    }
                    onChange={(
                      event,
                    ) =>
                      setEdit(
                        (current) => ({
                          ...current,
                          commissionFreeOnly:
                            event.target
                              .checked,
                        }),
                      )
                    }
                  />
                  Komisyonsuz
                </label>
              </div>

              <label>
                <span>
                  Ana not
                </span>

                <textarea
                  value={
                    edit.note
                  }
                  onChange={(
                    event,
                  ) =>
                    setEdit(
                      (current) => ({
                        ...current,
                        note:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <button
                type="button"
                className="ap-primary-button"
                disabled={
                  savingEdit
                }
                onClick={
                  saveEdit
                }
              >
                {savingEdit
                  ? "Kaydediliyor..."
                  : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </details>

          <section className="ap-request-notes-card ap-glass">
            <div>
              <p className="ap-kicker">
                GÖRÜŞME GEÇMİŞİ
              </p>

              <h2>
                Hızlı not ekle
              </h2>
            </div>

            <textarea
              placeholder="Arandı, eşiyle görüşecek, cumartesi gösterim..."
              value={
                noteText
              }
              onChange={(
                event,
              ) =>
                setNoteText(
                  event.target.value,
                )
              }
            />

            <button
              type="button"
              className="ap-primary-button"
              disabled={
                savingNote
              }
              onClick={
                addNote
              }
            >
              {savingNote
                ? "Ekleniyor..."
                : "Notu Ekle"}
            </button>

            <div className="ap-request-note-timeline">
              {notes.length === 0 ? (
                <p>
                  Henüz görüşme notu yok.
                </p>
              ) : (
                notes.map(
                  (note) => (
                    <article
                      key={
                        note.id
                      }
                    >
                      <span>
                        {formatDateTime(
                          note.created_at,
                        )}
                      </span>

                      <p>
                        {note.note}
                      </p>
                    </article>
                  ),
                )
              )}
            </div>
          </section>

          {presentations.length > 0 ? (
            <section className="ap-request-past-presentations ap-glass">
              <p className="ap-kicker">
                ÖNCEKİ SUNUMLAR
              </p>

              {presentations.map(
                (item) =>
                  item.presentation ? (
                    <article
                      key={
                        item.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            item.presentation
                              .title
                          }
                        </strong>

                        <span>
                          {formatDateTime(
                            item.created_at,
                          )}
                        </span>
                      </div>

                      <a
                        href={
                          `/sunum/${item.presentation.slug}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Aç
                      </a>
                    </article>
                  ) : null,
              )}
            </section>
          ) : null}

          <button
            type="button"
            className="ap-request-delete-button"
            onClick={
              removeRequest
            }
          >
            Talebi Kalıcı Olarak Sil
          </button>
        </aside>

        <section className="ap-request-matches-panel">
          <div className="ap-request-match-toolbar ap-glass">
            <div>
              <p className="ap-kicker">
                OTOMATİK EŞLEŞME
              </p>

              <h2>
                {visibleMatches.length} uygun
                seçenek
              </h2>
            </div>

            <div className="ap-request-match-tools">
              <input
                type="search"
                placeholder="Sonuçlarda ara..."
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
                value={
                  threshold
                }
                onChange={(
                  event,
                ) =>
                  setThreshold(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              >
                <option value="40">
                  Tüm alternatifler
                </option>

                <option value="60">
                  %60 ve üzeri
                </option>

                <option value="75">
                  %75 ve üzeri
                </option>

                <option value="85">
                  %85 ve üzeri
                </option>
              </select>
            </div>

            <div className="ap-request-selection-bar">
              <span>
                {selected.length} ilan
                seçildi
              </span>

              <button
                type="button"
                onClick={() =>
                  selectTop(3)
                }
              >
                İlk 3
              </button>

              <button
                type="button"
                onClick={() =>
                  selectTop(5)
                }
              >
                İlk 5
              </button>

              <button
                type="button"
                className="ap-request-create-presentation"
                disabled={
                  creatingPresentation ||
                  selected.length === 0
                }
                onClick={
                  createPresentation
                }
              >
                {creatingPresentation
                  ? "Sunum hazırlanıyor..."
                  : "Seçilenlerden Sunum Oluştur"}
              </button>
            </div>
          </div>

          {visibleMatches.length === 0 ? (
            <section className="ap-empty-state ap-glass">
              <h2>
                Bu kriterlerde ilan bulunamadı
              </h2>

              <p>
                Eşik değerini düşürün veya
                talep kriterlerini düzenleyin.
              </p>
            </section>
          ) : (
            <div className="ap-request-match-grid">
              {visibleMatches.map(
                (match) => {
                  const listing =
                    match.listing;

                  const isSelected =
                    selected.includes(
                      listing.id,
                    );

                  return (
                    <article
                      className={
                        `ap-request-match-card ap-glass ${
                          isSelected
                            ? "is-selected"
                            : ""
                        }`
                      }
                      key={
                        listing.id
                      }
                    >
                      <button
                        type="button"
                        className="ap-request-match-select"
                        aria-label="İlanı sunuma seç"
                        onClick={() =>
                          toggleSelected(
                            listing.id,
                          )
                        }
                      >
                        {isSelected
                          ? "✓"
                          : "+"}
                      </button>

                      <div className="ap-request-match-image">
                        {listing.cover_image_url ? (
                          <img
                            src={
                              listing.cover_image_url
                            }
                            alt={
                              listing.title
                            }
                          />
                        ) : (
                          <div>
                            Fotoğraf yok
                          </div>
                        )}

                        <div
                          className={
                            `ap-request-match-score ${matchTone(
                              match.score,
                            )}`
                          }
                        >
                          <strong>
                            %{match.score}
                          </strong>

                          <span>
                            {matchLabel(
                              match.score,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="ap-request-match-body">
                        <p>
                          {listing.project_name ||
                            "AYDEMİR PORTFÖY"}
                        </p>

                        <h3>
                          {listing.title}
                        </h3>

                        <div className="ap-request-match-meta">
                          <span>
                            {
                              listing.neighborhood
                            }
                          </span>

                          {listing.room_count ? (
                            <span>
                              {
                                listing.room_count
                              }
                            </span>
                          ) : null}

                          {listing.area_m2 ? (
                            <span>
                              {
                                listing.area_m2
                              }{" "}
                              m²
                            </span>
                          ) : null}
                        </div>

                        <strong className="ap-request-match-price">
                          {formatPrice(
                            listing.price,
                          )}
                        </strong>

                        {match.reasons.length > 0 ? (
                          <div className="ap-request-reason-row">
                            {match.reasons.map(
                              (reason) => (
                                <span
                                  key={
                                    reason
                                  }
                                >
                                  ✓ {reason}
                                </span>
                              ),
                            )}
                          </div>
                        ) : null}

                        {match.gaps.length > 0 ? (
                          <div className="ap-request-gap-row">
                            {match.gaps.map(
                              (gap) => (
                                <span
                                  key={
                                    gap
                                  }
                                >
                                  {gap}
                                </span>
                              ),
                            )}
                          </div>
                        ) : null}

                        <div className="ap-request-match-actions">
                          <a
                            href={
                              `/ilan/${listing.slug}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="ap-soft-button"
                          >
                            İlanı Aç
                          </a>

                          <button
                            type="button"
                            className={
                              isSelected
                                ? "ap-primary-button"
                                : "ap-soft-button"
                            }
                            onClick={() =>
                              toggleSelected(
                                listing.id,
                              )
                            }
                          >
                            {isSelected
                              ? "Sunuma Seçildi"
                              : "Sunuma Ekle"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
