# Manuais ADM Manutenção

Três manuais separados por perfil, prontos para inserir capturas de tela e exportar em PDF.

| Perfil | Arquivo Markdown | PDF gerado |
|--------|------------------|------------|
| Gestor ADM | [manual-gestor.md](manual-gestor.md) | `manual-gestor-v1.0.pdf` |
| Técnico | [manual-tecnico.md](manual-tecnico.md) | `manual-tecnico-v1.0.pdf` |
| Cliente | [manual-cliente.md](manual-cliente.md) | `manual-cliente-v1.0.pdf` |

O manual completo (todos os perfis) permanece em [manual-adm-manutencao.md](manual-adm-manutencao.md).

---

## Passo a passo para gerar os PDFs

### 1. Capturar imagens

Siga o roteiro detalhado: [roteiro-capturas.md](roteiro-capturas.md)

Salve os arquivos PNG nas pastas:

```text
docs/img/shared/          ← login (compartilhado)
docs/img/gestor/          ← 9 imagens
docs/img/tecnico/         ← 9 imagens
docs/img/cliente/         ← 9 imagens
```

Use dados fictícios (empresa de teste). Resolução recomendada: **1920×1080**, zoom 100%.

### 2. Inserir imagens (opcional)

Os três manuais já referenciam os caminhos `![...](img/...)`. Basta salvar os PNGs com os nomes indicados — o Markdown exibirá as imagens automaticamente.

### 3. Exportar PDF

#### Opção A — Script automático (Pandoc)

Instale [Pandoc](https://pandoc.org/installing.html) e execute:

```powershell
npm run manual:pdf
```

Gera os três PDFs em `docs/pdf/`.

#### Opção B — Canva / Word (layout premium)

1. Abra o `.md` no VS Code → copie seção por seção
2. Cole no Canva ou Word com capa ADM Rental Service
3. Insira as imagens de `docs/img/`
4. Exporte PDF A4

#### Opção C — VS Code + extensão

Extensão **Markdown PDF** → abrir cada `.md` → `Markdown PDF: Export (pdf)`.

---

## Estrutura de pastas

```text
docs/
├── README.md
├── manual-adm-manutencao.md    ← índice / manual completo
├── manual-gestor.md
├── manual-tecnico.md
├── manual-cliente.md
├── roteiro-capturas.md
├── img/
│   ├── shared/
│   ├── gestor/
│   ├── tecnico/
│   └── cliente/
└── pdf/                        ← PDFs gerados (gitignore opcional)
```

---

## Entrega ao cliente

Envie apenas o PDF correspondente ao perfil:

- Gestores internos ADM → `manual-gestor-v1.0.pdf`
- Técnicos de campo → `manual-tecnico-v1.0.pdf`
- Usuários das empresas clientes → `manual-cliente-v1.0.pdf`
