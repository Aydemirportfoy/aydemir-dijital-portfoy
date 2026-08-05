"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  compactRequestSummary,
} from "@/lib/requestQuickParser";
import {
  REQUEST_PRIORITY_OPTIONS,
  REQUEST_STATUS_OPTIONS,
  requestPriorityLabel,
  requestStatusLabel,
  type CustomerRequest,
  type CustomerRequestPriority,
  type CustomerRequestStatus,
} from "@/lib/requestTypes";

type FocusFilter =
  | "today"
  | "overdue"
  | "new"
  | "presentation_sent"
  | "viewing"
  | "negotiation"
  | "waiting"
  | "unplanned"
  | "all";

const CLOSED_STATUSES:
  CustomerRequestStatus[] = [
    "won",
    "lost",
    "archived",
  ];

function isClosed(
  status: CustomerRequestStatus,
) {
  return CLOSED_STATUSES.includes(
    status,
  );
}

function sameLocalDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function startOfToday() {
  const value =
    new Date();

  value.setHours(
    0,
    0,
    0,
    0,
  );

  return value;
}

function isToday(
  value: string | null,
) {
  if (!value) {
    return false;
  }

  return sameLocalDay(
    new Date(value),
    new Date(),
  );
}

function isOverdue(
  request: CustomerRequest,
) {
  if (
    !request.follow_up_at ||
    isClosed(
      request.status,
    )
  ) {
    return false;
  }

  return (
    new Date(
      request.follow_up_at,
    ).getTime() <
      startOfToday().getTime()
  );
}

function dateTimeLabel(
  value: string | null,
) {
  if (!value) {
    return "Takip planlanmadı";
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

function shortDateTimeLabel(
  value: string | null,
) {
  if (!value) {
    return "Plan yok";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
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
      `Merhaba ${customerName}, talebinizle ilgili size ulaşmak istiyoruz.`,
    );

  return `https://wa.me/${phone}?text=${text}`;
}

function followUpIso(
  dayOffset: number,
  hour: number,
  minute = 0,
) {
  const value =
    new Date();

  value.setDate(
    value.getDate() +
      dayOffset,
  );

  value.setHours(
    hour,
    minute,
    0,
    0,
  );

  return value.toISOString();
}

function normalizedPriority(
  value:
    CustomerRequest["priority"] |
    null |
    undefined,
): CustomerRequestPriority {
  return (
    value ?? "normal"
  );
}

function sortRequests(
  rows: CustomerRequest[],
) {
  const priorityWeight:
    Record<
      CustomerRequestPriority,
      number
    > = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4,
    };

  return [...rows].sort(
    (
      first,
      second,
    ) => {
      const firstOverdue =
        isOverdue(first)
          ? 1
          : 0;

      const secondOverdue =
        isOverdue(second)
          ? 1
          : 0;

      if (
        firstOverdue !==
        secondOverdue
      ) {
        return (
          secondOverdue -
          firstOverdue
        );
      }

      const priorityDiff =
        priorityWeight[
          normalizedPriority(
            second.priority,
          )
        ] -
        priorityWeight[
          normalizedPriority(
            first.priority,
          )
        ];

      if (priorityDiff) {
        return priorityDiff;
      }

      const firstTime =
        first.follow_up_at
          ? new Date(
              first.follow_up_at,
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

      const secondTime =
        second.follow_up_at
          ? new Date(
              second.follow_up_at,
            ).getTime()
          : Number.MAX_SAFE_INTEGER;

      return (
        firstTime -
        secondTime
      );
    },
  );
}

export default function TrackingCenter({
  initialRequests,
  userId,
  setupError,
}: {
  initialRequests:
    CustomerRequest[];
  userId: string;
  setupError:
    string | null;
}) {
  const [rows, setRows] =
    useState(
      initialRequests,
    );

  const [focus, setFocus] =
    useState<FocusFilter>(
      "today",
    );

  const [query, setQuery] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [busyId, setBusyId] =
    useState<string | null>(
      null,
    );

  const activeRows =
    useMemo(
      () =>
        rows.filter(
          (row) =>
            !isClosed(
              row.status,
            ),
        ),
      [rows],
    );

  const metrics =
    useMemo(
      () => ({
        today:
          activeRows.filter(
            (row) =>
              isToday(
                row.follow_up_at,
              ),
          ).length,

        overdue:
          activeRows.filter(
            isOverdue,
          ).length,

        new:
          activeRows.filter(
            (row) =>
              row.status ===
              "new",
          ).length,

        presentation:
          activeRows.filter(
            (row) =>
              row.status ===
              "presentation_sent",
          ).length,

        viewing:
          activeRows.filter(
            (row) =>
              row.status ===
              "viewing",
          ).length,

        negotiation:
          activeRows.filter(
            (row) =>
              row.status ===
              "negotiation",
          ).length,

        won:
          rows.filter(
            (row) =>
              row.status ===
              "won",
          ).length,
      }),
      [
        activeRows,
        rows,
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

      const result =
        activeRows.filter(
          (row) => {
            if (
              focus ===
                "today" &&
              !isToday(
                row.follow_up_at,
              )
            ) {
              return false;
            }

            if (
              focus ===
                "overdue" &&
              !isOverdue(row)
            ) {
              return false;
            }

            if (
              focus ===
                "unplanned" &&
              row.follow_up_at
            ) {
              return false;
            }

            if (
              ![
                "today",
                "overdue",
                "unplanned",
                "all",
              ].includes(
                focus,
              ) &&
              row.status !==
                focus
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
              requestStatusLabel(
                row.status,
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

      return sortRequests(
        result,
      );
    }, [
      activeRows,
      focus,
      query,
    ]);

  async function addHistoryNote(
    requestId: string,
    note: string,
  ) {
    const supabase =
      createClient();

    await supabase
      .from(
        "customer_request_notes",
      )
      .insert({
        request_id:
          requestId,
        note,
        created_by:
          userId,
      });
  }

  async function updateRequest(
    request:
      CustomerRequest,
    patch:
      Partial<CustomerRequest>,
    successMessage: string,
    historyNote?: string,
  ) {
    if (setupError) {
      setMessage(
        "Önce günlük takip SQL dosyasını Supabase üzerinde çalıştırın.",
      );
      return;
    }

    setBusyId(
      request.id,
    );

    setMessage("");

    const supabase =
      createClient();

    const {
      data,
      error,
    } = await supabase
      .from(
        "customer_requests",
      )
      .update(patch)
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
        `İşlem tamamlanamadı: ${
          error?.message ??
          "Bilinmeyen hata"
        }`,
      );

      setBusyId(null);

      return;
    }

    setRows(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            request.id
              ? (
                  data as
                    CustomerRequest
                )
              : item,
        ),
    );

    if (historyNote) {
      await addHistoryNote(
        request.id,
        historyNote,
      );
    }

    setMessage(
      successMessage,
    );

    setBusyId(null);
  }

  async function changeStatus(
    request:
      CustomerRequest,
    status:
      CustomerRequestStatus,
  ) {
    let lostReason:
      string |
      null =
      request.lost_reason ??
      null;

    if (
      status ===
      "lost"
    ) {
      const reason =
        window.prompt(
          "Olumsuz sonuçlanma nedenini yazın:",
          request.lost_reason ??
            "",
        );

      if (reason === null) {
        return;
      }

      lostReason =
        reason.trim() ||
        "Neden belirtilmedi";
    }

    const now =
      new Date()
        .toISOString();

    await updateRequest(
      request,
      {
        status,
        status_changed_at:
          now,
        lost_reason:
          status ===
          "lost"
            ? lostReason
            : null,
        follow_up_at:
          [
            "won",
            "lost",
            "archived",
          ].includes(
            status,
          )
            ? null
            : request.follow_up_at,
      },
      `${request.customer_name}: ${requestStatusLabel(
        status,
      )}`,
      `Durum değişti: ${requestStatusLabel(
        status,
      )}${
        status ===
          "lost" &&
        lostReason
          ? ` · ${lostReason}`
          : ""
      }`,
    );
  }

  async function markContacted(
    request:
      CustomerRequest,
  ) {
    const now =
      new Date()
        .toISOString();

    await updateRequest(
      request,
      {
        status:
          request.status ===
          "new"
            ? "contacted"
            : request.status,
        last_contact_at:
          now,
        status_changed_at:
          request.status ===
          "new"
            ? now
            : request.status_changed_at,
      },
      `${request.customer_name} görüşüldü olarak işlendi.`,
      "Müşteriyle görüşüldü.",
    );
  }

  async function setFollowUp(
    request:
      CustomerRequest,
    value:
      string |
      null,
    label: string,
  ) {
    await updateRequest(
      request,
      {
        follow_up_at:
          value,
      },
      `${request.customer_name}: ${label}`,
      `Takip planı: ${label}`,
    );
  }

  async function changePriority(
    request:
      CustomerRequest,
    priority:
      CustomerRequestPriority,
  ) {
    await updateRequest(
      request,
      {
        priority,
      },
      `${request.customer_name}: öncelik ${requestPriorityLabel(
        priority,
      )}`,
    );
  }

  async function addQuickNote(
    request:
      CustomerRequest,
  ) {
    const note =
      window.prompt(
        `${request.customer_name} için görüşme notu:`,
      );

    if (
      !note ||
      note.trim()
        .length < 2
    ) {
      return;
    }

    setBusyId(
      request.id,
    );

    const supabase =
      createClient();

    const {
      error,
    } = await supabase
      .from(
        "customer_request_notes",
      )
      .insert({
        request_id:
          request.id,
        note:
          note.trim(),
        created_by:
          userId,
      });

    if (error) {
      setMessage(
        `Not eklenemedi: ${error.message}`,
      );
    } else {
      setMessage(
        `${request.customer_name} için not eklendi.`,
      );
    }

    setBusyId(null);
  }

  const filters: Array<{
    value: FocusFilter;
    label: string;
    count?: number;
  }> = [
    {
      value: "today",
      label: "Bugün",
      count:
        metrics.today,
    },
    {
      value: "overdue",
      label: "Geciken",
      count:
        metrics.overdue,
    },
    {
      value: "new",
      label: "Yeni",
      count:
        metrics.new,
    },
    {
      value:
        "presentation_sent",
      label: "Sunum",
      count:
        metrics.presentation,
    },
    {
      value: "viewing",
      label: "Gösterim",
      count:
        metrics.viewing,
    },
    {
      value: "negotiation",
      label: "Pazarlık",
      count:
        metrics.negotiation,
    },
    {
      value: "waiting",
      label: "Dönüş",
    },
    {
      value: "unplanned",
      label: "Plansız",
    },
    {
      value: "all",
      label: "Tümü",
      count:
        activeRows.length,
    },
  ];

  return (
    <main className="ap-admin-page ap-follow-center">
      <section className="ap-follow-hero ap-glass">
        <div>
          <p className="ap-kicker">
            GÜNLÜK SATIŞ AKIŞI
          </p>

          <h1>
            Günlük Takip Merkezi
          </h1>

          <p>
            Aranacak müşterileri, geciken
            görüşmeleri ve satış aşamalarını
            tek ekranda yönetin.
          </p>
        </div>

        <div className="ap-follow-hero-actions">
          <Link
            href="/yonetim/talepler"
            className="ap-primary-button"
          >
            + Yeni Talep
          </Link>

          <Link
            href="/yonetim/sunumlar"
            className="ap-soft-button"
          >
            Sunumlar
          </Link>
        </div>
      </section>

      {message ? (
        <div className="ap-follow-message">
          {message}
        </div>
      ) : null}

      {setupError ? (
        <section className="ap-follow-warning ap-glass">
          <strong>
            Takip kurulumu tamamlanmalı
          </strong>

          <p>
            SQL-TAKIP-KOPYALA.bat dosyasını
            çalıştırın, Supabase SQL Editor’a
            yapıştırın ve Run’a basın.
          </p>
        </section>
      ) : null}

      <section className="ap-follow-metrics">
        <button
          type="button"
          className="ap-follow-metric is-today"
          onClick={() =>
            setFocus(
              "today",
            )
          }
        >
          <span>Bugün aranacak</span>
          <strong>
            {metrics.today}
          </strong>
          <small>
            Günün odak listesi
          </small>
        </button>

        <button
          type="button"
          className="ap-follow-metric is-overdue"
          onClick={() =>
            setFocus(
              "overdue",
            )
          }
        >
          <span>Geciken takip</span>
          <strong>
            {metrics.overdue}
          </strong>
          <small>
            Öncelikli dönüş
          </small>
        </button>

        <button
          type="button"
          className="ap-follow-metric"
          onClick={() =>
            setFocus(
              "presentation_sent",
            )
          }
        >
          <span>Sunum gönderildi</span>
          <strong>
            {metrics.presentation}
          </strong>
          <small>
            Dönüş bekleniyor
          </small>
        </button>

        <button
          type="button"
          className="ap-follow-metric"
          onClick={() =>
            setFocus(
              "viewing",
            )
          }
        >
          <span>Daire gösterimi</span>
          <strong>
            {metrics.viewing}
          </strong>
          <small>
            Planlanan müşteri
          </small>
        </button>

        <button
          type="button"
          className="ap-follow-metric is-negotiation"
          onClick={() =>
            setFocus(
              "negotiation",
            )
          }
        >
          <span>Pazarlık</span>
          <strong>
            {metrics.negotiation}
          </strong>
          <small>
            Sıcak müşteri
          </small>
        </button>

        <div className="ap-follow-metric is-won">
          <span>Toplam satış</span>
          <strong>
            {metrics.won}
          </strong>
          <small>
            Tamamlanan süreç
          </small>
        </div>
      </section>

      <section className="ap-follow-board ap-glass">
        <div className="ap-follow-board-head">
          <div>
            <p className="ap-kicker">
              ODAK LİSTESİ
            </p>

            <h2>
              {filters.find(
                (item) =>
                  item.value ===
                  focus,
              )?.label ??
                "Müşteriler"}
            </h2>
          </div>

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
        </div>

        <div className="ap-follow-filter-row">
          {filters.map(
            (item) => (
              <button
                type="button"
                key={
                  item.value
                }
                className={
                  focus ===
                  item.value
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  setFocus(
                    item.value,
                  )
                }
              >
                <span>
                  {item.label}
                </span>

                {typeof item.count ===
                "number" ? (
                  <b>
                    {item.count}
                  </b>
                ) : null}
              </button>
            ),
          )}
        </div>

        {filteredRows.length ===
        0 ? (
          <div className="ap-follow-empty">
            <strong>
              Bu bölümde müşteri yok
            </strong>

            <p>
              Farklı filtreyi seçin veya
              müşteri için takip tarihi
              planlayın.
            </p>
          </div>
        ) : (
          <div className="ap-follow-list">
            {filteredRows.map(
              (request) => {
                const overdue =
                  isOverdue(
                    request,
                  );

                const busy =
                  busyId ===
                  request.id;

                const priority =
                  normalizedPriority(
                    request.priority,
                  );

                return (
                  <article
                    key={
                      request.id
                    }
                    className={`ap-follow-card priority-${priority}${
                      overdue
                        ? " is-overdue"
                        : ""
                    }`}
                  >
                    <div className="ap-follow-card-main">
                      <div className="ap-follow-card-person">
                        <div className="ap-follow-avatar">
                          {request.customer_name
                            .trim()
                            .charAt(0)
                            .toLocaleUpperCase(
                              "tr-TR",
                            ) ||
                            "M"}
                        </div>

                        <div>
                          <div className="ap-follow-name-row">
                            <strong>
                              {
                                request.customer_name
                              }
                            </strong>

                            <span
                              className={`ap-follow-priority priority-${priority}`}
                            >
                              {requestPriorityLabel(
                                priority,
                              )}
                            </span>

                            {overdue ? (
                              <span className="ap-follow-overdue">
                                Gecikti
                              </span>
                            ) : null}
                          </div>

                          <span>
                            {request.phone ||
                              "Telefon girilmedi"}
                          </span>
                        </div>
                      </div>

                      <p className="ap-follow-summary">
                        {compactRequestSummary(
                          request,
                        )}
                      </p>

                      <div className="ap-follow-meta-row">
                        <div>
                          <span>
                            Takip zamanı
                          </span>

                          <strong>
                            {shortDateTimeLabel(
                              request.follow_up_at,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Son görüşme
                          </span>

                          <strong>
                            {request.last_contact_at
                              ? shortDateTimeLabel(
                                  request.last_contact_at,
                                )
                              : "Henüz yok"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Aşama
                          </span>

                          <strong>
                            {requestStatusLabel(
                              request.status,
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="ap-follow-card-controls">
                      <div className="ap-follow-select-row">
                        <label>
                          <span>
                            Satış aşaması
                          </span>

                          <select
                            value={
                              request.status
                            }
                            disabled={
                              busy
                            }
                            onChange={(
                              event,
                            ) =>
                              changeStatus(
                                request,
                                event.target
                                  .value as CustomerRequestStatus,
                              )
                            }
                          >
                            {REQUEST_STATUS_OPTIONS.map(
                              (
                                item,
                              ) => (
                                <option
                                  key={
                                    item.value
                                  }
                                  value={
                                    item.value
                                  }
                                >
                                  {
                                    item.label
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        <label>
                          <span>
                            Öncelik
                          </span>

                          <select
                            value={
                              priority
                            }
                            disabled={
                              busy
                            }
                            onChange={(
                              event,
                            ) =>
                              changePriority(
                                request,
                                event.target
                                  .value as CustomerRequestPriority,
                              )
                            }
                          >
                            {REQUEST_PRIORITY_OPTIONS.map(
                              (
                                item,
                              ) => (
                                <option
                                  key={
                                    item.value
                                  }
                                  value={
                                    item.value
                                  }
                                >
                                  {
                                    item.label
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      </div>

                      <div className="ap-follow-plan-row">
                        <span>
                          Sonraki takip
                        </span>

                        <div>
                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              setFollowUp(
                                request,
                                followUpIso(
                                  0,
                                  17,
                                ),
                                "Bugün 17:00",
                              )
                            }
                          >
                            Bugün
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              setFollowUp(
                                request,
                                followUpIso(
                                  1,
                                  10,
                                ),
                                "Yarın 10:00",
                              )
                            }
                          >
                            Yarın
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              setFollowUp(
                                request,
                                followUpIso(
                                  3,
                                  10,
                                ),
                                "3 gün sonra",
                              )
                            }
                          >
                            +3 Gün
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              setFollowUp(
                                request,
                                null,
                                "Takip kaldırıldı",
                              )
                            }
                          >
                            Temizle
                          </button>
                        </div>
                      </div>

                      <div className="ap-follow-action-row">
                        <Link
                          href={`/yonetim/talepler/${request.id}`}
                          className="ap-primary-button"
                        >
                          Talebi Aç
                        </Link>

                        <button
                          type="button"
                          className="ap-soft-button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            markContacted(
                              request,
                            )
                          }
                        >
                          Görüşüldü
                        </button>

                        <button
                          type="button"
                          className="ap-soft-button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            addQuickNote(
                              request,
                            )
                          }
                        >
                          Not Ekle
                        </button>

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
                              href={whatsappHref(
                                request.phone,
                                request.customer_name,
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

                      <small className="ap-follow-full-date">
                        {dateTimeLabel(
                          request.follow_up_at,
                        )}
                      </small>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}
