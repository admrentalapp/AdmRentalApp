---
title: "Manual do Cliente"
subtitle: "ADM Manutenção"
version: "1.0"
date: "julho/2026"
audience: "Cliente"
---

# Manual do Cliente — ADM Manutenção

**ADM Rental Service** · Versão 1.0 · julho/2026

Este manual é destinado ao perfil **Cliente** (`cliente`), usuário da empresa contratante que abre chamados, acompanha manutenções e aprova serviços quando necessário.

---

## Sumário

1. [Introdução](#1-introdução)
2. [Primeiro acesso](#2-primeiro-acesso)
3. [Meus chamados](#3-meus-chamados)
4. [Abrir chamado](#4-abrir-chamado)
5. [Acompanhar andamento (timeline)](#5-acompanhar-andamento-timeline)
6. [Editar ou excluir chamado](#6-editar-ou-excluir-chamado)
7. [Aprovar ou recusar serviços](#7-aprovar-ou-recusar-serviços)
8. [Conclusão do serviço](#8-conclusão-do-serviço)
9. [Entendendo os status](#9-entendendo-os-status)
10. [Uso no celular](#10-uso-no-celular)
11. [Rotina recomendada](#11-rotina-recomendada)
12. [Perguntas frequentes](#12-perguntas-frequentes)
13. [Índice de figuras](#13-índice-de-figuras)

---

## 1. Introdução

Como cliente, você pode:

- **Abrir chamados** quando um equipamento apresentar falha
- **Acompanhar** o andamento em tempo real pela linha do tempo
- **Aprovar ou recusar** serviços recomendados pelo técnico
- **Consultar** laudo, histórico, anexos e conclusão com assinaturas

Você vê **apenas dados da sua empresa** e **não** altera prioridade, técnico ou status internos.

---

## 2. Primeiro acesso

### Login

1. Acesse a URL fornecida pela ADM Rental Service.
2. Informe **e-mail** e **senha** cadastrados pelo gestor.
3. O sistema abre **Meus chamados**.

![Tela de login](img/shared/01-login.png)

*Figura 1 — Tela de login*

### Conta não vinculada

Se aparecer mensagem de que sua conta **não está vinculada a uma empresa**, entre em contato com a ADM para regularizar o cadastro.

![Área do cliente](img/cliente/02-meus-chamados.png)

*Figura 2 — Tela inicial Meus chamados*

---

## 3. Meus chamados

A tela principal lista todos os chamados da sua empresa, com:

- Número da OS (ex.: `OS: 2026-00125`)
- Título e equipamento
- Status e prioridade
- Data de abertura

Clique em um chamado para ver os **detalhes** e a **linha do tempo**.

---

## 4. Abrir chamado

1. Clique em **Abrir chamado**.
2. Preencha os campos:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| Obra | Sim | Local onde está o equipamento |
| Equipamento | Sim | Equipamento com falha |
| Data/hora da avaria | Sim | Quando o problema ocorreu |
| Responsável na obra | Sim | Quem receberá o técnico |
| Telefone do contato | Sim | Contato na obra |
| Título | Sim | Resumo do problema |
| Descrição da falha | Sim | Detalhes do que aconteceu |
| Anexos | Não | Fotos ou PDF (até 5 arquivos) |

3. Confirme o envio.

O chamado inicia com status **Aberto** e prioridade **Média**. A equipe ADM fará a triagem.

![Abrir chamado](img/cliente/03-abrir-chamado.png)

*Figura 3 — Formulário de abertura de chamado*

> **Dica:** anexe fotos da avaria — isso agiliza a triagem e o atendimento.

> **Atenção:** se não aparecer equipamento na lista, a ADM precisa alocar o equipamento à sua obra.

---

## 5. Acompanhar andamento (timeline)

1. Na lista, clique no chamado.
2. Veja a tela **Detalhes do Chamado** com:
   - Número da OS
   - Badge de **status** e **prioridade**
   - **Linha do tempo vertical** — etapas concluídas e etapa atual
3. Clique em **Ver detalhes** para descrição completa, laudo, histórico e anexos.

![Timeline do chamado](img/cliente/04-timeline.png)

*Figura 4 — Linha do tempo vertical do chamado*

### Etapas da timeline

| Etapa | Significado |
|-------|-------------|
| Solicitação recebida | Chamado registrado |
| Triagem realizada | ADM classificou o chamado |
| Técnico atribuído | Profissional designado |
| Inspeção técnica | Laudo registrado |
| Aprovação do cliente | Aguardando sua decisão |
| Em execução | Manutenção em andamento |
| Aguardando peças | Pausado por falta de peças |
| Serviço concluído | Atendimento finalizado |

![Ver detalhes](img/cliente/05-ver-detalhes.png)

*Figura 5 — Descrição, laudo, histórico e anexos*

---

## 6. Editar ou excluir chamado

Permitido **somente enquanto o status for Aberto** (antes da triagem):

- **Editar chamado** — corrige dados da solicitação
- **Excluir chamado** — remove o chamado

Após a triagem iniciar, você apenas **acompanha** o andamento.

![Editar chamado](img/cliente/06-editar-chamado.png)

*Figura 6 — Edição de chamado em status Aberto*

---

## 7. Aprovar ou recusar serviços

Quando o status for **Aguard. aprovação**, o técnico identificou serviços cuja **responsabilidade é do cliente**.

1. Leia as **recomendações** do laudo de inspeção.
2. Opcionalmente, adicione **observações**.
3. Escolha:
   - **Aprovar execução** — autoriza o serviço
   - **Recusar** — não autoriza o serviço
4. Confirme a decisão.

![Aprovação](img/cliente/07-aprovacao.png)

*Figura 7 — Tela de aprovação ou recusa de serviços*

> **Dica:** responda o quanto antes para evitar atraso no atendimento.

---

## 8. Conclusão do serviço

Após o técnico finalizar, a seção **Conclusão do serviço** exibe:

- Data da conclusão
- Se o equipamento foi **liberado em condições de uso**
- Imagens das **assinaturas** do técnico e do responsável na obra

![Conclusão](img/cliente/08-conclusao.png)

*Figura 8 — Conclusão do serviço com assinaturas*

---

## 9. Entendendo os status

| Status | O que significa para você |
|--------|---------------------------|
| Aberto | Chamado recebido; aguarda triagem ADM |
| Triagem | ADM analisando |
| Em inspeção | Técnico inspecionando o equipamento |
| Aguard. aprovação | **Sua ação necessária** |
| Em execução | Manutenção em andamento |
| Aguard. peças | Pausado aguardando peças |
| Concluído | Serviço finalizado |
| Cancelado | Chamado encerrado |

### Prioridades

| Prioridade | Significado |
|------------|-------------|
| Baixa | Sem urgência |
| Média | Padrão |
| Alta | Impacto na operação |
| Crítica | Equipamento parado ou risco elevado |

---

## 10. Uso no celular

1. Abra o link no **Chrome** ou **Safari**.
2. Toque em **Adicionar à tela inicial** / **Instalar app**.
3. Use o ícone na tela inicial para abrir chamados e acompanhar a timeline.

Ideal para abrir chamados direto da obra com fotos.

![App no celular](img/cliente/09-pwa-celular.png)

*Figura 9 — Sistema no celular*

---

## 11. Rotina recomendada

```text
Problema no equipamento
  → Abrir chamado com fotos e descrição clara
  → Informar responsável e telefone na obra

Acompanhamento
  → Consultar timeline periodicamente

Se status = Aguard. aprovação
  → Ler laudo e aprovar ou recusar

Após atendimento
  → Conferir conclusão e assinaturas
```

---

## 12. Perguntas frequentes

**Não aparece equipamento ao abrir chamado**  
A ADM precisa alocar o equipamento à sua obra. Solicite ao gestor.

**Não consigo editar o chamado**  
Edição só é permitida com status **Aberto**. Após triagem, apenas acompanhamento.

**Quanto tempo demora o atendimento?**  
Depende da prioridade e disponibilidade. Acompanhe pela timeline.

**Preciso assinar no celular?**  
A assinatura na conclusão é coletada pelo **técnico** na obra, com o responsável presente.

**Como falar com a ADM?**  
Use o telefone de contato informado no chamado ou canal comercial da ADM Rental Service.

---

## 13. Índice de figuras

| Figura | Arquivo | Conteúdo |
|--------|---------|----------|
| 1 | `img/shared/01-login.png` | Login |
| 2 | `img/cliente/02-meus-chamados.png` | Meus chamados |
| 3 | `img/cliente/03-abrir-chamado.png` | Abrir chamado |
| 4 | `img/cliente/04-timeline.png` | Timeline |
| 5 | `img/cliente/05-ver-detalhes.png` | Detalhes expandidos |
| 6 | `img/cliente/06-editar-chamado.png` | Editar chamado |
| 7 | `img/cliente/07-aprovacao.png` | Aprovação |
| 8 | `img/cliente/08-conclusao.png` | Conclusão |
| 9 | `img/cliente/09-pwa-celular.png` | Celular |

---

*ADM Rental Service — ADM Manutenção · Manual do Cliente v1.0*
