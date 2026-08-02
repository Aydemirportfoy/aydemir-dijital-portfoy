-- AYDEMIR V2: 3 AKTIF TEST ILANI
-- Mevcut 3 aktif ilanın bilgilerini ve kapaklarını kopyalar.
-- Test ilanları başlıklarında "ÖRNEK" ibaresiyle görünür.
-- Bu kod tekrar çalıştırılırsa aynı test ilanlarını yeniden oluşturmaz.

do $$
declare
  source_listing record;
  new_listing_id uuid;
  example_number integer := 0;
  example_slug text;
  shared_video_url text;
begin
  select listing_video_url
  into shared_video_url
  from public.listings
  where listing_video_url is not null
  order by updated_at desc
  limit 1;

  for source_listing in
    select *
    from public.listings
    where status = 'active'
      and slug not like 'ornek-test-%'
    order by created_at desc
    limit 3
  loop
    example_number :=
      example_number + 1;

    example_slug :=
      'ornek-test-' ||
      example_number ||
      '-' ||
      source_listing.slug;

    if not exists (
      select 1
      from public.listings
      where slug = example_slug
    ) then
      insert into public.listings (
        slug,
        project_name,
        title,
        city,
        district,
        neighborhood,
        room_count,
        area_m2,
        gross_area_m2,
        floor,
        facade,
        kitchen_type,
        price,
        short_description,
        description,
        features,
        credit_available,
        exchange_available,
        commission_free,
        status,
        cover_image_url,
        listing_video_url,
        listing_video_storage_path,
        created_by
      )
      values (
        example_slug,
        'ÖRNEK ' ||
          coalesce(
            source_listing.project_name,
            'AYDEMİR PORTFÖY'
          ),
        'ÖRNEK ' ||
          example_number ||
          ' · ' ||
          source_listing.title,
        source_listing.city,
        source_listing.district,
        source_listing.neighborhood,
        source_listing.room_count,
        source_listing.area_m2,
        source_listing.gross_area_m2,
        source_listing.floor,
        source_listing.facade,
        source_listing.kitchen_type,
        source_listing.price,
        source_listing.short_description,
        source_listing.description,
        source_listing.features,
        source_listing.credit_available,
        source_listing.exchange_available,
        source_listing.commission_free,
        'active',
        source_listing.cover_image_url,
        coalesce(
          source_listing.listing_video_url,
          shared_video_url
        ),
        null,
        source_listing.created_by
      )
      returning id
      into new_listing_id;

      insert into public.listing_images (
        listing_id,
        image_url,
        storage_path,
        position
      )
      select
        new_listing_id,
        image_url,
        null,
        position
      from public.listing_images
      where listing_id =
        source_listing.id
      order by position;
    end if;
  end loop;
end
$$;

notify pgrst, 'reload schema';
