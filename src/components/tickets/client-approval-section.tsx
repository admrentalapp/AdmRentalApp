import { useState, type FormEvent } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { approvalDecisionLabel } from '@/features/tickets/approvals-api'
import { formatDateTime } from '@/lib/format'
import type { Ticket, TicketApproval, TicketInspection } from '@/types'

export function ClientApprovalSection({
  ticket,
  inspection,
  approval,
  loading,
  submitLoading,
  submitError,
  onRespond,
}: {
  ticket: Ticket
  inspection: TicketInspection | null
  approval: TicketApproval | null
  loading: boolean
  submitLoading: boolean
  submitError: string
  onRespond: (
    decision: 'aprovado' | 'recusado',
    notes: string,
  ) => void | Promise<void>
}) {
  const [notes, setNotes] = useState('')
  const [pendingDecision, setPendingDecision] = useState<
    'aprovado' | 'recusado' | null
  >(null)

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Carregando aprovação...</p>
      </section>
    )
  }

  if (ticket.status !== 'aguardando_aprovacao' && !approval) {
    return null
  }

  if (approval) {
    const approved = approval.decision === 'aprovado'

    return (
      <section
        className={`mt-6 rounded-2xl border p-6 ${
          approved
            ? 'border-emerald-300 bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/20'
            : 'border-red-300 bg-red-100 dark:border-red-900/60 dark:bg-red-950/20'
        }`}
      >
        <div className="flex items-start gap-3">
          {approved ? (
            <CheckCircle2
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              size={22}
            />
          ) : (
            <XCircle className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" size={22} />
          )}
          <div>
            <h4 className="font-bold text-foreground">
              {approvalDecisionLabel(approval.decision)} pelo cliente
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Respondido em {formatDateTime(approval.responded_at)}
            </p>
            {approval.notes && (
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {approval.notes}
              </p>
            )}
          </div>
        </div>
      </section>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingDecision) return
    await onRespond(pendingDecision, notes.trim())
  }

  return (
    <section className="mt-6 rounded-2xl border border-purple-300 bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/20 p-6">
      <h4 className="font-bold text-foreground">Aprovação necessária</h4>
      <p className="mt-2 text-sm text-muted-foreground">
        O laudo de inspeção indica responsabilidade do cliente. Revise as
        recomendações abaixo e confirme se autoriza a execução dos serviços.
      </p>

      {inspection && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Recomendações da manutenção
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {inspection.recommendation}
          </p>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="approvalNotes"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Observações{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="approvalNotes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Comentários sobre a aprovação ou motivo da recusa..."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
          />
        </div>

        {submitError && (
          <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
            {submitError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitLoading}
            onClick={() => setPendingDecision('recusado')}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
              pendingDecision === 'recusado'
                ? 'border-red-500 bg-red-600 text-white'
                : 'border-border text-foreground hover:bg-accent'
            }`}
          >
            <XCircle size={16} />
            Recusar
          </button>
          <button
            type="button"
            disabled={submitLoading}
            onClick={() => setPendingDecision('aprovado')}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
              pendingDecision === 'aprovado'
                ? 'border-emerald-500 bg-emerald-600 text-white'
                : 'border-border text-foreground hover:bg-accent'
            }`}
          >
            <CheckCircle2 size={16} />
            Aprovar execução
          </button>
          <button
            type="submit"
            disabled={submitLoading || !pendingDecision}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitLoading ? 'Enviando...' : 'Confirmar decisão'}
          </button>
        </div>
      </form>
    </section>
  )
}
