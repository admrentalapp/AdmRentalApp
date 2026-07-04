import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Loader2, Save, X } from 'lucide-react'
import { filterClientEquipmentBySite } from '@/features/equipment/api'
import { insertTicketEvent, updateClientTicket } from '@/features/tickets/api'
import type { EquipmentWithAllocation, Site, Ticket } from '@/types'

function defaultIncidentAtValue() {
  const now = new Date()
  now.setSeconds(0, 0)
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return defaultIncidentAtValue()
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return defaultIncidentAtValue()
  }

  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function ClientEditTicketModal({
  open,
  companyName,
  ticket,
  userId,
  sites,
  allocatedFleet,
  onClose,
  onUpdated,
}: {
  open: boolean
  companyName: string
  ticket: Ticket | null
  userId: string
  sites: Site[]
  allocatedFleet: EquipmentWithAllocation[]
  onClose: () => void
  onUpdated: (ticket: Ticket) => void | Promise<void>
}) {
  const [siteId, setSiteId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [incidentAt, setIncidentAt] = useState(defaultIncidentAtValue)
  const [siteContactName, setSiteContactName] = useState('')
  const [siteContactPhone, setSiteContactPhone] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const availableEquipment = useMemo(
    () => filterClientEquipmentBySite(allocatedFleet, siteId),
    [allocatedFleet, siteId],
  )

  useEffect(() => {
    if (!open || !ticket) {
      return
    }

    setSiteId(ticket.site_id ?? '')
    setEquipmentId(ticket.equipment_id ?? '')
    setIncidentAt(toDateTimeLocalValue(ticket.incident_at))
    setSiteContactName(ticket.site_contact_name ?? '')
    setSiteContactPhone(ticket.site_contact_phone ?? '')
    setTitle(ticket.title)
    setDescription(ticket.description)
    setMessage('')
  }, [open, ticket])

  useEffect(() => {
    if (
      equipmentId &&
      !availableEquipment.some((item) => item.id === equipmentId)
    ) {
      setEquipmentId('')
    }
  }, [availableEquipment, equipmentId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ticket) return

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

    const { data: updatedTicket, error } = await updateClientTicket({
      ticketId: ticket.id,
      siteId,
      equipmentId,
      incidentAt: incidentDate.toISOString(),
      siteContactName: trimmedContactName,
      siteContactPhone: trimmedContactPhone,
      title: trimmedTitle,
      description: trimmedDescription,
    })

    setLoading(false)

    if (error || !updatedTicket) {
      setMessage(error?.message || 'Não foi possível atualizar o chamado.')
      return
    }

    const changes: string[] = []

    if ((ticket.site_id ?? '') !== siteId) changes.push('obra atualizada')
    if ((ticket.equipment_id ?? '') !== equipmentId) {
      changes.push('equipamento atualizado')
    }
    if ((ticket.incident_at ?? '') !== updatedTicket.incident_at) {
      changes.push('data da avaria atualizada')
    }
    if ((ticket.site_contact_name ?? '') !== trimmedContactName) {
      changes.push('responsável na obra atualizado')
    }
    if ((ticket.site_contact_phone ?? '') !== trimmedContactPhone) {
      changes.push('telefone de contato atualizado')
    }
    if (ticket.title !== trimmedTitle) changes.push('título atualizado')
    if (ticket.description !== trimmedDescription) {
      changes.push('descrição atualizada')
    }

    if (changes.length > 0) {
      await insertTicketEvent(
        ticket.id,
        'atualizacao',
        `Chamado atualizado pelo cliente: ${changes.join(' · ')}`,
        userId,
      )
    }

    await onUpdated(updatedTicket)
    onClose()
  }

  if (!open || !ticket) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
      <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Atualizar solicitação</p>
            <h3 className="mt-1 text-xl font-bold">Editar chamado</h3>
            <p className="mt-1 text-xs text-muted-foreground">{companyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p>
              Revise obra, equipamento e descrição antes de salvar. Essas
              informações serão usadas pela equipe de manutenção no atendimento.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="editClientTicketSite"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Obra
              </label>
              <select
                id="editClientTicketSite"
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
                htmlFor="editClientTicketEquipment"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Equipamento
              </label>
              <select
                id="editClientTicketEquipment"
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
              htmlFor="editClientTicketIncidentAt"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Data e hora da avaria
            </label>
            <input
              id="editClientTicketIncidentAt"
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
                htmlFor="editClientTicketContactName"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Responsável na obra
              </label>
              <input
                id="editClientTicketContactName"
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
                htmlFor="editClientTicketContactPhone"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Telefone do contato
              </label>
              <input
                id="editClientTicketContactPhone"
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
              htmlFor="editClientTicketTitle"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Título
            </label>
            <input
              id="editClientTicketTitle"
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
              htmlFor="editClientTicketDescription"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Descrição detalhada
            </label>
            <textarea
              id="editClientTicketDescription"
              required
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o que aconteceu, sintomas, mensagens de erro e o que já foi verificado..."
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            />
          </div>

          {message && (
            <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
