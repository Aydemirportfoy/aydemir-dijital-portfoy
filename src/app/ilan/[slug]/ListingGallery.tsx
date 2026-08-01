"use client";

import { useEffect, useRef, useState } from "react";

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_cover: boolean;
};

type ListingGalleryProps = {
  images: GalleryImage[];
  title: string;
  commissionFree: boolean;
};

export default function ListingGallery({
  images,
  title,
  commissionFree,
}: ListingGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const thumbnailStrip = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs =
    useRef<Array<HTMLButtonElement | null>>([]);

  const imageCount = images.length;

  function showImage(index: number) {
    if (imageCount === 0) return;

    const normalized =
      ((index % imageCount) + imageCount) % imageCount;

    setCurrentIndex(normalized);
  }

  function previousImage() {
    showImage(currentIndex - 1);
  }

  function nextImage() {
    showImage(currentIndex + 1);
  }

  function handleTouchStart(
    event: React.TouchEvent<HTMLDivElement>,
  ) {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(
    event: React.TouchEvent<HTMLDivElement>,
  ) {
    if (touchStartX.current === null) return;

    const endX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;

    const difference =
      touchStartX.current - endX;

    if (Math.abs(difference) > 45) {
      difference > 0
        ? nextImage()
        : previousImage();
    }

    touchStartX.current = null;
  }

  useEffect(() => {
    const strip = thumbnailStrip.current;
    const active =
      thumbnailRefs.current[currentIndex];

    if (!strip || !active) return;

    const targetLeft =
      active.offsetLeft -
      (strip.clientWidth - active.clientWidth) / 2;

    strip.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [currentIndex]);

  if (imageCount === 0) {
    return (
      <div className="mx-auto flex aspect-[4/3] w-full max-w-[720px] items-center justify-center rounded-[24px] bg-[#2A2A2A]/5 text-[#2A2A2A]/45">
        İlan fotoğrafı bulunmuyor
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <section className="mx-auto w-full max-w-[720px]">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#EFECE7] shadow-[0_18px_50px_rgba(42,42,42,0.12)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <img
          src={currentImage.image_url}
          alt={
            currentImage.alt_text ??
            `${title} fotoğrafı ${currentIndex + 1}`
          }
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />

        {commissionFree && currentIndex === 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#F6A04D] px-3 py-1.5 text-xs font-semibold text-[#2A2A2A] shadow-[0_10px_25px_rgba(42,42,42,0.18)] sm:left-4 sm:top-4 sm:px-4 sm:py-2 sm:text-sm">
            Komisyonsuz Firma Satışı
          </span>
        ) : null}

        {imageCount > 1 ? (
          <>
            <button
              type="button"
              onClick={previousImage}
              aria-label="Önceki fotoğraf"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#2A2A2A] shadow-[0_10px_28px_rgba(42,42,42,0.18)]"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Sonraki fotoğraf"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-[#2A2A2A] shadow-[0_10px_28px_rgba(42,42,42,0.18)]"
            >
              ›
            </button>

            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2A2A2A] shadow-[0_8px_20px_rgba(42,42,42,0.14)] sm:right-4 sm:top-4 sm:text-sm">
              {currentIndex + 1}/{imageCount}
            </span>
          </>
        ) : null}
      </div>

      {imageCount > 1 ? (
        <div
          ref={thumbnailStrip}
          className="mt-4 flex gap-2.5 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            overscrollBehaviorInline: "contain",
          }}
        >
          {images.map((image, index) => {
            const isActive =
              index === currentIndex;

            return (
              <button
                key={image.id}
                ref={(element) => {
                  thumbnailRefs.current[index] =
                    element;
                }}
                type="button"
                onClick={() => showImage(index)}
                aria-label={`${index + 1}. fotoğrafı aç`}
                className={`relative h-14 w-[72px] shrink-0 overflow-hidden rounded-[13px] border-2 transition-all duration-200 sm:h-16 sm:w-20 ${
                  isActive
                    ? "border-[#F6A04D] opacity-100 shadow-[0_8px_20px_rgba(246,160,77,0.20)]"
                    : "border-transparent opacity-60"
                }`}
              >
                <img
                  src={image.image_url}
                  alt=""
                  className={`h-full w-full object-cover transition ${
                    isActive
                      ? "blur-0"
                      : "scale-105 blur-[1.5px]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
