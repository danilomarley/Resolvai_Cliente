-- Bucket das fotos dos pedidos. Rodar uma vez no SQL Editor do Supabase.
-- Leitura pública (as URLs vão para pedidos e propostas) e envio só para
-- usuários autenticados, dentro da pasta com o próprio id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos', 'pedidos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "pedidos_leitura_publica"
on storage.objects for select
using (bucket_id = 'pedidos');

create policy "pedidos_envio_na_propria_pasta"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'pedidos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
