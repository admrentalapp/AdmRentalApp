import { type FormEvent } from 'react'
import { Info, Users, X } from 'lucide-react'
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
      <section>
        <p className="text-sm text-zinc-500">Usuários e acessos</p>
        <h3 className="mt-1 text-2xl font-bold">Usuários e acessos</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Defina o papel de cada usuário. Manutenção ADM e Manutenção Externa
          aparecem para atribuição de chamados.
        </p>
      </section>

      <section className="mt-6 flex gap-3 rounded-2xl border border-blue-950 bg-blue-950/30 p-4 text-sm text-blue-200">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          O login (e-mail e senha) é criado no Supabase Auth — pelo cadastro do
          próprio usuário ou pelo painel do Supabase. Aqui o gestor apenas
          define o papel e, para clientes, a empresa vinculada.
        </p>
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5">
          <h4 className="font-bold">Usuários cadastrados</h4>
          <p className="mt-1 text-sm text-zinc-500">
            Total de registros: {profiles.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-zinc-400">
            Carregando usuários...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-300">{error}</div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Users className="text-zinc-600" size={34} />
            <div>
              <p className="font-medium text-zinc-300">
                Nenhum usuário encontrado.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Cadastre usuários no Supabase Auth para gerenciá-los aqui.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="divide-y divide-zinc-800">
            {profiles.map((managed) => {
              const isCurrentUser = managed.id === currentUserId

              return (
                <div
                  key={managed.id}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-red-400">
                      <Users size={20} />
                    </div>

                    <div>
                      <p className="font-semibold">
                        {managed.full_name || 'Sem nome'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-zinc-500">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
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
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Gerenciar acesso</p>
                <h3 className="mt-1 text-xl font-bold">
                  {editProfile.full_name || 'Sem nome'}
                </h3>
              </div>

              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onSaveProfile}>
              <div>
                <label
                  htmlFor="profileRole"
                  className="mb-2 block text-sm font-medium text-zinc-200"
                >
                  Papel do usuário
                </label>

                <select
                  id="profileRole"
                  value={editRole}
                  onChange={(event) =>
                    onEditRoleChange(event.target.value as UserRole)
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500"
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
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Empresa vinculada
                  </label>

                  <select
                    id="profileClient"
                    value={editClientId}
                    onChange={(event) => onEditClientChange(event.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-red-500"
                  >
                    <option value="">Selecione a empresa...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {clients.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      Nenhuma empresa cadastrada. Cadastre um cliente antes de
                      vincular.
                    </p>
                  )}
                </div>
              )}

              {isMaintenanceRole(editRole) && (
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                  {editRole === 'manutencao_adm'
                    ? 'Profissional da equipe interna de manutenção da ADM.'
                    : 'Profissional de empresa terceira contratada para manutenção.'}
                </p>
              )}

              {editMessage && (
                <p className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                  {editMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
