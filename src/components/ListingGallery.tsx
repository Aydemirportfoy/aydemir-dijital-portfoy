"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type GalleryMode = "photo" | "video";

export default function ListingGallery({
  images,
  title,
  videoUrl,
  initialMode = "photo",
}: {
  images: string[];
  title: string;
  videoUrl?: string | null;
  initialMode?: GalleryMode;
}) {
  const cleanImages = useMemo(
    () => images.filter(Boolean),
    [images],
  );

  const [active, setActive] = useState(0);
  const [mode, setMode] =
    useState<GalleryMode>(() => {
      if (
        initialMode === "video" &&
        videoUrl
      ) {
        return "video";
      }

      return cleanImages.length > 0
        ? "photo"
        : videoUrl
          ? "video"
          : "photo";
    });

  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (active >= cleanImages.length) {
      setActive(0);
    }
  }, [active, cleanImages.length]);

  useEffect(() => {
    if (
      cleanImages.length === 0 &&
      videoUrl
    ) {
      setMode("video");
    }
  }, [cleanImages.length, videoUrl]);

  if (
    cleanImages.length === 0 &&
    !videoUrl
  ) {
    return (
      <div className="ap-gallery-empty">
        Fotoğraf veya ilan klibi
        eklenmemiş
      </div>
    );
  }

  function go(next: number) {
    if (cleanImages.length === 0) {
      return;
    }

    const count = cleanImages.length;

    setMode("photo");
    setActive(
      (next + count) % count,
    );
  }

  function start(clientX: number) {
    if (mode === "video") {
      return;
    }

    startX.current = clientX;
  }

  function end(clientX: number) {
    if (
      mode === "video" ||
      startX.current === null
    ) {
      return;
    }

    const delta =
      clientX - startX.current;

    if (Math.abs(delta) > 45) {
      go(
        active +
          (delta < 0 ? 1 : -1),
      );
    }

    startX.current = null;
  }

  return (
    <section className="ap-gallery ap-glass">
      <div
        className={
          mode === "video"
            ? "ap-gallery-main ap-gallery-main-video"
            : "ap-gallery-main"
        }
        onMouseDown={(event) =>
          start(event.clientX)
        }
        onMouseUp={(event) =>
          end(event.clientX)
        }
        onMouseLeave={() => {
          startX.current = null;
        }}
        onTouchStart={(event) =>
          start(
            event.touches[0].clientX,
          )
        }
        onTouchEnd={(event) =>
          end(
            event.changedTouches[0]
              .clientX,
          )
        }
      >
        {mode === "video" &&
        videoUrl ? (
          <>
            <video
              src={videoUrl}
              poster={
                cleanImages[active]
              }
              controls
              autoPlay
              playsInline
              preload="metadata"
            />

            {cleanImages.length > 0 ? (
              <button
                type="button"
                className="ap-gallery-back-photo"
                onClick={() =>
                  setMode("photo")
                }
              >
                ← Fotoğraflara Dön
              </button>
            ) : null}
          </>
        ) : (
          <>
            <img
              src={cleanImages[active]}
              alt={
                `${title} - ` +
                `${active + 1}. fotoğraf`
              }
              draggable={false}
            />

            <span className="ap-gallery-count">
              {active + 1}/
              {cleanImages.length}
            </span>

            {videoUrl ? (
              <button
                type="button"
                className="ap-gallery-video-trigger"
                onClick={(event) => {
                  event.stopPropagation();
                  setMode("video");
                }}
              >
                <span>▶</span>
                İlan Klibi
              </button>
            ) : null}

            {cleanImages.length > 1 ? (
              <>
                <button
                  type="button"
                  className="ap-gallery-arrow left"
                  onClick={() =>
                    go(active - 1)
                  }
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="ap-gallery-arrow right"
                  onClick={() =>
                    go(active + 1)
                  }
                >
                  ›
                </button>
              </>
            ) : null}
          </>
        )}
      </div>

      {(cleanImages.length > 1 ||
        videoUrl) ? (
        <div className="ap-gallery-thumbs">
          {videoUrl ? (
            <button
              type="button"
              className={
                mode === "video"
                  ? "ap-gallery-video-thumb is-active"
                  : "ap-gallery-video-thumb"
              }
              onClick={() =>
                setMode("video")
              }
              aria-label="İlan klibini göster"
            >
              <span>▶</span>
              <small>Klip</small>
            </button>
          ) : null}

          {cleanImages.map(
            (image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={
                  mode === "photo" &&
                  index === active
                    ? "is-active"
                    : ""
                }
                onClick={() => {
                  setActive(index);
                  setMode("photo");
                }}
                aria-label={
                  `${index + 1}. ` +
                  "fotoğrafı göster"
                }
              >
                <img
                  src={image}
                  alt=""
                  draggable={false}
                />
              </button>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}
