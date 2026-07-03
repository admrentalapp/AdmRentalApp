# Migrações SQL — ADM Manutenção

Execute no **SQL Editor** do Supabase Dashboard, **na ordem abaixo**, um arquivo por vez.

> Se o projeto Supabase for novo, você precisa primeiro do schema base (`profiles`, `clients`, `tickets`, etc.) criado anteriormente. Estes arquivos são migrações incrementais.

## Ordem de execução

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `equipment-allocations.sql` | Frota ADM + alocações por cliente/obra |
| 2 | `ticket-client-fields.sql` | Campos extras na abertura pelo cliente |
| 3 | `tickets-rls-fix.sql` | Policies RLS corrigidas |
| 4 | `storage-attachments.sql` | Bucket e policies de anexos |
| 5 | `roles-manutencao-1-enum.sql` | Valores do enum de papéis (**commit separado**) |
| 6 | `roles-manutencao-2-migrate.sql` | Migração técnico → manutenção |
| 7 | `ticket-inspections.sql` | Laudo de inspeção |
| 8 | `ticket-approvals.sql` | Aprovação do cliente |
| 9 | `parts-inventory.sql` | Estoque de peças |
| 10 | `checklists.sql` | Checklists de equipamento |

## Notas importantes

### Enum `user_role` (passos 5 e 6)

O PostgreSQL exige **duas execuções separadas**:

1. Execute `roles-manutencao-1-enum.sql` e aguarde commit
2. Execute `roles-manutencao-2-migrate.sql`

### Edge Function `create-user`

Após o banco configurado, publique a função para criação de usuários pelo app:

```bash
npx supabase functions deploy create-user
```

Código em `supabase/functions/create-user/index.ts`.

### Verificação rápida

```sql
select tablename from pg_tables
where schemaname = 'public'
order by tablename;
```

Tabelas esperadas após todas as migrações:

- `ticket_approvals`
- `ticket_inspections`
- `parts`, `part_movements`
- `checklist_templates`, `checklist_items`, `checklist_runs`, `checklist_run_items`

## Arquivo de referência

- `roles-manutencao.sql` — apenas instruções (não executar diretamente)
