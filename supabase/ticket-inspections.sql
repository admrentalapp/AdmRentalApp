-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Laudo de inspeção técnica vinculado ao chamado.

create table if not exists public.ticket_inspections (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete cascade,
  inspector_id uuid not null references public.profiles(id) on delete restrict,
  inspected_at timestamptz not null default now(),
  findings text not null,
  probable_cause text not null check (
    probable_cause in (
      'desgaste_natural',
      'operacao_inadequada',
      'mau_uso',
      'defeito_fabricacao',
      'outro'
    )
  ),
  cause_notes text,
  responsibility text not null check (responsibility in ('adm', 'cliente')),
  recommendation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_inspections_ticket_id_idx
  on public.ticket_inspections (ticket_id);

alter table public.ticket_inspections enable row level security;

drop policy if exists "ticket_inspections_select" on public.ticket_inspections;
create policy "ticket_inspections_select"
on public.ticket_inspections
for select
to authenticated
using (public.can_access_ticket(ticket_id));

drop policy if exists "ticket_inspections_insert" on public.ticket_inspections;
create policy "ticket_inspections_insert"
on public.ticket_inspections
for insert
to authenticated
with check (
  inspector_id = auth.uid()
  and public.is_manutencao()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.technician_id = auth.uid()
  )
);

drop policy if exists "ticket_inspections_update" on public.ticket_inspections;
create policy "ticket_inspections_update"
on public.ticket_inspections
for update
to authenticated
using (
  public.is_manutencao()
  and inspector_id = auth.uid()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.technician_id = auth.uid()
  )
)
with check (
  inspector_id = auth.uid()
  and public.is_manutencao()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.technician_id = auth.uid()
  )
);
