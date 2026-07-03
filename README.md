# ADM Manutenção

Sistema de gestão de manutenção e chamados para locação de equipamentos (ADM Rental).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth, Postgres, Storage, Edge Functions)
- PWA (vite-plugin-pwa)

## Perfis de acesso

| Papel | Descrição |
|-------|-----------|
| `gestor_adm` | Dashboard, triagem, usuários, estoque, relatórios |
| `manutencao_adm` | Chamados atribuídos, laudo de inspeção |
| `manutencao_externa` | Idem manutenção ADM (terceiro) |
| `cliente` | Abertura de chamados, aprovação de laudos |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
```

Na **Vercel**, configure as mesmas variáveis em *Settings → Environment Variables*.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Banco de dados (Supabase)

Execute os scripts SQL na ordem documentada em [`supabase/README.md`](supabase/README.md).

## Edge Function: criar usuários

O gestor cria usuários pelo app (menu **Usuários → Novo usuário**). Publique a função:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy create-user
```

A função usa automaticamente `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do projeto.

## Deploy (Vercel)

1. Conecte o repositório GitHub à Vercel
2. Framework: **Vite** · Output: `dist` · Build: `npm run build`
3. Configure `VITE_SUPABASE_*`
4. No Supabase → **Authentication → URL Configuration**, adicione a URL da Vercel

## Fluxo principal

1. **Cliente** abre chamado (obra, equipamento, anexos)
2. **Gestor** faz triagem e atribui manutenção
3. **Manutenção** registra laudo de inspeção
4. Se responsabilidade **cliente** → status `aguardando_aprovacao`
5. **Cliente** aprova ou recusa → `em_execucao` ou retorno à `triagem`
6. Gestor conclui o chamado

## Licença

Uso interno ADM Rental.
