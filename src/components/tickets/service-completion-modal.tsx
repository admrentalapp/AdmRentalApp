import { useRef, useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import {
  SignaturePadField,
  type SignaturePadFieldHandle,
} from '@/components/tickets/signature-pad-field'

export function ServiceCompletionModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  loading: boolean
  error: string
  onClose: () => void
  onSubmit: (input: {
    technicianSignatureDataUrl: string
    clientSignatureDataUrl: string
    clientSignerName: string
    equipmentReady: boolean
    notes: string
  }) => void | Promise<void>
}) {
  const technicianPadRef = useRef<SignaturePadFieldHandle>(null)
  const clientPadRef = useRef<SignaturePadFieldHandle>(null)
  const [clientSignerName, setClientSignerName] = useState('')
  const [equipmentReady, setEquipmentReady] = useState(true)
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState('')
  const [signatureTick, setSignatureTick] = useState(0)

  if (!open) {
    return null
  }

  async function handleSubmit() {
    setValidationError('')

    if (technicianPadRef.current?.isEmpty()) {
      setValidationError('Assine no campo do técnico antes de finalizar.')
      return
    }

    if (clientPadRef.current?.isEmpty()) {
      setValidationError('Assine no campo do cliente antes de finalizar.')
      return
    }

    const trimmedName = clientSignerName.trim()
    if (trimmedName.length < 2) {
      setValidationError('Informe o nome do responsável que assina pelo cliente.')
      return
    }

    await onSubmit({
      technicianSignatureDataUrl: technicianPadRef.current!.toDataUrl(),
      clientSignatureDataUrl: clientPadRef.current!.toDataUrl(),
      clientSignerName: trimmedName,
      equipmentReady,
      notes: notes.trim(),
    })
  }

  const displayError = validationError || error

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/75 p-0 sm:items-center sm:p-4">
      <section className="flex max-h-[100svh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[calc(100svh-2rem)] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Encerramento da OS</p>
            <h3 className="text-xl font-bold">Conclusão do Serviço</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 size={34} />
            </div>
            <h4 className="mt-4 text-lg font-bold text-foreground">
              Serviço concluído com sucesso!
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {equipmentReady
                ? 'Equipamento em condições de uso.'
                : 'Registre abaixo se o equipamento não está apto ao uso.'}
            </p>
          </div>

          <label className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
            <input
              type="checkbox"
              checked={equipmentReady}
              onChange={(event) => setEquipmentReady(event.target.checked)}
              className="h-4 w-4 rounded border-border text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-foreground">
              Equipamento em condições de uso
            </span>
          </label>

          <div className="mt-6 space-y-5">
            <SignaturePadField
              ref={technicianPadRef}
              id="technician-signature"
              label="Assinatura do técnico"
              onChange={() => setSignatureTick((value) => value + 1)}
            />

            <div>
              <label
                htmlFor="clientSignerName"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Nome do responsável (cliente)
              </label>
              <input
                id="clientSignerName"
                type="text"
                value={clientSignerName}
                onChange={(event) => setClientSignerName(event.target.value)}
                placeholder="Nome de quem assina pelo cliente"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              />
            </div>

            <SignaturePadField
              ref={clientPadRef}
              id="client-signature"
              label="Assinatura do cliente"
              onChange={() => setSignatureTick((value) => value + 1)}
            />

            <div>
              <label
                htmlFor="completionNotes"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Observações{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="completionNotes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Informações adicionais sobre a conclusão..."
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              />
            </div>
          </div>

          {displayError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {displayError}
            </p>
          )}

          <span className="sr-only" aria-hidden>
            {signatureTick}
          </span>
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Finalizando...
              </>
            ) : (
              'Finalizar'
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
