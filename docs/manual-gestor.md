---
title: "Manual do Gestor ADM"
subtitle: "ADM Manutenção"
version: "1.0"
date: "julho/2026"
audience: "Gestor ADM"
---

# Manual do Gestor ADM — ADM Manutenção

**ADM Rental Service** · Versão 1.0 · julho/2026

Plataforma web para gestão de manutenção preventiva e corretiva de equipamentos locados.

Este manual é destinado ao perfil **Gestor ADM** (`gestor_adm`), responsável por cadastros, triagem de chamados, indicadores e relatórios.

---

## Sumário

1. [Introdução](#1-introdução)
2. [Primeiro acesso](#2-primeiro-acesso)
3. [Implantação inicial](#3-implantação-inicial)
4. [Fluxo do chamado (visão gestor)](#4-fluxo-do-chamado-visão-gestor)
5. [Visão geral (Painel)](#5-visão-geral-painel)
6. [Clientes e obras](#6-clientes-e-obras)
7. [Usuários](#7-usuários)
8. [Equipamentos](#8-equipamentos)
9. [Chamados](#9-chamados)
10. [Estoque](#10-estoque)
11. [Checklist](#11-checklist)
12. [Relatórios](#12-relatórios)
13. [Rotina diária](#13-rotina-diária)
14. [Scripts SQL](#14-scripts-sql)
15. [Perguntas frequentes](#15-perguntas-frequentes)
16. [Índice de figuras](#16-índice-de-figuras)

---

## 1. Introdução

Como gestor, você administra toda a operação de manutenção:

- Cadastro de **clientes**, **obras**, **equipamentos** e **usuários**
- **Triagem** e gestão de chamados (ordens de serviço)
- Acompanhamento de **KPIs** e **SLA**
- Controle de **estoque** e **checklists**
- Exportação de **relatórios Excel**

O sistema funciona no navegador (PC, tablet ou celular) e pode ser instalado como **PWA**.

### Menu disponível

| Menu | Função |
|------|--------|
| Visão geral | Painel de controle e indicadores |
| Chamados | Lista, triagem e gestão das OS |
| Clientes | Cadastro de empresas e obras |
| Usuários | Perfis e acessos |
| Equipamentos | Frota e alocação |
| Estoque | Peças e movimentações |
| Checklist | Templates e execuções |
| Relatórios | Indicadores e exportação Excel |

![Menu lateral do gestor](img/gestor/02-menu-gestor.png)

*Figura 1 — Menu lateral com todas as opções do Gestor ADM*

---

## 2. Primeiro acesso

### Login

1. Acesse a URL do sistema no navegador.
2. Informe **e-mail** e **senha** de gestor.
3. O sistema abre automaticamente a área administrativa.

![Tela de login](img/shared/01-login.png)

*Figura 2 — Tela de login*

> **Dica:** use Chrome ou Edge em tela cheia (zoom 100%) para melhor visualização.

---

## 3. Implantação inicial

Execute **uma única vez** os scripts SQL no **Supabase → SQL Editor** (lista completa na [seção 14](#14-scripts-sql)).

Depois, siga esta ordem operacional:

```text
1. Cadastrar clientes (empresas)
2. Cadastrar obras de cada cliente
3. Cadastrar equipamentos na frota
4. Alocar equipamentos ao cliente/obra
5. Criar usuários (técnicos e clientes)
6. Vincular usuário cliente à empresa correta
7. Operar chamados
```

### Cliente sem empresa vinculada

Se um usuário cliente aparecer sem acesso:

1. Menu → **Usuários**
2. Edite o usuário
3. Defina papel **Cliente** e selecione a **empresa**

---

## 4. Fluxo do chamado (visão gestor)

### Status

| Status | Significado |
|--------|-------------|
| Aberto | Aguarda triagem |
| Triagem | Em análise pelo gestor |
| Em inspeção | Técnico realizando laudo |
| Aguard. aprovação | Cliente deve aprovar serviços |
| Em execução | Manutenção em andamento |
| Aguard. peças | Pausado por falta de peças |
| Concluído | Finalizado com assinaturas |
| Cancelado | Encerrado sem conclusão |

### Sequência operacional

```text
Cliente abre chamado (Aberto)
        ↓
Gestor faz triagem → prioridade + técnico
        ↓
Técnico registra laudo
        ↓
Cliente aprova (se necessário)
        ↓
Técnico executa e conclui com assinaturas
```

### Prioridades

| Prioridade | Quando usar |
|------------|-------------|
| Baixa | Sem urgência |
| Média | Padrão |
| Alta | Impacto operacional |
| Crítica | Equipamento parado ou risco elevado |

---

## 5. Visão geral (Painel)

**Caminho:** Menu → **Visão geral**

**Indicadores disponíveis:**

- Chamados abertos, em atendimento e concluídos no mês
- SLA de triagem e tempo médio de atendimento
- Equipamentos parados
- Gráficos de status, prioridade e equipamentos com mais falhas
- Tabela de chamados recentes

**Uso recomendado:** consulta diária pela manhã para identificar gargalos.

![Painel de controle](img/gestor/03-dashboard.png)

*Figura 3 — Visão geral com KPIs e gráficos*

---

## 6. Clientes e obras

**Caminho:** Menu → **Clientes**

### Cadastrar empresa

1. Clique em **Novo cliente**.
2. Preencha:
   - Razão social e nome fantasia *(obrigatório)*
   - CNPJ, código interno, segmento
   - Contato comercial (nome, e-mail, telefone)
   - Cidade/UF e observações internas
3. Clique em **Cadastrar cliente**.

**Atalho:** **Cadastrar empresa de teste** preenche um exemplo.

### Editar ou inativar

- **Editar** — altera dados cadastrais
- **Apagar** — inativa o cliente (preserva histórico)

### Obras

1. Na lista, clique em **Ver obras** no cliente.
2. **Nova obra** → nome e endereço (opcional).
3. Salve.

![Cadastro de clientes](img/gestor/04-clientes.png)

*Figura 4 — Lista de clientes e formulário de cadastro*

---

## 7. Usuários

**Caminho:** Menu → **Usuários**

### Criar usuário

1. **Novo usuário**
2. Preencha: nome, e-mail, senha e **papel**:
   - **Gestor ADM** — administrador
   - **Manutenção ADM** / **Manutenção Externa** — técnico
   - **Cliente** — usuário da empresa contratante
3. Se **Cliente**, selecione a **empresa** vinculada.
4. Salve.

![Novo usuário](img/gestor/05-usuarios.png)

*Figura 5 — Cadastro de usuário com seleção de papel*

---

## 8. Equipamentos

**Caminho:** Menu → **Equipamentos**

### Cadastrar

1. **Novo equipamento**
2. Patrimônio (tag), descrição e número de série (opcional)
3. Salve

### Alocar à obra

1. Localize o equipamento na frota.
2. **Alocar** → selecione **cliente** e **obra**.
3. Confirme.

> Equipamentos alocados aparecem para o cliente ao abrir chamado.

### Encerrar locação

Use quando o equipamento retornar à base ADM.

![Frota e alocação](img/gestor/06-equipamentos.png)

*Figura 6 — Lista de equipamentos com status de alocação*

---

## 9. Chamados

**Caminho:** Menu → **Chamados**

### Lista

- Filtre por status.
- Clique em um chamado para o detalhe.

### Criar chamado

1. **Novo chamado**
2. Cliente, obra, equipamento
3. Título, descrição e prioridade
4. Salve

### Triagem (detalhe da OS)

1. Revise descrição, dados e anexos.
2. Em **Triagem e gestão**, ajuste:
   - **Status**
   - **Prioridade**
   - **Técnico**
3. **Salvar alterações**

### Editar ou excluir

- **Editar** — altera dados da OS
- **Excluir** — remove da lista operacional

### Acompanhar

- Laudo de inspeção do técnico
- Aprovação do cliente (status Aguard. aprovação)
- Assinaturas na conclusão

![Detalhe do chamado](img/gestor/07-chamados-triagem.png)

*Figura 7 — Detalhe da OS com triagem e histórico*

---

## 10. Estoque

**Caminho:** Menu → **Estoque**

### Nova peça

SKU, nome, unidade, estoque atual e mínimo.

### Movimentação

Selecione a peça → **entrada**, **saída** ou **ajuste** com quantidade e observação.

![Estoque](img/gestor/08-estoque.png)

*Figura 8 — Controle de estoque de peças*

---

## 11. Checklist

**Caminho:** Menu → **Checklist**

### Templates

Crie templates com itens de verificação conforme procedimento operacional.

### Executar

1. Selecione template e equipamento (opcional).
2. Marque itens e adicione observações.
3. Conclua.

---

## 12. Relatórios

**Caminho:** Menu → **Relatórios**

1. Filtros: período, cliente, técnico, status, prioridade.
2. Analise indicadores na tela.
3. **Exportar Excel** → arquivo `.xlsx` com abas de chamados, estoque, aprovações, checklists, clientes e equipamentos.

![Relatórios](img/gestor/09-relatorios.png)

*Figura 9 — Relatórios gerenciais com exportação Excel*

---

## 13. Rotina diária

```text
Manhã
  → Visão geral (KPIs)
  → Chamados Aberto / Triagem
  → Atribuir técnico e prioridade

Durante o dia
  → Acompanhar OS em inspeção e execução
  → Pendências de aprovação do cliente
  → Movimentações de estoque

Fim do dia / semana
  → Relatórios → Exportar Excel
  → Revisar equipamentos parados e SLA
```

---

## 14. Scripts SQL

Execute no **SQL Editor** do Supabase na implantação ou após atualizações.

| Arquivo | Finalidade |
|---------|------------|
| `roles-manutencao-1-enum.sql` | Papéis (executar primeiro) |
| `roles-manutencao-2-migrate.sql` | Migração de papéis |
| `clients-management.sql` | Policies de clientes |
| `clients-extended-fields.sql` | Campos do cadastro de clientes |
| `ticket-client-fields.sql` | Campos na abertura de chamado |
| `tickets-rls-fix.sql` | Regras de acesso |
| `client-ticket-actions.sql` | Cliente editar/excluir chamados |
| `gestor-ticket-actions.sql` | Gestor excluir chamados |
| `storage-attachments.sql` | Anexos no Storage |
| `ticket-inspections.sql` | Laudos de inspeção |
| `ticket-approvals.sql` | Aprovações do cliente |
| `ticket-service-completions.sql` | Conclusão com assinaturas |
| `equipment-allocations.sql` | Alocação de frota |
| `parts-inventory.sql` | Estoque |
| `checklists.sql` | Checklists |

---

## 15. Perguntas frequentes

**Cliente não vê equipamentos ao abrir chamado**  
Alocar equipamento ao cliente/obra e vincular usuário à empresa correta.

**Técnico não vê chamados**  
Atribuir o técnico na triagem do chamado.

**Erro ao anexar arquivo**  
Formatos: JPEG, PNG, WebP, GIF, PDF. Máx. 10 MB. Executar `storage-attachments.sql`.

**Erro ao excluir chamado**  
Executar `gestor-ticket-actions.sql`.

---

## 16. Índice de figuras

| Figura | Arquivo | Conteúdo |
|--------|---------|----------|
| 1 | `img/gestor/02-menu-gestor.png` | Menu lateral |
| 2 | `img/shared/01-login.png` | Login |
| 3 | `img/gestor/03-dashboard.png` | Painel |
| 4 | `img/gestor/04-clientes.png` | Clientes |
| 5 | `img/gestor/05-usuarios.png` | Usuários |
| 6 | `img/gestor/06-equipamentos.png` | Equipamentos |
| 7 | `img/gestor/07-chamados-triagem.png` | Triagem |
| 8 | `img/gestor/08-estoque.png` | Estoque |
| 9 | `img/gestor/09-relatorios.png` | Relatórios |

---

*ADM Rental Service — ADM Manutenção · Manual do Gestor ADM v1.0*
