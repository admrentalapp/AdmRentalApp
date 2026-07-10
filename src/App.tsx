import { Suspense, lazy, useCallback, useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, ClipboardList, LogOut, Menu, Plus, Trash2, X } from 'lucide-react'
import { AppLogo } from '@/components/shared/app-logo'
import { PagePanel } from '@/components/shared/page-panel'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import type { InspectionFormValues } from '@/components/tickets/inspection-section'
import { ServiceCompletionModal } from '@/components/tickets/service-completion-modal'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { managerMenuItems } from '@/config/menu'
import type { LoadOptions } from '@/lib/load-options'
import {
  createEquipmentAllocation,
  createFleetEquipment,
  deactivateFleetEquipment,
  endEquipmentAllocation,
  fetchAllocatedEquipmentForClient,
  fetchClientAllocatedFleet,
  fetchFleetData,
  filterFleet,
  mergeEquipmentWithAllocations,
  updateFleetEquipment,
} from '@/features/equipment/api'
import {
  completeTicketService,
  fetchTicketServiceCompletion,
  parseTicketServiceCompletion,
} from '@/features/tickets/completions-api'
import {
  deleteClientTicket,
  deleteGestorTicket,
  fetchTicketAttachments,
  insertTicketEvent,
  parseAttachments,
  updateGestorTicket,
  uploadTicketAttachment,
} from '@/features/tickets/api'
import {
  fetchTicketApproval,
  fetchTicketApprovals,
  parseTicketApprovals,
  parseTicketApproval,
  respondTicketApproval,
} from '@/features/tickets/approvals-api'
import {
  fetchTicketInspection,
  parseTicketInspection,
  saveTicketInspection,
} from '@/features/tickets/inspections-api'
import { TICKET_SELECT_COLUMNS } from '@/features/tickets/constants'
import {
  fetchChecklistRuns,
  fetchChecklistTemplates,
  parseRuns,
  parseTemplates,
  startChecklistRun,
} from '@/features/checklists/api'
import {
  createPart,
  deactivatePart,
  fetchParts,
  fetchPartMovements,
  parseParts,
  parsePartMovements,
  registerPartMovement,
  updatePart,
} from '@/features/inventory/api'
import {
  CLIENT_SELECT_COLUMNS,
  TEST_CLIENT_FORM,
  clientFormToPayload,
  clientToForm,
  emptyClientForm,
  validateClientForm,
  type ClientFormValues,
} from '@/features/clients/api'
import { createManagedUser } from '@/features/users/api'
import {
  fetchDashboardEvents,
  fetchDashboardLookups,
} from '@/features/dashboard/api'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, roleLabel, statusLabel } from '@/lib/tickets'
import { supabase } from '@/lib/supabase'
import type {
  AppPage,
  Attachment,
  ChecklistRun,
  ChecklistTemplate,
  Client,
  Equipment,
  EquipmentWithAllocation,
  ManagedProfile,
  Part,
  PartMovement,
  Profile,
  Site,
  Ticket,
  TicketApproval,
  TicketEvent,
  TicketInspection,
  TicketServiceCompletion,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@/types'
import { isMaintenanceRole } from '@/types'
import { DashboardPage } from '@/pages/dashboard-page'

const LoginBackground = lazy(() =>
  import('@/components/auth/login-background').then((module) => ({
    default: module.LoginBackground,
  })),
)

const ClientEditTicketModal = lazy(() =>
  import('@/components/tickets/client-edit-ticket-modal').then((module) => ({
    default: module.ClientEditTicketModal,
  })),
)

const ClientNewTicketModal = lazy(() =>
  import('@/components/tickets/client-new-ticket-modal').then((module) => ({
    default: module.ClientNewTicketModal,
  })),
)

const ClientTicketDetailPage = lazy(() =>
  import('@/pages/client-ticket-detail-page').then((module) => ({
    default: module.ClientTicketDetailPage,
  })),
)

const ClientsPage = lazy(() =>
  import('@/pages/clients-page').then((module) => ({
    default: module.ClientsPage,
  })),
)

const ChecklistPage = lazy(() =>
  import('@/pages/checklist-page').then((module) => ({
    default: module.ChecklistPage,
  })),
)

const EquipmentPage = lazy(() =>
  import('@/pages/equipment-page').then((module) => ({
    default: module.EquipmentPage,
  })),
)

const InventoryPage = lazy(() =>
  import('@/pages/inventory-page').then((module) => ({
    default: module.InventoryPage,
  })),
)

const ReportsPage = lazy(() =>
  import('@/pages/reports-page').then((module) => ({
    default: module.ReportsPage,
  })),
)

const SitesPage = lazy(() =>
  import('@/pages/sites-page').then((module) => ({
    default: module.SitesPage,
  })),
)

const TechniciansPage = lazy(() =>
  import('@/pages/technicians-page').then((module) => ({
    default: module.TechniciansPage,
  })),
)

const TechnicianTicketDetailPage = lazy(() =>
  import('@/pages/technician-ticket-detail-page').then((module) => ({
    default: module.TechnicianTicketDetailPage,
  })),
)

const TicketDetailPage = lazy(() =>
  import('@/pages/ticket-detail-page').then((module) => ({
    default: module.TicketDetailPage,
  })),
)

const TicketsPage = lazy(() =>
  import('@/pages/tickets-page').then((module) => ({
    default: module.TicketsPage,
  })),
)

function PageLoader({ message = 'Carregando tela...' }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-8 text-sm text-muted-foreground shadow-sm">
      {message}
    </div>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const [visitedPages, setVisitedPages] = useState<Set<AppPage>>(
    () => new Set<AppPage>(['dashboard']),
  )

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState('')

  const [newClientOpen, setNewClientOpen] = useState(false)
  const [newClientForm, setNewClientForm] = useState<ClientFormValues>(emptyClientForm())
  const [newClientLoading, setNewClientLoading] = useState(false)
  const [newClientMessage, setNewClientMessage] = useState('')
  const [editClientTarget, setEditClientTarget] = useState<Client | null>(null)
  const [editClientForm, setEditClientForm] = useState<ClientFormValues>(emptyClientForm())
  const [editClientLoading, setEditClientLoading] = useState(false)
  const [editClientMessage, setEditClientMessage] = useState('')
  const [deactivateClientTarget, setDeactivateClientTarget] = useState<Client | null>(
    null,
  )
  const [deactivateClientLoading, setDeactivateClientLoading] = useState(false)
  const [deactivateClientMessage, setDeactivateClientMessage] = useState('')

  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState('')

  const [newSiteOpen, setNewSiteOpen] = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteAddress, setNewSiteAddress] = useState('')
  const [newSiteLoading, setNewSiteLoading] = useState(false)
  const [newSiteMessage, setNewSiteMessage] = useState('')

  const [profiles, setProfiles] = useState<ManagedProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [profilesError, setProfilesError] = useState('')

  const [editProfile, setEditProfile] = useState<ManagedProfile | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('cliente')
  const [editClientId, setEditClientId] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  const [equipmentFilterClientId, setEquipmentFilterClientId] = useState('')
  const [equipmentFilterSiteId, setEquipmentFilterSiteId] = useState('')
  const [equipmentFleet, setEquipmentFleet] = useState<EquipmentWithAllocation[]>(
    [],
  )
  const [equipmentFilterSites, setEquipmentFilterSites] = useState<Site[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipmentError, setEquipmentError] = useState('')

  const [newEquipmentOpen, setNewEquipmentOpen] = useState(false)
  const [newEquipmentAssetTag, setNewEquipmentAssetTag] = useState('')
  const [newEquipmentDescription, setNewEquipmentDescription] = useState('')
  const [newEquipmentSerial, setNewEquipmentSerial] = useState('')
  const [newEquipmentLoading, setNewEquipmentLoading] = useState(false)
  const [newEquipmentMessage, setNewEquipmentMessage] = useState('')
  const [editEquipment, setEditEquipment] = useState<EquipmentWithAllocation | null>(null)
  const [editEquipmentAssetTag, setEditEquipmentAssetTag] = useState('')
  const [editEquipmentDescription, setEditEquipmentDescription] = useState('')
  const [editEquipmentSerial, setEditEquipmentSerial] = useState('')
  const [editEquipmentLoading, setEditEquipmentLoading] = useState(false)
  const [editEquipmentMessage, setEditEquipmentMessage] = useState('')
  const [deactivateEquipment, setDeactivateEquipment] =
    useState<EquipmentWithAllocation | null>(null)
  const [deactivateEquipmentLoading, setDeactivateEquipmentLoading] = useState(false)
  const [deactivateEquipmentMessage, setDeactivateEquipmentMessage] = useState('')

  const [allocateModalOpen, setAllocateModalOpen] = useState(false)
  const [allocateEquipment, setAllocateEquipment] =
    useState<EquipmentWithAllocation | null>(null)
  const [allocateClientId, setAllocateClientId] = useState('')
  const [allocateSiteId, setAllocateSiteId] = useState('')
  const [allocateSites, setAllocateSites] = useState<Site[]>([])
  const [allocateLoading, setAllocateLoading] = useState(false)
  const [allocateMessage, setAllocateMessage] = useState('')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState('')
  const [ticketStatusFilter, setTicketStatusFilter] = useState('')

  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null)
  const [editTicketStatus, setEditTicketStatus] = useState<TicketStatus>('aberto')
  const [editTicketPriority, setEditTicketPriority] =
    useState<TicketPriority>('media')
  const [editTicketTechnicianId, setEditTicketTechnicianId] = useState('')
  const [editTicketLoading, setEditTicketLoading] = useState(false)
  const [editTicketMessage, setEditTicketMessage] = useState('')

  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [newTicketClientId, setNewTicketClientId] = useState('')
  const [newTicketSiteId, setNewTicketSiteId] = useState('')
  const [newTicketEquipmentId, setNewTicketEquipmentId] = useState('')
  const [newTicketTitle, setNewTicketTitle] = useState('')
  const [newTicketDescription, setNewTicketDescription] = useState('')
  const [newTicketPriority, setNewTicketPriority] =
    useState<TicketPriority>('media')
  const [newTicketLoading, setNewTicketLoading] = useState(false)
  const [newTicketMessage, setNewTicketMessage] = useState('')

  const [editGestorTicket, setEditGestorTicket] = useState<Ticket | null>(null)
  const [editGestorClientId, setEditGestorClientId] = useState('')
  const [editGestorSiteId, setEditGestorSiteId] = useState('')
  const [editGestorEquipmentId, setEditGestorEquipmentId] = useState('')
  const [editGestorTitle, setEditGestorTitle] = useState('')
  const [editGestorDescription, setEditGestorDescription] = useState('')
  const [editGestorPriority, setEditGestorPriority] =
    useState<TicketPriority>('media')
  const [editGestorLoading, setEditGestorLoading] = useState(false)
  const [editGestorMessage, setEditGestorMessage] = useState('')
  const [editGestorFormSites, setEditGestorFormSites] = useState<Site[]>([])
  const [editGestorFormEquipment, setEditGestorFormEquipment] = useState<
    Equipment[]
  >([])

  const [deleteGestorTicketTarget, setDeleteGestorTicketTarget] =
    useState<Ticket | null>(null)
  const [deleteGestorLoading, setDeleteGestorLoading] = useState(false)
  const [deleteGestorMessage, setDeleteGestorMessage] = useState('')

  const [ticketFormSites, setTicketFormSites] = useState<Site[]>([])
  const [ticketFormEquipment, setTicketFormEquipment] = useState<Equipment[]>([])

  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([])
  const [ticketEventsLoading, setTicketEventsLoading] = useState(false)
  const [ticketAttachments, setTicketAttachments] = useState<Attachment[]>([])
  const [ticketAttachmentsLoading, setTicketAttachmentsLoading] = useState(false)
  const [attachmentUploadLoading, setAttachmentUploadLoading] = useState(false)
  const [attachmentUploadError, setAttachmentUploadError] = useState('')

  const [clientCompanyName, setClientCompanyName] = useState('')
  const [clientNewTicketOpen, setClientNewTicketOpen] = useState(false)
  const [clientNewMessage, setClientNewMessage] = useState('')
  const [clientEditTicketOpen, setClientEditTicketOpen] = useState(false)
  const [clientDeleteTicket, setClientDeleteTicket] = useState<Ticket | null>(null)
  const [clientDeleteLoading, setClientDeleteLoading] = useState(false)
  const [clientDeleteError, setClientDeleteError] = useState('')
  const [clientFormSites, setClientFormSites] = useState<Site[]>([])
  const [clientAllocatedFleet, setClientAllocatedFleet] = useState<
    EquipmentWithAllocation[]
  >([])

  const [viewingTicketSiteName, setViewingTicketSiteName] = useState<string>()
  const [viewingTicketEquipmentLabel, setViewingTicketEquipmentLabel] =
    useState<string>()
  const [techEventMessage, setTechEventMessage] = useState('')
  const [techEventLoading, setTechEventLoading] = useState(false)
  const [techEventError, setTechEventError] = useState('')

  const [ticketInspection, setTicketInspection] = useState<TicketInspection | null>(
    null,
  )
  const [ticketInspectionLoading, setTicketInspectionLoading] = useState(false)
  const [inspectionSaveLoading, setInspectionSaveLoading] = useState(false)
  const [inspectionSaveError, setInspectionSaveError] = useState('')
  const [inspectionSaveSuccess, setInspectionSaveSuccess] = useState('')

  const [ticketApproval, setTicketApproval] = useState<TicketApproval | null>(null)
  const [ticketApprovalLoading, setTicketApprovalLoading] = useState(false)
  const [approvalSubmitLoading, setApprovalSubmitLoading] = useState(false)
  const [approvalSubmitError, setApprovalSubmitError] = useState('')

  const [ticketServiceCompletion, setTicketServiceCompletion] =
    useState<TicketServiceCompletion | null>(null)
  const [ticketServiceCompletionLoading, setTicketServiceCompletionLoading] =
    useState(false)
  const [serviceCompletionOpen, setServiceCompletionOpen] = useState(false)
  const [serviceCompletionLoading, setServiceCompletionLoading] = useState(false)
  const [serviceCompletionError, setServiceCompletionError] = useState('')

  const [dashboardEvents, setDashboardEvents] = useState<TicketEvent[]>([])
  const [dashboardSiteLabels, setDashboardSiteLabels] = useState(
    () => new Map<string, string>(),
  )
  const [dashboardEquipmentLabels, setDashboardEquipmentLabels] = useState(
    () => new Map<string, string>(),
  )
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [parts, setParts] = useState<Part[]>([])
  const [reportPartMovements, setReportPartMovements] = useState<PartMovement[]>([])
  const [reportApprovals, setReportApprovals] = useState<TicketApproval[]>([])
  const [reportChecklistRuns, setReportChecklistRuns] = useState<ChecklistRun[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [partsLoading, setPartsLoading] = useState(false)
  const [partsError, setPartsError] = useState('')
  const [newPartOpen, setNewPartOpen] = useState(false)
  const [newPartSku, setNewPartSku] = useState('')
  const [newPartName, setNewPartName] = useState('')
  const [newPartDescription, setNewPartDescription] = useState('')
  const [newPartMinStock, setNewPartMinStock] = useState('0')
  const [newPartCurrentStock, setNewPartCurrentStock] = useState('0')
  const [newPartLoading, setNewPartLoading] = useState(false)
  const [newPartMessage, setNewPartMessage] = useState('')
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [editPartSku, setEditPartSku] = useState('')
  const [editPartName, setEditPartName] = useState('')
  const [editPartDescription, setEditPartDescription] = useState('')
  const [editPartMinStock, setEditPartMinStock] = useState('0')
  const [editPartCurrentStock, setEditPartCurrentStock] = useState('0')
  const [editPartLoading, setEditPartLoading] = useState(false)
  const [editPartMessage, setEditPartMessage] = useState('')
  const [deactivatePartTarget, setDeactivatePartTarget] = useState<Part | null>(null)
  const [deactivatePartLoading, setDeactivatePartLoading] = useState(false)
  const [deactivatePartMessage, setDeactivatePartMessage] = useState('')
  const [movementPartId, setMovementPartId] = useState('')
  const [movementType, setMovementType] = useState<'entrada' | 'saida' | 'ajuste'>(
    'entrada',
  )
  const [movementQty, setMovementQty] = useState('1')
  const [movementNotes, setMovementNotes] = useState('')
  const [movementLoading, setMovementLoading] = useState(false)
  const [movementMessage, setMovementMessage] = useState('')

  const [checklistTemplates, setChecklistTemplates] = useState<
    ChecklistTemplate[]
  >([])
  const [checklistRuns, setChecklistRuns] = useState<ChecklistRun[]>([])
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [checklistError, setChecklistError] = useState('')
  const [checklistTemplateId, setChecklistTemplateId] = useState('')
  const [checklistEquipmentId, setChecklistEquipmentId] = useState('')
  const [checklistNotes, setChecklistNotes] = useState('')
  const [checklistStartLoading, setChecklistStartLoading] = useState(false)
  const [checklistStartMessage, setChecklistStartMessage] = useState('')

  const [newUserOpen, setNewUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('cliente')
  const [newUserClientId, setNewUserClientId] = useState('')
  const [newUserLoading, setNewUserLoading] = useState(false)
  const [newUserMessage, setNewUserMessage] = useState('')

  const loadClients = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setClientsLoading(true)
    }
    setClientsError('')

    const { data, error } = await supabase
      .from('clients')
      .select(CLIENT_SELECT_COLUMNS)
      .order('name', { ascending: true })

    if (!options?.silent) {
      setClientsLoading(false)
    }

    if (error) {
      setClients([])
      setClientsError(error.message || 'Não foi possível carregar os clientes.')
      return
    }

    setClients((data ?? []) as Client[])
  }, [])

  const loadSites = useCallback(async (clientId: string) => {
    setSitesLoading(true)
    setSitesError('')

    const { data, error } = await supabase
      .from('sites')
      .select('id, client_id, name, address, active, created_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true })

    setSitesLoading(false)

    if (error) {
      setSites([])
      setSitesError(error.message || 'Não foi possível carregar as obras.')
      return
    }

    setSites((data ?? []) as Site[])
  }, [])

  const loadProfiles = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setProfilesLoading(true)
    }
    setProfilesError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, client_id, created_at')
      .order('full_name', { ascending: true })

    if (!options?.silent) {
      setProfilesLoading(false)
    }

    if (error) {
      setProfiles([])
      setProfilesError(error.message || 'Não foi possível carregar os usuários.')
      return
    }

    setProfiles((data ?? []) as ManagedProfile[])
  }, [])

  const loadEquipmentSitesForClient = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('id, client_id, name, address, active, created_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true })

    if (error) {
      return [] as Site[]
    }

    return (data ?? []) as Site[]
  }, [])

  const loadFleet = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setEquipmentLoading(true)
    }
    setEquipmentError('')

    const { equipment, allocations, error } = await fetchFleetData()

    if (!options?.silent) {
      setEquipmentLoading(false)
    }

    if (error) {
      setEquipmentFleet([])
      setEquipmentError(
        error.message || 'Não foi possível carregar a frota de equipamentos.',
      )
      return
    }

    setEquipmentFleet(mergeEquipmentWithAllocations(equipment, allocations))
  }, [])

  const loadDashboardData = useCallback(async (ticketList: Ticket[], options?: LoadOptions) => {
    if (!options?.silent) {
      setDashboardLoading(true)
    }

    const ticketIds = ticketList.map((ticket) => ticket.id)
    const [eventsResult, lookupsResult] = await Promise.all([
      fetchDashboardEvents(ticketIds),
      fetchDashboardLookups(ticketList),
    ])

    setDashboardEvents(eventsResult.data ?? [])
    setDashboardSiteLabels(lookupsResult.siteLabels)
    setDashboardEquipmentLabels(lookupsResult.equipmentLabels)

    if (!options?.silent) {
      setDashboardLoading(false)
    }
  }, [])

  const loadTickets = useCallback(async (
    statusFilter = '',
    options?: LoadOptions & { forPage?: AppPage },
  ) => {
    if (!options?.silent) {
      setTicketsLoading(true)
    }
    setTicketsError('')

    let query = supabase
      .from('tickets')
      .select(TICKET_SELECT_COLUMNS)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (!options?.silent) {
      setTicketsLoading(false)
    }

    if (error) {
      setTickets([])
      setTicketsError(error.message || 'Não foi possível carregar os chamados.')
      return
    }

    const parsedTickets = (data ?? []) as Ticket[]
    setTickets(parsedTickets)

    const page = options?.forPage ?? activePage
    if (
      profile?.role === 'gestor_adm' &&
      (page === 'dashboard' || page === 'relatorios')
    ) {
      void loadDashboardData(parsedTickets, { silent: options?.silent })
    }
  }, [activePage, loadDashboardData, profile?.role])

  const loadTechnicianTickets = useCallback(async (technicianId: string) => {
    setTicketsLoading(true)
    setTicketsError('')

    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_COLUMNS)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false })

    setTicketsLoading(false)

    if (error) {
      setTickets([])
      setTicketsError(error.message || 'Não foi possível carregar os chamados.')
      return
    }

    setTickets((data ?? []) as Ticket[])
  }, [])

  const loadClientTickets = useCallback(async () => {
    setTicketsLoading(true)
    setTicketsError('')

    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_COLUMNS)
      .order('created_at', { ascending: false })

    setTicketsLoading(false)

    if (error) {
      setTickets([])
      setTicketsError(error.message || 'Não foi possível carregar os chamados.')
      return
    }

    setTickets((data ?? []) as Ticket[])
  }, [])

  const loadTicketEvents = useCallback(async (ticketId: string) => {
    setTicketEventsLoading(true)

    const { data, error } = await supabase
      .from('ticket_events')
      .select('id, ticket_id, event_type, message, created_by, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    setTicketEventsLoading(false)

    if (error) {
      setTicketEvents([])
      return
    }

    setTicketEvents((data ?? []) as TicketEvent[])
  }, [])

  const loadTicketInspection = useCallback(async (ticketId: string) => {
    setTicketInspectionLoading(true)

    const { data, error } = await fetchTicketInspection(ticketId)

    setTicketInspectionLoading(false)

    if (error) {
      setTicketInspection(null)
      return
    }

    setTicketInspection(parseTicketInspection(data))
  }, [])

  const loadTicketApproval = useCallback(async (ticketId: string) => {
    setTicketApprovalLoading(true)

    const { data, error } = await fetchTicketApproval(ticketId)

    setTicketApprovalLoading(false)

    if (error) {
      setTicketApproval(null)
      return
    }

    setTicketApproval(parseTicketApproval(data))
  }, [])

  const loadTicketServiceCompletion = useCallback(async (ticketId: string) => {
    setTicketServiceCompletionLoading(true)

    const { data, error } = await fetchTicketServiceCompletion(ticketId)

    setTicketServiceCompletionLoading(false)

    if (error) {
      setTicketServiceCompletion(null)
      return
    }

    setTicketServiceCompletion(parseTicketServiceCompletion(data))
  }, [])

  const loadParts = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setPartsLoading(true)
    }
    setPartsError('')
    const { data, error } = await fetchParts()
    if (!options?.silent) {
      setPartsLoading(false)
    }
    if (error) {
      setParts([])
      setPartsError(error.message || 'Não foi possível carregar o estoque.')
      return
    }
    setParts(parseParts(data))
  }, [])

  const loadChecklistData = useCallback(async () => {
    setChecklistLoading(true)
    setChecklistError('')
    const [templatesResult, runsResult] = await Promise.all([
      fetchChecklistTemplates(),
      fetchChecklistRuns(),
    ])
    setChecklistLoading(false)
    if (templatesResult.error || runsResult.error) {
      setChecklistTemplates([])
      setChecklistRuns([])
      setChecklistError(
        templatesResult.error?.message ||
          runsResult.error?.message ||
          'Não foi possível carregar checklists.',
      )
      return
    }
    setChecklistTemplates(parseTemplates(templatesResult.data))
    setChecklistRuns(parseRuns(runsResult.data))
  }, [])

  const loadReportsData = useCallback(async (options?: LoadOptions) => {
    if (!options?.silent) {
      setReportsLoading(true)
    }
    setReportsError('')

    const [approvalsResult, runsResult, movementsResult, templatesResult] =
      await Promise.all([
        fetchTicketApprovals(),
        fetchChecklistRuns(0),
        fetchPartMovements(),
        fetchChecklistTemplates(),
      ])

    if (!options?.silent) {
      setReportsLoading(false)
    }

    setReportApprovals(
      approvalsResult.error ? [] : parseTicketApprovals(approvalsResult.data),
    )
    setReportChecklistRuns(runsResult.error ? [] : parseRuns(runsResult.data))
    setReportPartMovements(
      movementsResult.error ? [] : parsePartMovements(movementsResult.data),
    )

    if (!templatesResult.error) {
      setChecklistTemplates(parseTemplates(templatesResult.data))
    }

    const loadError =
      approvalsResult.error?.message ||
      runsResult.error?.message ||
      movementsResult.error?.message ||
      templatesResult.error?.message ||
      ''

    setReportsError(loadError)
  }, [])

  const loadTicketAttachments = useCallback(async (ticketId: string) => {
    setTicketAttachmentsLoading(true)

    const { data, error } = await fetchTicketAttachments(ticketId)

    setTicketAttachmentsLoading(false)

    if (error) {
      setTicketAttachments([])
      return
    }

    setTicketAttachments(parseAttachments(data))
  }, [])

  const loadTicketFormData = useCallback(async (clientId: string) => {
    const [sites, equipmentResult] = await Promise.all([
      loadEquipmentSitesForClient(clientId),
      fetchAllocatedEquipmentForClient(clientId),
    ])

    setTicketFormSites(sites)
    setTicketFormEquipment(equipmentResult.data)
  }, [loadEquipmentSitesForClient])

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, client_id')
        .eq('id', userId)
        .single()

      if (error || !data) {
        setProfile(null)
        setMessage('Não foi possível carregar seu perfil de acesso.')
        return
      }

      const loadedProfile = data as Profile
      setProfile(loadedProfile)
      setMessage('')

      if (loadedProfile.role === 'gestor_adm') {
        await Promise.all([loadClients(), loadTickets(), loadProfiles()])
      }

      if (isMaintenanceRole(loadedProfile.role)) {
        await loadTechnicianTickets(loadedProfile.id)
      }

      if (loadedProfile.role === 'cliente') {
        if (loadedProfile.client_id) {
          const [sites, fleetResult, clientResult] = await Promise.all([
            loadEquipmentSitesForClient(loadedProfile.client_id),
            fetchClientAllocatedFleet(loadedProfile.client_id),
            supabase
              .from('clients')
              .select('name')
              .eq('id', loadedProfile.client_id)
              .single(),
          ])

          setClientFormSites(sites)
          setClientAllocatedFleet(fleetResult.data)
          setClientCompanyName(clientResult.data?.name ?? '')
          await loadClientTickets()
        } else {
          setClientCompanyName('')
        }
      }
    },
    [
      loadClients,
      loadTickets,
      loadProfiles,
      loadTechnicianTickets,
      loadClientTickets,
      loadEquipmentSitesForClient,
    ],
  )

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await loadProfile(session.user.id)
      }

      setLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      void loadProfile(session.user.id)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadProfile])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setLoginLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoginLoading(false)

    if (error) {
      setMessage('E-mail ou senha inválidos.')
      return
    }

    if (!data.user) {
      setMessage('Não foi possível identificar o usuário.')
      return
    }

    await loadProfile(data.user.id)
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    setEmail('')
    setPassword('')
    setMessage('')
    setProfile(null)
    setMenuOpen(false)
    setActivePage('dashboard')
    setClients([])
    setNewClientOpen(false)
    setNewClientForm(emptyClientForm())
    setNewClientMessage('')
    setViewingClient(null)
    setSites([])
    setSitesError('')
    setNewSiteOpen(false)
    setNewSiteName('')
    setNewSiteAddress('')
    setNewSiteMessage('')
    setProfiles([])
    setProfilesError('')
    setEditProfile(null)
    setEditMessage('')
    resetEquipmentView()
    resetTicketsView()
    setClientCompanyName('')
    setClientNewTicketOpen(false)
    setClientNewMessage('')
    setClientFormSites([])
    setClientAllocatedFleet([])
    setTechEventMessage('')
    setTechEventError('')
    setTicketEvents([])
  }

  async function createClient(form: ClientFormValues) {
    const validationError = validateClientForm(form)

    if (validationError) {
      setNewClientMessage(validationError)
      return false
    }

    setNewClientLoading(true)
    setNewClientMessage('')

    const { error } = await supabase.from('clients').insert({
      ...clientFormToPayload(form),
      active: true,
    })

    setNewClientLoading(false)

    if (error) {
      setNewClientMessage(
        error.message ||
          'Não foi possível cadastrar o cliente. Verifique as policies do Supabase.',
      )
      return false
    }

    setNewClientForm(emptyClientForm())
    setNewClientOpen(false)
    await loadClients()
    return true
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createClient(newClientForm)
  }

  async function handleCreateTestClient() {
    setNewClientForm(TEST_CLIENT_FORM)
    setNewClientMessage('')
    setNewClientOpen(true)
  }

  function openNewClientModal() {
    setNewClientForm(emptyClientForm())
    setNewClientMessage('')
    setNewClientOpen(true)
  }

  function closeNewClientModal() {
    setNewClientForm(emptyClientForm())
    setNewClientMessage('')
    setNewClientOpen(false)
  }

  function openEditClientModal(client: Client) {
    setEditClientTarget(client)
    setEditClientForm(clientToForm(client))
    setEditClientMessage('')
  }

  function closeEditClientModal() {
    setEditClientTarget(null)
    setEditClientForm(emptyClientForm())
    setEditClientMessage('')
  }

  async function handleUpdateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editClientTarget) return

    const validationError = validateClientForm(editClientForm)

    if (validationError) {
      setEditClientMessage(validationError)
      return
    }

    setEditClientLoading(true)
    setEditClientMessage('')

    const payload = clientFormToPayload(editClientForm)

    const { error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', editClientTarget.id)

    setEditClientLoading(false)

    if (error) {
      setEditClientMessage(
        error.message ||
          'Não foi possível atualizar o cliente. Verifique as policies do Supabase.',
      )
      return
    }

    if (viewingClient?.id === editClientTarget.id) {
      setViewingClient({
        ...viewingClient,
        ...payload,
      })
    }

    closeEditClientModal()
    await loadClients()
  }

  function openDeactivateClientModal(client: Client) {
    setDeactivateClientTarget(client)
    setDeactivateClientMessage('')
  }

  function closeDeactivateClientModal() {
    setDeactivateClientTarget(null)
    setDeactivateClientMessage('')
  }

  async function handleDeactivateClient() {
    if (!deactivateClientTarget) return

    setDeactivateClientLoading(true)
    setDeactivateClientMessage('')

    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', deactivateClientTarget.id)

    setDeactivateClientLoading(false)

    if (error) {
      setDeactivateClientMessage(
        error.message ||
          'Não foi possível inativar o cliente. Verifique as policies do Supabase.',
      )
      return
    }

    if (viewingClient?.id === deactivateClientTarget.id) {
      backToClients()
    }

    closeDeactivateClientModal()
    await loadClients()
  }

  function openClientSites(client: Client) {
    setViewingClient(client)
    setNewSiteOpen(false)
    setNewSiteName('')
    setNewSiteAddress('')
    setNewSiteMessage('')
    void loadSites(client.id)
  }

  function backToClients() {
    setViewingClient(null)
    setSites([])
    setSitesError('')
    setNewSiteOpen(false)
    setNewSiteMessage('')
  }

  function openNewSiteModal() {
    setNewSiteName('')
    setNewSiteAddress('')
    setNewSiteMessage('')
    setNewSiteOpen(true)
  }

  function closeNewSiteModal() {
    setNewSiteName('')
    setNewSiteAddress('')
    setNewSiteMessage('')
    setNewSiteOpen(false)
  }

  async function handleCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!viewingClient) return

    const name = newSiteName.trim()

    if (name.length < 2) {
      setNewSiteMessage('Digite um nome com pelo menos 2 caracteres.')
      return
    }

    setNewSiteLoading(true)
    setNewSiteMessage('')

    const address = newSiteAddress.trim()

    const { error } = await supabase.from('sites').insert({
      client_id: viewingClient.id,
      name,
      address: address.length > 0 ? address : null,
      active: true,
    })

    setNewSiteLoading(false)

    if (error) {
      setNewSiteMessage(
        error.message ||
          'Não foi possível cadastrar a obra. Verifique as policies do Supabase.',
      )
      return
    }

    setNewSiteName('')
    setNewSiteAddress('')
    setNewSiteOpen(false)
    await loadSites(viewingClient.id)
  }

  function openEditProfile(managed: ManagedProfile) {
    setEditProfile(managed)
    setEditRole(managed.role)
    setEditClientId(managed.client_id ?? '')
    setEditMessage('')
  }

  function closeEditProfile() {
    setEditProfile(null)
    setEditMessage('')
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editProfile) return

    if (editProfile.id === profile?.id) {
      setEditMessage('Você não pode alterar o seu próprio perfil.')
      return
    }

    if (editRole === 'cliente' && !editClientId) {
      setEditMessage('Selecione a empresa vinculada ao cliente.')
      return
    }

    setEditLoading(true)
    setEditMessage('')

    const clientId = editRole === 'cliente' ? editClientId : null

    const { error } = await supabase
      .from('profiles')
      .update({ role: editRole, client_id: clientId })
      .eq('id', editProfile.id)

    setEditLoading(false)

    if (error) {
      setEditMessage(
        error.message ||
          'Não foi possível atualizar o usuário. Verifique as policies do Supabase.',
      )
      return
    }

    setEditProfile(null)
    await loadProfiles()
  }

  function resetEquipmentView() {
    setEquipmentFilterClientId('')
    setEquipmentFilterSiteId('')
    setEquipmentFleet([])
    setEquipmentFilterSites([])
    setEquipmentError('')
    setNewEquipmentOpen(false)
    setNewEquipmentAssetTag('')
    setNewEquipmentDescription('')
    setNewEquipmentSerial('')
    setNewEquipmentMessage('')
    setEditEquipment(null)
    setEditEquipmentAssetTag('')
    setEditEquipmentDescription('')
    setEditEquipmentSerial('')
    setEditEquipmentMessage('')
    setDeactivateEquipment(null)
    setDeactivateEquipmentMessage('')
    setAllocateModalOpen(false)
    setAllocateEquipment(null)
    setAllocateClientId('')
    setAllocateSiteId('')
    setAllocateSites([])
    setAllocateMessage('')
  }

  async function selectEquipmentFilterClient(clientId: string) {
    setEquipmentFilterClientId(clientId)
    setEquipmentFilterSiteId('')
    setEquipmentError('')

    if (!clientId) {
      setEquipmentFilterSites([])
      return
    }

    const sites = await loadEquipmentSitesForClient(clientId)
    setEquipmentFilterSites(sites)
  }

  function selectEquipmentFilterSite(siteId: string) {
    setEquipmentFilterSiteId(siteId)
  }

  function openNewEquipmentModal() {
    setNewEquipmentAssetTag('')
    setNewEquipmentDescription('')
    setNewEquipmentSerial('')
    setNewEquipmentMessage('')
    setNewEquipmentOpen(true)
  }

  function closeNewEquipmentModal() {
    setNewEquipmentAssetTag('')
    setNewEquipmentDescription('')
    setNewEquipmentSerial('')
    setNewEquipmentMessage('')
    setNewEquipmentOpen(false)
  }

  function openEditEquipmentModal(item: EquipmentWithAllocation) {
    setEditEquipment(item)
    setEditEquipmentAssetTag(item.asset_tag)
    setEditEquipmentDescription(item.description)
    setEditEquipmentSerial(item.serial_number ?? '')
    setEditEquipmentMessage('')
  }

  function closeEditEquipmentModal() {
    setEditEquipment(null)
    setEditEquipmentAssetTag('')
    setEditEquipmentDescription('')
    setEditEquipmentSerial('')
    setEditEquipmentMessage('')
  }

  async function handleCreateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const assetTag = newEquipmentAssetTag.trim()
    const description = newEquipmentDescription.trim()
    const serialNumber = newEquipmentSerial.trim()

    if (assetTag.length < 2) {
      setNewEquipmentMessage('Digite uma tag/patrimônio com pelo menos 2 caracteres.')
      return
    }

    if (description.length < 3) {
      setNewEquipmentMessage('Digite uma descrição com pelo menos 3 caracteres.')
      return
    }

    setNewEquipmentLoading(true)
    setNewEquipmentMessage('')

    const { error } = await createFleetEquipment({
      assetTag,
      description,
      serialNumber: serialNumber.length > 0 ? serialNumber : null,
    })

    setNewEquipmentLoading(false)

    if (error) {
      setNewEquipmentMessage(
        error.message ||
          'Não foi possível cadastrar o equipamento. Verifique as policies do Supabase.',
      )
      return
    }

    closeNewEquipmentModal()
    await loadFleet()
  }

  async function handleUpdateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editEquipment) return

    const assetTag = editEquipmentAssetTag.trim()
    const description = editEquipmentDescription.trim()
    const serialNumber = editEquipmentSerial.trim()

    if (assetTag.length < 2) {
      setEditEquipmentMessage('Digite uma tag/patrimônio com pelo menos 2 caracteres.')
      return
    }

    if (description.length < 3) {
      setEditEquipmentMessage('Digite uma descrição com pelo menos 3 caracteres.')
      return
    }

    setEditEquipmentLoading(true)
    setEditEquipmentMessage('')

    const { error } = await updateFleetEquipment({
      equipmentId: editEquipment.id,
      assetTag,
      description,
      serialNumber: serialNumber.length > 0 ? serialNumber : null,
    })

    setEditEquipmentLoading(false)

    if (error) {
      setEditEquipmentMessage(
        error.message ||
          'Não foi possível atualizar o equipamento. Verifique as policies do Supabase.',
      )
      return
    }

    closeEditEquipmentModal()
    await loadFleet()
  }

  function openDeactivateEquipmentModal(item: EquipmentWithAllocation) {
    setDeactivateEquipment(item)
    setDeactivateEquipmentMessage('')
  }

  function closeDeactivateEquipmentModal() {
    setDeactivateEquipment(null)
    setDeactivateEquipmentMessage('')
  }

  async function handleDeactivateEquipment() {
    if (!deactivateEquipment) return

    if (deactivateEquipment.allocation) {
      setDeactivateEquipmentMessage(
        'Encerre a locação ativa antes de apagar este equipamento da lista.',
      )
      return
    }

    setDeactivateEquipmentLoading(true)
    setDeactivateEquipmentMessage('')

    const { error } = await deactivateFleetEquipment(deactivateEquipment.id)

    setDeactivateEquipmentLoading(false)

    if (error) {
      setDeactivateEquipmentMessage(
        error.message ||
          'Não foi possível inativar o equipamento. Verifique as policies do Supabase.',
      )
      return
    }

    closeDeactivateEquipmentModal()
    await loadFleet()
  }

  function openAllocateModal(item: EquipmentWithAllocation) {
    if (item.allocation) {
      setEquipmentError('Este equipamento já está alocado a um cliente.')
      return
    }

    setAllocateEquipment(item)
    setAllocateClientId('')
    setAllocateSiteId('')
    setAllocateSites([])
    setAllocateMessage('')
    setAllocateModalOpen(true)
  }

  function closeAllocateModal() {
    setAllocateModalOpen(false)
    setAllocateEquipment(null)
    setAllocateClientId('')
    setAllocateSiteId('')
    setAllocateSites([])
    setAllocateMessage('')
  }

  async function selectAllocateClient(clientId: string) {
    setAllocateClientId(clientId)
    setAllocateSiteId('')

    if (!clientId) {
      setAllocateSites([])
      return
    }

    const sites = await loadEquipmentSitesForClient(clientId)
    setAllocateSites(sites)
  }

  async function handleCreateAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!allocateEquipment) return

    if (!allocateClientId) {
      setAllocateMessage('Selecione o cliente para alocar o equipamento.')
      return
    }

    setAllocateLoading(true)
    setAllocateMessage('')

    const { error } = await createEquipmentAllocation({
      equipmentId: allocateEquipment.id,
      clientId: allocateClientId,
      siteId: allocateSiteId || null,
    })

    setAllocateLoading(false)

    if (error) {
      setAllocateMessage(
        error.message ||
          'Não foi possível alocar o equipamento. Verifique se o SQL de alocações foi executado.',
      )
      return
    }

    closeAllocateModal()
    await loadFleet()
  }

  async function handleEndAllocation(allocationId: string) {
    setEquipmentError('')

    const { error } = await endEquipmentAllocation(allocationId)

    if (error) {
      setEquipmentError(
        error.message || 'Não foi possível encerrar a locação do equipamento.',
      )
      return
    }

    await loadFleet()
  }

  function resetTicketsView() {
    setTicketStatusFilter('')
    setTicketsError('')
    setViewingTicket(null)
    setEditTicketMessage('')
    setTicketEvents([])
    setNewTicketOpen(false)
    setNewTicketClientId('')
    setNewTicketSiteId('')
    setNewTicketEquipmentId('')
    setNewTicketTitle('')
    setNewTicketDescription('')
    setNewTicketPriority('media')
    setNewTicketMessage('')
    setTicketFormSites([])
    setTicketFormEquipment([])
  }

  async function selectTicketStatusFilter(status: string) {
    setTicketStatusFilter(status)
    await loadTickets(status)
  }

  function openNewTicketModal() {
    setNewTicketClientId('')
    setNewTicketSiteId('')
    setNewTicketEquipmentId('')
    setNewTicketTitle('')
    setNewTicketDescription('')
    setNewTicketPriority('media')
    setNewTicketMessage('')
    setTicketFormSites([])
    setTicketFormEquipment([])
    setNewTicketOpen(true)
  }

  function closeNewTicketModal() {
    setNewTicketOpen(false)
    setNewTicketMessage('')
  }

  async function selectNewTicketClient(clientId: string) {
    setNewTicketClientId(clientId)
    setNewTicketSiteId('')
    setNewTicketEquipmentId('')

    if (!clientId) {
      setTicketFormSites([])
      setTicketFormEquipment([])
      return
    }

    await loadTicketFormData(clientId)
  }

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile) return

    const title = newTicketTitle.trim()
    const description = newTicketDescription.trim()

    if (!newTicketClientId) {
      setNewTicketMessage('Selecione o cliente.')
      return
    }

    if (title.length < 3) {
      setNewTicketMessage('O título deve ter pelo menos 3 caracteres.')
      return
    }

    if (description.length < 3) {
      setNewTicketMessage('A descrição deve ter pelo menos 3 caracteres.')
      return
    }

    setNewTicketLoading(true)
    setNewTicketMessage('')

    const { data: created, error } = await supabase
      .from('tickets')
      .insert({
        client_id: newTicketClientId,
        site_id: newTicketSiteId || null,
        equipment_id: newTicketEquipmentId || null,
        title,
        description,
        status: 'aberto',
        priority: newTicketPriority,
        created_by: profile.id,
        manager_id: profile.id,
      })
      .select('id')
      .single()

    setNewTicketLoading(false)

    if (error || !created) {
      setNewTicketMessage(
        error?.message ||
          'Não foi possível criar o chamado. Verifique as policies do Supabase.',
      )
      return
    }

    await insertTicketEvent(
      created.id,
      'criado',
      `Chamado aberto pelo gestor: ${title}`,
      profile.id,
    )

    closeNewTicketModal()
    await loadTickets(ticketStatusFilter)
  }

  async function openEditGestorTicketModal(ticket: Ticket) {
    setEditGestorTicket(ticket)
    setEditGestorClientId(ticket.client_id)
    setEditGestorSiteId(ticket.site_id ?? '')
    setEditGestorEquipmentId(ticket.equipment_id ?? '')
    setEditGestorTitle(ticket.title)
    setEditGestorDescription(ticket.description)
    setEditGestorPriority(ticket.priority)
    setEditGestorMessage('')
    await loadEditGestorFormData(ticket.client_id)
  }

  function closeEditGestorTicketModal() {
    setEditGestorTicket(null)
    setEditGestorMessage('')
  }

  async function loadEditGestorFormData(clientId: string) {
    if (!clientId) {
      setEditGestorFormSites([])
      setEditGestorFormEquipment([])
      return
    }

    const [sites, equipmentResult] = await Promise.all([
      loadEquipmentSitesForClient(clientId),
      fetchAllocatedEquipmentForClient(clientId),
    ])

    setEditGestorFormSites(sites)
    setEditGestorFormEquipment(equipmentResult.data)
  }

  async function selectEditGestorClient(clientId: string) {
    setEditGestorClientId(clientId)
    setEditGestorSiteId('')
    setEditGestorEquipmentId('')
    await loadEditGestorFormData(clientId)
  }

  async function handleUpdateGestorTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editGestorTicket || !profile) return

    const title = editGestorTitle.trim()
    const description = editGestorDescription.trim()

    if (!editGestorClientId) {
      setEditGestorMessage('Selecione o cliente.')
      return
    }

    if (title.length < 3) {
      setEditGestorMessage('O título deve ter pelo menos 3 caracteres.')
      return
    }

    if (description.length < 3) {
      setEditGestorMessage('A descrição deve ter pelo menos 3 caracteres.')
      return
    }

    setEditGestorLoading(true)
    setEditGestorMessage('')

    const { data: updatedTicket, error } = await updateGestorTicket({
      ticketId: editGestorTicket.id,
      clientId: editGestorClientId,
      siteId: editGestorSiteId || null,
      equipmentId: editGestorEquipmentId || null,
      title,
      description,
      priority: editGestorPriority,
    })

    setEditGestorLoading(false)

    if (error || !updatedTicket) {
      setEditGestorMessage(
        error?.message ||
          'Não foi possível atualizar o chamado. Verifique as policies do Supabase.',
      )
      return
    }

    const changes: string[] = []

    if (editGestorTicket.client_id !== editGestorClientId) {
      changes.push('cliente atualizado')
    }
    if ((editGestorTicket.site_id ?? '') !== (editGestorSiteId || '')) {
      changes.push('obra atualizada')
    }
    if ((editGestorTicket.equipment_id ?? '') !== (editGestorEquipmentId || '')) {
      changes.push('equipamento atualizado')
    }
    if (editGestorTicket.title !== title) changes.push('título atualizado')
    if (editGestorTicket.description !== description) {
      changes.push('descrição atualizada')
    }
    if (editGestorTicket.priority !== editGestorPriority) {
      changes.push('prioridade atualizada')
    }

    if (changes.length > 0) {
      await insertTicketEvent(
        editGestorTicket.id,
        'atualizacao',
        `Chamado atualizado pelo gestor: ${changes.join(' · ')}`,
        profile.id,
      )
    }

    closeEditGestorTicketModal()
    await loadTickets(ticketStatusFilter)

    if (viewingTicket?.id === updatedTicket.id) {
      setViewingTicket(updatedTicket)
    }
  }

  function openDeleteGestorTicketModal(ticket: Ticket) {
    setDeleteGestorTicketTarget(ticket)
    setDeleteGestorMessage('')
  }

  function closeDeleteGestorTicketModal() {
    setDeleteGestorTicketTarget(null)
    setDeleteGestorMessage('')
  }

  async function handleDeleteGestorTicket() {
    if (!deleteGestorTicketTarget) return

    setDeleteGestorLoading(true)
    setDeleteGestorMessage('')

    const { data, error } = await deleteGestorTicket(deleteGestorTicketTarget.id)

    setDeleteGestorLoading(false)

    if (error) {
      const message = error.message || 'Não foi possível excluir o chamado.'
      setDeleteGestorMessage(
        message.includes('policy') || message.includes('permission')
          ? 'Permissão de exclusão ainda não aplicada no Supabase. Execute o arquivo supabase/gestor-ticket-actions.sql no SQL Editor.'
          : message,
      )
      return
    }

    if (!data?.length) {
      setDeleteGestorMessage(
        'O chamado não foi excluído. Execute o arquivo supabase/gestor-ticket-actions.sql no SQL Editor do Supabase.',
      )
      return
    }

    if (viewingTicket?.id === deleteGestorTicketTarget.id) {
      backToTicketsList()
    }

    closeDeleteGestorTicketModal()
    await loadTickets(ticketStatusFilter)
  }

  async function openTicketDetail(ticket: Ticket) {
    setViewingTicket(ticket)
    setEditTicketStatus(ticket.status)
    setEditTicketPriority(ticket.priority)
    setEditTicketTechnicianId(ticket.technician_id ?? '')
    setEditTicketMessage('')
    setTechEventMessage('')
    setTechEventError('')
    setAttachmentUploadError('')
    setViewingTicketSiteName(undefined)
    setViewingTicketEquipmentLabel(undefined)
    setTicketInspection(null)
    setInspectionSaveError('')
    setInspectionSaveSuccess('')
    setTicketApproval(null)
    setApprovalSubmitError('')
    setTicketServiceCompletion(null)
    setServiceCompletionOpen(false)
    setServiceCompletionError('')

    const detailLookups: Promise<unknown>[] = [
      loadTicketEvents(ticket.id),
      loadTicketAttachments(ticket.id),
      loadTicketInspection(ticket.id),
      loadTicketApproval(ticket.id),
      loadTicketServiceCompletion(ticket.id),
    ]

    if (profile?.role !== 'cliente') {
      detailLookups.push(
        (async () => {
          if (ticket.site_id) {
            const { data } = await supabase
              .from('sites')
              .select('name')
              .eq('id', ticket.site_id)
              .maybeSingle()
            setViewingTicketSiteName(data?.name ?? undefined)
          }

          if (ticket.equipment_id) {
            const { data } = await supabase
              .from('equipment')
              .select('asset_tag, description')
              .eq('id', ticket.equipment_id)
              .maybeSingle()
            setViewingTicketEquipmentLabel(
              data ? `${data.asset_tag} — ${data.description}` : undefined,
            )
          }
        })(),
      )
    }

    await Promise.all(detailLookups)
  }

  function resolveTicketSiteName(ticket: Ticket) {
    return clientFormSites.find((site) => site.id === ticket.site_id)?.name
  }

  function resolveTicketEquipmentLabel(ticket: Ticket) {
    const equipment = clientAllocatedFleet.find((item) => item.id === ticket.equipment_id)
    return equipment ? `${equipment.asset_tag} — ${equipment.description}` : undefined
  }

  function backToTicketsList() {
    setViewingTicket(null)
    setClientEditTicketOpen(false)
    setClientDeleteTicket(null)
    setClientDeleteError('')
    setViewingTicketSiteName(undefined)
    setViewingTicketEquipmentLabel(undefined)
    setEditTicketMessage('')
    setTicketEvents([])
    setTicketAttachments([])
    setAttachmentUploadError('')
    setTechEventMessage('')
    setTechEventError('')
    setTicketInspection(null)
    setInspectionSaveError('')
    setInspectionSaveSuccess('')
    setTicketApproval(null)
    setApprovalSubmitError('')
    setTicketServiceCompletion(null)
    setServiceCompletionOpen(false)
    setServiceCompletionError('')
  }

  function openServiceCompletionModal() {
    setServiceCompletionError('')
    setServiceCompletionOpen(true)
  }

  function closeServiceCompletionModal() {
    setServiceCompletionOpen(false)
    setServiceCompletionError('')
  }

  async function handleCompleteService(input: {
    technicianSignatureDataUrl: string
    clientSignatureDataUrl: string
    clientSignerName: string
    equipmentReady: boolean
    notes: string
  }) {
    if (!viewingTicket || !profile) return

    setServiceCompletionLoading(true)
    setServiceCompletionError('')

    const { error } = await completeTicketService({
      ticketId: viewingTicket.id,
      ...input,
    })

    setServiceCompletionLoading(false)

    if (error) {
      setServiceCompletionError(
        error.message ||
          'Não foi possível concluir o serviço. Execute supabase/ticket-service-completions.sql.',
      )
      return
    }

    const closedAt = new Date().toISOString()
    const updatedTicket: Ticket = {
      ...viewingTicket,
      status: 'concluido',
      closed_at: closedAt,
      updated_at: closedAt,
    }

    setViewingTicket(updatedTicket)
    closeServiceCompletionModal()

    await Promise.all([
      loadTicketServiceCompletion(viewingTicket.id),
      loadTicketEvents(viewingTicket.id),
    ])

    if (isMaintenanceRole(profile.role)) {
      await loadTechnicianTickets(profile.id)
    } else if (profile.role === 'gestor_adm') {
      await loadTickets(ticketStatusFilter)
    } else if (profile.role === 'cliente') {
      await loadClientTickets()
    }
  }

  async function handleClientTicketUpdated(updatedTicket: Ticket) {
    setViewingTicket(updatedTicket)
    setClientEditTicketOpen(false)
    setClientNewMessage('Chamado atualizado com sucesso.')
    await loadClientTickets()
    await loadTicketEvents(updatedTicket.id)
  }

  async function handleClientDeleteTicket() {
    if (!clientDeleteTicket) return

    setClientDeleteLoading(true)
    setClientDeleteError('')

    const { data, error } = await deleteClientTicket(clientDeleteTicket.id)

    setClientDeleteLoading(false)

    if (error) {
      const message = error.message || 'Não foi possível excluir o chamado.'
      setClientDeleteError(
        message.includes('Could not find the function') ||
          message.includes('schema cache')
          ? 'Permissão de exclusão ainda não aplicada no Supabase. Execute o arquivo supabase/client-ticket-actions.sql no SQL Editor.'
          : message,
      )
      return
    }

    if (!data?.length) {
      setClientDeleteError(
        'O chamado não foi excluído. Execute o arquivo supabase/client-ticket-actions.sql no SQL Editor do Supabase.',
      )
      return
    }

    setClientDeleteTicket(null)
    setClientNewMessage('Chamado excluído com sucesso.')
    backToTicketsList()
    await loadClientTickets()
  }

  async function handleUploadAttachment(file: File) {
    if (!viewingTicket || !profile) return

    setAttachmentUploadLoading(true)
    setAttachmentUploadError('')

    const { data, error } = await uploadTicketAttachment(
      viewingTicket.id,
      file,
      profile.id,
    )

    setAttachmentUploadLoading(false)

    if (error) {
      setAttachmentUploadError(
        error.message || 'Não foi possível enviar o anexo.',
      )
      return
    }

    if (data) {
      setTicketAttachments((current) => [data, ...current])

      await insertTicketEvent(
        viewingTicket.id,
        'anexo',
        `Arquivo anexado: ${file.name}`,
        profile.id,
      )
      await loadTicketEvents(viewingTicket.id)
    }
  }

  async function handleUpdateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!viewingTicket || !profile) return

    setEditTicketLoading(true)
    setEditTicketMessage('')

    const isClosed =
      editTicketStatus === 'concluido' || editTicketStatus === 'cancelado'

    const { error } = await supabase
      .from('tickets')
      .update({
        status: editTicketStatus,
        priority: editTicketPriority,
        technician_id: editTicketTechnicianId || null,
        manager_id: profile.id,
        closed_at: isClosed ? new Date().toISOString() : null,
      })
      .eq('id', viewingTicket.id)

    setEditTicketLoading(false)

    if (error) {
      setEditTicketMessage(
        error.message ||
          'Não foi possível atualizar o chamado. Verifique as policies do Supabase.',
      )
      return
    }

    const eventMessages: string[] = []

    if (editTicketStatus !== viewingTicket.status) {
      eventMessages.push(
        `Status alterado de ${statusLabel(viewingTicket.status)} para ${statusLabel(editTicketStatus)}`,
      )
    }

    if (editTicketPriority !== viewingTicket.priority) {
      eventMessages.push(
        `Prioridade alterada de ${priorityLabel(viewingTicket.priority)} para ${priorityLabel(editTicketPriority)}`,
      )
    }

    const previousTechnician = viewingTicket.technician_id ?? ''
    if (editTicketTechnicianId !== previousTechnician) {
      const techName = profiles.find((item) => item.id === editTicketTechnicianId)
        ?.full_name
      eventMessages.push(
        editTicketTechnicianId
          ? `Manutenção atribuída: ${techName || 'Profissional de manutenção'}`
          : 'Manutenção removida do chamado',
      )
    }

    if (eventMessages.length > 0) {
      await insertTicketEvent(
        viewingTicket.id,
        'atualizacao',
        eventMessages.join(' · '),
        profile.id,
      )
    }

    await loadTickets(ticketStatusFilter)
    setViewingTicket(null)
    setTicketEvents([])
  }

  async function handleTechnicianAddEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!viewingTicket || !profile) return

    const note = techEventMessage.trim()

    if (note.length < 3) {
      setTechEventError('Digite uma anotação com pelo menos 3 caracteres.')
      return
    }

    setTechEventLoading(true)
    setTechEventError('')

    const { error } = await insertTicketEvent(
      viewingTicket.id,
      'anotacao',
      note,
      profile.id,
    )

    setTechEventLoading(false)

    if (error) {
      setTechEventError(
        error.message ||
          'Não foi possível registrar a anotação. Verifique as policies do Supabase.',
      )
      return
    }

    setTechEventMessage('')
    await loadTicketEvents(viewingTicket.id)
  }

  async function handleSaveInspection(values: InspectionFormValues) {
    if (!viewingTicket || !profile) return

    const findings = values.findings.trim()
    const recommendation = values.recommendation.trim()

    if (findings.length < 10) {
      setInspectionSaveError('Constatações devem ter pelo menos 10 caracteres.')
      setInspectionSaveSuccess('')
      return
    }

    if (recommendation.length < 10) {
      setInspectionSaveError(
        'Recomendações devem ter pelo menos 10 caracteres.',
      )
      setInspectionSaveSuccess('')
      return
    }

    setInspectionSaveLoading(true)
    setInspectionSaveError('')
    setInspectionSaveSuccess('')

    const inspectedAt = new Date(values.inspectedAt)
    if (Number.isNaN(inspectedAt.getTime())) {
      setInspectionSaveLoading(false)
      setInspectionSaveError('Data e hora da inspeção inválidas.')
      return
    }

    const { data, error } = await saveTicketInspection({
      ticketId: viewingTicket.id,
      inspectorId: profile.id,
      inspectedAt: inspectedAt.toISOString(),
      findings,
      probableCause: values.probableCause,
      causeNotes: values.causeNotes.trim() || null,
      responsibility: values.responsibility,
      recommendation,
    })

    setInspectionSaveLoading(false)

    if (error || !data) {
      setInspectionSaveError(
        error?.message ||
          'Não foi possível salvar o laudo. Execute supabase/ticket-inspections.sql e verifique as policies.',
      )
      return
    }

    setTicketInspection(data)
    setInspectionSaveSuccess(
      'Laudo registrado. O gestor aplicará o próximo status conforme a responsabilidade indicada.',
    )
    await loadTicketEvents(viewingTicket.id)
  }

  async function handleClientApproval(
    decision: 'aprovado' | 'recusado',
    notes: string,
  ) {
    if (!viewingTicket || !profile) return

    setApprovalSubmitLoading(true)
    setApprovalSubmitError('')

    const { error } = await respondTicketApproval(
      viewingTicket.id,
      decision,
      notes || null,
    )

    setApprovalSubmitLoading(false)

    if (error) {
      setApprovalSubmitError(
        error.message ||
          'Não foi possível registrar a aprovação. Execute supabase/ticket-approvals.sql.',
      )
      return
    }

    const newStatus = decision === 'aprovado' ? 'em_execucao' : 'triagem'
    setViewingTicket({ ...viewingTicket, status: newStatus })
    await Promise.all([
      loadTicketApproval(viewingTicket.id),
      loadTicketEvents(viewingTicket.id),
    ])
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return

    if (newUserRole === 'cliente' && !newUserClientId) {
      setNewUserMessage('Selecione a empresa para usuários cliente.')
      return
    }

    setNewUserLoading(true)
    setNewUserMessage('')

    const { data, error } = await createManagedUser({
      email: newUserEmail.trim(),
      password: newUserPassword,
      fullName: newUserName.trim(),
      role: newUserRole,
      clientId: newUserRole === 'cliente' ? newUserClientId : null,
    })

    setNewUserLoading(false)

    if (error) {
      setNewUserMessage(
        error.message ||
          'Falha ao criar usuário. Verifique se a Edge Function create-user está publicada no Supabase.',
      )
      return
    }

    const response = data as { error?: string } | null
    if (response?.error) {
      setNewUserMessage(response.error)
      return
    }

    setNewUserOpen(false)
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserName('')
    setNewUserRole('cliente')
    setNewUserClientId('')
    setNewUserMessage('')
    await loadProfiles()
  }

  async function handleCreatePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewPartLoading(true)
    setNewPartMessage('')

    const { error } = await createPart({
      sku: newPartSku.trim(),
      name: newPartName.trim(),
      description: newPartDescription.trim() || null,
      minStock: Number(newPartMinStock) || 0,
      currentStock: Number(newPartCurrentStock) || 0,
    })

    setNewPartLoading(false)

    if (error) {
      setNewPartMessage(error.message || 'Não foi possível cadastrar a peça.')
      return
    }

    setNewPartOpen(false)
    setNewPartSku('')
    setNewPartName('')
    setNewPartDescription('')
    setNewPartMinStock('0')
    setNewPartCurrentStock('0')
    await loadParts()
  }

  function openEditPartModal(part: Part) {
    setEditPart(part)
    setEditPartSku(part.sku)
    setEditPartName(part.name)
    setEditPartDescription(part.description ?? '')
    setEditPartMinStock(String(part.min_stock))
    setEditPartCurrentStock(String(part.current_stock))
    setEditPartMessage('')
  }

  function closeEditPartModal() {
    setEditPart(null)
    setEditPartSku('')
    setEditPartName('')
    setEditPartDescription('')
    setEditPartMinStock('0')
    setEditPartCurrentStock('0')
    setEditPartMessage('')
  }

  async function handleUpdatePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editPart) return

    const sku = editPartSku.trim()
    const name = editPartName.trim()
    const description = editPartDescription.trim()
    const minStock = Number(editPartMinStock)
    const currentStock = Number(editPartCurrentStock)

    if (sku.length < 2) {
      setEditPartMessage('Digite uma tag/patrimônio com pelo menos 2 caracteres.')
      return
    }

    if (name.length < 3) {
      setEditPartMessage('Digite um nome com pelo menos 3 caracteres.')
      return
    }

    if (!Number.isFinite(minStock) || minStock < 0) {
      setEditPartMessage('Informe um estoque mínimo válido.')
      return
    }

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      setEditPartMessage('Informe um estoque atual válido.')
      return
    }

    setEditPartLoading(true)
    setEditPartMessage('')

    const { error } = await updatePart({
      partId: editPart.id,
      sku,
      name,
      description: description || null,
      minStock,
      currentStock,
    })

    setEditPartLoading(false)

    if (error) {
      setEditPartMessage(error.message || 'Não foi possível atualizar a peça.')
      return
    }

    closeEditPartModal()
    setNewPartMessage('Peça atualizada com sucesso.')
    await loadParts()
  }

  function openDeactivatePartModal(part: Part) {
    setDeactivatePartTarget(part)
    setDeactivatePartMessage('')
  }

  function closeDeactivatePartModal() {
    setDeactivatePartTarget(null)
    setDeactivatePartMessage('')
  }

  async function handleDeactivatePart() {
    if (!deactivatePartTarget) return

    setDeactivatePartLoading(true)
    setDeactivatePartMessage('')

    const { error } = await deactivatePart(deactivatePartTarget.id)

    setDeactivatePartLoading(false)

    if (error) {
      setDeactivatePartMessage(error.message || 'Não foi possível inativar a peça.')
      return
    }

    closeDeactivatePartModal()
    setNewPartMessage('Peça removida da lista com sucesso.')
    await loadParts()
  }

  async function handleRegisterMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMovementLoading(true)
    setMovementMessage('')

    const { error } = await registerPartMovement({
      partId: movementPartId,
      movementType,
      quantity: Number(movementQty),
      notes: movementNotes.trim() || null,
    })

    setMovementLoading(false)

    if (error) {
      setMovementMessage(error.message || 'Não foi possível registrar movimentação.')
      return
    }

    setMovementMessage('')
    setMovementNotes('')
    await loadParts()
  }

  async function handleStartChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return

    setChecklistStartLoading(true)
    setChecklistStartMessage('')

    const { error } = await startChecklistRun({
      templateId: checklistTemplateId,
      equipmentId: checklistEquipmentId || null,
      performedBy: profile.id,
      notes: checklistNotes.trim() || null,
    })

    setChecklistStartLoading(false)

    if (error) {
      setChecklistStartMessage(
        error.message ||
          'Não foi possível iniciar o checklist. Execute supabase/checklists.sql.',
      )
      return
    }

    setChecklistTemplateId('')
    setChecklistEquipmentId('')
    setChecklistNotes('')
    await loadChecklistData()
  }

  function changePage(page: AppPage) {
    setActivePage(page)
    setVisitedPages((current) => new Set(current).add(page))
    setMenuOpen(false)
    backToClients()
    setEditProfile(null)
    setEditMessage('')
    resetEquipmentView()
    resetTicketsView()

    if (page === 'clientes' || page === 'dashboard') {
      void loadClients({ silent: clients.length > 0 })
      void loadTickets('', {
        silent: tickets.length > 0,
        forPage: page,
      })

      if (page === 'dashboard' && profile?.role === 'gestor_adm') {
        void loadProfiles({ silent: profiles.length > 0 })
      }
    }

    if (page === 'tecnicos') {
      void loadClients({ silent: clients.length > 0 })
      void loadProfiles({ silent: profiles.length > 0 })
    }

    if (page === 'equipamentos') {
      void loadClients({ silent: clients.length > 0 })
      void loadFleet({ silent: equipmentFleet.length > 0 })
    }

    if (page === 'chamados') {
      if (profile && isMaintenanceRole(profile.role)) {
        void loadTechnicianTickets(profile.id)
      } else {
        void loadClients({ silent: clients.length > 0 })
        void loadProfiles({ silent: profiles.length > 0 })
        void loadTickets(ticketStatusFilter, {
          silent: tickets.length > 0,
          forPage: page,
        })
      }
    }

    if (page === 'estoque') {
      void loadParts({ silent: parts.length > 0 })
    }

    if (page === 'checklist') {
      void loadFleet({ silent: equipmentFleet.length > 0 })
      void loadChecklistData()
    }

    if (page === 'relatorios') {
      void loadClients({ silent: clients.length > 0 })
      void loadProfiles({ silent: profiles.length > 0 })
      void loadTickets('', {
        silent: tickets.length > 0,
        forPage: page,
      })
      void loadParts({ silent: parts.length > 0 })
      void loadFleet({ silent: equipmentFleet.length > 0 })
      void loadReportsData({
        silent:
          reportApprovals.length > 0 ||
          reportChecklistRuns.length > 0 ||
          reportPartMovements.length > 0,
      })
    }
  }

  function renderTechnicianArea() {
    const technicianPage = activePage === 'checklist' ? 'checklist' : 'chamados'

    if (viewingTicket) {
      return (
        <main className="min-h-svh bg-background p-5 text-foreground sm:p-8">
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<PageLoader message="Carregando chamado..." />}>
              <TechnicianTicketDetailPage
                ticket={viewingTicket}
                siteName={viewingTicketSiteName}
                equipmentLabel={viewingTicketEquipmentLabel}
                events={ticketEvents}
                eventsLoading={ticketEventsLoading}
                attachments={ticketAttachments}
                attachmentsLoading={ticketAttachmentsLoading}
                canUpload
                uploading={attachmentUploadLoading}
                uploadError={attachmentUploadError}
                onUpload={handleUploadAttachment}
                eventMessage={techEventMessage}
                eventLoading={techEventLoading}
                eventError={techEventError}
                inspection={ticketInspection}
                inspectionLoading={ticketInspectionLoading}
                inspectionSaveLoading={inspectionSaveLoading}
                inspectionSaveError={inspectionSaveError}
                inspectionSaveSuccess={inspectionSaveSuccess}
                onSaveInspection={handleSaveInspection}
                serviceCompletion={ticketServiceCompletion}
                serviceCompletionLoading={ticketServiceCompletionLoading}
                onOpenServiceCompletion={openServiceCompletionModal}
                onBack={backToTicketsList}
                onEventMessageChange={setTechEventMessage}
                onAddEvent={handleTechnicianAddEvent}
              />
            </Suspense>

            <ServiceCompletionModal
              open={serviceCompletionOpen}
              loading={serviceCompletionLoading}
              error={serviceCompletionError}
              onClose={closeServiceCompletionModal}
              onSubmit={handleCompleteService}
            />
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-svh bg-background text-foreground">
        <header className="border-b border-border px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Área de manutenção</p>
              <h1 className="text-xl font-bold">
                Olá, {profile?.full_name || roleLabel(profile?.role ?? 'manutencao_adm')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl p-5 sm:p-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {technicianPage === 'checklist' ? 'Checklist' : 'Meus chamados'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {technicianPage === 'checklist'
                  ? 'Execute e acompanhe checklists vinculados a equipamentos.'
                  : 'Chamados atribuídos a você. Registre inspeções e anotações no histórico de cada OS.'}
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => changePage('chamados')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  technicianPage === 'chamados'
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Meus chamados
              </button>
              <button
                type="button"
                onClick={() => changePage('checklist')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  technicianPage === 'checklist'
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Checklist
              </button>
            </div>
          </section>

          {technicianPage === 'checklist' ? (
            <div className="mt-8">
              <Suspense fallback={<PageLoader message="Carregando checklist..." />}>
                <ChecklistPage
                  templates={checklistTemplates}
                  runs={checklistRuns}
                  equipment={equipmentFleet}
                  loading={checklistLoading}
                  error={checklistError}
                  selectedTemplateId={checklistTemplateId}
                  selectedEquipmentId={checklistEquipmentId}
                  notes={checklistNotes}
                  startLoading={checklistStartLoading}
                  startMessage={checklistStartMessage}
                  isGestor={false}
                  onTemplateChange={setChecklistTemplateId}
                  onEquipmentChange={setChecklistEquipmentId}
                  onNotesChange={setChecklistNotes}
                  onStartRun={handleStartChecklist}
                  onReload={() => void loadChecklistData()}
                />
              </Suspense>
            </div>
          ) : (
            <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-6 py-5">
                <h3 className="font-bold">Chamados atribuídos</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Total: {tickets.length}
                </p>
              </div>

              {ticketsLoading && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Carregando chamados...
                </div>
              )}

              {!ticketsLoading && ticketsError && (
                <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">
                  {ticketsError}
                </div>
              )}

              {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                  <ClipboardList className="text-muted-foreground" size={34} />
                  <div>
                    <p className="font-medium text-foreground">
                      Nenhum chamado atribuído.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      O gestor ADM atribuirá chamados a você após a triagem.
                    </p>
                  </div>
                </div>
              )}

              {!ticketsLoading && !ticketsError && tickets.length > 0 && (
                <div className="divide-y divide-border">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => void openTicketDetail(ticket)}
                      className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          #{ticket.ticket_number} · {ticket.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    )
  }

  function renderClientArea() {
    if (!profile?.client_id) {
      return (
        <main className="flex min-h-svh items-center justify-center bg-background p-5 text-foreground">
          <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-7">
            <h1 className="text-2xl font-bold">
              Bem-vindo, {profile?.full_name || 'Cliente'}
            </h1>
            <p className="mt-4 rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Seu perfil ainda não está vinculado a uma empresa. Peça ao gestor
              ADM para associar sua conta a um cliente.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
            >
              Sair
            </button>
          </section>
        </main>
      )
    }

    if (viewingTicket) {
      return (
        <main className="min-h-svh bg-background p-5 text-foreground sm:p-8">
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<PageLoader message="Carregando chamado..." />}>
              <ClientTicketDetailPage
                ticket={viewingTicket}
                companyName={clientCompanyName}
                siteName={resolveTicketSiteName(viewingTicket)}
                equipmentLabel={resolveTicketEquipmentLabel(viewingTicket)}
                events={ticketEvents}
                eventsLoading={ticketEventsLoading}
                attachments={ticketAttachments}
                attachmentsLoading={ticketAttachmentsLoading}
                canUpload
                uploading={attachmentUploadLoading}
                uploadError={attachmentUploadError}
                onUpload={handleUploadAttachment}
                inspection={ticketInspection}
                inspectionLoading={ticketInspectionLoading}
                approval={ticketApproval}
                approvalLoading={ticketApprovalLoading}
                approvalSubmitLoading={approvalSubmitLoading}
                approvalSubmitError={approvalSubmitError}
                serviceCompletion={ticketServiceCompletion}
                serviceCompletionLoading={ticketServiceCompletionLoading}
                onRespondApproval={handleClientApproval}
                onEditTicket={() => {
                  setClientDeleteError('')
                  setClientEditTicketOpen(true)
                }}
                onDeleteTicket={() => {
                  setClientDeleteError('')
                  setClientDeleteTicket(viewingTicket)
                }}
                onBack={backToTicketsList}
              />

              {clientEditTicketOpen && (
                <ClientEditTicketModal
                  open={clientEditTicketOpen}
                  companyName={clientCompanyName}
                  ticket={viewingTicket}
                  userId={profile.id}
                  sites={clientFormSites}
                  allocatedFleet={clientAllocatedFleet}
                  onClose={() => setClientEditTicketOpen(false)}
                  onUpdated={handleClientTicketUpdated}
                />
              )}
            </Suspense>

            {clientDeleteTicket && (
              <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                  <div className="border-b border-border px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                        <AlertTriangle size={22} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Excluir chamado</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Esta ação remove o chamado e o histórico vinculado a ele.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-5">
                    <p className="text-sm text-foreground">
                      Deseja excluir o chamado{' '}
                      <span className="font-semibold">
                        "#{clientDeleteTicket.ticket_number} · {clientDeleteTicket.title}"
                      </span>
                      ?
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Esta ação não pode ser desfeita.
                    </p>

                    {clientDeleteError && (
                      <p className="mt-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        {clientDeleteError}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      disabled={clientDeleteLoading}
                      onClick={() => {
                        setClientDeleteTicket(null)
                        setClientDeleteError('')
                      }}
                      className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60 sm:w-auto"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={clientDeleteLoading}
                      onClick={() => void handleClientDeleteTicket()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                    >
                      <Trash2 size={16} />
                      {clientDeleteLoading ? 'Excluindo...' : 'Excluir chamado'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-svh bg-background text-foreground">
        <header className="border-b border-border px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Área do cliente</p>
              <h1 className="text-xl font-bold">
                {clientCompanyName || 'Minha empresa'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.full_name || 'Usuário cliente'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl p-5 sm:p-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Meus chamados</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Abra chamados de manutenção e acompanhe o andamento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setClientNewMessage('')
                setClientNewTicketOpen(true)
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Plus size={18} />
              Abrir chamado
            </button>
          </section>

          {clientNewMessage && (
            <p
              className={`mt-6 rounded-lg border p-3 text-sm ${
                clientNewMessage.includes('falharam')
                  ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'border-green-300 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200'
              }`}
            >
              {clientNewMessage}
            </p>
          )}

          <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-5">
              <h3 className="font-bold">Chamados da empresa</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Total: {tickets.length}
              </p>
            </div>

            {ticketsLoading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Carregando chamados...
              </div>
            )}

            {!ticketsLoading && ticketsError && (
              <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">
                {ticketsError}
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                <ClipboardList className="text-muted-foreground" size={34} />
                <div>
                  <p className="font-medium text-foreground">
                    Nenhum chamado aberto ainda.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clique em &quot;Abrir chamado&quot; para solicitar
                    manutenção.
                  </p>
                </div>
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length > 0 && (
              <div className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => void openTicketDetail(ticket)}
                    className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        #{ticket.ticket_number} · {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(ticket.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {profile.client_id && clientNewTicketOpen && (
          <Suspense fallback={null}>
            <ClientNewTicketModal
              open={clientNewTicketOpen}
              companyName={clientCompanyName}
              clientId={profile.client_id}
              userId={profile.id}
              sites={clientFormSites}
              allocatedFleet={clientAllocatedFleet}
              onClose={() => setClientNewTicketOpen(false)}
              onCreated={async (warning) => {
                if (warning) {
                  setClientNewMessage(warning)
                } else {
                  setClientNewMessage('Chamado aberto com sucesso.')
                }

                const fleetResult = await fetchClientAllocatedFleet(
                  profile.client_id!,
                )
                setClientAllocatedFleet(fleetResult.data)
                await loadClientTickets()
              }}
            />
          </Suspense>
        )}
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        Carregando acesso...
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-zinc-950 p-5 text-white">
        <Suspense fallback={null}>
          <LoginBackground />
        </Suspense>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-zinc-950/40 to-zinc-950" />

        <section className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-full bg-red-600/20 blur-2xl" />
              <AppLogo className="relative h-24 w-auto max-w-[250px] object-contain" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight">
              ADM Manutenção
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Plataforma profissional de gestão de chamados
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Senha
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              {message && (
                <p className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            ADM Rental Service · Acesso restrito
          </p>
        </section>
      </main>
    )
  }

  if (profile && isMaintenanceRole(profile.role)) {
    return renderTechnicianArea()
  }

  if (profile.role === 'cliente') {
    return renderClientArea()
  }

  const activeMenuItem = managerMenuItems.find((item) => item.page === activePage)
  const dashboardBusy = ticketsLoading || dashboardLoading
  const dashboardInitialLoading = tickets.length === 0 && dashboardBusy
  const reportsBusy =
    ticketsLoading || partsLoading || dashboardLoading || reportsLoading
  const reportsHasData = tickets.length > 0 || parts.length > 0
  const reportsInitialLoading = !reportsHasData && reportsBusy

  return (
    <main className="min-h-svh bg-background text-foreground">
      {menuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo className="h-10 w-auto max-w-[140px] object-contain" />

            <div>
              <h1 className="font-bold">ADM Manutenção</h1>
              <p className="text-xs text-muted-foreground">Gestão operacional</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {managerMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.page

            return (
              <button
                key={item.page}
                type="button"
                onClick={() => changePage(item.page)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-5">
          <p className="truncate text-sm font-medium text-foreground">
            {profile.full_name || 'Gestor ADM'}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">Gestor ADM</p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <section className="lg:pl-72">
        <header className="flex h-20 items-center justify-between border-b border-border bg-card px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold">
                {activeMenuItem?.label || 'Visão geral'}
              </h2>

              <p className="text-xs text-muted-foreground">
                Gestão de manutenção e chamados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <PagePanel active={activePage === 'dashboard'}>
            {visitedPages.has('dashboard') && (
              <DashboardPage
                tickets={tickets}
                events={dashboardEvents}
                profiles={profiles}
                equipmentLabels={dashboardEquipmentLabels}
                siteLabels={dashboardSiteLabels}
                loading={dashboardInitialLoading}
                onGoToTickets={() => changePage('chamados')}
              />
            )}
          </PagePanel>

          <PagePanel active={activePage === 'clientes'}>
            {visitedPages.has('clientes') && (
              <Suspense fallback={<PageLoader />}>
                {viewingClient ? (
                  <SitesPage
                  client={viewingClient}
                  sites={sites}
                  loading={sitesLoading}
                  error={sitesError}
                  modalOpen={newSiteOpen}
                  newSiteName={newSiteName}
                  newSiteAddress={newSiteAddress}
                  newSiteLoading={newSiteLoading}
                  newSiteMessage={newSiteMessage}
                  onBack={backToClients}
                  onOpenModal={openNewSiteModal}
                  onCloseModal={closeNewSiteModal}
                  onNewSiteNameChange={setNewSiteName}
                  onNewSiteAddressChange={setNewSiteAddress}
                  onCreateSite={handleCreateSite}
                />
              ) : (
                <ClientsPage
                  clients={clients}
                  loading={clientsLoading}
                  error={clientsError}
                  modalOpen={newClientOpen}
                  newClientForm={newClientForm}
                  newClientLoading={newClientLoading}
                  newClientMessage={newClientMessage}
                  editClient={editClientTarget}
                  editClientForm={editClientForm}
                  editClientLoading={editClientLoading}
                  editClientMessage={editClientMessage}
                  deactivateClient={deactivateClientTarget}
                  deactivateClientLoading={deactivateClientLoading}
                  deactivateClientMessage={deactivateClientMessage}
                  onOpenModal={() => openNewClientModal()}
                  onCloseModal={closeNewClientModal}
                  onNewClientFormChange={(patch) =>
                    setNewClientForm((current) => ({ ...current, ...patch }))
                  }
                  onCreateClient={handleCreateClient}
                  onCreateTestClient={handleCreateTestClient}
                  onOpenClient={openClientSites}
                  onOpenEditClient={openEditClientModal}
                  onCloseEditClient={closeEditClientModal}
                  onEditClientFormChange={(patch) =>
                    setEditClientForm((current) => ({ ...current, ...patch }))
                  }
                  onUpdateClient={handleUpdateClient}
                  onOpenDeactivateClient={openDeactivateClientModal}
                  onCloseDeactivateClient={closeDeactivateClientModal}
                  onDeactivateClient={() => void handleDeactivateClient()}
                />
                )}
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'chamados'}>
            {visitedPages.has('chamados') && (
              <Suspense fallback={<PageLoader />}>
                {viewingTicket ? (
                  <TicketDetailPage
                  ticket={viewingTicket}
                  clients={clients}
                  profiles={profiles}
                  siteName={viewingTicketSiteName}
                  equipmentLabel={viewingTicketEquipmentLabel}
                  events={ticketEvents}
                  eventsLoading={ticketEventsLoading}
                  attachments={ticketAttachments}
                  attachmentsLoading={ticketAttachmentsLoading}
                  canUpload
                  uploading={attachmentUploadLoading}
                  uploadError={attachmentUploadError}
                  onUpload={handleUploadAttachment}
                  editStatus={editTicketStatus}
                  editPriority={editTicketPriority}
                  editTechnicianId={editTicketTechnicianId}
                  editLoading={editTicketLoading}
                  editMessage={editTicketMessage}
                  inspection={ticketInspection}
                  inspectionLoading={ticketInspectionLoading}
                  approval={ticketApproval}
                  approvalLoading={ticketApprovalLoading}
                  serviceCompletion={ticketServiceCompletion}
                  serviceCompletionLoading={ticketServiceCompletionLoading}
                  onBack={backToTicketsList}
                  onEditStatusChange={setEditTicketStatus}
                  onEditPriorityChange={setEditTicketPriority}
                  onEditTechnicianChange={setEditTicketTechnicianId}
                  onSave={handleUpdateTicket}
                />
              ) : (
                <TicketsPage
                  tickets={tickets}
                  clients={clients}
                  loading={ticketsLoading}
                  error={ticketsError}
                  statusFilter={ticketStatusFilter}
                  modalOpen={newTicketOpen}
                  newClientId={newTicketClientId}
                  newSiteId={newTicketSiteId}
                  newEquipmentId={newTicketEquipmentId}
                  newTitle={newTicketTitle}
                  newDescription={newTicketDescription}
                  newPriority={newTicketPriority}
                  newLoading={newTicketLoading}
                  newMessage={newTicketMessage}
                  formSites={ticketFormSites}
                  formEquipment={ticketFormEquipment}
                  onSelectStatusFilter={(status) =>
                    void selectTicketStatusFilter(status)
                  }
                  onOpenModal={openNewTicketModal}
                  onCloseModal={closeNewTicketModal}
                  onSelectClient={(clientId) =>
                    void selectNewTicketClient(clientId)
                  }
                  onNewSiteChange={setNewTicketSiteId}
                  onNewEquipmentChange={setNewTicketEquipmentId}
                  onNewTitleChange={setNewTicketTitle}
                  onNewDescriptionChange={setNewTicketDescription}
                  onNewPriorityChange={setNewTicketPriority}
                  onCreateTicket={handleCreateTicket}
                  onOpenTicket={openTicketDetail}
                  editTicket={editGestorTicket}
                  editClientId={editGestorClientId}
                  editSiteId={editGestorSiteId}
                  editEquipmentId={editGestorEquipmentId}
                  editTitle={editGestorTitle}
                  editDescription={editGestorDescription}
                  editPriority={editGestorPriority}
                  editLoading={editGestorLoading}
                  editMessage={editGestorMessage}
                  editFormSites={editGestorFormSites}
                  editFormEquipment={editGestorFormEquipment}
                  onOpenEditTicket={(ticket) => void openEditGestorTicketModal(ticket)}
                  onCloseEditTicket={closeEditGestorTicketModal}
                  onSelectEditClient={(clientId) =>
                    void selectEditGestorClient(clientId)
                  }
                  onEditSiteChange={setEditGestorSiteId}
                  onEditEquipmentChange={setEditGestorEquipmentId}
                  onEditTitleChange={setEditGestorTitle}
                  onEditDescriptionChange={setEditGestorDescription}
                  onEditPriorityChange={setEditGestorPriority}
                  onUpdateTicket={handleUpdateGestorTicket}
                  deleteTicket={deleteGestorTicketTarget}
                  deleteLoading={deleteGestorLoading}
                  deleteMessage={deleteGestorMessage}
                  onOpenDeleteTicket={openDeleteGestorTicketModal}
                  onCloseDeleteTicket={closeDeleteGestorTicketModal}
                  onDeleteTicket={() => void handleDeleteGestorTicket()}
                />
                )}
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'tecnicos'}>
            {visitedPages.has('tecnicos') && (
              <Suspense fallback={<PageLoader />}>
                <TechniciansPage
                profiles={profiles}
                clients={clients}
                currentUserId={profile.id}
                loading={profilesLoading}
                error={profilesError}
                editProfile={editProfile}
                editRole={editRole}
                editClientId={editClientId}
                editLoading={editLoading}
                editMessage={editMessage}
                onEditProfile={openEditProfile}
                onCloseEdit={closeEditProfile}
                onEditRoleChange={setEditRole}
                onEditClientChange={setEditClientId}
                onSaveProfile={handleSaveProfile}
                newUserOpen={newUserOpen}
                newUserEmail={newUserEmail}
                newUserPassword={newUserPassword}
                newUserName={newUserName}
                newUserRole={newUserRole}
                newUserClientId={newUserClientId}
                newUserLoading={newUserLoading}
                newUserMessage={newUserMessage}
                onOpenNewUser={() => {
                  setNewUserOpen(true)
                  setNewUserMessage('')
                }}
                onCloseNewUser={() => setNewUserOpen(false)}
                onNewUserEmailChange={setNewUserEmail}
                onNewUserPasswordChange={setNewUserPassword}
                onNewUserNameChange={setNewUserName}
                onNewUserRoleChange={setNewUserRole}
                onNewUserClientChange={setNewUserClientId}
                onCreateUser={handleCreateUser}
              />
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'estoque'}>
            {visitedPages.has('estoque') && (
              <Suspense fallback={<PageLoader />}>
                <InventoryPage
                parts={parts}
                loading={partsLoading}
                error={partsError}
                modalOpen={newPartOpen}
                newSku={newPartSku}
                newName={newPartName}
                newDescription={newPartDescription}
                newMinStock={newPartMinStock}
                newCurrentStock={newPartCurrentStock}
                newLoading={newPartLoading}
                newMessage={newPartMessage}
                editPart={editPart}
                editSku={editPartSku}
                editName={editPartName}
                editDescription={editPartDescription}
                editMinStock={editPartMinStock}
                editCurrentStock={editPartCurrentStock}
                editLoading={editPartLoading}
                editMessage={editPartMessage}
                deactivatePart={deactivatePartTarget}
                deactivateLoading={deactivatePartLoading}
                deactivateMessage={deactivatePartMessage}
                movementPartId={movementPartId}
                movementType={movementType}
                movementQty={movementQty}
                movementNotes={movementNotes}
                movementLoading={movementLoading}
                movementMessage={movementMessage}
                onOpenModal={() => {
                  setNewPartOpen(true)
                  setNewPartMessage('')
                }}
                onCloseModal={() => setNewPartOpen(false)}
                onNewSkuChange={setNewPartSku}
                onNewNameChange={setNewPartName}
                onNewDescriptionChange={setNewPartDescription}
                onNewMinStockChange={setNewPartMinStock}
                onNewCurrentStockChange={setNewPartCurrentStock}
                onCreatePart={handleCreatePart}
                onOpenEditModal={openEditPartModal}
                onCloseEditModal={closeEditPartModal}
                onEditSkuChange={setEditPartSku}
                onEditNameChange={setEditPartName}
                onEditDescriptionChange={setEditPartDescription}
                onEditMinStockChange={setEditPartMinStock}
                onEditCurrentStockChange={setEditPartCurrentStock}
                onUpdatePart={handleUpdatePart}
                onOpenDeactivateModal={openDeactivatePartModal}
                onCloseDeactivateModal={closeDeactivatePartModal}
                onDeactivatePart={() => void handleDeactivatePart()}
                onMovementPartChange={setMovementPartId}
                onMovementTypeChange={setMovementType}
                onMovementQtyChange={setMovementQty}
                onMovementNotesChange={setMovementNotes}
                onRegisterMovement={handleRegisterMovement}
                onReload={() => void loadParts()}
              />
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'checklist'}>
            {visitedPages.has('checklist') && (
              <Suspense fallback={<PageLoader />}>
                <ChecklistPage
                templates={checklistTemplates}
                runs={checklistRuns}
                equipment={equipmentFleet}
                loading={checklistLoading}
                error={checklistError}
                selectedTemplateId={checklistTemplateId}
                selectedEquipmentId={checklistEquipmentId}
                notes={checklistNotes}
                startLoading={checklistStartLoading}
                startMessage={checklistStartMessage}
                isGestor={profile.role === 'gestor_adm'}
                onTemplateChange={setChecklistTemplateId}
                onEquipmentChange={setChecklistEquipmentId}
                onNotesChange={setChecklistNotes}
                onStartRun={handleStartChecklist}
                onReload={() => void loadChecklistData()}
              />
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'relatorios'}>
            {visitedPages.has('relatorios') && (
              <Suspense fallback={<PageLoader />}>
                <ReportsPage
                tickets={tickets}
                parts={parts}
                events={dashboardEvents}
                profiles={profiles}
                clients={clients}
                equipmentFleet={equipmentFleet}
                siteLabels={dashboardSiteLabels}
                equipmentLabels={dashboardEquipmentLabels}
                approvals={reportApprovals}
                checklistRuns={reportChecklistRuns}
                checklistTemplates={checklistTemplates}
                partMovements={reportPartMovements}
                loading={reportsInitialLoading}
                error={ticketsError || partsError || reportsError}
              />
              </Suspense>
            )}
          </PagePanel>

          <PagePanel active={activePage === 'equipamentos'}>
            {visitedPages.has('equipamentos') && (
              <Suspense fallback={<PageLoader />}>
                <EquipmentPage
                clients={clients}
                sites={
                  allocateModalOpen ? allocateSites : equipmentFilterSites
                }
                fleet={filterFleet(
                  equipmentFleet,
                  equipmentFilterClientId,
                  equipmentFilterSiteId,
                )}
                filterClientId={equipmentFilterClientId}
                filterSiteId={equipmentFilterSiteId}
                loading={equipmentLoading}
                error={equipmentError}
                newModalOpen={newEquipmentOpen}
                newAssetTag={newEquipmentAssetTag}
                newDescription={newEquipmentDescription}
                newSerial={newEquipmentSerial}
                newLoading={newEquipmentLoading}
                newMessage={newEquipmentMessage}
                editEquipment={editEquipment}
                editAssetTag={editEquipmentAssetTag}
                editDescription={editEquipmentDescription}
                editSerial={editEquipmentSerial}
                editLoading={editEquipmentLoading}
                editMessage={editEquipmentMessage}
                deactivateEquipment={deactivateEquipment}
                deactivateLoading={deactivateEquipmentLoading}
                deactivateMessage={deactivateEquipmentMessage}
                allocateModalOpen={allocateModalOpen}
                allocateEquipment={allocateEquipment}
                allocateClientId={allocateClientId}
                allocateSiteId={allocateSiteId}
                allocateLoading={allocateLoading}
                allocateMessage={allocateMessage}
                onFilterClientChange={(clientId) =>
                  void selectEquipmentFilterClient(clientId)
                }
                onFilterSiteChange={selectEquipmentFilterSite}
                onOpenNewModal={openNewEquipmentModal}
                onCloseNewModal={closeNewEquipmentModal}
                onNewAssetTagChange={setNewEquipmentAssetTag}
                onNewDescriptionChange={setNewEquipmentDescription}
                onNewSerialChange={setNewEquipmentSerial}
                onCreateEquipment={handleCreateEquipment}
                onOpenEditModal={openEditEquipmentModal}
                onCloseEditModal={closeEditEquipmentModal}
                onEditAssetTagChange={setEditEquipmentAssetTag}
                onEditDescriptionChange={setEditEquipmentDescription}
                onEditSerialChange={setEditEquipmentSerial}
                onUpdateEquipment={handleUpdateEquipment}
                onOpenDeactivateModal={openDeactivateEquipmentModal}
                onCloseDeactivateModal={closeDeactivateEquipmentModal}
                onDeactivateEquipment={() => void handleDeactivateEquipment()}
                onOpenAllocateModal={openAllocateModal}
                onCloseAllocateModal={closeAllocateModal}
                onAllocateClientChange={(clientId) =>
                  void selectAllocateClient(clientId)
                }
                onAllocateSiteChange={setAllocateSiteId}
                onCreateAllocation={handleCreateAllocation}
                onEndAllocation={(allocationId) =>
                  void handleEndAllocation(allocationId)
                }
              />
              </Suspense>
            )}
          </PagePanel>
        </div>
      </section>
    </main>
  )
}
