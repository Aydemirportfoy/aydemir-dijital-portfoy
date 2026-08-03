"use client";

import {
  CSSProperties,
  PointerEvent,
  useRef,
  useState,
} from "react";
import type {
  Listing,
} from "@/lib/types";
import PresentationListingCard from "@/components/PresentationListingCard";

export default function PresentationSwipeDeck({
  listings,
}: {
  listings: Listing[];
}) {
  const [activeIndex, setActiveIndex] =
    useState(0);
  const [dragX, setDragX] =
    useState(0);
  const [dragging, setDragging] =
    useState(false);

  const deckRef =
    useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const movedRef = useRef(false);
  const suppressClickRef =
    useRef(false);

  const lastIndex =
    Math.max(
      listings.length - 1,
      0,
    );

  function clampIndex(value: number) {
    return Math.min(
      Math.max(value, 0),
      lastIndex,
    );
  }

  function moveTo(index: number) {
    setActiveIndex(
      clampIndex(index),
    );
    setDragX(0);
    setDragging(false);
  }

  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (listings.length < 2) {
      return;
    }

    startXRef.current =
      event.clientX;
    startTimeRef.current =
      performance.now();
    movedRef.current = false;
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
    event: PointerEvent<HTMLDivElement>,
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
      movedRef.current = true;
      suppressClickRef.current =
        true;
    }

    const atFirst =
      activeIndex === 0 &&
      nextDrag > 0;

    const atLast =
      activeIndex === lastIndex &&
      nextDrag < 0;

    const resistance =
      atFirst || atLast
        ? 0.28
        : 1;

    setDragX(
      nextDrag * resistance,
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
      deckRef.current
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
        width * 0.17,
        64,
      );

    const velocityEnough =
      Math.abs(velocity) > 0.42;

    if (
      distanceEnough ||
      velocityEnough
    ) {
      moveTo(
        activeIndex +
          (dragX < 0 ? 1 : -1),
      );
    } else {
      setDragX(0);
      setDragging(false);
    }
  }

  function handleClickCapture(
    event: React.MouseEvent<
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
    "--ap-deck-offset":
      `${activeIndex * -100}%`,
    "--ap-swipe-x":
      `${dragX}px`,
  } as CSSProperties;

  const deckWidth =
    deckRef.current
      ?.clientWidth || 320;

  const progress =
    dragging
      ? Math.min(
          Math.abs(dragX) /
            deckWidth,
          1,
        )
      : 0;

  const targetIndex =
    activeIndex +
    (dragX < 0 ? 1 : -1);

  return (
    <section
      className="ap-presentation-swipe"
      aria-label="Portföy kartları"
    >
      <div className="ap-presentation-swipe-head">
        <span>
          Kaydırarak inceleyin
        </span>

        <strong>
          {activeIndex + 1} /{" "}
          {listings.length}
        </strong>
      </div>

      <div
        ref={deckRef}
        className={
          `ap-presentation-swipe-viewport ${
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
        <div
          className="ap-presentation-swipe-track"
          style={trackStyle}
        >
          {listings.map(
            (listing, index) => {
              let scale = 0.98;
              let opacity = 0.9;

              if (
                index === activeIndex
              ) {
                scale =
                  1 -
                  progress * 0.02;
                opacity =
                  1 -
                  progress * 0.08;
              } else if (
                index === targetIndex &&
                progress > 0
              ) {
                scale =
                  0.98 +
                  progress * 0.02;
                opacity =
                  0.9 +
                  progress * 0.1;
              }

              const slideStyle = {
                "--ap-slide-scale":
                  scale,
                "--ap-slide-opacity":
                  opacity,
              } as CSSProperties;

              return (
                <div
                  key={listing.id}
                  className={
                    `ap-presentation-swipe-slide ${
                      index ===
                      activeIndex
                        ? "is-active"
                        : ""
                    }`
                  }
                  style={
                    slideStyle
                  }
                  aria-hidden={
                    index !==
                    activeIndex
                  }
                >
                  <PresentationListingCard
                    listing={
                      listing
                    }
                    index={index}
                  />
                </div>
              );
            },
          )}
        </div>
      </div>

      {listings.length > 1 ? (
        <div className="ap-presentation-swipe-controls">
          <button
            type="button"
            onClick={() =>
              moveTo(
                activeIndex - 1,
              )
            }
            disabled={
              activeIndex === 0
            }
            aria-label="Önceki portföy"
          >
            ←
          </button>

          <div className="ap-presentation-swipe-dots">
            {listings.map(
              (listing, index) => (
                <button
                  key={listing.id}
                  type="button"
                  className={
                    index ===
                    activeIndex
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    moveTo(index)
                  }
                  aria-label={`${index + 1}. portföye git`}
                />
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              moveTo(
                activeIndex + 1,
              )
            }
            disabled={
              activeIndex ===
              lastIndex
            }
            aria-label="Sonraki portföy"
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
}
