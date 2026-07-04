-- Gestão de clientes sem exclusão física.
-- Permite ao gestor criar e atualizar clientes; clientes enxergam apenas a própria empresa.

alter table if exists public.clients enable row level security;

drop policy if exists "clients_select" on public.clients;
create policy "clients_select"
on public.clients
for select
using (
  public.is_gestor_adm()
  or id = public.my_client_id()
);

drop policy if exists "clients_gestor_insert" on public.clients;
create policy "clients_gestor_insert"
on public.clients
for insert
with check (public.is_gestor_adm());

drop policy if exists "clients_gestor_update" on public.clients;
create policy "clients_gestor_update"
on public.clients
for update
using (public.is_gestor_adm())
with check (public.is_gestor_adm());
