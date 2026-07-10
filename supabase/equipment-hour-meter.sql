-- Horímetro de equipamentos + leitura no laudo + histórico
-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)

-- 1) Campos no equipamento (leitura atual)
alter table public.equipment
  add column if not exists hour_meter_current numeric(12, 1),
  add column if not exists hour_meter_updated_at timestamptz;

comment on column public.equipment.hour_meter_current is
  'Última leitura conhecida do horímetro (horas)';
comment on column public.equipment.hour_meter_updated_at is
  'Data/hora da última atualização do horímetro';

-- 2) Leitura no laudo de inspeção
alter table public.ticket_inspections
  add column if not exists hour_meter_reading numeric(12, 1);

comment on column public.ticket_inspections.hour_meter_reading is
  'Horímetro registrado na inspeção técnica (horas)';

-- 3) Histórico de leituras
create table if not exists public.equipment_hour_meter_readings (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  reading_value numeric(12, 1) not null check (reading_value >= 0),
  read_at timestamptz not null default now(),
  source text not null check (
    source in ('manual', 'abertura_chamado', 'inspecao', 'conclusao')
  ),
  ticket_id uuid references public.tickets(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_hour_meter_readings_equipment_idx
  on public.equipment_hour_meter_readings (equipment_id, read_at desc);

create index if not exists equipment_hour_meter_readings_ticket_idx
  on public.equipment_hour_meter_readings (ticket_id)
  where ticket_id is not null;

alter table public.equipment_hour_meter_readings enable row level security;

drop policy if exists "hour_meter_readings_select" on public.equipment_hour_meter_readings;
create policy "hour_meter_readings_select"
on public.equipment_hour_meter_readings
for select
to authenticated
using (
  public.is_gestor_adm()
  or public.is_manutencao()
  or exists (
    select 1
    from public.equipment_allocations a
    where a.equipment_id = equipment_hour_meter_readings.equipment_id
      and a.ended_at is null
      and a.client_id = public.my_client_id()
  )
);

drop policy if exists "hour_meter_readings_insert" on public.equipment_hour_meter_readings;
create policy "hour_meter_readings_insert"
on public.equipment_hour_meter_readings
for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and (
    public.is_gestor_adm()
    or public.is_manutencao()
  )
);

-- 4) Atualiza frota alocada do cliente com horímetro
drop function if exists public.get_client_allocated_fleet(uuid);

create or replace function public.get_client_allocated_fleet(p_client_id uuid)
returns table (
  equipment_id uuid,
  asset_tag text,
  description text,
  serial_number text,
  active boolean,
  hour_meter_current numeric,
  hour_meter_updated_at timestamptz,
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
    e.hour_meter_current,
    e.hour_meter_updated_at,
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

-- 5) RPC: registra leitura, atualiza equipamento e grava histórico
create or replace function public.record_equipment_hour_meter(
  p_equipment_id uuid,
  p_reading_value numeric,
  p_source text,
  p_ticket_id uuid default null,
  p_notes text default null,
  p_read_at timestamptz default now()
)
returns public.equipment
language plpgsql
security definer
set search_path = public
as $$
declare
  v_equipment public.equipment;
begin
  if p_reading_value is null or p_reading_value < 0 then
    raise exception 'Leitura de horímetro inválida';
  end if;

  if p_source not in ('manual', 'abertura_chamado', 'inspecao', 'conclusao') then
    raise exception 'Origem de leitura inválida';
  end if;

  if not (
    public.is_gestor_adm()
    or public.is_manutencao()
  ) then
    raise exception 'Sem permissão para registrar horímetro';
  end if;

  update public.equipment
  set
    hour_meter_current = p_reading_value,
    hour_meter_updated_at = coalesce(p_read_at, now())
  where id = p_equipment_id
  returning * into v_equipment;

  if v_equipment.id is null then
    raise exception 'Equipamento não encontrado';
  end if;

  insert into public.equipment_hour_meter_readings (
    equipment_id,
    reading_value,
    read_at,
    source,
    ticket_id,
    recorded_by,
    notes
  ) values (
    p_equipment_id,
    p_reading_value,
    coalesce(p_read_at, now()),
    p_source,
    p_ticket_id,
    auth.uid(),
    p_notes
  );

  return v_equipment;
end;
$$;

grant execute on function public.record_equipment_hour_meter(
  uuid, numeric, text, uuid, text, timestamptz
) to authenticated;
