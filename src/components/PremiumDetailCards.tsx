"use client";

import { useState } from "react";
import CollapsibleDescription from "@/components/CollapsibleDescription";

type Tab = "description" | "features" | "location";

export default function PremiumDetailCards({
  description,
  features,
  neighborhood,
  district,
  city,
  facade,
}: {
  description?: string | null;
  features: string[];
  neighborhood: string;
  district: string;
  city: string;
  facade?: string | null;
}) {
  const publicMapUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      `${neighborhood}, ${district}, ${city}`,
    );
  const [activeTab, setActiveTab] =
    useState<Tab>("description");

  return (
    <section className="ap-detail-info-wrap">
      <div className="ap-mobile-detail-tabs">
        <button
          type="button"
          className={
            activeTab === "description"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setActiveTab("description")
          }
        >
          Açıklama
        </button>

        <button
          type="button"
          className={
            activeTab === "features"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setActiveTab("features")
          }
        >
          Özellikler
        </button>

        <button
          type="button"
          className={
            activeTab === "location"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setActiveTab("location")
          }
        >
          Konum
        </button>
      </div>

      <div className="ap-premium-detail-cards">
        <article
          className={
            `ap-premium-info-card ap-glass ` +
            (activeTab === "description"
              ? "is-active"
              : "")
          }
        >
          <p className="ap-kicker">
            İLAN DETAYLARI
          </p>

          <h2>Açıklama</h2>

          {description ? (
            <CollapsibleDescription
              text={description}
            />
          ) : (
            <p className="ap-muted">
              Bu ilan için henüz açıklama
              eklenmemiş.
            </p>
          )}
        </article>

        <article
          className={
            `ap-premium-info-card ap-glass ` +
            (activeTab === "features"
              ? "is-active"
              : "")
          }
        >
          <p className="ap-kicker">
            ÖNE ÇIKANLAR
          </p>

          <h2>Özellikler</h2>

          {facade ? (
            <div className="ap-facade-highlight">
              <span>Cephe</span>
              <strong>{facade}</strong>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div className="ap-premium-feature-grid">
              {features.map((feature) => (
                <div
                  className="ap-premium-feature"
                  key={feature}
                >
                  <span>✓</span>
                  {feature}
                </div>
              ))}
            </div>
          ) : (
            <p className="ap-muted">
              Özellik bilgisi bulunmuyor.
            </p>
          )}
        </article>

        <article
          className={
            `ap-premium-info-card ap-glass ap-premium-location-card ` +
            (activeTab === "location"
              ? "is-active"
              : "")
          }
        >
          <p className="ap-kicker">
            BÖLGE VE SATIŞ
          </p>

          <h2>Konum</h2>

          <div className="ap-location-stack">
            <div>
              <span>Mahalle</span>
              <strong>{neighborhood}</strong>
            </div>

            <div>
              <span>İlçe</span>
              <strong>{district}</strong>
            </div>

            <div>
              <span>Şehir</span>
              <strong>{city}</strong>
            </div>
          </div>

          <p className="ap-public-location-note">
            Güvenlik nedeniyle dairenin tam konumu
            paylaşılmaz. Haritada yalnızca bağlı
            olduğu mahalle gösterilir.
          </p>

          <a
            href={publicMapUrl}
            target="_blank"
            rel="noreferrer"
            className="ap-public-map-button"
          >
            Mahalle Konumunu Aç
            <span>↗</span>
          </a>
        </article>
      </div>
    </section>
  );
}
