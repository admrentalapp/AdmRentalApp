import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AlertTriangle, Loader2, Paperclip, Upload, X } from 'lucide-react'
import { ATTACHMENT_ACCEPT } from '@/config/storage'
import { filterClientEquipmentBySite } from '@/features/equipment/api'
import { createClientTicket, validateAttachmentFile } from '@/features/tickets/api'
import type { EquipmentWithAllocation, Site } from '@/types'

const MAX_OPENING_ATTACHMENTS = 5

function defaultIncidentAtValue() {
  const now = new Date()
  now.setSeconds(0, 0)
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function ClientNewTicketModal({
  open,
  companyName,
  clientId,
  userId,
  sites,
  allocatedFleet,
  onClose,
  onCreated,
}: {
  open: boolean
  companyName: string
  clientId: string
  userId: string
  sites: Site[]
  allocatedFleet: EquipmentWithAllocation[]
  onClose: () => void
  onCreated: (warning?: string) => void | Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [siteId, setSiteId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [incidentAt, setIncidentAt] = useState(defaultIncidentAtValue)
  const [siteContactName, setSiteContactName] = useState('')
  const [siteContactPhone, setSiteContactPhone] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const availableEquipment = useMemo(
    () => filterClientEquipmentBySite(allocatedFleet, siteId),
    [allocatedFleet, siteId],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setSiteId('')
    setEquipmentId('')
    setIncidentAt(defaultIncidentAtValue())
    setSiteContactName('')
    setSiteContactPhone('')
    setTitle('')
    setDescription('')
    setAttachments([])
    setMessage('')
  }, [open])

  useEffect(() => {
    if (
      equipmentId &&
      !availableEquipment.some((item) => item.id === equipmentId)
    ) {
      setEquipmentId('')
    }
  }, [availableEquipment, equipmentId])

  function handleAddFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return
    }

    const nextFiles = [...attachments]
    const errors: string[] = []

    for (const file of Array.from(fileList)) {
      if (nextFiles.length >= MAX_OPENING_ATTACHMENTS) {
        errors.push(`Máximo de ${MAX_OPENING_ATTACHMENTS} anexos na abertura.`)
        break
      }

      const validationError = validateAttachmentFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
        continue
      }

      if (nextFiles.some((item) => item.name === file.name && item.size === file.size)) {
        continue
      }

      nextFiles.push(file)
    }

    setAttachments(nextFiles)

    if (errors.length > 0) {
      setMessage(errors.join(' '))
    } else {
      setMessage('')
    }
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!siteId) {
      setMessage('Selecione a obra onde o equipamento está.')
      return
    }

    if (!equipmentId) {
      setMessage('Selecione o equipamento com avaria.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const trimmedContactName = siteContactName.trim()
    const trimmedContactPhone = siteContactPhone.trim()
    const phoneDigits = normalizePhone(trimmedContactPhone)

    if (!incidentAt) {
      setMessage('Informe a data e hora da avaria.')
      return
    }

    const incidentDate = new Date(incidentAt)
    if (Number.isNaN(incidentDate.getTime())) {
      setMessage('Data/hora da avaria inválida.')
      return
    }

    if (incidentDate.getTime() > Date.now()) {
      setMessage('A data da avaria não pode ser no futuro.')
      return
    }

    if (trimmedContactName.length < 2) {
      setMessage('Informe o nome do responsável na obra.')
      return
    }

    if (phoneDigits.length < 8) {
      setMessage('Informe um telefone válido para contato na obra.')
      return
    }

    if (trimmedTitle.length < 3) {
      setMessage('O título deve ter pelo menos 3 caracteres.')
      return
    }

    if (trimmedDescription.length < 10) {
      setMessage('Descreva o problema com pelo menos 10 caracteres.')
      return
    }

    setLoading(true)
    setMessage('')

    const { data, error, attachmentErrors } = await createClientTicket({
      clientId,
      siteId,
      equipmentId,
      incidentAt: incidentDate.toISOString(),
      siteContactName: trimmedContactName,
      siteContactPhone: trimmedContactPhone,
      title: trimmedTitle,
      description: trimmedDescription,
      createdBy: userId,
      attachments,
    })

    setLoading(false)

    if (error || !data) {
      setMessage(
        error?.message ||
          'Não foi possível abrir o chamado. Verifique se seu perfil está vinculado à empresa.',
      )
      return
    }

    const warning =
      attachmentErrors.length > 0
        ? `Chamado aberto, mas alguns anexos falharam: ${attachmentErrors.join(' · ')}`
        : undefined

    await onCreated(warning)
    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-5">
      <section className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nova solicitação</p>
            <h3 className="mt-1 text-xl font-bold">Abrir chamado</h3>
            <p className="mt-1 text-xs text-muted-foreground">{companyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p>
              Se houver risco à operação ou segurança, interrompa o uso do
              equipamento e sinalize a equipe na obra antes de aguardar o
              atendimento da ADM.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="clientTicketSite"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Obra
              </label>
              <select
                id="clientTicketSite"
                required
                value={siteId}
                onChange={(event) => setSiteId(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              >
                <option value="">Selecione a obra</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="clientTicketEquipment"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Equipamento
              </label>
              <select
                id="clientTicketEquipment"
                required
                disabled={!siteId}
                value={equipmentId}
                onChange={(event) => setEquipmentId(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {siteId ? 'Selecione o equipamento' : 'Selecione a obra primeiro'}
                </option>
                {availableEquipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.asset_tag} — {item.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="clientTicketIncidentAt"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Data e hora da avaria
            </label>
            <input
              id="clientTicketIncidentAt"
              type="datetime-local"
              required
              value={incidentAt}
              max={defaultIncidentAtValue()}
              onChange={(event) => setIncidentAt(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="clientTicketContactName"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Responsável na obra
              </label>
              <input
                id="clientTicketContactName"
                type="text"
                required
                value={siteContactName}
                onChange={(event) => setSiteContactName(event.target.value)}
                placeholder="Nome de quem está na obra"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label
                htmlFor="clientTicketContactPhone"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Telefone do contato
              </label>
              <input
                id="clientTicketContactPhone"
                type="tel"
                required
                value={siteContactPhone}
                onChange={(event) => setSiteContactPhone(event.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="clientTicketTitle"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Título
            </label>
            <input
              id="clientTicketTitle"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Equipamento parou de funcionar"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="clientTicketDescription"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Descrição detalhada
            </label>
            <textarea
              id="clientTicketDescription"
              required
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o que aconteceu, sintomas, mensagens de erro e o que já foi verificado..."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            />
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Paperclip size={16} />
                  Fotos e documentos
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Envie imagens ou PDF da avaria (até {MAX_OPENING_ATTACHMENTS}{' '}
                  arquivos, 10 MB cada).
                </p>
              </div>

              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ATTACHMENT_ACCEPT}
                  className="hidden"
                  disabled={loading || attachments.length >= MAX_OPENING_ATTACHMENTS}
                  onChange={(event) => handleAddFiles(event.target.files)}
                />
                <button
                  type="button"
                  disabled={loading || attachments.length >= MAX_OPENING_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={16} />
                  Adicionar anexos
                </button>
              </div>
            </div>

            {attachments.length > 0 && (
              <ul className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="truncate text-foreground">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {message && (
            <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
              {message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                'Abrir chamado'
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
