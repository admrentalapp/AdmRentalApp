-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Migra equipamentos para frota ADM + alocações a clientes/obras.
-- Preserva dados existentes de equipment.client_id / equipment.site_id.

-- 1) Tabela de alocações (locação)
create table if not exists public.equipment_allocations (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Apenas uma alocação ativa por equipamento
create unique index if not exists equipment_allocations_one_active
  on public.equipment_allocations (equipment_id)
  where ended_at is null;

create index if not exists equipment_allocations_client_active_idx
  on public.equipment_allocations (client_id)
  where ended_at is null;

-- 2) Migrar vínculos antigos (equipment.client_id) para alocações ativas
-- (só funciona enquanto as colunas client_id/site_id ainda existirem em equipment)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'equipment'
      and column_name = 'client_id'
  ) then
    insert into public.equipment_allocations (equipment_id, client_id, site_id, started_at, created_at)
    select e.id, e.client_id, e.site_id, e.created_at, e.created_at
    from public.equipment e
    where e.client_id is not null
      and not exists (
        select 1
        from public.equipment_allocations a
        where a.equipment_id = e.id
          and a.ended_at is null
      );
  end if;
end $$;

-- 3) Remover TODAS as policies antigas de equipment (dependem de client_id/site_id)
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'equipment'
  loop
    execute format('drop policy if exists %I on public.equipment', pol.policyname);
  end loop;
end $$;

-- Policies conhecidas do schema anterior (caso pg_policies não liste todas)
drop policy if exists "equipment_client_select_own" on public.equipment;
drop policy if exists "equipment_gestor_all" on public.equipment;
drop policy if exists "equipment_gestor_select" on public.equipment;
drop policy if exists "equipment_gestor_insert" on public.equipment;
drop policy if exists "equipment_gestor_update" on public.equipment;
drop policy if exists "equipment_gestor_delete" on public.equipment;
drop policy if exists "equipment_select" on public.equipment;
drop policy if exists "equipment_insert" on public.equipment;
drop policy if exists "equipment_update" on public.equipment;
drop policy if exists "equipment_delete" on public.equipment;

-- 4) Remover colunas antigas da frota (patrimônio é da ADM)
alter table public.equipment drop column if exists client_id;
alter table public.equipment drop column if exists site_id;

-- 5) RLS em equipment_allocations
create or replace function public.is_manutencao()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('manutencao_adm', 'manutencao_externa', 'tecnico_adm')
  );
$$;

alter table public.equipment_allocations enable row level security;

drop policy if exists "equipment_allocations_select" on public.equipment_allocations;
create policy "equipment_allocations_select"
on public.equipment_allocations
for select
to authenticated
using (
  public.is_gestor_adm()
  or (public.my_client_id() is not null and client_id = public.my_client_id())
  or public.is_manutencao()
);

drop policy if exists "equipment_allocations_insert" on public.equipment_allocations;
create policy "equipment_allocations_insert"
on public.equipment_allocations
for insert
to authenticated
with check (public.is_gestor_adm());

drop policy if exists "equipment_allocations_update" on public.equipment_allocations;
create policy "equipment_allocations_update"
on public.equipment_allocations
for update
to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

-- 6) Novas policies de equipment (frota ADM — gestor gerencia; demais leem via alocação)
drop policy if exists "equipment_select" on public.equipment;
create policy "equipment_select"
on public.equipment
for select
to authenticated
using (
  public.is_gestor_adm()
  or exists (
    select 1
    from public.equipment_allocations a
    join public.profiles p on p.id = auth.uid()
    where a.equipment_id = equipment.id
      and a.ended_at is null
      and p.role = 'cliente'
      and a.client_id = p.client_id
  )
  or public.is_manutencao()
);

drop policy if exists "equipment_insert" on public.equipment;
create policy "equipment_insert"
on public.equipment
for insert
to authenticated
with check (public.is_gestor_adm());

drop policy if exists "equipment_update" on public.equipment;
create policy "equipment_update"
on public.equipment
for update
to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());
