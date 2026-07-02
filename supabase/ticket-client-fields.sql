-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Campos extras na abertura de chamado pelo cliente.

alter table public.tickets
  add column if not exists incident_at timestamptz,
  add column if not exists site_contact_name text,
  add column if not exists site_contact_phone text;

comment on column public.tickets.incident_at is 'Data/hora informada pelo cliente quando a avaria ocorreu';
comment on column public.tickets.site_contact_name is 'Responsável na obra no momento da solicitação';
comment on column public.tickets.site_contact_phone is 'Telefone do contato na obra';
