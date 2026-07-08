-- Conclusão do serviço com assinaturas do técnico e do cliente.
-- Execute no SQL Editor do Supabase após storage-attachments.sql

create table if not exists public.ticket_service_completions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete cascade,
  technician_signature_path text not null,
  client_signature_path text not null,
  technician_signed_by uuid not null references public.profiles(id) on delete restrict,
  client_signer_name text not null,
  equipment_ready boolean not null default true,
  notes text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ticket_service_completions_ticket_id_idx
  on public.ticket_service_completions (ticket_id);

alter table public.ticket_service_completions enable row level security;

drop policy if exists "ticket_service_completions_select" on public.ticket_service_completions;
create policy "ticket_service_completions_select"
on public.ticket_service_completions
for select
to authenticated
using (public.can_access_ticket(ticket_id));

drop policy if exists "ticket_service_completions_insert" on public.ticket_service_completions;
create policy "ticket_service_completions_insert"
on public.ticket_service_completions
for insert
to authenticated
with check (
  technician_signed_by = auth.uid()
  and public.is_manutencao()
  and exists (
    select 1
    from public.tickets t
    where t.id = ticket_id
      and t.technician_id = auth.uid()
      and t.status in ('em_inspecao', 'em_execucao', 'aguardando_pecas')
  )
);

create or replace function public.complete_ticket_service(
  p_ticket_id uuid,
  p_technician_signature_path text,
  p_client_signature_path text,
  p_client_signer_name text,
  p_equipment_ready boolean default true,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
  v_completion_id uuid;
  v_client_signer_name text;
begin
  if not public.is_manutencao() then
    raise exception 'Apenas manutenção pode concluir o serviço.';
  end if;

  select * into v_ticket
  from public.tickets
  where id = p_ticket_id
    and technician_id = auth.uid()
  for update;

  if not found then
    raise exception 'Chamado não encontrado ou não atribuído a você.';
  end if;

  if v_ticket.status not in ('em_inspecao', 'em_execucao', 'aguardando_pecas') then
    raise exception 'O chamado não está em status que permite conclusão.';
  end if;

  if exists (
    select 1 from public.ticket_service_completions where ticket_id = p_ticket_id
  ) then
    raise exception 'Este chamado já possui conclusão registrada.';
  end if;

  v_client_signer_name := btrim(coalesce(p_client_signer_name, ''));
  if char_length(v_client_signer_name) < 2 then
    raise exception 'Informe o nome do responsável que assina pelo cliente.';
  end if;

  if btrim(coalesce(p_technician_signature_path, '')) = ''
    or btrim(coalesce(p_client_signature_path, '')) = '' then
    raise exception 'Assinaturas do técnico e do cliente são obrigatórias.';
  end if;

  insert into public.ticket_service_completions (
    ticket_id,
    technician_signature_path,
    client_signature_path,
    technician_signed_by,
    client_signer_name,
    equipment_ready,
    notes
  )
  values (
    p_ticket_id,
    p_technician_signature_path,
    p_client_signature_path,
    auth.uid(),
    v_client_signer_name,
    coalesce(p_equipment_ready, true),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_completion_id;

  update public.tickets
  set
    status = 'concluido',
    closed_at = now(),
    updated_at = now()
  where id = p_ticket_id;

  insert into public.ticket_events (ticket_id, event_type, message, created_by)
  values (
    p_ticket_id,
    'conclusao_servico',
    'Serviço concluído com assinaturas do técnico e do cliente (' || v_client_signer_name || ').',
    auth.uid()
  );

  return v_completion_id;
end;
$$;

grant execute on function public.complete_ticket_service(
  uuid, text, text, text, boolean, text
) to authenticated;
