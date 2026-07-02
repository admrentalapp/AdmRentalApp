import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Bell, ClipboardList, LogOut, Menu, Plus, X } from 'lucide-react'
import { AppLogo } from '@/components/shared/app-logo'
import { ClientNewTicketModal } from '@/components/tickets/client-new-ticket-modal'
import type { InspectionFormValues } from '@/components/tickets/inspection-section'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { managerMenuItems } from '@/config/menu'
import {
  createEquipmentAllocation,
  createFleetEquipment,
  endEquipmentAllocation,
  fetchAllocatedEquipmentForClient,
  fetchClientAllocatedFleet,
  fetchFleetData,
  filterFleet,
  mergeEquipmentWithAllocations,
} from '@/features/equipment/api'
import {
  fetchTicketAttachments,
  insertTicketEvent,
  parseAttachments,
  uploadTicketAttachment,
} from '@/features/tickets/api'
import {
  fetchTicketInspection,
  parseTicketInspection,
  saveTicketInspection,
} from '@/features/tickets/inspections-api'
import { TICKET_SELECT_COLUMNS } from '@/features/tickets/constants'
import {
  fetchDashboardEvents,
  fetchDashboardLookups,
} from '@/features/dashboard/api'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, roleLabel, statusLabel } from '@/lib/tickets'
import { supabase } from '@/lib/supabase'
import { ClientTicketDetailPage } from '@/pages/client-ticket-detail-page'
import { ClientsPage } from '@/pages/clients-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EquipmentPage } from '@/pages/equipment-page'
import { SitesPage } from '@/pages/sites-page'
import { TechniciansPage } from '@/pages/technicians-page'
import { TechnicianTicketDetailPage } from '@/pages/technician-ticket-detail-page'
import { TicketDetailPage } from '@/pages/ticket-detail-page'
import { TicketsPage } from '@/pages/tickets-page'
import type {
  AppPage,
  Attachment,
  Client,
  Equipment,
  EquipmentWithAllocation,
  ManagedProfile,
  Profile,
  Site,
  Ticket,
  TicketEvent,
  TicketInspection,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@/types'
import { TEST_CLIENT_NAME, isMaintenanceRole } from '@/types'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState<AppPage>('dashboard')

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState('')

  const [newClientOpen, setNewClientOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientLoading, setNewClientLoading] = useState(false)
  const [newClientMessage, setNewClientMessage] = useState('')

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

  const [dashboardEvents, setDashboardEvents] = useState<TicketEvent[]>([])
  const [dashboardSiteLabels, setDashboardSiteLabels] = useState(
    () => new Map<string, string>(),
  )
  const [dashboardEquipmentLabels, setDashboardEquipmentLabels] = useState(
    () => new Map<string, string>(),
  )
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const loadClients = useCallback(async () => {
    setClientsLoading(true)
    setClientsError('')

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, active, created_at')
      .order('name', { ascending: true })

    setClientsLoading(false)

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

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    setProfilesError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, client_id, created_at')
      .order('full_name', { ascending: true })

    setProfilesLoading(false)

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

  const loadFleet = useCallback(async () => {
    setEquipmentLoading(true)
    setEquipmentError('')

    const { equipment, allocations, error } = await fetchFleetData()

    setEquipmentLoading(false)

    if (error) {
      setEquipmentFleet([])
      setEquipmentError(
        error.message || 'Não foi possível carregar a frota de equipamentos.',
      )
      return
    }

    setEquipmentFleet(mergeEquipmentWithAllocations(equipment, allocations))
  }, [])

  const loadTickets = useCallback(async (statusFilter = '') => {
    setTicketsLoading(true)
    setTicketsError('')

    let query = supabase
      .from('tickets')
      .select(TICKET_SELECT_COLUMNS)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    setTicketsLoading(false)

    if (error) {
      setTickets([])
      setTicketsError(error.message || 'Não foi possível carregar os chamados.')
      return
    }

    setTickets((data ?? []) as Ticket[])
  }, [])

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

  const loadDashboardData = useCallback(async (ticketList: Ticket[]) => {
    setDashboardLoading(true)

    const ticketIds = ticketList.map((ticket) => ticket.id)
    const [eventsResult, lookupsResult] = await Promise.all([
      fetchDashboardEvents(ticketIds),
      fetchDashboardLookups(ticketList),
    ])

    setDashboardEvents(eventsResult.data ?? [])
    setDashboardSiteLabels(lookupsResult.siteLabels)
    setDashboardEquipmentLabels(lookupsResult.equipmentLabels)
    setDashboardLoading(false)
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
        await loadClients()
        await loadTickets()
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
    [loadClients, loadTickets, loadTechnicianTickets, loadClientTickets, loadEquipmentSitesForClient],
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

  useEffect(() => {
    if (profile?.role !== 'gestor_adm' || activePage !== 'dashboard') return

    void loadProfiles()
    void loadDashboardData(tickets)
  }, [profile, activePage, tickets, loadProfiles, loadDashboardData])

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
    setNewClientName('')
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

  async function createClient(name: string) {
    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      setNewClientMessage('Digite um nome com pelo menos 2 caracteres.')
      return false
    }

    setNewClientLoading(true)
    setNewClientMessage('')

    const { error } = await supabase.from('clients').insert({
      name: trimmedName,
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

    setNewClientName('')
    setNewClientOpen(false)
    await loadClients()
    return true
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createClient(newClientName)
  }

  async function handleCreateTestClient() {
    setNewClientName(TEST_CLIENT_NAME)
    setNewClientMessage('')
    setNewClientOpen(true)
  }

  function openNewClientModal(prefillName = '') {
    setNewClientName(prefillName)
    setNewClientMessage('')
    setNewClientOpen(true)
  }

  function closeNewClientModal() {
    setNewClientName('')
    setNewClientMessage('')
    setNewClientOpen(false)
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

    const detailLookups: Promise<unknown>[] = [
      loadTicketEvents(ticket.id),
      loadTicketAttachments(ticket.id),
      loadTicketInspection(ticket.id),
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

  function changePage(page: AppPage) {
    setActivePage(page)
    setMenuOpen(false)
    backToClients()
    setEditProfile(null)
    setEditMessage('')
    resetEquipmentView()
    resetTicketsView()

    if (page === 'clientes' || page === 'dashboard') {
      void loadClients()
      void loadTickets()
    }

    if (page === 'tecnicos') {
      void loadClients()
      void loadProfiles()
    }

    if (page === 'equipamentos') {
      void loadClients()
      void loadFleet()
    }

    if (page === 'chamados') {
      void loadClients()
      void loadProfiles()
      void loadTickets()
    }
  }

  function goToNewTicketFromDashboard() {
    setActivePage('chamados')
    setMenuOpen(false)
    resetTicketsView()
    openNewTicketModal()
    void loadClients()
    void loadProfiles()
    void loadTickets()
  }

  function renderTechnicianArea() {
    if (viewingTicket) {
      return (
        <main className="min-h-svh bg-zinc-950 p-5 text-white sm:p-8">
          <div className="mx-auto max-w-3xl">
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
              onBack={backToTicketsList}
              onEventMessageChange={setTechEventMessage}
              onAddEvent={handleTechnicianAddEvent}
            />
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-svh bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Área de manutenção</p>
              <h1 className="text-xl font-bold">
                Olá, {profile?.full_name || roleLabel(profile?.role ?? 'manutencao_adm')}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl p-5 sm:p-8">
          <section>
            <h2 className="text-2xl font-bold">Meus chamados</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Chamados atribuídos a você. Registre inspeções e anotações no
              histórico de cada OS.
            </p>
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-6 py-5">
              <h3 className="font-bold">Chamados atribuídos</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Total: {tickets.length}
              </p>
            </div>

            {ticketsLoading && (
              <div className="p-8 text-center text-sm text-zinc-400">
                Carregando chamados...
              </div>
            )}

            {!ticketsLoading && ticketsError && (
              <div className="p-8 text-center text-sm text-red-300">
                {ticketsError}
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                <ClipboardList className="text-zinc-600" size={34} />
                <div>
                  <p className="font-medium text-zinc-300">
                    Nenhum chamado atribuído.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    O gestor ADM atribuirá chamados a você após a triagem.
                  </p>
                </div>
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length > 0 && (
              <div className="divide-y divide-zinc-800">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => void openTicketDetail(ticket)}
                    className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-zinc-950/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        #{ticket.ticket_number} · {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
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
      </main>
    )
  }

  function renderClientArea() {
    if (!profile?.client_id) {
      return (
        <main className="flex min-h-svh items-center justify-center bg-zinc-950 p-5 text-white">
          <section className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h1 className="text-2xl font-bold">
              Bem-vindo, {profile?.full_name || 'Cliente'}
            </h1>
            <p className="mt-4 rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">
              Seu perfil ainda não está vinculado a uma empresa. Peça ao gestor
              ADM para associar sua conta a um cliente.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-lg border border-zinc-700 px-4 py-3 font-medium hover:bg-zinc-800"
            >
              Sair
            </button>
          </section>
        </main>
      )
    }

    if (viewingTicket) {
      return (
        <main className="min-h-svh bg-zinc-950 p-5 text-white sm:p-8">
          <div className="mx-auto max-w-3xl">
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
              onBack={backToTicketsList}
            />
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-svh bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Área do cliente</p>
              <h1 className="text-xl font-bold">
                {clientCompanyName || 'Minha empresa'}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                {profile.full_name || 'Usuário cliente'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl p-5 sm:p-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Meus chamados</h2>
              <p className="mt-2 text-sm text-zinc-400">
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
                  ? 'border-amber-900 bg-amber-950/40 text-amber-100'
                  : 'border-green-900 bg-green-950/40 text-green-200'
              }`}
            >
              {clientNewMessage}
            </p>
          )}

          <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-6 py-5">
              <h3 className="font-bold">Chamados da empresa</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Total: {tickets.length}
              </p>
            </div>

            {ticketsLoading && (
              <div className="p-8 text-center text-sm text-zinc-400">
                Carregando chamados...
              </div>
            )}

            {!ticketsLoading && ticketsError && (
              <div className="p-8 text-center text-sm text-red-300">
                {ticketsError}
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                <ClipboardList className="text-zinc-600" size={34} />
                <div>
                  <p className="font-medium text-zinc-300">
                    Nenhum chamado aberto ainda.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Clique em &quot;Abrir chamado&quot; para solicitar
                    manutenção.
                  </p>
                </div>
              </div>
            )}

            {!ticketsLoading && !ticketsError && tickets.length > 0 && (
              <div className="divide-y divide-zinc-800">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => void openTicketDetail(ticket)}
                    className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-zinc-950/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        #{ticket.ticket_number} · {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
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

        {profile.client_id && (
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
        )}
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-zinc-950 text-zinc-400">
        Carregando acesso...
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-zinc-950 p-5 text-white">
        <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
          <div className="mb-8">
            <AppLogo className="mb-4 h-16 w-auto max-w-full object-contain" />

            <h1 className="text-2xl font-bold">ADM Manutenção</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Acesse sua área de manutenção.
            </p>
          </div>

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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
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
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
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

  return (
    <main className="min-h-svh bg-zinc-950 text-white">
      {menuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 p-5 transition-transform lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo className="h-10 w-auto max-w-[140px] object-contain" />

            <div>
              <h1 className="font-bold">ADM Manutenção</h1>
              <p className="text-xs text-zinc-500">Gestão operacional</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 lg:hidden"
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
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-zinc-800 pt-5">
          <p className="truncate text-sm font-medium text-zinc-200">
            {profile.full_name || 'Gestor ADM'}
          </p>

          <p className="mt-1 text-xs text-zinc-500">Gestor ADM</p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <section className="lg:pl-72">
        <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-900 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold">
                {activeMenuItem?.label || 'Visão geral'}
              </h2>

              <p className="text-xs text-zinc-500">
                Gestão de manutenção e chamados
              </p>
            </div>
          </div>

          <button
            type="button"
            className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <Bell size={21} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </header>

        <div className="p-5 sm:p-8">
          {activePage === 'dashboard' && (
            <DashboardPage
              tickets={tickets}
              events={dashboardEvents}
              profiles={profiles}
              equipmentLabels={dashboardEquipmentLabels}
              siteLabels={dashboardSiteLabels}
              loading={ticketsLoading || dashboardLoading}
              onGoToTickets={() => changePage('chamados')}
              onCreateTicket={goToNewTicketFromDashboard}
            />
          )}

          {activePage === 'clientes' &&
            (viewingClient ? (
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
                newClientName={newClientName}
                newClientLoading={newClientLoading}
                newClientMessage={newClientMessage}
                onOpenModal={() => openNewClientModal()}
                onCloseModal={closeNewClientModal}
                onNewClientNameChange={setNewClientName}
                onCreateClient={handleCreateClient}
                onCreateTestClient={handleCreateTestClient}
                onOpenClient={openClientSites}
              />
            ))}

          {activePage === 'chamados' &&
            (viewingTicket ? (
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
              />
            ))}

          {activePage === 'tecnicos' && (
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
            />
          )}

          {activePage === 'equipamentos' && (
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
          )}
        </div>
      </section>
    </main>
  )
}
