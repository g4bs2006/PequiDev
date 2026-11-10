-- Bucket público das imagens do site: capas e telas de projetos e de posts.
-- Qualquer pessoa vê pelo endereço público. Só quem é admin envia, troca ou apaga.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens', 'imagens', true, 5242880,
  array['image/webp', 'image/avif', 'image/png', 'image/jpeg']
);

create policy "Admin envia imagens"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'imagens' and (select private.is_admin()));

create policy "Admin lista imagens"
  on storage.objects for select to authenticated
  using (bucket_id = 'imagens' and (select private.is_admin()));

create policy "Admin troca imagens"
  on storage.objects for update to authenticated
  using (bucket_id = 'imagens' and (select private.is_admin()))
  with check (bucket_id = 'imagens' and (select private.is_admin()));

create policy "Admin apaga imagens"
  on storage.objects for delete to authenticated
  using (bucket_id = 'imagens' and (select private.is_admin()));
