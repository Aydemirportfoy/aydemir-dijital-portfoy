import type { ListingStatus } from "@/lib/types";

const labels: Record<ListingStatus, string> = {
  draft: "Taslak",
  active: "Aktif",
  reserved: "Rezerve",
  sold: "Satıldı",
};

export default function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`ap-status ap-status-${status}`}>{labels[status]}</span>;
}
