-- AYDEMIR V2 LARGE VIDEO BUCKET PATCH

update storage.buckets
set
  public = true,
  file_size_limit = 157286400,
  allowed_mime_types = array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v'
  ]
where id = 'listing-media';

notify pgrst, 'reload schema';
