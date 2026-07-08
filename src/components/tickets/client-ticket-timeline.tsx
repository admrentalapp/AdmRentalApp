import { useMemo, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import {
  buildClientTicketTimeline,
  formatTicketOsNumber,
} from '@/lib/ticket-timeline'
import type { Ticket, TicketEvent } from '@/types'

export function ClientTicketTimeline({
  ticket,
  events,
  loading,
  onViewDetails,
}: {
  ticket: Ticket
  events: TicketEvent[]
  loading: boolean
  onViewDetails: () => void
}) {
  const detailsAnchorRef = useRef<HTMLDivElement>(null)

  const steps = useMemo(
    () => buildClientTicketTimeline(ticket, events),
    [ticket, events],
  )

  function handleViewDetails() {
    onViewDetails()
    window.requestAnimationFrame(() => {
      detailsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Detalhes do Chamado
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground">
              {formatTicketOsNumber(ticket.ticket_number, ticket.created_at)}
            </p>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          <h3 className="mt-3 text-xl font-bold text-foreground">{ticket.title}</h3>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Andamento
          </p>

          {loading && (
            <p className="text-sm text-muted-foreground">Carregando linha do tempo...</p>
          )}

          {!loading && (
            <ol className="relative ms-2 border-s border-border ps-6">
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1
                const dotClass =
                  step.state === 'done'
                    ? 'border-foreground bg-foreground'
                    : step.state === 'current'
                      ? 'border-orange-500 bg-orange-500 ring-4 ring-orange-500/20'
                      : 'border-muted-foreground/40 bg-background'

                const titleClass =
                  step.state === 'upcoming'
                    ? 'text-muted-foreground'
                    : 'text-foreground'

                return (
                  <li
                    key={step.id}
                    className={`relative ${isLast ? 'pb-0' : 'pb-6'}`}
                  >
                    <span
                      className={`absolute -start-[31px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${dotClass}`}
                      aria-hidden
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      {step.timeLabel ? (
                        <p className="shrink-0 text-xs font-medium text-muted-foreground sm:order-2">
                          {step.timeLabel}
                        </p>
                      ) : (
                        <span className="hidden sm:order-2 sm:inline" />
                      )}
                      <div className="min-w-0 sm:order-1">
                        <p className={`text-sm font-semibold ${titleClass}`}>
                          {step.title}
                          {step.state === 'current' && (
                            <span className="ms-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              Agora
                            </span>
                          )}
                        </p>
                        {step.description && (
                          <p
                            className={`mt-1 text-sm ${
                              step.state === 'current'
                                ? 'text-orange-700 dark:text-orange-300'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="border-t border-border px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleViewDetails}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700"
          >
            Ver detalhes
            <ChevronDown size={18} />
          </button>
        </div>
      </section>

      <div ref={detailsAnchorRef} className="h-0 scroll-mt-6" aria-hidden />
    </>
  )
}
