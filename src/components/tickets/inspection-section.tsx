import { useEffect, useState, type FormEvent } from 'react'
import {
  inspectionCauseLabel,
  inspectionResponsibilityLabel,
  recommendedStatusForResponsibility,
} from '@/lib/inspections'
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/tickets'
import type {
  InspectionCause,
  InspectionResponsibility,
  TicketInspection,
  TicketStatus,
} from '@/types'
import { INSPECTION_CAUSES } from '@/types'

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultInspectedAt() {
  return toDatetimeLocalValue(new Date().toISOString())
}

export type InspectionFormValues = {
  inspectedAt: string
  findings: string
  probableCause: InspectionCause
  causeNotes: string
  responsibility: InspectionResponsibility
  recommendation: string
}

function buildInitialValues(inspection: TicketInspection | null): InspectionFormValues {
  if (inspection) {
    return {
      inspectedAt: toDatetimeLocalValue(inspection.inspected_at),
      findings: inspection.findings,
      probableCause: inspection.probable_cause,
      causeNotes: inspection.cause_notes ?? '',
      responsibility: inspection.responsibility,
      recommendation: inspection.recommendation,
    }
  }

  return {
    inspectedAt: defaultInspectedAt(),
    findings: '',
    probableCause: 'desgaste_natural',
    causeNotes: '',
    responsibility: 'adm',
    recommendation: '',
  }
}

export function InspectionSection({
  mode,
  inspection,
  loading,
  inspectorName,
  saveLoading = false,
  saveError = '',
  saveSuccess = '',
  currentStatus,
  onSave,
  onApplyRecommendedStatus,
}: {
  mode: 'form' | 'view'
  inspection: TicketInspection | null
  loading: boolean
  inspectorName?: string
  saveLoading?: boolean
  saveError?: string
  saveSuccess?: string
  currentStatus?: TicketStatus
  onSave?: (values: InspectionFormValues) => void | Promise<void>
  onApplyRecommendedStatus?: (status: TicketStatus) => void
}) {
  const [values, setValues] = useState<InspectionFormValues>(() =>
    buildInitialValues(inspection),
  )

  useEffect(() => {
    setValues(buildInitialValues(inspection))
  }, [inspection])

  const recommendedStatus = inspection
    ? recommendedStatusForResponsibility(inspection.responsibility)
    : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave?.(values)
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h4 className="font-bold">Laudo de inspeção</h4>
        <p className="mt-6 text-sm text-muted-foreground">Carregando laudo...</p>
      </section>
    )
  }

  if (mode === 'view' && !inspection) {
    return null
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h4 className="font-bold">Laudo de inspeção</h4>
      {mode === 'form' ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Registre constatações, causa provável e responsabilidade. O gestor
          aplicará o próximo status com base no laudo.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Resultado da inspeção técnica registrada pela manutenção.
        </p>
      )}

      {mode === 'view' && inspection && recommendedStatus && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            inspection.responsibility === 'adm'
              ? 'border-emerald-300 bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30'
              : 'border-amber-300 bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30'
          }`}
        >
          <p className="text-sm font-medium text-foreground">
            {inspectionResponsibilityLabel(inspection.responsibility)}
          </p>
          <p className="mt-1 text-sm text-foreground">
            Status sugerido:{' '}
            <span className="font-semibold text-foreground">
              {statusLabel(recommendedStatus)}
            </span>
            {currentStatus && currentStatus !== recommendedStatus && (
              <span className="text-muted-foreground">
                {' '}
                (atual: {statusLabel(currentStatus)})
              </span>
            )}
          </p>
          {onApplyRecommendedStatus &&
            currentStatus &&
            currentStatus !== recommendedStatus && (
              <button
                type="button"
                onClick={() => onApplyRecommendedStatus(recommendedStatus)}
                className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Usar status sugerido na triagem
              </button>
            )}
        </div>
      )}

      {mode === 'form' ? (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="inspectedAt"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Data e hora da inspeção
            </label>
            <input
              id="inspectedAt"
              type="datetime-local"
              required
              value={values.inspectedAt}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  inspectedAt: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="findings"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Constatações
            </label>
            <textarea
              id="findings"
              rows={4}
              required
              minLength={10}
              value={values.findings}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  findings: event.target.value,
                }))
              }
              placeholder="Descreva o que foi observado no equipamento e no local..."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="probableCause"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Causa provável
              </label>
              <select
                id="probableCause"
                value={values.probableCause}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    probableCause: event.target.value as InspectionCause,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              >
                {INSPECTION_CAUSES.map((cause) => (
                  <option key={cause} value={cause}>
                    {inspectionCauseLabel(cause)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="responsibility"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Responsabilidade
              </label>
              <select
                id="responsibility"
                value={values.responsibility}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    responsibility: event.target.value as InspectionResponsibility,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              >
                <option value="adm">Responsabilidade ADM</option>
                <option value="cliente">Responsabilidade do cliente</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                ADM → sugerido Em execução · Cliente → sugerido Aguardando
                aprovação
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="causeNotes"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Detalhes da causa{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="causeNotes"
              type="text"
              value={values.causeNotes}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  causeNotes: event.target.value,
                }))
              }
              placeholder="Complemento sobre a causa identificada"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="recommendation"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Recomendações
            </label>
            <textarea
              id="recommendation"
              rows={3}
              required
              minLength={10}
              value={values.recommendation}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  recommendation: event.target.value,
                }))
              }
              placeholder="Peças, serviços ou próximos passos recomendados..."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
            />
          </div>

          {saveError && (
            <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="rounded-lg border border-emerald-300 bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              {saveSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={saveLoading}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saveLoading
              ? 'Salvando...'
              : inspection
                ? 'Atualizar laudo'
                : 'Registrar laudo'}
          </button>
        </form>
      ) : (
        inspection && (
          <div className="mt-6 space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Inspeção em
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDateTime(inspection.inspected_at)}
                </p>
              </div>
              {inspectorName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Inspetor
                  </p>
                  <p className="mt-1 text-sm text-foreground">{inspectorName}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Constatações
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {inspection.findings}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Causa provável
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {inspectionCauseLabel(inspection.probable_cause)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Responsabilidade
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {inspectionResponsibilityLabel(inspection.responsibility)}
                </p>
              </div>
            </div>

            {inspection.cause_notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Detalhes da causa
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {inspection.cause_notes}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Recomendações
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {inspection.recommendation}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Atualizado em {formatDateTime(inspection.updated_at)}
            </p>
          </div>
        )
      )}
    </section>
  )
}
