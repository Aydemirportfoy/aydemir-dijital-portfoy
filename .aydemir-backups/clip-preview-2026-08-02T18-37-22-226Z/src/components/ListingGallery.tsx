"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function ListingGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const cleanImages = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (active >= cleanImages.length) setActive(0);
  }, [active, cleanImages.length]);

  if (cleanImages.length === 0) {
    return <div className="ap-gallery-empty">Fotoğraf eklenmemiş</div>;
  }

  function go(next: number) {
    const count = cleanImages.length;
    setActive((next + count) % count);
  }

  function start(clientX: number) {
    startX.current = clientX;
  }

  function end(clientX: number) {
    if (startX.current === null) return;
    const delta = clientX - startX.current;
    if (Math.abs(delta) > 45) {
      go(active + (delta < 0 ? 1 : -1));
    }
    startX.current = null;
  }

  return (
    <section className="ap-gallery ap-glass">
      <div
        className="ap-gallery-main"
        onMouseDown={(event) => start(event.clientX)}
        onMouseUp={(event) => end(event.clientX)}
        onMouseLeave={() => {
          startX.current = null;
        }}
        onTouchStart={(event) => start(event.touches[0].clientX)}
        onTouchEnd={(event) => end(event.changedTouches[0].clientX)}
      >
        <img
          src={cleanImages[active]}
          alt={`${title} - ${active + 1}. fotoğraf`}
          draggable={false}
        />

        <span className="ap-gallery-count">
          {active + 1}/{cleanImages.length}
        </span>

        {cleanImages.length > 1 ? (
          <>
            <button type="button" className="ap-gallery-arrow left" onClick={() => go(active - 1)}>
              ‹
            </button>
            <button type="button" className="ap-gallery-arrow right" onClick={() => go(active + 1)}>
              ›
            </button>
          </>
        ) : null}
      </div>

      {cleanImages.length > 1 ? (
        <div className="ap-gallery-thumbs">
          {cleanImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              className={index === active ? "is-active" : ""}
              onClick={() => setActive(index)}
              aria-label={`${index + 1}. fotoğrafı göster`}
            >
              <img src={image} alt="" draggable={false} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
