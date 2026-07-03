import { Download, FileSpreadsheet } from 'lucide-react'
import { getTicketStats } from '@/lib/tickets'
import { statusLabel, priorityLabel } from '@/lib/tickets'
import { formatDateTime } from '@/lib/format'
import { isPartBelowMinimum } from '@/features/inventory/api'
import type { Part, Ticket } from '@/types'

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage({
  tickets,
  parts,
}: {
  tickets: Ticket[]
  parts: Part[]
}) {
  const stats = getTicketStats(tickets)
  const lowStock = parts.filter(isPartBelowMinimum)

  function exportTickets() {
    downloadCsv(`relatorio-chamados-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['OS', 'Titulo', 'Status', 'Prioridade', 'Abertura', 'Encerramento'],
      ...tickets.map((ticket) => [
        String(ticket.ticket_number),
        ticket.title,
        statusLabel(ticket.status),
        priorityLabel(ticket.priority),
        formatDateTime(ticket.created_at),
        ticket.closed_at ? formatDateTime(ticket.closed_at) : '',
      ]),
    ])
  }

  function exportParts() {
    downloadCsv(`relatorio-estoque-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['SKU', 'Nome', 'Estoque', 'Minimo', 'Status'],
      ...parts.map((part) => [
        part.sku,
        part.name,
        String(part.current_stock),
        String(part.min_stock),
        isPartBelowMinimum(part) ? 'Abaixo do minimo' : 'OK',
      ]),
    ])
  }

  return (
    <>
      <section>
        <p className="text-sm text-zinc-500">Exportações e indicadores</p>
        <h3 className="mt-1 text-2xl font-bold">Relatórios</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Resumo operacional e exportação de dados em CSV.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total de chamados</p>
          <p className="mt-2 text-3xl font-bold">{tickets.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Abertos</p>
          <p className="mt-2 text-3xl font-bold">{stats.openCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Concluídos no mês</p>
          <p className="mt-2 text-3xl font-bold">{stats.completedThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Peças críticas</p>
          <p className="mt-2 text-3xl font-bold">{lowStock.length}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={exportTickets}
          className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left hover:border-zinc-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <p className="font-semibold">Exportar chamados</p>
            <p className="mt-1 text-sm text-zinc-500">
              CSV com OS, status, prioridade e datas.
            </p>
          </div>
          <Download className="ml-auto text-zinc-500" size={18} />
        </button>

        <button
          type="button"
          onClick={exportParts}
          className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left hover:border-zinc-700"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <p className="font-semibold">Exportar estoque</p>
            <p className="mt-1 text-sm text-zinc-500">
              CSV com SKU, quantidades e alertas de mínimo.
            </p>
          </div>
          <Download className="ml-auto text-zinc-500" size={18} />
        </button>
      </section>
    </>
  )
}
