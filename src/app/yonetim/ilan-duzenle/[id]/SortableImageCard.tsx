"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

export type SortableListingImage = {
  id: string;
  image_url: string;
  storage_path: string;
  alt_text: string | null;
  is_cover: boolean;
  position: number;
};

type SortableImageCardProps = {
  image: SortableListingImage;
  index: number;
  workingImageId: string;
  onSetCover: (image: SortableListingImage) => void;
  onDelete: (image: SortableListingImage) => void;
};

export default function SortableImageCard({
  image,
  index,
  workingImageId,
  onSetCover,
  onDelete,
}: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.76 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`admin-photo-card ${
        isDragging ? "admin-photo-card-dragging" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="admin-photo-drag-area"
        aria-label={`${index + 1}. fotoğrafı sürükleyerek sırala`}
      >
        <img
          src={image.image_url}
          alt={
            image.alt_text ??
            `İlan fotoğrafı ${index + 1}`
          }
          className="admin-photo-image"
          draggable={false}
        />

        <div className="admin-photo-overlay" />

        {image.is_cover ? (
          <span className="admin-cover-badge">
            Kapak
          </span>
        ) : null}

        <span className="admin-photo-number">
          {index + 1}
        </span>

        <span
          className="admin-drag-dots"
          aria-hidden="true"
        >
          ⠿
        </span>
      </div>

      <div className="admin-photo-actions">
        <button
          type="button"
          onClick={() => onSetCover(image)}
          disabled={
            image.is_cover ||
            workingImageId === image.id
          }
          className="admin-photo-action admin-photo-action-primary"
        >
          {image.is_cover
            ? "Kapak Fotoğrafı"
            : "Kapak Yap"}
        </button>

        <button
          type="button"
          onClick={() => onDelete(image)}
          disabled={workingImageId === image.id}
          className="admin-photo-action admin-photo-action-danger"
        >
          {workingImageId === image.id
            ? "İşleniyor..."
            : "Sil"}
        </button>
      </div>
    </article>
  );
}
