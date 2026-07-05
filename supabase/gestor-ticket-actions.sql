-- Permite ao gestor ADM excluir chamados da operação.

alter table if exists public.tickets enable row level security;

drop policy if exists "tickets_gestor_delete" on public.tickets;
create policy "tickets_gestor_delete"
on public.tickets
for delete
to authenticated
using (public.is_gestor_adm());
