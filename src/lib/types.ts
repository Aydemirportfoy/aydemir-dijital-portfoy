export type ListingStatus =
  | "draft"
  | "active"
  | "reserved"
  | "sold";

export type Listing = {
  id: string;
  slug: string;
  project_name: string | null;
  title: string;
  city: string;
  district: string;
  neighborhood: string;
  room_count: string | null;
  area_m2: number | null;
  gross_area_m2?: number | null;
  floor: string | null;
  facade: string | null;
  kitchen_type: string | null;
  price: number | null;
  short_description: string | null;
  description: string | null;
  features: string[];
  credit_available: boolean;
  exchange_available: boolean;
  commission_free: boolean;
  status: ListingStatus;
  cover_image_url: string | null;
  listing_video_url: string | null;
  listing_video_storage_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  image_url: string;
  storage_path: string | null;
  position: number;
};

export type ListingPrivateDetails = {
  listing_id: string;
  seller_name: string | null;
  seller_phone: string | null;
  available_credit_amount: number | null;
  maps_url: string | null;
  location_note: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminListing = Listing & {
  private_details: ListingPrivateDetails | null;
};

export type PresentationStatus =
  | "active"
  | "archived";

export type Presentation = {
  id: string;
  slug: string;
  customer_name: string;
  title: string | null;
  note: string | null;
  status: PresentationStatus;
  created_at: string;
};
