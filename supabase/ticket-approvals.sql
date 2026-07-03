-- Execute no SQL Editor do Supabase (após tickets-rls-fix.sql e ticket-inspections.sql)
-- Aprovação do cliente quando chamado está em aguardando_aprovacao.

create table if not exists public.ticket_approvals (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.tickets(id) on delete cascade,
  decision text not null check (decision in ('aprovado', 'recusado')),
  notes text,
  responded_by uuid not null references public.profiles(id) on delete restrict,
  responded_at timestamptz not null default now()
);

create index if not exists ticket_approvals_ticket_id_idx
  on public.ticket_approvals (ticket_id);

alter table public.ticket_approvals enable row level security;

drop policy if exists "ticket_approvals_select" on public.ticket_approvals;
create policy "ticket_approvals_select"
on public.ticket_approvals
for select
to authenticated
using (public.can_access_ticket(ticket_id));

-- Cliente responde aprovação via RPC (SECURITY DEFINER)
create or replace function public.client_respond_ticket_approval(
  p_ticket_id uuid,
  p_decision text,
  p_notes text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_ticket public.tickets%rowtype;
  v_notes text;
begin
  if p_decision not in ('aprovado', 'recusado') then
    raise exception 'Decisão inválida. Use aprovado ou recusado.';
  end if;

  select public.my_client_id() into v_client_id;

  if v_client_id is null then
    raise exception 'Apenas usuários cliente podem responder aprovações.';
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

  if v_ticket.status <> 'aguardando_aprovacao' then
    raise exception 'Este chamado não está aguardando aprovação do cliente.';
  end if;

  if exists (
    select 1 from public.ticket_approvals where ticket_id = p_ticket_id
  ) then
    raise exception 'Este chamado já possui resposta de aprovação.';
  end if;

  v_notes := nullif(trim(p_notes), '');

  insert into public.ticket_approvals (
    ticket_id,
    decision,
    notes,
    responded_by
  ) values (
    p_ticket_id,
    p_decision,
    v_notes,
    auth.uid()
  );

  update public.tickets
  set
    status = case
      when p_decision = 'aprovado' then 'em_execucao'::public.ticket_status
      else 'triagem'::public.ticket_status
    end,
    updated_at = now()
  where id = p_ticket_id;

  insert into public.ticket_events (
    ticket_id,
    event_type,
    message,
    created_by
  ) values (
    p_ticket_id,
    'aprovacao_cliente',
    case
      when p_decision = 'aprovado' then
        'Cliente aprovou o laudo e serviços recomendados'
        || coalesce(' · ' || v_notes, '')
        || ' · Status: Em execução'
      else
        'Cliente recusou o laudo ou serviços recomendados'
        || coalesce(' · ' || v_notes, '')
        || ' · Retornado para triagem do gestor'
    end,
    auth.uid()
  );

  return json_build_object(
    'ticket_id', p_ticket_id,
    'decision', p_decision,
    'new_status', case
      when p_decision = 'aprovado' then 'em_execucao'
      else 'triagem'
    end
  );
end;
$$;

grant execute on function public.client_respond_ticket_approval(uuid, text, text)
  to authenticated;
