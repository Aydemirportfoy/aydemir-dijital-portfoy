"use client";

import {
  CSSProperties,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type GalleryMode =
  | "photo"
  | "video";

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
    () =>
      Array.from(
        new Set(
          images.filter(Boolean),
        ),
      ),
    [images],
  );

  const [active, setActive] =
    useState(0);
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

  const [dragX, setDragX] =
    useState(0);
  const [dragging, setDragging] =
    useState(false);

  const viewportRef =
    useRef<HTMLDivElement>(null);
  const startXRef =
    useRef(0);
  const startTimeRef =
    useRef(0);
  const suppressClickRef =
    useRef(false);

  useEffect(() => {
    if (
      active >=
      cleanImages.length
    ) {
      setActive(0);
    }
  }, [
    active,
    cleanImages.length,
  ]);

  useEffect(() => {
    if (
      cleanImages.length === 0 &&
      videoUrl
    ) {
      setMode("video");
    }
  }, [
    cleanImages.length,
    videoUrl,
  ]);

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

  const lastIndex =
    Math.max(
      cleanImages.length - 1,
      0,
    );

  function clampIndex(
    value: number,
  ) {
    return Math.min(
      Math.max(value, 0),
      lastIndex,
    );
  }

  function moveTo(
    nextIndex: number,
  ) {
    if (
      cleanImages.length === 0
    ) {
      return;
    }

    setMode("photo");
    setActive(
      clampIndex(nextIndex),
    );
    setDragX(0);
    setDragging(false);
  }

  function handlePointerDown(
    event:
      PointerEvent<HTMLDivElement>,
  ) {
    if (
      mode === "video" ||
      cleanImages.length < 2
    ) {
      return;
    }

    startXRef.current =
      event.clientX;
    startTimeRef.current =
      performance.now();
    suppressClickRef.current =
      false;

    setDragging(true);
    setDragX(0);

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      );
  }

  function handlePointerMove(
    event:
      PointerEvent<HTMLDivElement>,
  ) {
    if (
      !dragging ||
      mode === "video"
    ) {
      return;
    }

    const nextDrag =
      event.clientX -
      startXRef.current;

    if (
      Math.abs(nextDrag) > 7
    ) {
      suppressClickRef.current =
        true;
    }

    const atFirst =
      active === 0 &&
      nextDrag > 0;

    const atLast =
      active === lastIndex &&
      nextDrag < 0;

    setDragX(
      nextDrag *
        (
          atFirst || atLast
            ? 0.28
            : 1
        ),
    );
  }

  function finishDrag(
    event:
      | PointerEvent<HTMLDivElement>
      | null,
  ) {
    if (!dragging) {
      return;
    }

    if (
      event &&
      event.currentTarget
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId,
        );
    }

    const width =
      viewportRef.current
        ?.clientWidth || 320;

    const elapsed =
      Math.max(
        performance.now() -
          startTimeRef.current,
        1,
      );

    const velocity =
      dragX / elapsed;

    const distanceEnough =
      Math.abs(dragX) >
      Math.min(
        width * 0.16,
        64,
      );

    const velocityEnough =
      Math.abs(velocity) >
      0.4;

    if (
      distanceEnough ||
      velocityEnough
    ) {
      moveTo(
        active +
          (
            dragX < 0
              ? 1
              : -1
          ),
      );
    } else {
      setDragX(0);
      setDragging(false);
    }
  }

  const galleryWidth =
    viewportRef.current
      ?.clientWidth || 320;

  const progress =
    dragging
      ? Math.min(
          Math.abs(dragX) /
            galleryWidth,
          1,
        )
      : 0;

  const targetIndex =
    active +
    (
      dragX < 0
        ? 1
        : -1
    );

  const trackStyle = {
    "--ap-detail-index":
      active,
    "--ap-detail-drag":
      `${dragX}px`,
  } as CSSProperties;

  return (
    <section className="ap-gallery ap-glass ap-detail-gallery-premium">
      <div
        className={
          `ap-gallery-main ${
            mode === "video"
              ? "ap-gallery-main-video"
              : ""
          } ${
            dragging
              ? "is-dragging"
              : ""
          }`
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
            <div
              ref={viewportRef}
              className="ap-detail-gallery-viewport"
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                finishDrag
              }
              onPointerCancel={
                finishDrag
              }
              onClickCapture={(
                event,
              ) => {
                if (
                  suppressClickRef.current
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  suppressClickRef.current =
                    false;
                }
              }}
            >
              <div
                className="ap-detail-gallery-track"
                style={trackStyle}
              >
                {cleanImages.map(
                  (
                    image,
                    index,
                  ) => {
                    let scale =
                      0.98;
                    let opacity =
                      0.9;

                    if (
                      index === active
                    ) {
                      scale =
                        1 -
                        progress *
                          0.02;
                      opacity =
                        1 -
                        progress *
                          0.08;
                    } else if (
                      index ===
                        targetIndex &&
                      progress > 0
                    ) {
                      scale =
                        0.98 +
                        progress *
                          0.02;
                      opacity =
                        0.9 +
                        progress *
                          0.1;
                    }

                    const slideStyle = {
                      "--ap-detail-scale":
                        scale,
                      "--ap-detail-opacity":
                        opacity,
                    } as CSSProperties;

                    return (
                      <div
                        className={
                          `ap-detail-gallery-slide ${
                            index ===
                            active
                              ? "is-active"
                              : ""
                          }`
                        }
                        style={
                          slideStyle
                        }
                        key={`${image}-${index}`}
                      >
                        <div className="ap-detail-gallery-slide-inner">
                          <img
                            src={image}
                            alt={
                              `${title} - ` +
                              `${index + 1}. fotoğraf`
                            }
                            draggable={
                              false
                            }
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <span className="ap-gallery-count">
              {active + 1}/
              {cleanImages.length}
            </span>

            {videoUrl ? (
              <button
                type="button"
                className="ap-gallery-video-trigger"
                onClick={(
                  event,
                ) => {
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
                    moveTo(
                      active - 1,
                    )
                  }
                  disabled={
                    active === 0
                  }
                  aria-label="Önceki fotoğraf"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="ap-gallery-arrow right"
                  onClick={() =>
                    moveTo(
                      active + 1,
                    )
                  }
                  disabled={
                    active ===
                    lastIndex
                  }
                  aria-label="Sonraki fotoğraf"
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
                onClick={() =>
                  moveTo(index)
                }
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
