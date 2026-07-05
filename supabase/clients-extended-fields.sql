-- Campos profissionais para cadastro de clientes (empresas).

alter table if exists public.clients
  add column if not exists legal_name text,
  add column if not exists cnpj text,
  add column if not exists internal_code text,
  add column if not exists state_registration text,
  add column if not exists segment text,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists city text,
  add column if not exists state_code text,
  add column if not exists notes text;

create unique index if not exists clients_cnpj_unique
  on public.clients (cnpj)
  where cnpj is not null and btrim(cnpj) <> '';

create unique index if not exists clients_internal_code_unique
  on public.clients (internal_code)
  where internal_code is not null and btrim(internal_code) <> '';
