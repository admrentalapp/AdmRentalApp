#Requires -Version 5.1
<#
.SYNOPSIS
  Gera PDFs dos manuais Gestor, Tecnico e Cliente a partir dos arquivos Markdown.

.DESCRIPTION
  Requer Pandoc instalado: https://pandoc.org/installing.html

  Uso:
    npm run manual:pdf
    ou
    pwsh scripts/build-manuals.ps1
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Docs = Join-Path $Root "docs"
$OutDir = Join-Path $Docs "pdf"

$Manuals = @(
    @{ Source = "manual-gestor.md";  Output = "manual-gestor-v1.0.pdf" },
    @{ Source = "manual-tecnico.md"; Output = "manual-tecnico-v1.0.pdf" },
    @{ Source = "manual-cliente.md"; Output = "manual-cliente-v1.0.pdf" }
)

function Test-Pandoc {
    $pandoc = Get-Command pandoc -ErrorAction SilentlyContinue
    if (-not $pandoc) {
        Write-Host ""
        Write-Host "Pandoc nao encontrado." -ForegroundColor Red
        Write-Host "Instale em: https://pandoc.org/installing.html" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternativa: exporte cada .md pelo Canva, Word ou extensao Markdown PDF no VS Code." -ForegroundColor Cyan
        exit 1
    }
    return $pandoc.Source
}

$pandocPath = Test-Pandoc
Write-Host "Usando Pandoc: $pandocPath" -ForegroundColor Green

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

Push-Location $Docs
try {
    foreach ($manual in $Manuals) {
        $src = Join-Path $Docs $manual.Source
        $dst = Join-Path $OutDir $manual.Output

        if (-not (Test-Path $src)) {
            Write-Warning "Arquivo nao encontrado: $($manual.Source)"
            continue
        }

        Write-Host "Gerando $($manual.Output)..." -ForegroundColor Cyan

        & pandoc $manual.Source `
            -o $dst `
            --from markdown `
            --pdf-engine=wkhtmltopdf `
            --toc `
            --toc-depth=2 `
            -V geometry:margin=2.5cm `
            -V documentclass=article `
            -V lang=pt-BR `
            2>$null

        if ($LASTEXITCODE -ne 0) {
            # Fallback sem wkhtmltopdf — engine padrao do pandoc (pdflatex ou outro)
            & pandoc $manual.Source `
                -o $dst `
                --from markdown `
                --toc `
                --toc-depth=2 `
                -V geometry:margin=2.5cm `
                -V documentclass=article `
                -V lang=pt-BR
        }

        if ($LASTEXITCODE -eq 0 -and (Test-Path $dst)) {
            Write-Host "  OK -> docs/pdf/$($manual.Output)" -ForegroundColor Green
        } else {
            Write-Host "  Falha ao gerar $($manual.Output). Verifique Pandoc/LaTeX." -ForegroundColor Red
        }
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Concluido. PDFs em docs/pdf/" -ForegroundColor Green
