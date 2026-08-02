"use client";

import { useState } from "react";

export default function ListingVideoCard({
  url,
  poster,
  title,
}: {
  url: string;
  poster?: string | null;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <section className="ap-listing-video ap-glass">
        <div className="ap-listing-video-head">
          <div>
            <p className="ap-kicker">
              İLAN KLİBİ
            </p>
            <strong>
              {title}
            </strong>
          </div>

          <button
            type="button"
            className="ap-soft-button"
            onClick={() => setOpen(false)}
          >
            Kapat
          </button>
        </div>

        <video
          src={url}
          poster={poster ?? undefined}
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
      </section>
    );
  }

  return (
    <button
      type="button"
      className="ap-video-teaser ap-glass"
      onClick={() => setOpen(true)}
    >
      <span
        className="ap-video-teaser-image"
        style={
          poster
            ? {
                backgroundImage:
                  `linear-gradient(` +
                  `135deg, ` +
                  `rgba(20,18,16,.18), ` +
                  `rgba(20,18,16,.68)), ` +
                  `url("${poster}")`,
              }
            : undefined
        }
      >
        <i>▶</i>
      </span>

      <span className="ap-video-teaser-copy">
        <small>İLAN KLİBİ</small>
        <strong>
          Projeyi videoyla keşfedin
        </strong>
        <em>
          İzlemek için dokunun
        </em>
      </span>

      <b>↗</b>
    </button>
  );
}
