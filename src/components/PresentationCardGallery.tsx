"use client";

import {
  CSSProperties,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  createClient,
} from "@/lib/supabase/client";

type ImageRow = {
  image_url?: string | null;
  url?: string | null;
  position?: number | null;
  sort_order?: number | null;
  created_at?: string | null;
};

function uniqueUrls(
  values: Array<
    string | null | undefined
  >,
) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value),
      ),
    ),
  );
}

export default function PresentationCardGallery({
  listingId,
  title,
  coverImageUrl,
  index,
  commissionFree,
  videoUrl,
}: {
  listingId: string;
  title: string;
  coverImageUrl?: string | null;
  index: number;
  commissionFree: boolean;
  videoUrl?: string | null;
}) {
  const initialImages = useMemo(
    () =>
      uniqueUrls([
        coverImageUrl,
      ]),
    [coverImageUrl],
  );

  const [images, setImages] =
    useState<string[]>(
      initialImages,
    );
  const [activeIndex, setActiveIndex] =
    useState(0);
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
    let alive = true;

    async function loadImages() {
      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase
        .from("listing_images")
        .select("*")
        .eq(
          "listing_id",
          listingId,
        );

      if (
        !alive ||
        error ||
        !data
      ) {
        return;
      }

      const rows =
        (data as ImageRow[])
          .slice()
          .sort((a, b) => {
            const first =
              a.position ??
              a.sort_order ??
              9999;

            const second =
              b.position ??
              b.sort_order ??
              9999;

            if (first !== second) {
              return (
                first - second
              );
            }

            return String(
              a.created_at || "",
            ).localeCompare(
              String(
                b.created_at || "",
              ),
            );
          });

      const nextImages =
        uniqueUrls([
          coverImageUrl,
          ...rows.map(
            (row) =>
              row.image_url ||
              row.url,
          ),
        ]);

      if (
        nextImages.length > 0
      ) {
        setImages(nextImages);
        setActiveIndex(0);
      }
    }

    loadImages();

    return () => {
      alive = false;
    };
  }, [
    listingId,
    coverImageUrl,
  ]);

  const lastIndex =
    Math.max(
      images.length - 1,
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
    setActiveIndex(
      clampIndex(nextIndex),
    );
    setDragX(0);
    setDragging(false);
  }

  function handlePointerDown(
    event:
      PointerEvent<HTMLDivElement>,
  ) {
    if (images.length < 2) {
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
    if (!dragging) {
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
      activeIndex === 0 &&
      nextDrag > 0;

    const atLast =
      activeIndex ===
        lastIndex &&
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
        58,
      );

    const velocityEnough =
      Math.abs(velocity) >
      0.4;

    if (
      distanceEnough ||
      velocityEnough
    ) {
      moveTo(
        activeIndex +
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

  function handleClickCapture(
    event:
      React.MouseEvent<
        HTMLDivElement
      >,
  ) {
    if (
      suppressClickRef.current
    ) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current =
        false;
    }
  }

  const trackStyle = {
    "--ap-photo-index":
      activeIndex,
    "--ap-photo-drag":
      `${dragX}px`,
  } as CSSProperties;

  return (
    <div className="ap-presentation-card-media ap-presentation-photo-gallery">
      <div
        ref={viewportRef}
        className={
          `ap-presentation-photo-viewport ${
            dragging
              ? "is-dragging"
              : ""
          }`
        }
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
        onClickCapture={
          handleClickCapture
        }
      >
        {images.length > 0 ? (
          <div
            className="ap-presentation-photo-track"
            style={trackStyle}
          >
            {images.map(
              (
                image,
                imageIndex,
              ) => (
                <div
                  className={
                    `ap-presentation-photo-slide ${
                      imageIndex ===
                      activeIndex
                        ? "is-active"
                        : ""
                    }`
                  }
                  key={`${image}-${imageIndex}`}
                >
                  <img
                    src={image}
                    alt={`${title} ${imageIndex + 1}. fotoğraf`}
                    loading={
                      imageIndex === 0
                        ? "eager"
                        : "lazy"
                    }
                    draggable={false}
                  />
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="ap-image-empty">
            Kapak fotoğrafı yok
          </div>
        )}
      </div>

      <div className="ap-presentation-card-shade" />

      <span className="ap-presentation-card-number">
        {String(index + 1).padStart(
          2,
          "0",
        )}
      </span>

      {commissionFree ? (
        <span className="ap-presentation-card-commission">
          Komisyonsuz
        </span>
      ) : null}

      {videoUrl ? (
        <Link
          href={videoUrl}
          className="ap-presentation-media-video"
          aria-label={`${title} ilan klibini aç`}
        >
          <span>▶</span>
          İlan Klibi
        </Link>
      ) : null}

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="ap-presentation-photo-arrow is-prev"
            onClick={() =>
              moveTo(
                activeIndex - 1,
              )
            }
            disabled={
              activeIndex === 0
            }
            aria-label="Önceki fotoğraf"
          >
            ‹
          </button>

          <button
            type="button"
            className="ap-presentation-photo-arrow is-next"
            onClick={() =>
              moveTo(
                activeIndex + 1,
              )
            }
            disabled={
              activeIndex ===
              lastIndex
            }
            aria-label="Sonraki fotoğraf"
          >
            ›
          </button>

          <div className="ap-presentation-photo-count">
            {activeIndex + 1}
            <span>/</span>
            {images.length}
          </div>

          <div className="ap-presentation-photo-dots">
            {images
              .slice(0, 7)
              .map(
                (
                  image,
                  dotIndex,
                ) => (
                  <button
                    type="button"
                    key={`${image}-dot`}
                    className={
                      dotIndex ===
                      activeIndex
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      moveTo(
                        dotIndex,
                      )
                    }
                    aria-label={`${dotIndex + 1}. fotoğrafa git`}
                  />
                ),
              )}
          </div>
        </>
      ) : null}
    </div>
  );
}
