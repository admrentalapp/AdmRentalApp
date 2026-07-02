-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Corrige policies de tickets e ticket_events após migração equipment_allocations.
-- Remove referências a equipment.client_id (coluna removida da frota ADM).
--
-- Pré-requisitos: equipment-allocations.sql e ticket-client-fields.sql já aplicados.
-- Pode rodar várias vezes (idempotente).

-- =============================================================================
-- 0) Limpeza: triggers e funções legadas que referenciam equipment.client_id
-- =============================================================================

do $$
declare
  trg record;
begin
  for trg in
    select t.tgname, c.relname as table_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not t.tgisinternal
      and c.relname in ('tickets', 'ticket_events', 'equipment', 'equipment_allocations')
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      trg.tgname,
      trg.table_name
    );
  end loop;
end $$;

do $$
declare
  fn record;
begin
  for fn in
    select
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and pg_get_functiondef(p.oid) ilike '%client_id%'
      and pg_get_functiondef(p.oid) ilike '%equipment%'
      and p.proname not in (
        'equipment_allocated_to_client',
        'validate_client_ticket_insert',
        'validate_gestor_ticket_insert',
        'get_client_allocated_fleet',
        'is_gestor_adm',
        'is_manutencao',
        'is_technician_adm',
        'my_client_id',
        'site_belongs_to_client',
        'can_access_ticket'
      )
  loop
    execute format(
      'drop function if exists public.%I(%s) cascade',
      fn.proname,
      fn.args
    );
  end loop;
end $$;

-- =============================================================================
-- 1) Funções auxiliares
-- =============================================================================

create or replace function public.is_gestor_adm()
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
      and role = 'gestor_adm'
  );
$$;

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
      and role in ('manutencao_adm', 'manutencao_externa')
  );
$$;

create or replace function public.is_technician_adm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manutencao();
$$;

create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id
  from public.profiles
  where id = auth.uid();
$$;

-- Equipamento alocado ao cliente (via equipment_allocations, não equipment.client_id)
create or replace function public.equipment_allocated_to_client(
  p_equipment_id uuid,
  p_client_id uuid,
  p_site_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.equipment_allocations a
    where a.equipment_id = p_equipment_id
      and a.client_id = p_client_id
      and a.ended_at is null
      and (
        p_site_id is null
        or a.site_id is null
        or a.site_id = p_site_id
      )
  );
$$;

-- Obra pertence ao cliente do chamado
create or replace function public.site_belongs_to_client(
  p_site_id uuid,
  p_client_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and s.client_id = p_client_id
  );
$$;

-- Validação de abertura pelo cliente (SECURITY DEFINER — não usa equipment.client_id)
create or replace function public.validate_client_ticket_insert(
  p_client_id uuid,
  p_site_id uuid,
  p_equipment_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_my_client_id uuid;
begin
  select p.client_id
  into v_my_client_id
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'cliente';

  if v_my_client_id is null or v_my_client_id <> p_client_id then
    return false;
  end if;

  if p_site_id is null or p_equipment_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.sites s
    where s.id = p_site_id
      and s.client_id = p_client_id
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from public.equipment_allocations a
    where a.equipment_id = p_equipment_id
      and a.client_id = p_client_id
      and a.ended_at is null
      and (a.site_id is null or a.site_id = p_site_id)
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- Validação de abertura pelo gestor
create or replace function public.validate_gestor_ticket_insert(
  p_client_id uuid,
  p_site_id uuid,
  p_equipment_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_gestor_adm()
    and (
      p_site_id is null
      or public.site_belongs_to_client(p_site_id, p_client_id)
    )
    and (
      p_equipment_id is null
      or public.equipment_allocated_to_client(p_equipment_id, p_client_id, p_site_id)
    );
$$;

-- Frota alocada do cliente (evita join PostgREST com RLS quebrado em equipment)
create or replace function public.get_client_allocated_fleet(p_client_id uuid)
returns table (
  equipment_id uuid,
  asset_tag text,
  description text,
  serial_number text,
  active boolean,
  equipment_created_at timestamptz,
  allocation_id uuid,
  allocation_client_id uuid,
  allocation_site_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  allocation_created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.asset_tag,
    e.description,
    e.serial_number,
    e.active,
    e.created_at,
    a.id,
    a.client_id,
    a.site_id,
    a.started_at,
    a.ended_at,
    a.created_at
  from public.equipment_allocations a
  join public.equipment e on e.id = a.equipment_id
  where a.client_id = p_client_id
    and a.ended_at is null
    and (
      public.is_gestor_adm()
      or (
        public.my_client_id() is not null
        and p_client_id = public.my_client_id()
      )
    )
  order by e.asset_tag;
$$;

grant execute on function public.get_client_allocated_fleet(uuid) to authenticated;
grant execute on function public.validate_client_ticket_insert(uuid, uuid, uuid) to authenticated;
grant execute on function public.validate_gestor_ticket_insert(uuid, uuid, uuid) to authenticated;

-- Acesso ao chamado (usado por attachments, ticket_events, storage)
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

-- =============================================================================
-- 2) Remover policies antigas de tickets
-- =============================================================================

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tickets'
  loop
    execute format('drop policy if exists %I on public.tickets', pol.policyname);
  end loop;
end $$;

drop policy if exists "tickets_gestor_all" on public.tickets;
drop policy if exists "tickets_gestor_select" on public.tickets;
drop policy if exists "tickets_gestor_insert" on public.tickets;
drop policy if exists "tickets_gestor_update" on public.tickets;
drop policy if exists "tickets_gestor_delete" on public.tickets;
drop policy if exists "tickets_client_select_own" on public.tickets;
drop policy if exists "tickets_client_insert_own" on public.tickets;
drop policy if exists "tickets_client_insert" on public.tickets;
drop policy if exists "tickets_technician_select" on public.tickets;
drop policy if exists "tickets_manutencao_select" on public.tickets;
drop policy if exists "tickets_select" on public.tickets;
drop policy if exists "tickets_insert" on public.tickets;
drop policy if exists "tickets_update" on public.tickets;

-- =============================================================================
-- 3) Policies de tickets (modelo frota ADM + alocações)
-- =============================================================================

alter table public.tickets enable row level security;

-- Gestor: vê todos os chamados
create policy "tickets_gestor_select"
on public.tickets
for select
to authenticated
using (public.is_gestor_adm());

-- Cliente: vê chamados da própria empresa
create policy "tickets_client_select"
on public.tickets
for select
to authenticated
using (
  public.my_client_id() is not null
  and client_id = public.my_client_id()
);

-- Manutenção: vê chamados atribuídos
create policy "tickets_manutencao_select"
on public.tickets
for select
to authenticated
using (
  public.is_manutencao()
  and technician_id = auth.uid()
);

-- Gestor: cria chamado para qualquer cliente
create policy "tickets_gestor_insert"
on public.tickets
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.validate_gestor_ticket_insert(client_id, site_id, equipment_id)
);

-- Cliente: abre chamado da própria empresa (obra + equipamento alocado)
create policy "tickets_client_insert"
on public.tickets
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.validate_client_ticket_insert(client_id, site_id, equipment_id)
);

-- Gestor: triagem, prioridade, técnico, encerramento
create policy "tickets_gestor_update"
on public.tickets
for update
to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

-- =============================================================================
-- 4) Remover policies antigas de ticket_events
-- =============================================================================

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ticket_events'
  loop
    execute format('drop policy if exists %I on public.ticket_events', pol.policyname);
  end loop;
end $$;

drop policy if exists "ticket_events_select" on public.ticket_events;
drop policy if exists "ticket_events_gestor_insert" on public.ticket_events;
drop policy if exists "ticket_events_client_insert" on public.ticket_events;
drop policy if exists "ticket_events_technician_insert" on public.ticket_events;
drop policy if exists "ticket_events_manutencao_insert" on public.ticket_events;
drop policy if exists "ticket_events_insert" on public.ticket_events;

-- =============================================================================
-- 5) Policies de ticket_events
-- =============================================================================

alter table public.ticket_events enable row level security;

create policy "ticket_events_select"
on public.ticket_events
for select
to authenticated
using (public.can_access_ticket(ticket_id));

-- Gestor e cliente registram eventos nos chamados que acessam
create policy "ticket_events_gestor_insert"
on public.ticket_events
for insert
to authenticated
with check (
  public.is_gestor_adm()
  and created_by = auth.uid()
  and public.can_access_ticket(ticket_id)
);

create policy "ticket_events_client_insert"
on public.ticket_events
for insert
to authenticated
with check (
  public.my_client_id() is not null
  and created_by = auth.uid()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.client_id = public.my_client_id()
  )
);

-- Manutenção: anotações em chamados atribuídos
create policy "ticket_events_manutencao_insert"
on public.ticket_events
for insert
to authenticated
with check (
  public.is_manutencao()
  and created_by = auth.uid()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.technician_id = auth.uid()
  )
);

-- =============================================================================
-- 6) Reaplicar policies de equipment e equipment_allocations
-- =============================================================================

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('equipment', 'equipment_allocations')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname,
      pol.tablename
    );
  end loop;
end $$;

alter table public.equipment_allocations enable row level security;

create policy "equipment_allocations_select"
on public.equipment_allocations
for select
to authenticated
using (
  public.is_gestor_adm()
  or (public.my_client_id() is not null and client_id = public.my_client_id())
  or public.is_manutencao()
);

create policy "equipment_allocations_insert"
on public.equipment_allocations
for insert
to authenticated
with check (public.is_gestor_adm());

create policy "equipment_allocations_update"
on public.equipment_allocations
for update
to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

alter table public.equipment enable row level security;

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

create policy "equipment_insert"
on public.equipment
for insert
to authenticated
with check (public.is_gestor_adm());

create policy "equipment_update"
on public.equipment
for update
to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

-- =============================================================================
-- 7) Reaplicar can_access_ticket em attachments (idempotente)
-- =============================================================================

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
