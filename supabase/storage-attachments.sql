-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Cria bucket privado, função de acesso e policies para Storage + tabela attachments.

-- Bucket privado para anexos de chamados (máx. 10 MB, imagens e PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Verifica se o usuário autenticado pode acessar o chamado
create or replace function public.can_access_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    join public.profiles p on p.id = auth.uid()
    where t.id = p_ticket_id
      and (
        p.role = 'gestor_adm'
        or (p.role = 'cliente' and t.client_id = p.client_id)
        or (
          p.role in ('manutencao_adm', 'manutencao_externa')
          and t.technician_id = p.id
        )
      )
  );
$$;

-- Policies da tabela attachments (idempotentes)
alter table public.attachments enable row level security;

drop policy if exists "attachments_select" on public.attachments;
create policy "attachments_select"
on public.attachments
for select
to authenticated
using (public.can_access_ticket(ticket_id));

drop policy if exists "attachments_insert" on public.attachments;
create policy "attachments_insert"
on public.attachments
for insert
to authenticated
with check (
  public.can_access_ticket(ticket_id)
  and created_by = auth.uid()
);

-- Policies do Storage (objetos no bucket ticket-attachments)
-- Caminho esperado: {ticket_id}/{uuid}-{nome_arquivo}

drop policy if exists "ticket_attachments_select" on storage.objects;
create policy "ticket_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and public.can_access_ticket(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "ticket_attachments_insert" on storage.objects;
create policy "ticket_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-attachments'
  and public.can_access_ticket(((storage.foldername(name))[1])::uuid)
);
