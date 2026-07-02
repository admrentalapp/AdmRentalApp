-- PASSO 1 de 2 — Execute PRIMEIRO e aguarde "Success"
-- Adiciona novos valores ao enum user_role (commit obrigatório antes do passo 2).

alter type public.user_role add value if not exists 'manutencao_adm';
alter type public.user_role add value if not exists 'manutencao_externa';
