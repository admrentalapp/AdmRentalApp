---
title: "Manual do Técnico"
subtitle: "ADM Manutenção"
version: "1.0"
date: "julho/2026"
audience: "Manutenção ADM / Manutenção Externa"
---

# Manual do Técnico — ADM Manutenção

**ADM Rental Service** · Versão 1.0 · julho/2026

Este manual é destinado aos perfis **Manutenção ADM** (`manutencao_adm`) e **Manutenção Externa** (`manutencao_externa`), responsáveis pelo atendimento em campo das ordens de serviço.

---

## Sumário

1. [Introdução](#1-introdução)
2. [Primeiro acesso](#2-primeiro-acesso)
3. [Área de manutenção](#3-área-de-manutenção)
4. [Fluxo do atendimento](#4-fluxo-do-atendimento)
5. [Laudo de inspeção](#5-laudo-de-inspeção)
6. [Anexos e anotações](#6-anexos-e-anotações)
7. [Conclusão com assinaturas](#7-conclusão-com-assinaturas)
8. [Checklist](#8-checklist)
9. [Uso no celular (PWA)](#9-uso-no-celular-pwa)
10. [Rotina recomendada](#10-rotina-recomendada)
11. [Perguntas frequentes](#11-perguntas-frequentes)
12. [Índice de figuras](#12-índice-de-figuras)

---

## 1. Introdução

Como técnico, você:

- Atende **somente chamados atribuídos a você** pelo gestor
- Registra **laudo de inspeção** no equipamento
- Anexa **fotos e PDFs** como evidência
- **Conclui o serviço** com assinaturas do técnico e do cliente
- Executa **checklists** operacionais

Você **não** altera cadastros de clientes, equipamentos ou usuários.

---

## 2. Primeiro acesso

### Login

1. Acesse a URL do sistema no navegador ou app instalado (PWA).
2. Informe **e-mail** e **senha** fornecidos pelo gestor.
3. O sistema abre a **Área de manutenção**.

![Tela de login](img/shared/01-login.png)

*Figura 1 — Tela de login*

> **Atenção:** se a lista de chamados estiver vazia, peça ao gestor para atribuir OS a você na triagem.

---

## 3. Área de manutenção

Após o login, você verá duas abas:

| Aba | Função |
|-----|--------|
| **Meus chamados** | OS atribuídas a você |
| **Checklist** | Execução de checklists |

![Área do técnico](img/tecnico/02-area-manutencao.png)

*Figura 2 — Área de manutenção com abas Meus chamados e Checklist*

### Meus chamados

Lista apenas chamados em que você é o **técnico responsável**. Clique em um chamado para abrir o detalhe.

![Lista de chamados](img/tecnico/03-meus-chamados.png)

*Figura 3 — Lista de chamados atribuídos ao técnico*

---

## 4. Fluxo do atendimento

### Status que você encontrará

| Status | Sua ação |
|--------|----------|
| Em inspeção | Registrar laudo |
| Em execução | Executar serviço, anexar evidências |
| Aguard. peças | Aguardar peças; registrar anotações |
| Aguard. aprovação | Aguardar decisão do cliente |
| Concluído | Apenas consulta |

### Sequência na obra

```text
1. Abrir chamado na lista
2. Ler descrição e dados da solicitação
3. Preencher laudo de inspeção
4. Anexar fotos do equipamento
5. Executar o serviço
6. Concluir com assinaturas (técnico + cliente)
```

![Detalhe da OS](img/tecnico/04-detalhe-os.png)

*Figura 4 — Detalhe da ordem de serviço*

---

## 5. Laudo de inspeção

No detalhe da OS, seção **Laudo de inspeção**:

| Campo | O que preencher |
|-------|-----------------|
| Data/hora da inspeção | Momento da visita |
| Constatações | O que foi observado |
| Causa provável | Desgaste, operação inadequada, mau uso, etc. |
| Responsabilidade | **ADM** ou **Cliente** |
| Recomendações | Serviços sugeridos |

Clique em **Salvar laudo**.

| Responsabilidade | Próximo status |
|------------------|----------------|
| **Cliente** | Aguard. aprovação (cliente deve aprovar) |
| **ADM** | Em execução (prossiga com o serviço) |

![Laudo de inspeção](img/tecnico/05-laudo-inspecao.png)

*Figura 5 — Formulário de laudo de inspeção*

> **Dica:** descreva constatações de forma clara — o cliente lê este laudo na aprovação.

---

## 6. Anexos e anotações

### Anexos

- Formatos: JPEG, PNG, WebP, GIF, PDF
- Tamanho máximo: **10 MB** por arquivo
- Envie fotos do equipamento, avaria e serviço realizado

### Anotação rápida

Texto livre registrado no **histórico** da OS (ex.: “Aguardando peça X”, “Cliente ausente na obra”).

![Anexos](img/tecnico/06-anexos.png)

*Figura 6 — Envio de anexos e anotações*

---

## 7. Conclusão com assinaturas

Disponível quando o status for **Em inspeção**, **Em execução** ou **Aguard. peças**.

### Passo a passo

1. Clique em **Concluir serviço**.
2. Na tela de conclusão:
   - Confirme se o equipamento está **em condições de uso**
   - Assine em **Assinatura do técnico** (dedo no celular ou mouse no PC)
   - Informe o **nome do responsável** que assina pelo cliente
   - Colete a **Assinatura do cliente** na obra
3. Clique em **FINALIZAR**.

O chamado passa para **Concluído**. As assinaturas ficam registradas e visíveis ao gestor e ao cliente.

![Conclusão com assinaturas](img/tecnico/07-conclusao-assinaturas.png)

*Figura 7 — Modal de conclusão com assinaturas do técnico e do cliente*

> **Atenção:** não saia da obra sem coletar a assinatura do cliente quando o serviço for concluído.

---

## 8. Checklist

**Caminho:** Aba **Checklist**

1. Selecione o **template** e o **equipamento** (opcional).
2. Inicie a execução.
3. Marque cada item verificado.
4. Adicione observações quando necessário.
5. Conclua o checklist.

![Checklist](img/tecnico/08-checklist.png)

*Figura 8 — Execução de checklist operacional*

---

## 9. Uso no celular (PWA)

Para usar na obra com mais praticidade:

1. Abra o sistema no **Chrome** (Android) ou **Safari** (iPhone).
2. Toque em **Adicionar à tela inicial** ou **Instalar app**.
3. Acesse pelo ícone na tela inicial.

Ideal para: laudo, fotos e **assinaturas com o dedo**.

![App no celular](img/tecnico/09-pwa-celular.png)

*Figura 9 — Sistema instalado como app no celular*

---

## 10. Rotina recomendada

```text
Chegada na obra
  → Abrir OS no celular
  → Inspeção + fotos iniciais

Durante o serviço
  → Anotações no histórico
  → Anexos adicionais

Antes de sair
  → Conclusão com assinaturas (técnico + cliente)
  → Confirmar status "Concluído"
```

---

## 11. Perguntas frequentes

**Não vejo nenhum chamado**  
O gestor precisa atribuir você como técnico na triagem. Entre em contato com a central.

**Erro ao salvar laudo**  
Informe ao gestor — pode ser necessário executar script SQL no Supabase.

**Erro ao anexar foto**  
Verifique formato (JPEG, PNG, PDF) e tamanho (máx. 10 MB). Teste conexão de internet na obra.

**Erro ao finalizar com assinaturas**  
Preencha ambas as assinaturas e o nome do responsável pelo cliente antes de clicar FINALIZAR.

**Cliente recusou o serviço**  
Aguarde orientação do gestor. Não conclua a OS sem alinhamento.

---

## 12. Índice de figuras

| Figura | Arquivo | Conteúdo |
|--------|---------|----------|
| 1 | `img/shared/01-login.png` | Login |
| 2 | `img/tecnico/02-area-manutencao.png` | Área de manutenção |
| 3 | `img/tecnico/03-meus-chamados.png` | Lista de chamados |
| 4 | `img/tecnico/04-detalhe-os.png` | Detalhe da OS |
| 5 | `img/tecnico/05-laudo-inspecao.png` | Laudo |
| 6 | `img/tecnico/06-anexos.png` | Anexos |
| 7 | `img/tecnico/07-conclusao-assinaturas.png` | Assinaturas |
| 8 | `img/tecnico/08-checklist.png` | Checklist |
| 9 | `img/tecnico/09-pwa-celular.png` | PWA no celular |

---

*ADM Rental Service — ADM Manutenção · Manual do Técnico v1.0*
