"use client";

import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ListingImage,
} from "@/lib/types";

type ExistingImage =
  ListingImage & {
    removed?: boolean;
  };

export type CoverRef =
  | {
      kind: "existing";
      id: string;
    }
  | {
      kind: "new";
      id: string;
    }
  | null;

type MenuTarget =
  | {
      kind: "existing";
      id: string;
      url: string;
    }
  | {
      kind: "new";
      id: string;
      url: string;
    }
  | null;

type DragState =
  | {
      kind: "existing";
      index: number;
    }
  | {
      kind: "new";
      index: number;
    }
  | null;

export function photoFileKey(
  file: File,
) {
  return [
    file.name,
    file.size,
    file.lastModified,
  ].join("-");
}

export default function PhotoOrganizer({
  existingImages,
  setExistingImages,
  newFiles,
  setNewFiles,
  coverRef,
  setCoverRef,
}: {
  existingImages: ExistingImage[];
  setExistingImages:
    Dispatch<
      SetStateAction<ExistingImage[]>
    >;
  newFiles: File[];
  setNewFiles:
    Dispatch<SetStateAction<File[]>>;
  coverRef: CoverRef;
  setCoverRef:
    Dispatch<SetStateAction<CoverRef>>;
}) {
  const activeExisting = useMemo(
    () =>
      existingImages.filter(
        (image) => !image.removed,
      ),
    [existingImages],
  );

  const newPreviews = useMemo(
    () =>
      newFiles.map((file) => ({
        file,
        id: photoFileKey(file),
        url: URL.createObjectURL(file),
      })),
    [newFiles],
  );

  const [dragging, setDragging] =
    useState<DragState>(null);

  const [dropTarget, setDropTarget] =
    useState<DragState>(null);

  const [menuTarget, setMenuTarget] =
    useState<MenuTarget>(null);

  const longPressTimer =
    useRef<number | null>(null);

  const pressOrigin = useRef<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      newPreviews.forEach(
        ({ url }) => {
          URL.revokeObjectURL(url);
        },
      );
    };
  }, [newPreviews]);

  useEffect(() => {
    if (coverRef) {
      return;
    }

    if (activeExisting[0]) {
      setCoverRef({
        kind: "existing",
        id: activeExisting[0].id,
      });
      return;
    }

    if (newPreviews[0]) {
      setCoverRef({
        kind: "new",
        id: newPreviews[0].id,
      });
    }
  }, [
    activeExisting,
    coverRef,
    newPreviews,
    setCoverRef,
  ]);

  function clearPressTimer() {
    if (
      longPressTimer.current !== null
    ) {
      window.clearTimeout(
        longPressTimer.current,
      );
      longPressTimer.current = null;
    }

    pressOrigin.current = null;
  }

  function beginLongPress(
    event:
      ReactPointerEvent<HTMLElement>,
    target: Exclude<
      MenuTarget,
      null
    >,
  ) {
    if (
      event.pointerType !== "touch"
    ) {
      return;
    }

    pressOrigin.current = {
      x: event.clientX,
      y: event.clientY,
    };

    longPressTimer.current =
      window.setTimeout(() => {
        setMenuTarget(target);
        navigator.vibrate?.(24);
        clearPressTimer();
      }, 520);
  }

  function moveLongPress(
    event:
      ReactPointerEvent<HTMLElement>,
  ) {
    const origin =
      pressOrigin.current;

    if (!origin) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - origin.x,
      event.clientY - origin.y,
    );

    if (distance > 10) {
      clearPressTimer();
    }
  }

  function makeCover(
    target: Exclude<
      MenuTarget,
      null
    >,
  ) {
    setCoverRef({
      kind: target.kind,
      id: target.id,
    });
    setMenuTarget(null);
  }

  function nextCoverAfterDelete(
    deleting:
      Exclude<MenuTarget, null>,
  ) {
    const isSelected =
      coverRef?.kind ===
        deleting.kind &&
      coverRef.id === deleting.id;

    if (!isSelected) {
      return;
    }

    const nextExisting =
      activeExisting.find(
        (image) =>
          !(
            deleting.kind ===
              "existing" &&
            image.id === deleting.id
          ),
      );

    if (nextExisting) {
      setCoverRef({
        kind: "existing",
        id: nextExisting.id,
      });
      return;
    }

    const nextNew =
      newPreviews.find(
        (preview) =>
          !(
            deleting.kind === "new" &&
            preview.id === deleting.id
          ),
      );

    setCoverRef(
      nextNew
        ? {
            kind: "new",
            id: nextNew.id,
          }
        : null,
    );
  }

  function removePhoto(
    target:
      Exclude<MenuTarget, null>,
  ) {
    nextCoverAfterDelete(target);

    if (target.kind === "existing") {
      setExistingImages(
        (current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  removed: true,
                }
              : item,
          ),
      );
    } else {
      setNewFiles((current) =>
        current.filter(
          (file) =>
            photoFileKey(file) !==
            target.id,
        ),
      );
    }

    setMenuTarget(null);
  }

  function reorderExisting(
    from: number,
    to: number,
  ) {
    if (from === to) {
      return;
    }

    setExistingImages(
      (current) => {
        const visible =
          current.filter(
            (image) =>
              !image.removed,
          );

        const removed =
          current.filter(
            (image) =>
              image.removed,
          );

        const [moved] =
          visible.splice(from, 1);

        visible.splice(to, 0, moved);

        return [
          ...visible,
          ...removed,
        ];
      },
    );
  }

  function reorderNew(
    from: number,
    to: number,
  ) {
    if (from === to) {
      return;
    }

    setNewFiles((current) => {
      const next = [...current];
      const [moved] =
        next.splice(from, 1);

      next.splice(to, 0, moved);

      return next;
    });
  }

  function moveDragOver(
    kind: "existing" | "new",
    targetIndex: number,
  ) {
    if (
      !dragging ||
      dragging.kind !== kind ||
      dragging.index === targetIndex
    ) {
      setDropTarget({
        kind,
        index: targetIndex,
      });
      return;
    }

    if (kind === "existing") {
      reorderExisting(
        dragging.index,
        targetIndex,
      );
    } else {
      reorderNew(
        dragging.index,
        targetIndex,
      );
    }

    setDragging({
      kind,
      index: targetIndex,
    });

    setDropTarget({
      kind,
      index: targetIndex,
    });
  }

  function finishDrag() {
    setDragging(null);
    setDropTarget(null);
  }

  const total =
    activeExisting.length +
    newPreviews.length;

  if (total === 0) {
    return (
      <div className="ap-upload-empty">
        JPG, PNG veya WEBP
        fotoğrafları seçin. Dosya
        başına en fazla 10 MB.
      </div>
    );
  }

  return (
    <>
      <div className="ap-photo-help">
        <span>
          Bilgisayarda çift tıklayın:
          kapak yap
        </span>
        <span>
          Telefonda basılı tutun:
          işlemler
        </span>
        <span>
          Sürüklerken turuncu alan
          bırakılacağı yeri gösterir
        </span>
      </div>

      <div className="ap-photo-grid">
        {activeExisting.map(
          (image, index) => {
            const target = {
              kind: "existing" as const,
              id: image.id,
              url: image.image_url,
            };

            const isCover =
              coverRef?.kind ===
                "existing" &&
              coverRef.id === image.id;

            const isDragging =
              dragging?.kind ===
                "existing" &&
              dragging.index === index;

            const isTarget =
              dropTarget?.kind ===
                "existing" &&
              dropTarget.index === index;

            return (
              <article
                key={image.id}
                className={[
                  "ap-photo-card",
                  isCover
                    ? "is-cover"
                    : "",
                  isDragging
                    ? "is-dragging"
                    : "",
                  isTarget
                    ? "is-drop-target"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable
                onDoubleClick={() =>
                  makeCover(target)
                }
                onPointerDown={(
                  event,
                ) =>
                  beginLongPress(
                    event,
                    target,
                  )
                }
                onPointerMove={
                  moveLongPress
                }
                onPointerUp={
                  clearPressTimer
                }
                onPointerCancel={
                  clearPressTimer
                }
                onContextMenu={(
                  event,
                ) => {
                  if (
                    window.matchMedia(
                      "(pointer: coarse)",
                    ).matches
                  ) {
                    event.preventDefault();
                    setMenuTarget(
                      target,
                    );
                  }
                }}
                onDragStart={(
                  event,
                ) => {
                  setDragging({
                    kind: "existing",
                    index,
                  });

                  event.dataTransfer
                    .setData(
                      "text/plain",
                      image.id,
                    );

                  event.dataTransfer
                    .effectAllowed =
                    "move";

                  event.dataTransfer
                    .setDragImage(
                      event.currentTarget,
                      70,
                      55,
                    );
                }}
                onDragEnter={(
                  event,
                ) => {
                  event.preventDefault();

                  moveDragOver(
                    "existing",
                    index,
                  );
                }}
                onDragOver={(
                  event,
                ) => {
                  event.preventDefault();
                  event.dataTransfer
                    .dropEffect =
                    "move";
                }}
                onDrop={(
                  event,
                ) => {
                  event.preventDefault();
                  finishDrag();
                }}
                onDragEnd={
                  finishDrag
                }
              >
                <img
                  src={image.image_url}
                  alt=""
                  draggable={false}
                />

                <span className="ap-photo-order">
                  {index + 1}
                </span>

                {isCover ? (
                  <span className="ap-cover-badge">
                    Kapak
                  </span>
                ) : null}

                <span className="ap-photo-drag-label">
                  ⋮⋮ Sürükle
                </span>

                <button
                  type="button"
                  className="ap-photo-more"
                  onClick={() =>
                    setMenuTarget(
                      target,
                    )
                  }
                  aria-label="Fotoğraf işlemleri"
                >
                  •••
                </button>
              </article>
            );
          },
        )}

        {newPreviews.map(
          (
            {
              file,
              id,
              url,
            },
            index,
          ) => {
            const position =
              activeExisting.length +
              index;

            const target = {
              kind: "new" as const,
              id,
              url,
            };

            const isCover =
              coverRef?.kind ===
                "new" &&
              coverRef.id === id;

            const isDragging =
              dragging?.kind ===
                "new" &&
              dragging.index === index;

            const isTarget =
              dropTarget?.kind ===
                "new" &&
              dropTarget.index === index;

            return (
              <article
                key={id}
                className={[
                  "ap-photo-card",
                  isCover
                    ? "is-cover"
                    : "",
                  isDragging
                    ? "is-dragging"
                    : "",
                  isTarget
                    ? "is-drop-target"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable
                onDoubleClick={() =>
                  makeCover(target)
                }
                onPointerDown={(
                  event,
                ) =>
                  beginLongPress(
                    event,
                    target,
                  )
                }
                onPointerMove={
                  moveLongPress
                }
                onPointerUp={
                  clearPressTimer
                }
                onPointerCancel={
                  clearPressTimer
                }
                onContextMenu={(
                  event,
                ) => {
                  if (
                    window.matchMedia(
                      "(pointer: coarse)",
                    ).matches
                  ) {
                    event.preventDefault();
                    setMenuTarget(
                      target,
                    );
                  }
                }}
                onDragStart={(
                  event,
                ) => {
                  setDragging({
                    kind: "new",
                    index,
                  });

                  event.dataTransfer
                    .setData(
                      "text/plain",
                      id,
                    );

                  event.dataTransfer
                    .effectAllowed =
                    "move";

                  event.dataTransfer
                    .setDragImage(
                      event.currentTarget,
                      70,
                      55,
                    );
                }}
                onDragEnter={(
                  event,
                ) => {
                  event.preventDefault();

                  moveDragOver(
                    "new",
                    index,
                  );
                }}
                onDragOver={(
                  event,
                ) => {
                  event.preventDefault();
                  event.dataTransfer
                    .dropEffect =
                    "move";
                }}
                onDrop={(
                  event,
                ) => {
                  event.preventDefault();
                  finishDrag();
                }}
                onDragEnd={
                  finishDrag
                }
              >
                <img
                  src={url}
                  alt={file.name}
                  draggable={false}
                />

                <span className="ap-photo-order">
                  {position + 1}
                </span>

                {isCover ? (
                  <span className="ap-cover-badge">
                    Kapak
                  </span>
                ) : null}

                <span className="ap-photo-drag-label">
                  ⋮⋮ Sürükle
                </span>

                <button
                  type="button"
                  className="ap-photo-more"
                  onClick={() =>
                    setMenuTarget(
                      target,
                    )
                  }
                  aria-label="Fotoğraf işlemleri"
                >
                  •••
                </button>
              </article>
            );
          },
        )}
      </div>

      {menuTarget ? (
        <div
          className="ap-photo-action-backdrop"
          role="presentation"
          onClick={() =>
            setMenuTarget(null)
          }
        >
          <div
            className="ap-photo-action-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Fotoğraf işlemleri"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="ap-photo-action-handle" />

            <img
              src={menuTarget.url}
              alt=""
            />

            <div>
              <p className="ap-kicker">
                FOTOĞRAF İŞLEMLERİ
              </p>

              <h3>
                Bu fotoğraf için
                işlem seçin
              </h3>
            </div>

            <button
              type="button"
              className="ap-primary-button"
              onClick={() =>
                makeCover(menuTarget)
              }
            >
              Kapak Fotoğrafı Yap
            </button>

            <button
              type="button"
              className="ap-danger-button"
              onClick={() =>
                removePhoto(menuTarget)
              }
            >
              Fotoğrafı Sil
            </button>

            <button
              type="button"
              className="ap-soft-button"
              onClick={() =>
                setMenuTarget(null)
              }
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
