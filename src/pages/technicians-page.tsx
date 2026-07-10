import { type FormEvent } from 'react'
import { Plus, Users, X } from 'lucide-react'
import { DashboardCard } from '@/components/shared/dashboard-card'
import { RoleBadge } from '@/components/shared/role-badge'
import type { Client, ManagedProfile, UserRole } from '@/types'
import { isMaintenanceRole } from '@/types'

export function TechniciansPage({
  profiles,
  clients,
  currentUserId,
  loading,
  error,
  editProfile,
  editRole,
  editClientId,
  editLoading,
  editMessage,
  onEditProfile,
  onCloseEdit,
  onEditRoleChange,
  onEditClientChange,
  onSaveProfile,
  newUserOpen,
  newUserEmail,
  newUserPassword,
  newUserName,
  newUserRole,
  newUserClientId,
  newUserLoading,
  newUserMessage,
  onOpenNewUser,
  onCloseNewUser,
  onNewUserEmailChange,
  onNewUserPasswordChange,
  onNewUserNameChange,
  onNewUserRoleChange,
  onNewUserClientChange,
  onCreateUser,
}: {
  profiles: ManagedProfile[]
  clients: Client[]
  currentUserId: string
  loading: boolean
  error: string
  editProfile: ManagedProfile | null
  editRole: UserRole
  editClientId: string
  editLoading: boolean
  editMessage: string
  onEditProfile: (managed: ManagedProfile) => void
  onCloseEdit: () => void
  onEditRoleChange: (role: UserRole) => void
  onEditClientChange: (value: string) => void
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void
  newUserOpen: boolean
  newUserEmail: string
  newUserPassword: string
  newUserName: string
  newUserRole: UserRole
  newUserClientId: string
  newUserLoading: boolean
  newUserMessage: string
  onOpenNewUser: () => void
  onCloseNewUser: () => void
  onNewUserEmailChange: (value: string) => void
  onNewUserPasswordChange: (value: string) => void
  onNewUserNameChange: (value: string) => void
  onNewUserRoleChange: (role: UserRole) => void
  onNewUserClientChange: (value: string) => void
  onCreateUser: (event: FormEvent<HTMLFormElement>) => void
}) {
  const maintenanceAdmCount = profiles.filter(
    (item) => item.role === 'manutencao_adm',
  ).length
  const maintenanceExternalCount = profiles.filter(
    (item) => item.role === 'manutencao_externa',
  ).length
  const managerCount = profiles.filter(
    (item) => item.role === 'gestor_adm',
  ).length
  const clientCount = profiles.filter((item) => item.role === 'cliente').length

  function clientName(clientId: string | null) {
    if (!clientId) return null
    return clients.find((item) => item.id === clientId)?.name ?? null
  }

  function profileSubtitle(managed: ManagedProfile) {
    if (managed.role === 'cliente') {
      const linkedClient = clientName(managed.client_id)
      return linkedClient
        ? `Empresa: ${linkedClient}`
        : 'Cliente sem empresa vinculada'
    }

    if (managed.role === 'manutencao_externa') {
      return 'Empresa terceira — manutenção em campo'
    }

    if (managed.role === 'manutencao_adm') {
      return 'Equipe ADM — manutenção em campo'
    }

    return 'Equipe ADM'
  }

  return (
    <>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Usuários e acessos</p>
          <h3 className="mt-1 text-2xl font-bold">Usuários e acessos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie logins e defina o papel de cada usuário.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewUser}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Manutenção ADM"
          value={String(maintenanceAdmCount)}
          description="Equipe interna da ADM"
        />
        <DashboardCard
          label="Manutenção Externa"
          value={String(maintenanceExternalCount)}
          description="Empresas terceiras"
        />
        <DashboardCard
          label="Gestores ADM"
          value={String(managerCount)}
          description="Administram a operação"
        />
        <DashboardCard
          label="Clientes"
          value={String(clientCount)}
          description="Usuários de empresas"
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h4 className="font-bold">Usuários cadastrados</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de registros: {profiles.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando usuários...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Users className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                Nenhum usuário encontrado.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastre usuários no Supabase Auth para gerenciá-los aqui.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="divide-y divide-border">
            {profiles.map((managed) => {
              const isCurrentUser = managed.id === currentUserId

              return (
                <div
                  key={managed.id}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-red-600 dark:text-red-400">
                      <Users size={20} />
                    </div>

                    <div>
                      <p className="font-semibold">
                        {managed.full_name || 'Sem nome'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profileSubtitle(managed)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <RoleBadge role={managed.role} />

                    <button
                      type="button"
                      disabled={isCurrentUser}
                      onClick={() => onEditProfile(managed)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {editProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Gerenciar acesso</p>
                <h3 className="mt-1 text-xl font-bold">
                  {editProfile.full_name || 'Sem nome'}
                </h3>
              </div>

              <button
                type="button"
                onClick={onCloseEdit}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onSaveProfile}>
              <div>
                <label
                  htmlFor="profileRole"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Papel do usuário
                </label>

                <select
                  id="profileRole"
                  value={editRole}
                  onChange={(event) =>
                    onEditRoleChange(event.target.value as UserRole)
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                >
                  <option value="cliente">Cliente</option>
                  <option value="manutencao_adm">Manutenção ADM</option>
                  <option value="manutencao_externa">Manutenção Externa</option>
                  <option value="gestor_adm">Gestor ADM</option>
                </select>
              </div>

              {editRole === 'cliente' && (
                <div>
                  <label
                    htmlFor="profileClient"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Empresa vinculada
                  </label>

                  <select
                    id="profileClient"
                    value={editClientId}
                    onChange={(event) => onEditClientChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                  >
                    <option value="">Selecione a empresa...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {clients.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      Nenhuma empresa cadastrada. Cadastre um cliente antes de
                      vincular.
                    </p>
                  )}
                </div>
              )}

              {isMaintenanceRole(editRole) && (
                <p className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                  {editRole === 'manutencao_adm'
                    ? 'Profissional da equipe interna de manutenção da ADM.'
                    : 'Profissional de empresa terceira contratada para manutenção.'}
                </p>
              )}

              {editMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {editMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {newUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Novo acesso</p>
                <h3 className="mt-1 text-xl font-bold">Criar usuário</h3>
              </div>
              <button
                type="button"
                onClick={onCloseNewUser}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onCreateUser}>
              <div className="space-y-2">
                <label
                  htmlFor="newUserName"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Nome completo
                </label>
                <input
                  id="newUserName"
                  type="text"
                  value={newUserName}
                  onChange={(event) => onNewUserNameChange(event.target.value)}
                  placeholder="Nome completo"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newUserEmail"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  E-mail de login
                </label>
                <input
                  id="newUserEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => onNewUserEmailChange(event.target.value)}
                  placeholder="E-mail de login"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newUserPassword"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Senha inicial
                </label>
                <input
                  id="newUserPassword"
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => onNewUserPasswordChange(event.target.value)}
                  placeholder="Senha inicial (mín. 6 caracteres)"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newUserRole"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Papel do usuário
                </label>
                <select
                  id="newUserRole"
                  value={newUserRole}
                  onChange={(event) =>
                    onNewUserRoleChange(event.target.value as UserRole)
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                >
                  <option value="cliente">Cliente</option>
                  <option value="manutencao_adm">Manutenção ADM</option>
                  <option value="manutencao_externa">Manutenção Externa</option>
                  <option value="gestor_adm">Gestor ADM</option>
                </select>
              </div>
              {newUserRole === 'cliente' && (
                <div className="space-y-2">
                  <label
                    htmlFor="newUserClient"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Empresa vinculada
                  </label>
                  <select
                    id="newUserClient"
                    value={newUserClientId}
                    onChange={(event) => onNewUserClientChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                    required
                  >
                    <option value="">Empresa vinculada...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {newUserMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {newUserMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={newUserLoading}
                className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {newUserLoading ? 'Criando...' : 'Criar usuário'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
