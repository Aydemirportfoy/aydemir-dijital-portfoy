"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
} from "react";
import type {
  Listing,
} from "@/lib/types";

type DragState = {
  id: string;
  pointerId: number;
  startY: number;
  deltaY: number;
  sourceIndex: number;
  targetIndex: number;
  moved: boolean;
  centers: number[];
  shiftDistance: number;
};

export default function PresentationOrderList({
  listings,
  onReorder,
  onRemove,
}: {
  listings: Listing[];
  onReorder: (
    ids: string[],
  ) => void;
  onRemove: (
    id: string,
  ) => void;
}) {
  const [drag, setDrag] =
    useState<DragState | null>(
      null,
    );

  const [droppedId, setDroppedId] =
    useState<string | null>(
      null,
    );

  const dragRef =
    useRef<DragState | null>(
      null,
    );

  const nodesRef = useRef(
    new Map<
      string,
      HTMLElement
    >(),
  );

  const frameRef =
    useRef<number | null>(
      null,
    );

  const latestPointerYRef =
    useRef(0);

  const dropTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  useEffect(() => {
    return () => {
      document.body.classList.remove(
        "ap-live-order-dragging",
      );

      if (
        frameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          frameRef.current,
        );
      }

      if (
        dropTimerRef.current
      ) {
        clearTimeout(
          dropTimerRef.current,
        );
      }
    };
  }, []);

  const listingIds = useMemo(
    () =>
      listings.map(
        (listing) =>
          listing.id,
      ),
    [listings],
  );

  function setItemRef(
    id: string,
    node: HTMLElement | null,
  ) {
    if (node) {
      nodesRef.current.set(
        id,
        node,
      );
    } else {
      nodesRef.current.delete(
        id,
      );
    }
  }

  function getRemainingIds(
    draggedId: string,
  ) {
    return listingIds.filter(
      (id) =>
        id !== draggedId,
    );
  }

  function calculateShiftDistance(
    sourceIndex: number,
    sourceRect: DOMRect,
  ) {
    const nextListing =
      listings[
        sourceIndex + 1
      ];

    if (nextListing) {
      const nextNode =
        nodesRef.current.get(
          nextListing.id,
        );

      const nextRect =
        nextNode?.getBoundingClientRect();

      if (nextRect) {
        return Math.max(
          sourceRect.height,
          nextRect.top -
            sourceRect.top,
        );
      }
    }

    const previousListing =
      listings[
        sourceIndex - 1
      ];

    if (previousListing) {
      const previousNode =
        nodesRef.current.get(
          previousListing.id,
        );

      const previousRect =
        previousNode?.getBoundingClientRect();

      if (previousRect) {
        return Math.max(
          sourceRect.height,
          sourceRect.top -
            previousRect.top,
        );
      }
    }

    return (
      sourceRect.height +
      10
    );
  }

  function beginDrag(
    event:
      ReactPointerEvent<HTMLElement>,
    listing: Listing,
  ) {
    const target =
      event.target as HTMLElement;

    if (
      target.closest(
        "button, a, input, textarea, select, summary",
      )
    ) {
      return;
    }

    const sourceIndex =
      listings.findIndex(
        (item) =>
          item.id ===
          listing.id,
      );

    const sourceNode =
      nodesRef.current.get(
        listing.id,
      );

    if (
      sourceIndex < 0 ||
      !sourceNode
    ) {
      return;
    }

    event.preventDefault();

    const sourceRect =
      sourceNode.getBoundingClientRect();

    const remainingIds =
      getRemainingIds(
        listing.id,
      );

    const centers =
      remainingIds.map(
        (id) => {
          const node =
            nodesRef.current.get(
              id,
            );

          if (!node) {
            return 0;
          }

          const rect =
            node.getBoundingClientRect();

          return (
            rect.top +
            rect.height / 2
          );
        },
      );

    const nextDrag: DragState = {
      id: listing.id,
      pointerId:
        event.pointerId,
      startY:
        event.clientY,
      deltaY: 0,
      sourceIndex,
      targetIndex:
        sourceIndex,
      moved: false,
      centers,
      shiftDistance:
        calculateShiftDistance(
          sourceIndex,
          sourceRect,
        ),
    };

    dragRef.current =
      nextDrag;

    latestPointerYRef.current =
      event.clientY;

    setDrag(nextDrag);

    document.body.classList.add(
      "ap-live-order-dragging",
    );

    try {
      event.currentTarget
        .setPointerCapture(
          event.pointerId,
        );
    } catch {
      // Pointer capture desteklenmiyorsa normal pointer akışı kullanılır.
    }
  }

  function applyPointerMove() {
    frameRef.current = null;

    const current =
      dragRef.current;

    if (!current) {
      return;
    }

    const pointerY =
      latestPointerYRef.current;

    const deltaY =
      pointerY -
      current.startY;

    let targetIndex = 0;

    for (
      const center
      of current.centers
    ) {
      if (
        pointerY >
        center
      ) {
        targetIndex += 1;
      }
    }

    const nextDrag: DragState = {
      ...current,
      deltaY,
      targetIndex,
      moved:
        current.moved ||
        Math.abs(deltaY) > 4,
    };

    dragRef.current =
      nextDrag;

    setDrag(nextDrag);
  }

  function moveDrag(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    if (
      !dragRef.current
    ) {
      return;
    }

    event.preventDefault();

    latestPointerYRef.current =
      event.clientY;

    if (
      frameRef.current ===
      null
    ) {
      frameRef.current =
        requestAnimationFrame(
          applyPointerMove,
        );
    }
  }

  function finishDrag(
    event?:
      ReactPointerEvent<HTMLElement>,
  ) {
    const current =
      dragRef.current;

    if (!current) {
      return;
    }

    if (
      event &&
      event.currentTarget
        .hasPointerCapture(
          current.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          current.pointerId,
        );
    }

    if (
      frameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        frameRef.current,
      );

      frameRef.current =
        null;
    }

    dragRef.current = null;

    document.body.classList.remove(
      "ap-live-order-dragging",
    );

    if (
      current.moved &&
      current.targetIndex !==
        current.sourceIndex
    ) {
      const nextIds =
        getRemainingIds(
          current.id,
        );

      nextIds.splice(
        current.targetIndex,
        0,
        current.id,
      );

      onReorder(nextIds);
    }

    setDrag(null);

    if (
      current.moved
    ) {
      setDroppedId(
        current.id,
      );

      if (
        dropTimerRef.current
      ) {
        clearTimeout(
          dropTimerRef.current,
        );
      }

      dropTimerRef.current =
        setTimeout(
          () => {
            setDroppedId(null);
          },
          280,
        );
    }
  }

  function cancelDrag() {
    if (
      frameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        frameRef.current,
      );

      frameRef.current =
        null;
    }

    dragRef.current = null;
    setDrag(null);

    document.body.classList.remove(
      "ap-live-order-dragging",
    );
  }

  function getItemStyle(
    index: number,
    id: string,
  ): CSSProperties {
    if (!drag) {
      return {};
    }

    if (
      drag.id === id
    ) {
      return {
        transform:
          `translate3d(0, ${drag.deltaY}px, 0) scale(1.01)`,
      };
    }

    if (
      drag.sourceIndex <
      drag.targetIndex
    ) {
      if (
        index >
          drag.sourceIndex &&
        index <=
          drag.targetIndex
      ) {
        return {
          transform:
            `translate3d(0, -${drag.shiftDistance}px, 0)`,
        };
      }
    }

    if (
      drag.sourceIndex >
      drag.targetIndex
    ) {
      if (
        index >=
          drag.targetIndex &&
        index <
          drag.sourceIndex
      ) {
        return {
          transform:
            `translate3d(0, ${drag.shiftDistance}px, 0)`,
        };
      }
    }

    return {
      transform:
        "translate3d(0, 0, 0)",
    };
  }

  return (
    <div className="ap-presentation-order-list ap-live-slide-list">
      {listings.map(
        (
          listing,
          index,
        ) => (
          <article
            ref={(node) =>
              setItemRef(
                listing.id,
                node,
              )
            }
            className={
              `ap-presentation-order-item ap-live-slide-item ${
                drag?.id ===
                listing.id
                  ? "is-dragging"
                  : ""
              } ${
                droppedId ===
                listing.id
                  ? "is-just-dropped"
                  : ""
              }`
            }
            style={getItemStyle(
              index,
              listing.id,
            )}
            key={listing.id}
            onPointerDown={(
              event,
            ) =>
              beginDrag(
                event,
                listing,
              )
            }
            onPointerMove={
              moveDrag
            }
            onPointerUp={
              finishDrag
            }
            onPointerCancel={
              cancelDrag
            }
            onContextMenu={(
              event,
            ) =>
              event.preventDefault()
            }
          >
            <span className="ap-presentation-order-number">
              {index + 1}
            </span>

            <div className="ap-presentation-order-image">
              {listing.cover_image_url ? (
                <img
                  src={
                    listing.cover_image_url
                  }
                  alt=""
                  draggable={false}
                />
              ) : (
                <div className="ap-image-empty">
                  Fotoğraf yok
                </div>
              )}
            </div>

            <div className="ap-presentation-order-info">
              <strong>
                {listing.title}
              </strong>

              <small>
                {
                  listing.neighborhood
                }{" "}
                ·{" "}
                {
                  listing.room_count
                }
              </small>
            </div>

            <button
              type="button"
              className="ap-presentation-order-remove"
              onPointerDown={(
                event,
              ) =>
                event.stopPropagation()
              }
              onClick={() =>
                onRemove(
                  listing.id,
                )
              }
              aria-label="Sunumdan çıkar"
            >
              ×
            </button>
          </article>
        ),
      )}
    </div>
  );
}
