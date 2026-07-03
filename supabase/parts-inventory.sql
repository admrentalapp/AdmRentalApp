-- Execute no SQL Editor do Supabase
-- Estoque de peças e reposição mínima

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  unit text not null default 'un',
  current_stock integer not null default 0 check (current_stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.part_movements (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada', 'saida', 'ajuste')),
  quantity integer not null check (quantity > 0),
  notes text,
  ticket_id uuid references public.tickets(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists parts_active_idx on public.parts (active);
create index if not exists part_movements_part_id_idx on public.part_movements (part_id);

alter table public.parts enable row level security;
alter table public.part_movements enable row level security;

drop policy if exists "parts_select" on public.parts;
create policy "parts_select"
on public.parts for select to authenticated
using (public.is_gestor_adm() or public.is_manutencao());

drop policy if exists "parts_gestor_all" on public.parts;
create policy "parts_gestor_all"
on public.parts for all to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

drop policy if exists "part_movements_select" on public.part_movements;
create policy "part_movements_select"
on public.part_movements for select to authenticated
using (public.is_gestor_adm() or public.is_manutencao());

drop policy if exists "part_movements_gestor_insert" on public.part_movements;
create policy "part_movements_gestor_insert"
on public.part_movements for insert to authenticated
with check (public.is_gestor_adm() and created_by = auth.uid());

create or replace function public.register_part_movement(
  p_part_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_notes text default null,
  p_ticket_id uuid default null
)
returns public.parts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part public.parts%rowtype;
  v_delta integer;
begin
  if not public.is_gestor_adm() then
    raise exception 'Apenas gestores podem movimentar estoque.';
  end if;

  if p_movement_type not in ('entrada', 'saida', 'ajuste') then
    raise exception 'Tipo de movimentação inválido.';
  end if;

  select * into v_part from public.parts where id = p_part_id for update;
  if not found then
    raise exception 'Peça não encontrada.';
  end if;

  v_delta := case
    when p_movement_type = 'entrada' then p_quantity
    when p_movement_type = 'saida' then -p_quantity
    else p_quantity - v_part.current_stock
  end;

  if v_part.current_stock + v_delta < 0 then
    raise exception 'Estoque insuficiente para esta saída.';
  end if;

  update public.parts
  set current_stock = current_stock + v_delta,
      updated_at = now()
  where id = p_part_id
  returning * into v_part;

  insert into public.part_movements (
    part_id, movement_type, quantity, notes, ticket_id, created_by
  ) values (
    p_part_id,
    p_movement_type,
    p_quantity,
    nullif(trim(p_notes), ''),
    p_ticket_id,
    auth.uid()
  );

  return v_part;
end;
$$;

grant execute on function public.register_part_movement(uuid, text, integer, text, uuid)
  to authenticated;
