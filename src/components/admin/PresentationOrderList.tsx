"use client";

import {
  PointerEvent as ReactPointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  Listing,
} from "@/lib/types";

type DragState = {
  id: string;
  listing: Listing;
  left: number;
  top: number;
  width: number;
  height: number;
  startY: number;
  pointerId: number;
};

type PendingDrag = {
  id: string;
  listing: Listing;
  startX: number;
  startY: number;
  pointerId: number;
  element: HTMLElement;
  pointerType: string;
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
  const [overId, setOverId] =
    useState<string | null>(
      null,
    );
  const [droppedId, setDroppedId] =
    useState<string | null>(
      null,
    );

  const nodesRef = useRef(
    new Map<
      string,
      HTMLElement
    >(),
  );

  const previousRectsRef =
    useRef<
      Map<string, DOMRect> | null
    >(null);

  const overlayRef =
    useRef<HTMLDivElement>(null);

  const dragRef =
    useRef<DragState | null>(
      null,
    );

  const pendingRef =
    useRef<PendingDrag | null>(
      null,
    );

  const pressTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const currentYRef =
    useRef(0);

  const animationFrameRef =
    useRef<number | null>(
      null,
    );

  const dropTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

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

  function clearPressTimer() {
    if (pressTimerRef.current) {
      clearTimeout(
        pressTimerRef.current,
      );
      pressTimerRef.current =
        null;
    }
  }

  function captureRects() {
    const next =
      new Map<string, DOMRect>();

    for (
      const [id, node]
      of nodesRef.current
    ) {
      next.set(
        id,
        node.getBoundingClientRect(),
      );
    }

    previousRectsRef.current =
      next;
  }

  useLayoutEffect(() => {
    const previous =
      previousRectsRef.current;

    if (!previous) {
      return;
    }

    for (
      const [id, node]
      of nodesRef.current
    ) {
      const oldRect =
        previous.get(id);

      if (!oldRect) {
        continue;
      }

      const newRect =
        node.getBoundingClientRect();

      const deltaY =
        oldRect.top - newRect.top;

      if (
        Math.abs(deltaY) < 1
      ) {
        continue;
      }

      node.animate(
        [
          {
            transform:
              `translate3d(0, ${deltaY}px, 0)`,
          },
          {
            transform:
              "translate3d(0, 0, 0)",
          },
        ],
        {
          duration: 290,
          easing:
            "cubic-bezier(.22,.61,.36,1)",
        },
      );
    }

    previousRectsRef.current =
      null;
  }, [listings]);

  function updateOverlay() {
    animationFrameRef.current =
      null;

    const currentDrag =
      dragRef.current;

    const overlay =
      overlayRef.current;

    if (
      !currentDrag ||
      !overlay
    ) {
      return;
    }

    const offset =
      currentYRef.current -
      currentDrag.startY;

    overlay.style.transform =
      `translate3d(0, ${offset}px, 0) scale(1.018)`;
  }

  function scheduleOverlayUpdate() {
    if (
      animationFrameRef.current !==
      null
    ) {
      return;
    }

    animationFrameRef.current =
      requestAnimationFrame(
        updateOverlay,
      );
  }

  function reorder(
    draggedId: string,
    targetId: string,
  ) {
    const ids =
      listings.map(
        (listing) =>
          listing.id,
      );

    const from =
      ids.indexOf(draggedId);

    const to =
      ids.indexOf(targetId);

    if (
      from < 0 ||
      to < 0 ||
      from === to
    ) {
      return;
    }

    captureRects();

    const next = [...ids];

    const [moved] =
      next.splice(from, 1);

    next.splice(
      to,
      0,
      moved,
    );

    onReorder(next);
  }

  function activateDrag(
    pending: PendingDrag,
  ) {
    const item =
      nodesRef.current.get(
        pending.id,
      );

    if (!item) {
      return;
    }

    const rect =
      item.getBoundingClientRect();

    const nextDrag: DragState = {
      id: pending.id,
      listing:
        pending.listing,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      startY:
        pending.startY,
      pointerId:
        pending.pointerId,
    };

    currentYRef.current =
      pending.startY;

    dragRef.current =
      nextDrag;

    pendingRef.current =
      null;

    setDrag(nextDrag);
    setOverId(
      pending.id,
    );

    document.body.classList.add(
      "ap-order-dragging",
    );

    if (
      pending.element.isConnected
    ) {
      try {
        pending.element
          .setPointerCapture(
            pending.pointerId,
          );
      } catch {
        // Tarayıcı pointer yakalamayı desteklemiyorsa
        // sürükleme yine normal pointer olaylarıyla devam eder.
      }
    }
  }

  function startDrag(
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

    const pending: PendingDrag = {
      id: listing.id,
      listing,
      startX:
        event.clientX,
      startY:
        event.clientY,
      pointerId:
        event.pointerId,
      element:
        event.currentTarget,
      pointerType:
        event.pointerType,
    };

    pendingRef.current =
      pending;

    if (
      event.pointerType ===
      "mouse"
    ) {
      event.preventDefault();
      activateDrag(pending);
      return;
    }

    clearPressTimer();

    pressTimerRef.current =
      setTimeout(
        () => {
          const current =
            pendingRef.current;

          if (
            current &&
            current.pointerId ===
              pending.pointerId
          ) {
            activateDrag(
              current,
            );
          }
        },
        140,
      );
  }

  function moveDrag(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    const pending =
      pendingRef.current;

    if (
      pending &&
      !dragRef.current
    ) {
      const movement =
        Math.hypot(
          event.clientX -
            pending.startX,
          event.clientY -
            pending.startY,
        );

      if (movement > 9) {
        clearPressTimer();
        pendingRef.current =
          null;
      }

      return;
    }

    const currentDrag =
      dragRef.current;

    if (!currentDrag) {
      return;
    }

    event.preventDefault();

    currentYRef.current =
      event.clientY;

    scheduleOverlayUpdate();

    const edge = 86;

    if (
      event.clientY <
      edge
    ) {
      window.scrollBy({
        top: -8,
        behavior: "auto",
      });
    } else if (
      event.clientY >
      window.innerHeight -
        edge
    ) {
      window.scrollBy({
        top: 8,
        behavior: "auto",
      });
    }

    const hit =
      document.elementFromPoint(
        event.clientX,
        event.clientY,
      );

    const target =
      hit?.closest<HTMLElement>(
        "[data-order-id]",
      );

    const targetId =
      target?.dataset.orderId;

    if (!targetId) {
      setOverId(null);
      return;
    }

    setOverId(targetId);

    if (
      targetId !==
      currentDrag.id
    ) {
      reorder(
        currentDrag.id,
        targetId,
      );
    }
  }

  function cancelPending() {
    clearPressTimer();
    pendingRef.current =
      null;
  }

  function finishDrag(
    event?:
      ReactPointerEvent<HTMLElement>,
  ) {
    clearPressTimer();

    const currentDrag =
      dragRef.current;

    if (!currentDrag) {
      pendingRef.current =
        null;
      return;
    }

    if (
      event &&
      event.currentTarget
        .hasPointerCapture(
          currentDrag.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          currentDrag.pointerId,
        );
    }

    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current,
      );

      animationFrameRef.current =
        null;
    }

    const overlay =
      overlayRef.current;

    const target =
      nodesRef.current.get(
        currentDrag.id,
      );

    const finish = () => {
      dragRef.current = null;
      pendingRef.current =
        null;

      setDrag(null);
      setOverId(null);
      setDroppedId(
        currentDrag.id,
      );

      document.body.classList.remove(
        "ap-order-dragging",
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
          320,
        );
    };

    if (
      overlay &&
      target
    ) {
      const currentRect =
        overlay.getBoundingClientRect();

      const targetRect =
        target.getBoundingClientRect();

      overlay.style.left =
        `${currentRect.left}px`;

      overlay.style.top =
        `${currentRect.top}px`;

      overlay.style.transform =
        "none";

      const animation =
        overlay.animate(
          [
            {
              transform:
                "translate3d(0,0,0) scale(1.018)",
              opacity: 1,
            },
            {
              transform:
                `translate3d(${targetRect.left - currentRect.left}px, ${targetRect.top - currentRect.top}px, 0) scale(1)`,
              opacity: .82,
            },
          ],
          {
            duration: 190,
            easing:
              "cubic-bezier(.22,.61,.36,1)",
          },
        );

      animation.finished
        .catch(
          () => undefined,
        )
        .finally(finish);

      return;
    }

    finish();
  }

  return (
    <>
      <div
        className={
          `ap-presentation-order-list ap-sortable-order-list ap-whole-card-sort ${
            drag
              ? "is-dragging"
              : ""
          }`
        }
      >
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
              data-order-id={
                listing.id
              }
              className={
                `ap-presentation-order-item ap-sortable-order-item ${
                  drag?.id ===
                  listing.id
                    ? "is-drag-source"
                    : ""
                } ${
                  overId ===
                    listing.id &&
                  drag?.id !==
                    listing.id
                    ? "is-drop-target"
                    : ""
                } ${
                  droppedId ===
                  listing.id
                    ? "is-just-dropped"
                    : ""
                }`
              }
              key={listing.id}
              onPointerDown={(
                event,
              ) =>
                startDrag(
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
              onPointerCancel={() => {
                cancelPending();
                finishDrag();
              }}
              onContextMenu={(
                event,
              ) => {
                if (
                  dragRef.current ||
                  pendingRef.current
                ) {
                  event.preventDefault();
                }
              }}
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

      {drag ? (
        <div
          ref={overlayRef}
          className="ap-presentation-drag-overlay ap-whole-card-drag-overlay"
          style={{
            left: drag.left,
            top: drag.top,
            width: drag.width,
            height: drag.height,
          }}
          aria-hidden="true"
        >
          <span className="ap-presentation-order-number">
            {listings.findIndex(
              (item) =>
                item.id ===
                drag.id,
            ) + 1}
          </span>

          <div className="ap-presentation-order-image">
            {drag.listing.cover_image_url ? (
              <img
                src={
                  drag.listing.cover_image_url
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
              {drag.listing.title}
            </strong>

            <small>
              {
                drag.listing.neighborhood
              }{" "}
              ·{" "}
              {
                drag.listing.room_count
              }
            </small>
          </div>

          <span className="ap-presentation-drag-label">
            Sürükleniyor
          </span>
        </div>
      ) : null}
    </>
  );
}
