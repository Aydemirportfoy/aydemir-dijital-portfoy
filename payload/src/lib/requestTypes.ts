export type CustomerRequestStatus =
  | "new"
  | "contacted"
  | "presentation_sent"
  | "viewing"
  | "negotiation"
  | "waiting"
  | "won"
  | "lost"
  | "archived";

export type CustomerRequestPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type CustomerRequest = {
  id: string;
  customer_name: string;
  phone: string | null;
  source_text: string | null;
  min_budget: number | null;
  max_budget: number | null;
  neighborhoods: string[];
  room_counts: string[];
  min_area: number | null;
  max_area: number | null;
  floor_preferences: string | null;
  kitchen_type: string | null;
  credit_required: boolean;
  exchange_required: boolean;
  commission_free_only: boolean;
  required_features: string[];
  note: string | null;
  status: CustomerRequestStatus;
  follow_up_at: string | null;
  priority: CustomerRequestPriority;
  last_contact_at: string | null;
  lost_reason: string | null;
  status_changed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerRequestNote = {
  id: string;
  request_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
};

export type RequestPresentationLink = {
  id: string;
  request_id: string;
  presentation_id: string;
  created_at: string;
  presentation: {
    id: string;
    slug: string;
    customer_name: string;
    title: string | null;
    status: "active" | "archived";
    created_at: string;
  } | null;
};

export const REQUEST_STATUS_OPTIONS: Array<{
  value: CustomerRequestStatus;
  label: string;
}> = [
  {
    value: "new",
    label: "Yeni Talep",
  },
  {
    value: "contacted",
    label: "Görüşüldü",
  },
  {
    value: "presentation_sent",
    label: "Sunum Gönderildi",
  },
  {
    value: "viewing",
    label: "Daire Gösterilecek",
  },
  {
    value: "negotiation",
    label: "Pazarlık",
  },
  {
    value: "waiting",
    label: "Dönüş Bekleniyor",
  },
  {
    value: "won",
    label: "Satış Tamamlandı",
  },
  {
    value: "lost",
    label: "Olumsuz",
  },
  {
    value: "archived",
    label: "Arşiv",
  },
];

export const REQUEST_PRIORITY_OPTIONS: Array<{
  value: CustomerRequestPriority;
  label: string;
}> = [
  {
    value: "low",
    label: "Düşük",
  },
  {
    value: "normal",
    label: "Normal",
  },
  {
    value: "high",
    label: "Önemli",
  },
  {
    value: "urgent",
    label: "Acil",
  },
];

export function requestStatusLabel(
  status: CustomerRequestStatus,
) {
  return (
    REQUEST_STATUS_OPTIONS.find(
      (item) => item.value === status,
    )?.label ?? status
  );
}

export function requestPriorityLabel(
  priority:
    CustomerRequestPriority,
) {
  return (
    REQUEST_PRIORITY_OPTIONS.find(
      (item) => item.value === priority,
    )?.label ?? priority
  );
}
