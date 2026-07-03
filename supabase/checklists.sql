-- Execute no SQL Editor do Supabase
-- Checklists de inspeção de equipamentos

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  required boolean not null default true
);

create table if not exists public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete restrict,
  equipment_id uuid references public.equipment(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluido')),
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.checklist_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.checklist_runs(id) on delete cascade,
  item_id uuid not null references public.checklist_items(id) on delete restrict,
  checked boolean not null default false,
  observation text,
  unique (run_id, item_id)
);

create index if not exists checklist_items_template_idx on public.checklist_items (template_id);
create index if not exists checklist_runs_equipment_idx on public.checklist_runs (equipment_id);

alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_runs enable row level security;
alter table public.checklist_run_items enable row level security;

drop policy if exists "checklist_templates_select" on public.checklist_templates;
create policy "checklist_templates_select"
on public.checklist_templates for select to authenticated
using (active = true or public.is_gestor_adm());

drop policy if exists "checklist_templates_gestor_all" on public.checklist_templates;
create policy "checklist_templates_gestor_all"
on public.checklist_templates for all to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

drop policy if exists "checklist_items_select" on public.checklist_items;
create policy "checklist_items_select"
on public.checklist_items for select to authenticated
using (true);

drop policy if exists "checklist_items_gestor_all" on public.checklist_items;
create policy "checklist_items_gestor_all"
on public.checklist_items for all to authenticated
using (public.is_gestor_adm())
with check (public.is_gestor_adm());

drop policy if exists "checklist_runs_select" on public.checklist_runs;
create policy "checklist_runs_select"
on public.checklist_runs for select to authenticated
using (public.is_gestor_adm() or public.is_manutencao() or performed_by = auth.uid());

drop policy if exists "checklist_runs_insert" on public.checklist_runs;
create policy "checklist_runs_insert"
on public.checklist_runs for insert to authenticated
with check (
  performed_by = auth.uid()
  and (public.is_gestor_adm() or public.is_manutencao())
);

drop policy if exists "checklist_runs_update" on public.checklist_runs;
create policy "checklist_runs_update"
on public.checklist_runs for update to authenticated
using (performed_by = auth.uid() or public.is_gestor_adm())
with check (performed_by = auth.uid() or public.is_gestor_adm());

drop policy if exists "checklist_run_items_select" on public.checklist_run_items;
create policy "checklist_run_items_select"
on public.checklist_run_items for select to authenticated
using (
  exists (
    select 1 from public.checklist_runs r
    where r.id = run_id
      and (public.is_gestor_adm() or public.is_manutencao() or r.performed_by = auth.uid())
  )
);

drop policy if exists "checklist_run_items_update" on public.checklist_run_items;
create policy "checklist_run_items_update"
on public.checklist_run_items for update to authenticated
using (
  exists (
    select 1 from public.checklist_runs r
    where r.id = run_id
      and (r.performed_by = auth.uid() or public.is_gestor_adm())
  )
)
with check (
  exists (
    select 1 from public.checklist_runs r
    where r.id = run_id
      and (r.performed_by = auth.uid() or public.is_gestor_adm())
  )
);

with check (
  exists (
    select 1 from public.checklist_runs r
    where r.id = run_id
      and (r.performed_by = auth.uid() or public.is_gestor_adm())
  )
);

drop policy if exists "checklist_run_items_insert" on public.checklist_run_items;
create policy "checklist_run_items_insert"
on public.checklist_run_items for insert to authenticated
with check (
  exists (
    select 1 from public.checklist_runs r
    where r.id = run_id
      and (r.performed_by = auth.uid() or public.is_gestor_adm())
  )
);

insert into public.checklist_templates (name, description)
select 'Inspeção diária de equipamento', 'Verificações básicas antes da operação'
where not exists (
  select 1 from public.checklist_templates where name = 'Inspeção diária de equipamento'
);

insert into public.checklist_items (template_id, label, sort_order)
select t.id, item.label, item.sort_order
from public.checklist_templates t
cross join (
  values
    ('Nível de óleo do motor', 1),
    ('Pressão dos pneus / esteiras', 2),
    ('Vazamentos visíveis', 3),
    ('Funcionamento de alarmes', 4),
    ('Limpeza geral do equipamento', 5)
) as item(label, sort_order)
where t.name = 'Inspeção diária de equipamento'
  and not exists (
    select 1 from public.checklist_items ci where ci.template_id = t.id
  );
