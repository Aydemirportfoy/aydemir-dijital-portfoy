"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate,
  slugify,
} from "@/lib/format";
import type {
  Presentation,
} from "@/lib/types";

type Row = Presentation & {
  listingCount: number;
};

export default function PresentationsManager({
  initialRows,
}: {
  initialRows: Row[];
}) {
  const [rows, setRows] =
    useState(initialRows);
  const [message, setMessage] =
    useState("");
  const [working, setWorking] =
    useState("");

  function publicUrl(slug: string) {
    return `${window.location.origin}/sunum/${slug}`;
  }

  async function copy(slug: string) {
    try {
      await navigator.clipboard.writeText(
        publicUrl(slug),
      );
      setMessage(
        "Sunum linki kopyalandı.",
      );
    } catch {
      setMessage(
        "Link kopyalanamadı. Tarayıcı iznini kontrol edin.",
      );
    }
  }

  function whatsapp(row: Row) {
    const text = encodeURIComponent(
      `Merhaba ${row.customer_name}, sizin için hazırladığımız özel portföy sunumunu aşağıdaki bağlantıdan inceleyebilirsiniz:\n\n${publicUrl(row.slug)}`,
    );

    window.open(
      `https://wa.me/?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function toggle(row: Row) {
    setWorking(row.id);
    setMessage("");

    const next =
      row.status === "active"
        ? "archived"
        : "active";

    const supabase = createClient();

    const { error } = await supabase
      .from("presentations")
      .update({
        status: next,
      })
      .eq("id", row.id);

    if (error) {
      setMessage(
        `Durum değiştirilemedi: ${error.message}`,
      );
    } else {
      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: next,
              }
            : item,
        ),
      );

      setMessage(
        next === "active"
          ? "Sunum yeniden yayınlandı."
          : "Sunum arşive alındı.",
      );
    }

    setWorking("");
  }

  async function duplicate(row: Row) {
    setWorking(row.id);
    setMessage("");

    const supabase = createClient();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Oturum bulunamadı. Yönetici hesabıyla yeniden giriş yapın.",
      );
      setWorking("");
      return;
    }

    const {
      data: links,
      error: linksError,
    } = await supabase
      .from("presentation_listings")
      .select("listing_id, position")
      .eq("presentation_id", row.id)
      .order("position", {
        ascending: true,
      });

    if (linksError) {
      setMessage(
        `Sunum ilanları okunamadı: ${linksError.message}`,
      );
      setWorking("");
      return;
    }

    const slug =
      `${
        slugify(row.customer_name) ||
        "musteri"
      }-${
        Math.random()
          .toString(36)
          .slice(2, 8)
      }`;

    const {
      data: created,
      error: createError,
    } = await supabase
      .from("presentations")
      .insert({
        slug,
        customer_name:
          row.customer_name,
        title: row.title
          ? `${row.title} - Kopya`
          : `${row.customer_name} için özel portföy`,
        note: row.note,
        status: "active",
        created_by: user.id,
      })
      .select("*")
      .single();

    if (
      createError ||
      !created
    ) {
      setMessage(
        `Sunum çoğaltılamadı: ${
          createError?.message ||
          "Bilinmeyen hata"
        }`,
      );
      setWorking("");
      return;
    }

    if (
      links &&
      links.length > 0
    ) {
      const {
        error: insertError,
      } = await supabase
        .from(
          "presentation_listings",
        )
        .insert(
          links.map(
            (
              link,
              position,
            ) => ({
              presentation_id:
                created.id,
              listing_id:
                link.listing_id,
              position,
            }),
          ),
        );

      if (insertError) {
        await supabase
          .from("presentations")
          .delete()
          .eq("id", created.id);

        setMessage(
          `İlanlar kopyalanamadı: ${insertError.message}`,
        );
        setWorking("");
        return;
      }
    }

    setRows((current) => [
      {
        ...(created as Presentation),
        listingCount:
          links?.length || 0,
      },
      ...current,
    ]);

    setMessage(
      "Sunum çoğaltıldı. Düzenle butonuyla müşteri ve ilanları değiştirebilirsiniz.",
    );
    setWorking("");
  }

  async function remove(row: Row) {
    const confirmed =
      window.confirm(
        `${row.customer_name} sunumunu kalıcı olarak silmek istiyor musunuz?`,
      );

    if (!confirmed) {
      return;
    }

    setWorking(row.id);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("presentations")
      .delete()
      .eq("id", row.id);

    if (error) {
      setMessage(
        `Sunum silinemedi: ${error.message}`,
      );
    } else {
      setRows((current) =>
        current.filter(
          (item) =>
            item.id !== row.id,
        ),
      );

      setMessage(
        "Sunum kalıcı olarak silindi.",
      );
    }

    setWorking("");
  }

  return (
    <div className="ap-admin-page">
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">
            ÖZEL PORTFÖY PAYLAŞIMI
          </p>

          <h1>Müşteri Sunumları</h1>

          <p className="ap-muted">
            Sunumları düzenleyin,
            çoğaltın ve müşterinizle
            paylaşın.
          </p>
        </div>

        <Link
          href="/yonetim/sunumlar/yeni"
          className="ap-primary-button"
        >
          + Yeni Sunum
        </Link>
      </section>

      {message ? (
        <div className="ap-form-message success">
          {message}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="ap-empty-state ap-glass">
          <h2>Henüz sunum yok</h2>

          <p>
            İlk müşteri sunumunuzu
            oluşturun.
          </p>
        </div>
      ) : (
        <section className="ap-presentation-list">
          {rows.map((row) => (
            <article
              className="ap-presentation-row ap-glass ap-presentation-manager-row"
              key={row.id}
            >
              <div className="ap-presentation-manager-info">
                <p className="ap-kicker">
                  {formatDate(
                    row.created_at,
                  )}
                </p>

                <h2>
                  {row.customer_name}
                </h2>

                <p className="ap-muted">
                  {row.title ||
                    "Özel Gayrimenkul Sunumu"}
                </p>

                <div className="ap-pill-row">
                  <span className="ap-pill">
                    {row.listingCount} ilan
                  </span>

                  <span
                    className={
                      `ap-status ${
                        row.status ===
                        "active"
                          ? "ap-status-active"
                          : "ap-status-draft"
                      }`
                    }
                  >
                    {row.status ===
                    "active"
                      ? "Aktif"
                      : "Arşivde"}
                  </span>
                </div>
              </div>

              <div className="ap-presentation-actions ap-presentation-manager-actions">
                <a
                  href={`/sunum/${row.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ap-primary-button small"
                >
                  Aç
                </a>

                <Link
                  href={`/yonetim/sunumlar/duzenle/${row.id}`}
                  className="ap-soft-button"
                >
                  Düzenle
                </Link>

                <button
                  type="button"
                  className="ap-soft-button"
                  onClick={() =>
                    copy(row.slug)
                  }
                >
                  Linki Kopyala
                </button>

                <button
                  type="button"
                  className="ap-success-button"
                  onClick={() =>
                    whatsapp(row)
                  }
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  className="ap-soft-button"
                  disabled={
                    working === row.id
                  }
                  onClick={() =>
                    duplicate(row)
                  }
                >
                  Çoğalt
                </button>

                <button
                  type="button"
                  className="ap-soft-button"
                  disabled={
                    working === row.id
                  }
                  onClick={() =>
                    toggle(row)
                  }
                >
                  {row.status ===
                  "active"
                    ? "Arşivle"
                    : "Yayınla"}
                </button>

                <button
                  type="button"
                  className="ap-danger-button"
                  disabled={
                    working === row.id
                  }
                  onClick={() =>
                    remove(row)
                  }
                >
                  Sil
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
