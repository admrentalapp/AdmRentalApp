-- PASSO 2 de 2 — Execute DEPOIS do roles-manutencao-1-enum.sql
-- Migra perfis e atualiza funções de acesso.

-- 1) Migrar perfis existentes
update public.profiles
set role = 'manutencao_adm'::public.user_role
where role = 'tecnico_adm'::public.user_role;

-- 2) Função unificada: Manutenção ADM ou Manutenção Externa
-- (inclui tecnico_adm legado até todos os perfis migrarem)
create or replace function public.is_manutencao()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in (
        'manutencao_adm',
        'manutencao_externa',
        'tecnico_adm'
      )
  );
$$;

-- Alias legado (caso alguma policy antiga ainda referencie)
create or replace function public.is_technician_adm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_manutencao();
$$;

-- 3) can_access_ticket — manutenção atribuída ao chamado
create or replace function public.can_access_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    join public.profiles p on p.id = auth.uid()
    where t.id = p_ticket_id
      and (
        p.role = 'gestor_adm'
        or (p.role = 'cliente' and t.client_id = p.client_id)
        or (
          p.role in (
            'manutencao_adm',
            'manutencao_externa',
            'tecnico_adm'
          )
          and t.technician_id = p.id
        )
      )
  );
$$;

grant execute on function public.is_manutencao() to authenticated;
