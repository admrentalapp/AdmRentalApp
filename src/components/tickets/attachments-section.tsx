import { useRef, useState } from 'react'
import { Download, Loader2, Paperclip, Upload } from 'lucide-react'
import { ATTACHMENT_ACCEPT } from '@/config/storage'
import { getAttachmentSignedUrl } from '@/features/tickets/api'
import type { Attachment } from '@/types'
import { formatDateTime } from '@/lib/format'

export function AttachmentsSection({
  attachments,
  loading,
  canUpload = false,
  uploading = false,
  uploadError = '',
  onUpload,
}: {
  attachments: Attachment[]
  loading: boolean
  canUpload?: boolean
  uploading?: boolean
  uploadError?: string
  onUpload?: (file: File) => void | Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [downloadError, setDownloadError] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownload(attachment: Attachment) {
    setDownloadError('')
    setDownloadingId(attachment.id)

    const { data, error } = await getAttachmentSignedUrl(attachment.storage_path)

    setDownloadingId(null)

    if (error || !data?.signedUrl) {
      setDownloadError(
        error?.message || 'Não foi possível abrir o arquivo. Verifique o bucket Storage.',
      )
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !onUpload) return

    await onUpload(file)
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <Paperclip className="mt-0.5 shrink-0 text-muted-foreground" size={18} />
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="font-bold">Anexos</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Fotos e documentos vinculados ao chamado (imagens ou PDF, até 10 MB).
              </p>
            </div>

            {canUpload && onUpload && (
              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => void handleFileChange(event)}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Adicionar anexo
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
              {uploadError}
            </p>
          )}

          {downloadError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
              {downloadError}
            </p>
          )}

          {loading && (
            <p className="mt-4 text-sm text-muted-foreground">Carregando anexos...</p>
          )}

          {!loading && attachments.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
              {canUpload
                ? 'Nenhum anexo registrado. Use o botão acima para enviar fotos ou PDFs.'
                : 'Nenhum anexo registrado neste chamado.'}
            </p>
          )}

          {!loading && attachments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {attachment.file_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(attachment.created_at)}
                      {attachment.mime_type
                        ? ` · ${attachment.mime_type}`
                        : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={downloadingId === attachment.id}
                    onClick={() => void handleDownload(attachment)}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    {downloadingId === attachment.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Abrindo...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Abrir arquivo
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
