"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Presentation } from "@/lib/types";

type Row = Presentation & { listingCount: number };

export default function PresentationsManager({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState("");

  function publicUrl(slug: string) {
    return `${window.location.origin}/sunum/${slug}`;
  }

  async function copy(slug: string) {
    await navigator.clipboard.writeText(publicUrl(slug));
    setMessage("Sunum linki kopyalandı.");
  }

  function whatsapp(row: Row) {
    const text = encodeURIComponent(
      `Merhaba ${row.customer_name}, sizin için hazırladığımız özel portföy sunumunu aşağıdaki bağlantıdan inceleyebilirsiniz:

${publicUrl(row.slug)}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function toggle(row: Row) {
    setWorking(row.id);
    const next = row.status === "active" ? "archived" : "active";
    const supabase = createClient();
    const { error } = await supabase.from("presentations").update({ status: next }).eq("id", row.id);

    if (error) {
      setMessage(`Durum değiştirilemedi: ${error.message}`);
    } else {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: next } : item)));
    }

    setWorking("");
  }

  async function remove(row: Row) {
    if (!window.confirm(`${row.customer_name} sunumunu kalıcı olarak silmek istiyor musunuz?`)) return;
    setWorking(row.id);
    const supabase = createClient();
    const { error } = await supabase.from("presentations").delete().eq("id", row.id);

    if (error) {
      setMessage(`Sunum silinemedi: ${error.message}`);
    } else {
      setRows((current) => current.filter((item) => item.id !== row.id));
    }

    setWorking("");
  }

  return (
    <div className="ap-admin-page">
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">ÖZEL PORTFÖY PAYLAŞIMI</p>
          <h1>Müşteri Sunumları</h1>
          <p className="ap-muted">Müşteriye özel linkler oluşturun ve WhatsApp’tan paylaşın.</p>
        </div>
        <Link href="/yonetim/sunumlar/yeni" className="ap-primary-button">+ Yeni Sunum</Link>
      </section>

      {message ? <div className="ap-form-message success">{message}</div> : null}

      {rows.length === 0 ? (
        <div className="ap-empty-state ap-glass">
          <h2>Henüz sunum yok</h2>
          <p>İlk müşteri sunumunuzu oluşturun.</p>
        </div>
      ) : (
        <section className="ap-presentation-list">
          {rows.map((row) => (
            <article className="ap-presentation-row ap-glass" key={row.id}>
              <div>
                <p className="ap-kicker">{formatDate(row.created_at)}</p>
                <h2>{row.customer_name}</h2>
                <p className="ap-muted">{row.title || "Özel Gayrimenkul Sunumu"}</p>
                <div className="ap-pill-row">
                  <span className="ap-pill">{row.listingCount} ilan</span>
                  <span className={`ap-status ${row.status === "active" ? "ap-status-active" : "ap-status-draft"}`}>
                    {row.status === "active" ? "Aktif" : "Arşivde"}
                  </span>
                </div>
              </div>

              <div className="ap-presentation-actions">
                <a href={`/sunum/${row.slug}`} target="_blank" rel="noreferrer" className="ap-primary-button small">
                  Aç
                </a>
                <button type="button" className="ap-soft-button" onClick={() => copy(row.slug)}>
                  Linki Kopyala
                </button>
                <button type="button" className="ap-success-button" onClick={() => whatsapp(row)}>
                  WhatsApp
                </button>
                <button type="button" className="ap-soft-button" disabled={working === row.id} onClick={() => toggle(row)}>
                  {row.status === "active" ? "Arşivle" : "Yayınla"}
                </button>
                <button type="button" className="ap-danger-button" disabled={working === row.id} onClick={() => remove(row)}>
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
