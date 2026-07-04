-- Execute no SQL Editor do Supabase
-- Permite ao cliente editar e excluir chamados da própria empresa

-- =============================================================================
-- 1) Policy: cliente pode excluir chamados da própria empresa
-- =============================================================================

drop policy if exists "tickets_client_delete" on public.tickets;

create policy "tickets_client_delete"
on public.tickets
for delete
to authenticated
using (
  public.my_client_id() is not null
  and client_id = public.my_client_id()
);

-- =============================================================================
-- 2) RPC: cliente edita chamado (campos permitidos)
-- Requer my_client_id() e validate_client_ticket_insert() já existentes
-- (criados em supabase/tickets-rls-fix.sql)
-- =============================================================================

create or replace function public.client_update_ticket(
  p_ticket_id uuid,
  p_site_id uuid,
  p_equipment_id uuid,
  p_incident_at timestamptz,
  p_site_contact_name text,
  p_site_contact_phone text,
  p_title text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_ticket public.tickets%rowtype;
  v_updated_id uuid;
  v_title text;
  v_description text;
  v_site_contact_name text;
  v_site_contact_phone text;
begin
  select public.my_client_id() into v_client_id;

  if v_client_id is null then
    raise exception 'Apenas usuários cliente podem editar chamados.';
  end if;

  select *
  into v_ticket
  from public.tickets
  where id = p_ticket_id
    and client_id = v_client_id
  for update;

  if not found then
    raise exception 'Chamado não encontrado ou sem permissão.';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_description := btrim(coalesce(p_description, ''));
  v_site_contact_name := btrim(coalesce(p_site_contact_name, ''));
  v_site_contact_phone := btrim(coalesce(p_site_contact_phone, ''));

  if char_length(v_title) < 3 then
    raise exception 'O título deve ter pelo menos 3 caracteres.';
  end if;

  if char_length(v_description) < 10 then
    raise exception 'A descrição deve ter pelo menos 10 caracteres.';
  end if;

  if char_length(v_site_contact_name) < 2 then
    raise exception 'Informe o nome do responsável na obra.';
  end if;

  if char_length(regexp_replace(v_site_contact_phone, '\D', '', 'g')) < 8 then
    raise exception 'Informe um telefone válido para contato na obra.';
  end if;

  if p_incident_at is null or p_incident_at > now() then
    raise exception 'A data da avaria é inválida.';
  end if;

  if not public.validate_client_ticket_insert(v_ticket.client_id, p_site_id, p_equipment_id) then
    raise exception 'Obra ou equipamento inválidos para este cliente.';
  end if;

  update public.tickets
  set
    site_id = p_site_id,
    equipment_id = p_equipment_id,
    incident_at = p_incident_at,
    site_contact_name = v_site_contact_name,
    site_contact_phone = v_site_contact_phone,
    title = v_title,
    description = v_description
  where id = p_ticket_id
  returning id into v_updated_id;

  return v_updated_id;
end;
$$;

grant execute on function public.client_update_ticket(uuid, uuid, uuid, timestamptz, text, text, text, text)
to authenticated;

-- =============================================================================
-- 3) Atualiza cache do PostgREST (Supabase API)
-- =============================================================================

notify pgrst, 'reload schema';
