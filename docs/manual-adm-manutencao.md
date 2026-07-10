# Manuais ADM Manutenção — Índice

Documentação de uso da plataforma, organizada em **três manuais por perfil** para geração de PDF profissional.

**Versão:** 1.0 · **Atualização:** julho/2026

---

## Manuais por perfil

| Perfil | Documento | Público |
|--------|-----------|---------|
| **Gestor ADM** | [manual-gestor.md](manual-gestor.md) | Administradores, triagem, cadastros, relatórios |
| **Técnico** | [manual-tecnico.md](manual-tecnico.md) | Manutenção ADM e Manutenção Externa |
| **Cliente** | [manual-cliente.md](manual-cliente.md) | Usuários das empresas contratantes |

---

## Como gerar os PDFs

1. Capture as telas conforme [roteiro-capturas.md](roteiro-capturas.md)
2. Salve em `docs/img/shared/`, `docs/img/gestor/`, `docs/img/tecnico/`, `docs/img/cliente/`
3. Execute `npm run manual:pdf` (requer [Pandoc](https://pandoc.org)) **ou** monte no Canva/Word

Detalhes: [README.md](README.md)

---

## Conteúdo deste repositório (referência completa)

O texto abaixo consolida informações compartilhadas entre os três manuais. Para entrega ao usuário final, use os manuais individuais acima.

### Perfis de acesso

| Perfil | Código | Função |
|--------|--------|--------|
| Gestor ADM | `gestor_adm` | Cadastros, triagem, relatórios |
| Manutenção ADM | `manutencao_adm` | Atendimento em campo |
| Manutenção Externa | `manutencao_externa` | Atendimento em campo |
| Cliente | `cliente` | Abertura e acompanhamento de chamados |

### Fluxo ponta a ponta

```text
Cliente abre chamado → Gestor triagem → Técnico laudo →
Cliente aprova (se necessário) → Técnico executa → Conclusão com assinaturas
```

### Scripts SQL (implantação)

Ver lista completa em [manual-gestor.md — seção 14](manual-gestor.md#14-scripts-sql).

---

*ADM Rental Service — ADM Manutenção*
