import type { ManagedProfile, TicketEvent } from '@/types'
import { formatDateTime } from '@/lib/format'
import { eventTypeLabel } from '@/lib/inspections'

export function TicketEventsSection({
  events,
  loading,
  profiles,
}: {
  events: TicketEvent[]
  loading: boolean
  profiles?: ManagedProfile[]
}) {
  function authorName(userId: string) {
    return profiles?.find((item) => item.id === userId)?.full_name ?? 'Usuário'
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h4 className="font-bold">Histórico</h4>
      <p className="mt-1 text-sm text-zinc-500">
        Registro de eventos e atualizações deste chamado.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-zinc-400">Carregando histórico...</p>
      )}

      {!loading && events.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          Nenhum evento registrado ainda.
        </p>
      )}

      {!loading && events.length > 0 && (
        <div className="mt-6 space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                  {eventTypeLabel(event.event_type)}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {event.message}
              </p>
              {profiles && (
                <p className="mt-2 text-xs text-zinc-500">
                  Por {authorName(event.created_by)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
