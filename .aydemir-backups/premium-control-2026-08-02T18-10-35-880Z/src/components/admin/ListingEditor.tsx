"use client";

import {
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEATURE_OPTIONS } from "@/lib/constants";
import {
  safeFileName,
  slugify,
} from "@/lib/format";
import type {
  Listing,
  ListingImage,
  ListingPrivateDetails,
  ListingStatus,
} from "@/lib/types";

type ExistingImage =
  ListingImage & {
    removed?: boolean;
  };

type Props = {
  mode: "create" | "edit";
  userId: string;
  initialListing?: Listing;
  initialImages?: ListingImage[];
  initialPrivateDetails?:
    | ListingPrivateDetails
    | null;
};

const FACADE_OPTIONS = [
  "Güney",
  "Doğu",
  "Batı",
  "Kuzey",
] as const;

const MAX_VIDEO_BYTES =
  45 * 1024 * 1024;

const MAX_VIDEO_LABEL = "45 MB";

const emptyForm = {
  project_name: "",
  title: "",
  city: "Antalya",
  district: "Kepez",
  neighborhood: "",
  room_count: "",
  area_m2: "",
  floor: "",
  kitchen_type: "",
  price: "",
  short_description: "",
  description: "",
  status: "draft" as ListingStatus,
  credit_available: false,
  exchange_available: false,
  commission_free: true,
};

const emptyPrivate = {
  seller_name: "",
  seller_phone: "",
  available_credit_amount: "",
  maps_url: "",
  location_note: "",
};

type FormState =
  typeof emptyForm;

type PrivateState =
  typeof emptyPrivate;

type DraftData = {
  form?: Partial<FormState>;
  privateDetails?:
    Partial<PrivateState>;
  features?: string[];
  facades?: string[];
  savedAt?: string;
  pendingListingId?: string;
  pendingSlug?: string;
};

type Notice = {
  type: "error" | "info";
  text: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatGrouped(value: string) {
  const clean = digits(value).replace(
    /^0+(?=\d)/,
    "",
  );

  return clean.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );
}

function formatInitialNumber(
  value: number | null | undefined,
) {
  return value === null ||
    value === undefined
    ? ""
    : new Intl.NumberFormat(
        "tr-TR",
        {
          maximumFractionDigits: 0,
        },
      ).format(value);
}

function toNumber(value: string) {
  const clean = digits(value);

  return clean
    ? Number(clean)
    : null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(
      bytes / 1024,
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function withTimeout<T>(
  promise: PromiseLike<T>,
  milliseconds: number,
  message: string,
) {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>(
      (_, reject) => {
        window.setTimeout(() => {
          reject(
            new Error(message),
          );
        }, milliseconds);
      },
    ),
  ]);
}

async function uploadVideoWithProgress({
  file,
  storagePath,
  onProgress,
}: {
  file: File;
  storagePath: string;
  onProgress: (value: number) => void;
}) {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (
    sessionError ||
    !session
  ) {
    throw new Error(
      "Oturum bulunamadı. " +
        "Yeniden giriş yapın.",
    );
  }

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const publishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    !supabaseUrl ||
    !publishableKey
  ) {
    throw new Error(
      "Supabase bağlantı bilgileri eksik.",
    );
  }

  const encodedPath = storagePath
    .split("/")
    .map((part) =>
      encodeURIComponent(part),
    )
    .join("/");

  await new Promise<void>(
    (resolve, reject) => {
      const request =
        new XMLHttpRequest();

      request.open(
        "POST",
        `${supabaseUrl}/storage/v1/` +
          `object/listing-media/` +
          encodedPath,
      );

      request.setRequestHeader(
        "Authorization",
        `Bearer ${session.access_token}`,
      );

      request.setRequestHeader(
        "apikey",
        publishableKey,
      );

      request.setRequestHeader(
        "Content-Type",
        file.type ||
          "application/octet-stream",
      );

      request.setRequestHeader(
        "x-upsert",
        "false",
      );

      request.upload.onprogress = (
        event,
      ) => {
        if (!event.lengthComputable) {
          return;
        }

        onProgress(
          Math.max(
            1,
            Math.min(
              99,
              Math.round(
                (event.loaded /
                  event.total) *
                  100,
              ),
            ),
          ),
        );
      };

      request.onerror = () => {
        reject(
          new Error(
            "Video yükleme bağlantısı kesildi.",
          ),
        );
      };

      request.ontimeout = () => {
        reject(
          new Error(
            "Video yükleme süresi aşıldı.",
          ),
        );
      };

      request.timeout = 240000;

      request.onload = () => {
        if (
          request.status >= 200 &&
          request.status < 300
        ) {
          onProgress(100);
          resolve();
          return;
        }

        let message =
          request.responseText ||
          "Video yüklenemedi.";

        try {
          const parsed = JSON.parse(
            request.responseText,
          ) as {
            message?: string;
            error?: string;
          };

          message =
            parsed.message ||
            parsed.error ||
            message;
        } catch {}

        reject(
          new Error(message),
        );
      };

      request.send(file);
    },
  );

  const { data } =
    supabase.storage
      .from("listing-media")
      .getPublicUrl(
        storagePath,
      );

  return data.publicUrl;
}

export default function ListingEditor({
  mode,
  userId,
  initialListing,
  initialImages = [],
  initialPrivateDetails = null,
}: Props) {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(() =>
      initialListing
        ? {
            project_name:
              initialListing
                .project_name ?? "",
            title:
              initialListing.title,
            city:
              initialListing.city ??
              "Antalya",
            district:
              initialListing.district ??
              "Kepez",
            neighborhood:
              initialListing
                .neighborhood ?? "",
            room_count:
              initialListing
                .room_count ?? "",
            area_m2:
              formatInitialNumber(
                initialListing.area_m2,
              ),
            floor:
              initialListing.floor ??
              "",
            kitchen_type:
              initialListing
                .kitchen_type ?? "",
            price:
              formatInitialNumber(
                initialListing.price,
              ),
            short_description:
              initialListing
                .short_description ??
              "",
            description:
              initialListing
                .description ?? "",
            status:
              initialListing.status,
            credit_available:
              initialListing
                .credit_available,
            exchange_available:
              initialListing
                .exchange_available,
            commission_free:
              initialListing
                .commission_free,
          }
        : { ...emptyForm },
    );

  const [
    privateDetails,
    setPrivateDetails,
  ] = useState<PrivateState>(() => ({
    seller_name:
      initialPrivateDetails
        ?.seller_name ?? "",
    seller_phone:
      initialPrivateDetails
        ?.seller_phone ?? "",
    available_credit_amount:
      formatInitialNumber(
        initialPrivateDetails
          ?.available_credit_amount,
      ),
    maps_url:
      initialPrivateDetails
        ?.maps_url ?? "",
    location_note:
      initialPrivateDetails
        ?.location_note ?? "",
  }));

  const [features, setFeatures] =
    useState<string[]>(
      initialListing?.features ?? [],
    );

  const [facades, setFacades] =
    useState<string[]>(
      initialListing?.facade
        ? initialListing.facade
            .split(",")
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean)
        : [],
    );

  const [
    existingImages,
    setExistingImages,
  ] = useState<ExistingImage[]>(
    initialImages,
  );

  const [newFiles, setNewFiles] =
    useState<File[]>([]);

  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [
    removeExistingVideo,
    setRemoveExistingVideo,
  ] = useState(false);

  const [
    draggedExisting,
    setDraggedExisting,
  ] = useState<number | null>(null);

  const [draggedNew, setDraggedNew] =
    useState<number | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [draftReady, setDraftReady] =
    useState(false);

  const [lastSavedAt, setLastSavedAt] =
    useState("");

  const [
    pendingListingId,
    setPendingListingId,
  ] = useState("");

  const [pendingSlug, setPendingSlug] =
    useState("");

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState<number | null>(null);

  const [uploadStage, setUploadStage] =
    useState("");

  const draftKey =
    mode === "create"
      ? "aydemir-new-listing-draft-v4"
      : `aydemir-edit-listing-draft-v4-${
          initialListing?.id ??
          "unknown"
        }`;

  const activeExisting = useMemo(
    () =>
      existingImages.filter(
        (image) => !image.removed,
      ),
    [existingImages],
  );

  const newImagePreviews =
    useMemo(
      () =>
        newFiles.map((file) => ({
          file,
          url:
            URL.createObjectURL(
              file,
            ),
        })),
      [newFiles],
    );

  const videoPreview = useMemo(
    () =>
      videoFile
        ? URL.createObjectURL(
            videoFile,
          )
        : null,
    [videoFile],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(
        ({ url }) => {
          URL.revokeObjectURL(
            url,
          );
        },
      );
    };
  }, [newImagePreviews]);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(
          videoPreview,
        );
      }
    };
  }, [videoPreview]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          draftKey,
        );

      if (saved) {
        const parsed =
          JSON.parse(
            saved,
          ) as DraftData;

        if (parsed.form) {
          setForm((current) => ({
            ...current,
            ...parsed.form,
          }));
        }

        if (
          parsed.privateDetails
        ) {
          setPrivateDetails(
            (current) => ({
              ...current,
              ...parsed.privateDetails,
            }),
          );
        }

        if (
          Array.isArray(
            parsed.features,
          )
        ) {
          setFeatures(
            parsed.features,
          );
        }

        if (
          Array.isArray(
            parsed.facades,
          )
        ) {
          setFacades(
            parsed.facades,
          );
        }

        if (parsed.savedAt) {
          setLastSavedAt(
            parsed.savedAt,
          );
        }

        if (
          parsed.pendingListingId
        ) {
          setPendingListingId(
            parsed.pendingListingId,
          );
        }

        if (parsed.pendingSlug) {
          setPendingSlug(
            parsed.pendingSlug,
          );
        }
      }
    } catch {
      localStorage.removeItem(
        draftKey,
      );
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (
      !draftReady ||
      saving
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        const savedAt =
          new Date().toISOString();

        const draft: DraftData = {
          form,
          privateDetails,
          features,
          facades,
          savedAt,
          pendingListingId:
            pendingListingId ||
            undefined,
          pendingSlug:
            pendingSlug ||
            undefined,
        };

        localStorage.setItem(
          draftKey,
          JSON.stringify(draft),
        );

        setLastSavedAt(savedAt);
      }, 300);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    draftReady,
    draftKey,
    facades,
    features,
    form,
    pendingListingId,
    pendingSlug,
    privateDetails,
    saving,
  ]);

  function setField<
    K extends keyof FormState,
  >(
    name: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function setPrivateField<
    K extends keyof PrivateState,
  >(
    name: K,
    value: PrivateState[K],
  ) {
    setPrivateDetails(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function toggleFeature(
    feature: string,
  ) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter(
            (item) =>
              item !== feature,
          )
        : [...current, feature],
    );
  }

  function toggleFacade(
    facade: string,
  ) {
    setFacades((current) =>
      current.includes(facade)
        ? current.filter(
            (item) =>
              item !== facade,
          )
        : [...current, facade],
    );
  }

  function selectFiles(
    files: FileList | null,
  ) {
    if (!files) {
      return;
    }

    const accepted =
      Array.from(files).filter(
        (file) => {
          const validType = [
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(file.type);

          const validSize =
            file.size <=
            10 * 1024 * 1024;

          return (
            validType &&
            validSize
          );
        },
      );

    if (
      accepted.length !==
      files.length
    ) {
      setNotice({
        type: "error",
        text:
          "Bazı fotoğraflar uygun " +
          "formatta değildi veya " +
          "10 MB sınırını aşıyordu.",
      });
    }

    setNewFiles((current) => [
      ...current,
      ...accepted,
    ]);
  }

  function selectVideo(
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    const validType = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-m4v",
    ].includes(file.type);

    if (!validType) {
      setNotice({
        type: "error",
        text:
          "İlan klibi MP4, WEBM, " +
          "MOV veya M4V formatında " +
          "olmalıdır.",
      });
      return;
    }

    if (
      file.size >
      MAX_VIDEO_BYTES
    ) {
      setNotice({
        type: "error",
        text:
          `Seçilen video ` +
          `${formatBytes(file.size)}. ` +
          `Bu projede en fazla ` +
          `${MAX_VIDEO_LABEL} video ` +
          `yüklenebilir. Videoyu ` +
          `küçültüp tekrar seçin.`,
      });
      return;
    }

    setVideoFile(file);
    setRemoveExistingVideo(
      false,
    );

    setNotice({
      type: "info",
      text:
        `İlan klibi seçildi: ` +
        `${file.name} ` +
        `(${formatBytes(
          file.size,
        )})`,
    });
  }

  function reorderExisting(
    targetIndex: number,
  ) {
    if (
      draggedExisting === null ||
      draggedExisting ===
        targetIndex
    ) {
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
          visible.splice(
            draggedExisting,
            1,
          );

        visible.splice(
          targetIndex,
          0,
          moved,
        );

        return [
          ...visible,
          ...removed,
        ];
      },
    );

    setDraggedExisting(null);
  }

  function reorderNew(
    targetIndex: number,
  ) {
    if (
      draggedNew === null ||
      draggedNew === targetIndex
    ) {
      return;
    }

    setNewFiles((current) => {
      const next = [...current];

      const [moved] =
        next.splice(
          draggedNew,
          1,
        );

      next.splice(
        targetIndex,
        0,
        moved,
      );

      return next;
    });

    setDraggedNew(null);
  }

  async function findResumableDraft(
    supabase:
      ReturnType<typeof createClient>,
  ) {
    let query = supabase
      .from("listings")
      .select("id, slug")
      .eq(
        "title",
        form.title.trim(),
      )
      .eq(
        "neighborhood",
        form.neighborhood.trim(),
      )
      .eq("status", "draft")
      .order("created_at", {
        ascending: false,
      })
      .limit(1);

    if (
      form.project_name.trim()
    ) {
      query = query.eq(
        "project_name",
        form.project_name.trim(),
      );
    } else {
      query = query.is(
        "project_name",
        null,
      );
    }

    const { data, error } =
      await query.maybeSingle();

    if (error) {
      return null;
    }

    return data;
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setNotice(null);
    setUploadProgress(null);
    setUploadStage("");

    if (
      !form.title.trim() ||
      !form.neighborhood.trim() ||
      !form.room_count.trim()
    ) {
      setNotice({
        type: "error",
        text:
          "Başlık, mahalle ve oda " +
          "sayısı zorunludur.",
      });
      return;
    }

    if (
      videoFile &&
      videoFile.size >
        MAX_VIDEO_BYTES
    ) {
      setNotice({
        type: "error",
        text:
          `İlan klibi ` +
          `${MAX_VIDEO_LABEL} ` +
          `sınırını aşıyor.`,
      });
      return;
    }

    setSaving(true);

    const supabase =
      createClient();

    let listingId =
      initialListing?.id ??
      pendingListingId;

    let slug =
      initialListing?.slug ??
      pendingSlug;

    let listingBaseSaved = false;

    const payload = {
      project_name:
        form.project_name.trim() ||
        null,
      title:
        form.title.trim(),
      city:
        form.city.trim() ||
        "Antalya",
      district:
        form.district.trim() ||
        "Kepez",
      neighborhood:
        form.neighborhood.trim(),
      room_count:
        form.room_count.trim(),
      area_m2:
        toNumber(form.area_m2),
      floor:
        form.floor.trim() ||
        null,
      facade:
        facades.length > 0
          ? facades.join(", ")
          : null,
      kitchen_type:
        form.kitchen_type.trim() ||
        null,
      price:
        toNumber(form.price),
      short_description:
        form.short_description
          .trim() || null,
      description:
        form.description.trim() ||
        null,
      features,
      credit_available:
        form.credit_available,
      exchange_available:
        form.exchange_available,
      commission_free:
        form.commission_free,
      status: form.status,
    };

    try {
      setNotice({
        type: "info",
        text:
          "İlan bilgileri " +
          "kaydediliyor...",
      });

      if (mode === "create") {
        if (listingId) {
          const { data: existing } =
            await supabase
              .from("listings")
              .select("id, slug")
              .eq("id", listingId)
              .maybeSingle();

          if (!existing) {
            listingId = "";
            slug = "";
            setPendingListingId("");
            setPendingSlug("");
          }
        }

        if (!listingId) {
          const resumable =
            await findResumableDraft(
              supabase,
            );

          if (resumable) {
            listingId =
              resumable.id;

            slug =
              resumable.slug;

            setPendingListingId(
              listingId,
            );

            setPendingSlug(slug);

            setNotice({
              type: "info",
              text:
                "Daha önce yarım kalan " +
                "taslak devam ettiriliyor...",
            });
          }
        }

        if (listingId) {
          const result =
            await withTimeout(
              supabase
                .from("listings")
                .update(payload)
                .eq(
                  "id",
                  listingId,
                ),
              25000,
              "İlan güncellemesi " +
                "zaman aşımına uğradı.",
            );

          if (result.error) {
            throw new Error(
              result.error.message,
            );
          }
        } else {
          slug =
            `${
              slugify(
                form.project_name ||
                  form.title,
              ) || "ilan"
            }-${Math.random()
              .toString(36)
              .slice(2, 7)}`;

          const result =
            await withTimeout(
              supabase
                .from("listings")
                .insert({
                  ...payload,
                  slug,
                  created_by:
                    userId,
                })
                .select("id")
                .single(),
              25000,
              "İlan kaydı zaman " +
                "aşımına uğradı.",
            );

          if (
            result.error ||
            !result.data
          ) {
            throw new Error(
              result.error
                ?.message ??
                "İlan oluşturulamadı.",
            );
          }

          listingId =
            result.data.id;

          setPendingListingId(
            listingId,
          );

          setPendingSlug(slug);

          const savedAt =
            new Date().toISOString();

          const draft: DraftData = {
            form,
            privateDetails,
            features,
            facades,
            savedAt,
            pendingListingId:
              listingId,
            pendingSlug: slug,
          };

          localStorage.setItem(
            draftKey,
            JSON.stringify(draft),
          );
        }
      } else {
        const result =
          await withTimeout(
            supabase
              .from("listings")
              .update(payload)
              .eq("id", listingId),
            25000,
            "İlan güncellemesi " +
              "zaman aşımına uğradı.",
          );

        if (result.error) {
          throw new Error(
            result.error.message,
          );
        }
      }

      listingBaseSaved = true;

      setNotice({
        type: "info",
        text:
          "Yöneticiye özel bilgiler " +
          "kaydediliyor...",
      });

      const privateResult =
        await withTimeout(
          supabase
            .from(
              "listing_private_details",
            )
            .upsert(
              {
                listing_id:
                  listingId,
                seller_name:
                  privateDetails
                    .seller_name
                    .trim() ||
                  null,
                seller_phone:
                  privateDetails
                    .seller_phone
                    .trim() ||
                  null,
                available_credit_amount:
                  toNumber(
                    privateDetails
                      .available_credit_amount,
                  ),
                maps_url:
                  privateDetails
                    .maps_url
                    .trim() ||
                  null,
                location_note:
                  privateDetails
                    .location_note
                    .trim() ||
                  null,
              },
              {
                onConflict:
                  "listing_id",
              },
            ),
          25000,
          "Özel bilgiler kaydedilirken " +
            "süre aşıldı.",
        );

      if (privateResult.error) {
        throw new Error(
          privateResult.error.message,
        );
      }

      const removedImages =
        existingImages.filter(
          (image) =>
            image.removed,
        );

      if (
        removedImages.length > 0
      ) {
        const storagePaths =
          removedImages
            .map(
              (image) =>
                image.storage_path,
            )
            .filter(
              Boolean,
            ) as string[];

        if (
          storagePaths.length > 0
        ) {
          await withTimeout(
            supabase.storage
              .from(
                "listing-images",
              )
              .remove(storagePaths),
            30000,
            "Silinen fotoğraflar " +
              "temizlenirken süre aşıldı.",
          );
        }

        const deleteResult =
          await withTimeout(
            supabase
              .from(
                "listing_images",
              )
              .delete()
              .in(
                "id",
                removedImages.map(
                  (image) =>
                    image.id,
                ),
              ),
            25000,
            "Fotoğraf kayıtları " +
              "silinirken süre aşıldı.",
          );

        if (
          deleteResult.error
        ) {
          throw new Error(
            deleteResult
              .error.message,
          );
        }
      }

      const keptExisting =
        existingImages.filter(
          (image) =>
            !image.removed,
        );

      for (
        let index = 0;
        index <
        keptExisting.length;
        index += 1
      ) {
        const positionResult =
          await withTimeout(
            supabase
              .from(
                "listing_images",
              )
              .update({
                position: index,
              })
              .eq(
                "id",
                keptExisting[index]
                  .id,
              ),
            20000,
            "Fotoğraf sırası " +
              "kaydedilirken süre aşıldı.",
          );

        if (
          positionResult.error
        ) {
          throw new Error(
            positionResult
              .error.message,
          );
        }
      }

      const uploadedRows: Array<{
        listing_id: string;
        image_url: string;
        storage_path: string;
        position: number;
      }> = [];

      for (
        let index = 0;
        index <
        newFiles.length;
        index += 1
      ) {
        const file =
          newFiles[index];

        setNotice({
          type: "info",
          text:
            `Fotoğraflar ` +
            `yükleniyor ` +
            `(${index + 1}/` +
            `${newFiles.length})...`,
        });

        const storagePath =
          `${listingId}/` +
          `${crypto.randomUUID()}-` +
          `${safeFileName(
            file.name,
          )}`;

        const uploadResult =
          await withTimeout(
            supabase.storage
              .from(
                "listing-images",
              )
              .upload(
                storagePath,
                file,
                {
                  cacheControl:
                    "3600",
                  upsert: false,
                },
              ),
            90000,
            `${file.name} ` +
              "yüklenirken süre aşıldı.",
          );

        if (
          uploadResult.error
        ) {
          throw new Error(
            uploadResult
              .error.message,
          );
        }

        const {
          data: publicUrl,
        } =
          supabase.storage
            .from(
              "listing-images",
            )
            .getPublicUrl(
              storagePath,
            );

        uploadedRows.push({
          listing_id:
            listingId,
          image_url:
            publicUrl.publicUrl,
          storage_path:
            storagePath,
          position:
            keptExisting.length +
            index,
        });
      }

      if (
        uploadedRows.length > 0
      ) {
        const imageInsertResult =
          await withTimeout(
            supabase
              .from(
                "listing_images",
              )
              .insert(
                uploadedRows,
              ),
            30000,
            "Fotoğraf bilgileri " +
              "kaydedilirken süre aşıldı.",
          );

        if (
          imageInsertResult.error
        ) {
          throw new Error(
            imageInsertResult
              .error.message,
          );
        }
      }

      const cover =
        keptExisting[0]
          ?.image_url ??
        uploadedRows[0]
          ?.image_url ??
        initialListing
          ?.cover_image_url ??
        null;

      const coverResult =
        await withTimeout(
          supabase
            .from("listings")
            .update({
              cover_image_url:
                cover,
            })
            .eq("id", listingId),
          25000,
          "Kapak fotoğrafı " +
            "kaydedilirken süre aşıldı.",
        );

      if (coverResult.error) {
        throw new Error(
          coverResult.error.message,
        );
      }

      let listingVideoUrl =
        removeExistingVideo
          ? null
          : initialListing
              ?.listing_video_url ??
            null;

      let listingVideoStoragePath =
        removeExistingVideo
          ? null
          : initialListing
              ?.listing_video_storage_path ??
            null;

      if (
        removeExistingVideo &&
        initialListing
          ?.listing_video_storage_path
      ) {
        await withTimeout(
          supabase.storage
            .from("listing-media")
            .remove([
              initialListing
                .listing_video_storage_path,
            ]),
          30000,
          "Eski ilan klibi " +
            "silinirken süre aşıldı.",
        );
      }

      if (videoFile) {
        setUploadProgress(0);
        setUploadStage(
          "İlan klibi hazırlanıyor",
        );

        if (
          initialListing
            ?.listing_video_storage_path
        ) {
          await supabase.storage
            .from("listing-media")
            .remove([
              initialListing
                .listing_video_storage_path,
            ]);
        }

        const videoStoragePath =
          `${listingId}/` +
          `ilan-klibi-` +
          `${crypto.randomUUID()}-` +
          `${safeFileName(
            videoFile.name,
          )}`;

        listingVideoUrl =
          await uploadVideoWithProgress(
            {
              file: videoFile,
              storagePath:
                videoStoragePath,
              onProgress: (
                progress,
              ) => {
                setUploadProgress(
                  progress,
                );

                setUploadStage(
                  `İlan klibi ` +
                    `yükleniyor · ` +
                    `%${progress}`,
                );
              },
            },
          );

        listingVideoStoragePath =
          videoStoragePath;

        setUploadStage(
          "İlan klibi yüklendi",
        );
      }

      const finalResult =
        await withTimeout(
          supabase
            .from("listings")
            .update({
              listing_video_url:
                listingVideoUrl,
              listing_video_storage_path:
                listingVideoStoragePath,
            })
            .eq("id", listingId),
          30000,
          "İlan sonlandırılırken " +
            "süre aşıldı.",
        );

      if (finalResult.error) {
        throw new Error(
          finalResult.error.message,
        );
      }

      localStorage.removeItem(
        draftKey,
      );

      setUploadProgress(100);
      setUploadStage(
        "Tüm bilgiler kaydedildi",
      );

      router.push(
        "/yonetim/ilanlar",
      );

      router.refresh();
    } catch (error) {
      setUploadProgress(null);
      setUploadStage("");

      const message =
        error instanceof Error
          ? error.message
          : "Bilinmeyen hata";

      setNotice({
        type: "error",
        text: listingBaseSaved
          ? "İlan, özel bilgiler ve " +
            "tamamlanan medyalar " +
            "kaydedildi; işlem şu " +
            `aşamada durdu: ${message}. ` +
            "Bu taslak tekrar " +
            "kaydedildiğinde aynı " +
            "ilan üzerinden devam eder."
          : `İlan kaydedilemedi: ` +
            message,
      });
    } finally {
      setSaving(false);
    }
  }

  const formattedSavedAt =
    lastSavedAt
      ? new Intl.DateTimeFormat(
          "tr-TR",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          },
        ).format(
          new Date(lastSavedAt),
        )
      : "";

  const visibleVideoUrl =
    videoPreview ??
    (!removeExistingVideo
      ? initialListing
          ?.listing_video_url
      : null);

  return (
    <form
      className="ap-admin-page"
      onSubmit={submit}
    >
      <section className="ap-admin-hero">
        <div>
          <p className="ap-kicker">
            {mode === "create"
              ? "YENİ PORTFÖY"
              : "İLAN DÜZENLE"}
          </p>

          <h1>
            {mode === "create"
              ? "Yeni İlan Ekle"
              : form.title}
          </h1>

          <p className="ap-muted">
            Bilgileri düzenleyin,
            fotoğrafları doğrudan
            tutup sürükleyerek
            sıralayın.
          </p>

          <p className="ap-autosave-note">
            <span>●</span>
            Bilgiler otomatik
            saklanıyor
            {formattedSavedAt
              ? ` · Son kayıt ` +
                formattedSavedAt
              : ""}
          </p>
        </div>

        <button
          type="submit"
          className="ap-primary-button"
          disabled={saving}
        >
          {saving
            ? "Kaydediliyor..."
            : mode === "create"
              ? "İlanı Kaydet"
              : "Değişiklikleri Kaydet"}
        </button>
      </section>

      {notice ? (
        <div
          className={
            notice.type === "info"
              ? "ap-form-message success"
              : "ap-form-message"
          }
        >
          {notice.text}
        </div>
      ) : null}

      {saving ? (
        <div className="ap-save-progress ap-glass">
          <div className="ap-save-progress-icon">
            {uploadProgress !== null
              ? "▶"
              : "✓"}
          </div>

          <div>
            <strong>
              {uploadStage ||
                "İlan kaydediliyor"}
            </strong>

            <span>
              {uploadProgress !== null
                ? `%${uploadProgress}`
                : "Bilgiler güvenli " +
                  "şekilde işleniyor"}
            </span>
          </div>

          <div className="ap-save-progress-track">
            <i
              style={{
                width:
                  uploadProgress !== null
                    ? `${uploadProgress}%`
                    : "34%",
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="ap-editor-layout">
        <section className="ap-form-card ap-glass">
          <h2>Temel Bilgiler</h2>

          <div className="ap-form-grid">
            <label className="ap-field span-2">
              <span>Proje Adı</span>

              <input
                value={form.project_name}
                onChange={(event) =>
                  setField(
                    "project_name",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>
                İlan Başlığı *
              </span>

              <input
                value={form.title}
                onChange={(event) =>
                  setField(
                    "title",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Şehir</span>

              <input
                value={form.city}
                onChange={(event) =>
                  setField(
                    "city",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>İlçe</span>

              <input
                value={form.district}
                onChange={(event) =>
                  setField(
                    "district",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Mahalle *</span>

              <input
                value={
                  form.neighborhood
                }
                onChange={(event) =>
                  setField(
                    "neighborhood",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Oda Sayısı *</span>

              <input
                placeholder="3+1"
                value={
                  form.room_count
                }
                onChange={(event) =>
                  setField(
                    "room_count",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Metrekare</span>

              <input
                inputMode="numeric"
                placeholder="120"
                value={form.area_m2}
                onChange={(event) =>
                  setField(
                    "area_m2",
                    formatGrouped(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>

            <label className="ap-field">
              <span>Kat</span>

              <input
                value={form.floor}
                onChange={(event) =>
                  setField(
                    "floor",
                    event.target.value,
                  )
                }
              />
            </label>

            <fieldset className="ap-field span-2">
              <legend>
                Cephe Seçenekleri
              </legend>

              <div className="ap-facade-picker">
                {FACADE_OPTIONS.map(
                  (facade) => (
                    <button
                      type="button"
                      key={facade}
                      className={
                        facades.includes(
                          facade,
                        )
                          ? "is-active"
                          : ""
                      }
                      onClick={() =>
                        toggleFacade(
                          facade,
                        )
                      }
                    >
                      <span>
                        {facades.includes(
                          facade,
                        )
                          ? "✓"
                          : "+"}
                      </span>
                      {facade}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <label className="ap-field">
              <span>Mutfak Tipi</span>

              <select
                value={
                  form.kitchen_type
                }
                onChange={(event) =>
                  setField(
                    "kitchen_type",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Seçiniz
                </option>
                <option value="Ayrı mutfak">
                  Ayrı mutfak
                </option>
                <option value="Açık mutfak">
                  Açık mutfak
                </option>
              </select>
            </label>

            <label className="ap-field">
              <span>Fiyat</span>

              <input
                inputMode="numeric"
                placeholder="5.500.000"
                value={form.price}
                onChange={(event) =>
                  setField(
                    "price",
                    formatGrouped(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>Kısa Açıklama</span>

              <textarea
                rows={3}
                value={
                  form.short_description
                }
                onChange={(event) =>
                  setField(
                    "short_description",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="ap-field span-2">
              <span>
                Detaylı Açıklama
              </span>

              <textarea
                rows={7}
                value={
                  form.description
                }
                onChange={(event) =>
                  setField(
                    "description",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </section>

        <aside className="ap-form-card ap-glass">
          <h2>Yayın ve Satış</h2>

          <label className="ap-field">
            <span>İlan Durumu</span>

            <select
              value={form.status}
              onChange={(event) =>
                setField(
                  "status",
                  event.target
                    .value as ListingStatus,
                )
              }
            >
              <option value="draft">
                Taslak
              </option>
              <option value="active">
                Aktif
              </option>
              <option value="reserved">
                Rezerve
              </option>
              <option value="sold">
                Satıldı
              </option>
            </select>
          </label>

          <div className="ap-toggle-list">
            <label className="ap-switch-row">
              <span>
                Kredi imkânı
              </span>

              <input
                type="checkbox"
                checked={
                  form.credit_available
                }
                onChange={(event) =>
                  setField(
                    "credit_available",
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="ap-switch-row">
              <span>
                Takas imkânı
              </span>

              <input
                type="checkbox"
                checked={
                  form.exchange_available
                }
                onChange={(event) =>
                  setField(
                    "exchange_available",
                    event.target.checked,
                  )
                }
              />
            </label>

            <label className="ap-switch-row">
              <span>
                Komisyonsuz firma
                satışı
              </span>

              <input
                type="checkbox"
                checked={
                  form.commission_free
                }
                onChange={(event) =>
                  setField(
                    "commission_free",
                    event.target.checked,
                  )
                }
              />
            </label>
          </div>

          <h2 className="ap-subsection-title">
            Özellikler
          </h2>

          <div className="ap-feature-picker">
            {FEATURE_OPTIONS.map(
              (feature) => (
                <button
                  type="button"
                  key={feature}
                  className={
                    features.includes(
                      feature,
                    )
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    toggleFeature(
                      feature,
                    )
                  }
                >
                  <span>
                    {features.includes(
                      feature,
                    )
                      ? "✓"
                      : "+"}
                  </span>
                  {feature}
                </button>
              ),
            )}
          </div>
        </aside>
      </div>

      <section className="ap-private-editor ap-glass">
        <div className="ap-private-editor-head">
          <div>
            <p className="ap-kicker">
              SADECE YÖNETİCİLER
            </p>

            <h2>
              Satıcı, Kredi ve Konum
            </h2>

            <p>
              Bu bilgiler halka açık ilan
              sayfasında ve müşteri
              sunumlarında görünmez.
            </p>
          </div>

          <span className="ap-private-lock">
            Kilitli Alan
          </span>
        </div>

        <div className="ap-form-grid">
          <label className="ap-field">
            <span>Satıcı İsmi</span>

            <input
              placeholder="Ahmet Bey"
              value={
                privateDetails
                  .seller_name
              }
              onChange={(event) =>
                setPrivateField(
                  "seller_name",
                  event.target.value,
                )
              }
            />
          </label>

          <label className="ap-field">
            <span>
              Satıcı Telefonu
            </span>

            <input
              inputMode="tel"
              placeholder="05xx xxx xx xx"
              value={
                privateDetails
                  .seller_phone
              }
              onChange={(event) =>
                setPrivateField(
                  "seller_phone",
                  event.target.value,
                )
              }
            />
          </label>

          <label className="ap-field">
            <span>
              Çıkabilecek Kredi
            </span>

            <input
              inputMode="numeric"
              placeholder="3.500.000"
              value={
                privateDetails
                  .available_credit_amount
              }
              onChange={(event) =>
                setPrivateField(
                  "available_credit_amount",
                  formatGrouped(
                    event.target.value,
                  ),
                )
              }
            />
          </label>

          <label className="ap-field">
            <span>
              Google Maps Konumu
            </span>

            <input
              placeholder={
                "Maps linki, adres veya " +
                "koordinat"
              }
              value={
                privateDetails
                  .maps_url
              }
              onChange={(event) =>
                setPrivateField(
                  "maps_url",
                  event.target.value,
                )
              }
            />
          </label>

          <label className="ap-field span-2">
            <span>
              Konum / Ulaşım Notu
            </span>

            <textarea
              rows={3}
              placeholder={
                "Anahtar kimde, bina girişi, " +
                "yakın nokta gibi hızlı notlar"
              }
              value={
                privateDetails
                  .location_note
              }
              onChange={(event) =>
                setPrivateField(
                  "location_note",
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>

      <section
        className="ap-form-card ap-glass"
        style={{
          marginTop: 16,
        }}
      >
        <div className="ap-section-heading-row">
          <div>
            <h2>
              Fotoğraf Yönetimi
            </h2>

            <p className="ap-muted">
              Fotoğrafın herhangi bir
              yerinden tutup sürükleyin.
              İlk fotoğraf kapak olur.
            </p>
          </div>

          <label className="ap-upload-button">
            Fotoğraf Seç
            <input
              type="file"
              accept={
                "image/jpeg," +
                "image/png," +
                "image/webp"
              }
              multiple
              onChange={(event) =>
                selectFiles(
                  event.target.files,
                )
              }
            />
          </label>
        </div>

        {activeExisting.length === 0 &&
        newFiles.length === 0 ? (
          <div className="ap-upload-empty">
            JPG, PNG veya WEBP
            fotoğrafları seçin. Dosya
            başına en fazla 10 MB.
          </div>
        ) : (
          <div className="ap-photo-grid">
            {activeExisting.map(
              (image, index) => (
                <article
                  key={image.id}
                  className="ap-photo-card"
                  draggable
                  onDragStart={() =>
                    setDraggedExisting(
                      index,
                    )
                  }
                  onDragOver={(
                    event: DragEvent,
                  ) =>
                    event.preventDefault()
                  }
                  onDrop={() =>
                    reorderExisting(
                      index,
                    )
                  }
                >
                  <img
                    src={
                      image.image_url
                    }
                    alt=""
                  />

                  <span className="ap-photo-order">
                    {index + 1}
                  </span>

                  {index === 0 ? (
                    <span className="ap-cover-badge">
                      Kapak
                    </span>
                  ) : null}

                  <button
                    type="button"
                    className="ap-photo-delete"
                    onClick={() =>
                      setExistingImages(
                        (current) =>
                          current.map(
                            (item) =>
                              item.id ===
                              image.id
                                ? {
                                    ...item,
                                    removed:
                                      true,
                                  }
                                : item,
                          ),
                      )
                    }
                  >
                    Sil
                  </button>
                </article>
              ),
            )}

            {newImagePreviews.map(
              (
                {
                  file,
                  url,
                },
                index,
              ) => {
                const position =
                  activeExisting.length +
                  index;

                return (
                  <article
                    key={
                      `${file.name}-` +
                      `${file.lastModified}-` +
                      `${index}`
                    }
                    className="ap-photo-card"
                    draggable
                    onDragStart={() =>
                      setDraggedNew(
                        index,
                      )
                    }
                    onDragOver={(
                      event: DragEvent,
                    ) =>
                      event.preventDefault()
                    }
                    onDrop={() =>
                      reorderNew(index)
                    }
                  >
                    <img
                      src={url}
                      alt=""
                    />

                    <span className="ap-photo-order">
                      {position + 1}
                    </span>

                    {position === 0 ? (
                      <span className="ap-cover-badge">
                        Kapak
                      </span>
                    ) : null}

                    <button
                      type="button"
                      className="ap-photo-delete"
                      onClick={() =>
                        setNewFiles(
                          (current) =>
                            current.filter(
                              (
                                _,
                                fileIndex,
                              ) =>
                                fileIndex !==
                                index,
                            ),
                        )
                      }
                    >
                      Sil
                    </button>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section className="ap-video-editor ap-glass">
        <div className="ap-video-editor-copy">
          <p className="ap-kicker">
            YENİ NESİL SUNUM
          </p>

          <h2>İlan Klibi</h2>

          <p>
            Dairenin akışını tek videoda
            gösterin. Video yüklenirken
            ilerleme yüzdesi canlı olarak
            görünür.
          </p>

          <label className="ap-upload-button">
            {visibleVideoUrl
              ? "Klibi Değiştir"
              : "Video Seç"}

            <input
              type="file"
              accept={
                "video/mp4," +
                "video/webm," +
                "video/quicktime," +
                "video/x-m4v"
              }
              onChange={(event) =>
                selectVideo(
                  event.target
                    .files?.[0] ??
                    null,
                )
              }
            />
          </label>

          <small className="ap-video-limit">
            MP4, WEBM, MOV veya M4V ·
            En fazla {MAX_VIDEO_LABEL}
          </small>
        </div>

        <div className="ap-video-editor-preview">
          {visibleVideoUrl ? (
            <>
              <video
                src={visibleVideoUrl}
                controls
                preload="metadata"
              />

              {videoFile ? (
                <div className="ap-selected-video-info">
                  <strong>
                    {videoFile.name}
                  </strong>

                  <span>
                    {formatBytes(
                      videoFile.size,
                    )}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                className="ap-danger-button"
                onClick={() => {
                  setVideoFile(null);
                  setRemoveExistingVideo(
                    true,
                  );
                }}
              >
                Klibi Kaldır
              </button>
            </>
          ) : (
            <div className="ap-video-placeholder">
              <span>▶</span>

              <strong>
                İlan klibi eklenmedi
              </strong>

              <small>
                Video seçildiğinde
                önizleme burada görünür
              </small>
            </div>
          )}

          {uploadProgress !== null ? (
            <div className="ap-video-live-progress">
              <div>
                <strong>
                  {uploadStage}
                </strong>

                <span>
                  %{uploadProgress}
                </span>
              </div>

              <div>
                <i
                  style={{
                    width:
                      `${uploadProgress}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <p className="ap-media-security-note">
        Metinler, özel bilgiler,
        seçimler ve özellikler otomatik
        saklanır. Tarayıcı güvenliği
        nedeniyle henüz yüklenmemiş
        fotoğraf ve video dosyaları sayfa
        yenilenirse yeniden seçilmelidir.
      </p>

      <div className="ap-mobile-save-bar">
        <button
          type="submit"
          className="ap-primary-button"
          disabled={saving}
        >
          {saving
            ? "Kaydediliyor..."
            : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
