import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getAttachmentSignedUrl } from '@/features/tickets/api'
import { formatDateTime } from '@/lib/format'
import type { TicketServiceCompletion } from '@/types'

function SignaturePreview({
  label,
  storagePath,
}: {
  label: string
  storagePath: string
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void (async () => {
      setLoading(true)
      const { data, error } = await getAttachmentSignedUrl(storagePath)

      if (!active) return

      if (error || !data?.signedUrl) {
        setImageUrl(null)
      } else {
        setImageUrl(data.signedUrl)
      }

      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [storagePath])

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-white p-2">
        {loading && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Carregando assinatura...
          </div>
        )}
        {!loading && imageUrl && (
          <img
            src={imageUrl}
            alt={label}
            className="mx-auto block max-h-40 w-full object-contain"
          />
        )}
        {!loading && !imageUrl && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Assinatura indisponível
          </div>
        )}
      </div>
    </div>
  )
}

export function ServiceCompletionSection({
  completion,
  loading,
  technicianName,
}: {
  completion: TicketServiceCompletion | null
  loading: boolean
  technicianName?: string
}) {
  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Carregando conclusão do serviço...</p>
      </section>
    )
  }

  if (!completion) {
    return null
  }

  return (
    <section className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h4 className="font-bold text-foreground">Conclusão do serviço</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Finalizado em {formatDateTime(completion.completed_at)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {completion.equipment_ready
              ? 'Equipamento liberado em condições de uso.'
              : 'Equipamento registrado sem condições de uso.'}
          </p>
          {technicianName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Técnico: {technicianName}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Cliente: {completion.client_signer_name}
          </p>
          {completion.notes && (
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {completion.notes}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SignaturePreview
          label="Assinatura do técnico"
          storagePath={completion.technician_signature_path}
        />
        <SignaturePreview
          label="Assinatura do cliente"
          storagePath={completion.client_signature_path}
        />
      </div>
    </section>
  )
}
