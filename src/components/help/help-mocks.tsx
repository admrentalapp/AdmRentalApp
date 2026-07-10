import {
  Building2,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Package,
  PenLine,
  Users,
  Wrench,
} from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { RoleBadge } from '@/components/shared/role-badge'
import { HelpAppFrame } from '@/components/help/help-ui'

export function MockSidebarMenu() {
  const items = [
    { label: 'Visão geral', icon: LayoutDashboard, active: false },
    { label: 'Chamados', icon: ClipboardList, active: false },
    { label: 'Clientes', icon: Building2, active: false },
    { label: 'Usuários', icon: Users, active: false },
    { label: 'Equipamentos', icon: Wrench, active: false },
    { label: 'Estoque', icon: Package, active: false },
    { label: 'Help', icon: CircleHelp, active: true },
  ]

  return (
    <HelpAppFrame title="Menu do Gestor">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full space-y-1.5 rounded-xl border border-border bg-card p-2 sm:w-40 sm:shrink-0">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                  item.active
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </div>
            )
          })}
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          No computador, o menu fica à esquerda. No celular, abra pelo ícone de
          menu. A opção <strong className="text-foreground">Help</strong> abre
          este manual dentro do próprio sistema.
        </div>
      </div>
    </HelpAppFrame>
  )
}

export function MockClientOpenTicket() {
  return (
    <HelpAppFrame title="Cliente · Abrir chamado">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Meus chamados</p>
            <p className="font-semibold text-foreground">Nova solicitação</p>
          </div>
          <span className="w-fit rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
            Abrir chamado
          </span>
        </div>
        <div className="grid gap-2 rounded-xl border border-border bg-card p-3 text-xs sm:grid-cols-2">
          <Field label="Obra" value="Canteiro Shopping Norte" />
          <Field label="Equipamento" value="EQ-1042 · Plataforma 12m" />
          <Field label="Responsável" value="João Silva" />
          <Field label="Telefone" value="(11) 98888-0000" />
          <Field
            label="Título"
            value="Plataforma não sobe"
            className="sm:col-span-2"
          />
          <Field
            label="Descrição"
            value="Equipamento liga, mas não eleva. Barulho no mastro."
            className="sm:col-span-2"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Status inicial: <StatusBadge status="aberto" /> · Prioridade:{' '}
          <PriorityBadge priority="media" />
        </p>
      </div>
    </HelpAppFrame>
  )
}

export function MockGestorTriage() {
  return (
    <HelpAppFrame title="Gestor · Triagem">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            OS #2026-00125
          </span>
          <StatusBadge status="aberto" />
          <PriorityBadge priority="media" />
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Triagem e gestão
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <Field label="Status" value="Em inspeção" />
            <Field label="Prioridade" value="Alta" />
            <Field label="Técnico" value="Carlos Técnico" />
          </div>
          <div className="mt-3 flex justify-end">
            <span className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
              Salvar alterações
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Após salvar, o técnico vê o chamado em{' '}
          <strong className="text-foreground">Meus chamados</strong>.
        </p>
      </div>
    </HelpAppFrame>
  )
}

export function MockTechnicianInspection() {
  return (
    <HelpAppFrame title="Técnico · Laudo">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="em_inspecao" />
          <PriorityBadge priority="alta" />
          <RoleBadge role="manutencao_adm" />
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-xs">
          <p className="font-medium text-foreground">Laudo de inspeção</p>
          <div className="mt-2 space-y-2">
            <Field
              label="Constatações"
              value="Vazamento hidráulico · pressão insuficiente"
            />
            <Field label="Causa provável" value="Desgaste de mangueira" />
            <Field label="Responsabilidade" value="Cliente" />
            <Field
              label="Recomendações"
              value="Troca de mangueira + teste de elevação"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <span className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
              Salvar laudo
            </span>
          </div>
        </div>
      </div>
    </HelpAppFrame>
  )
}

export function MockClientApproval() {
  return (
    <HelpAppFrame title="Cliente · Aprovação">
      <div className="space-y-3">
        <StatusBadge status="aguardando_aprovacao" />
        <div className="rounded-xl border border-border bg-card p-3 text-xs">
          <p className="font-medium text-foreground">
            Serviços recomendados pelo técnico
          </p>
          <p className="mt-2 text-muted-foreground">
            Substituição de mangueira hidráulica e teste de elevação.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white">
              Aprovar execução
            </span>
            <span className="rounded-lg border border-border bg-background px-3 py-1.5 font-semibold text-foreground">
              Recusar
            </span>
          </div>
        </div>
      </div>
    </HelpAppFrame>
  )
}

export function MockCompletionSignatures() {
  return (
    <HelpAppFrame title="Técnico · Conclusão">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PenLine size={16} className="text-red-600" />
          Concluir serviço
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Assinatura do técnico
            </p>
            <div className="mt-2 flex h-16 items-end justify-center border-b border-foreground/20 pb-1 font-serif text-lg italic text-foreground/70">
              Carlos T.
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Assinatura do cliente
            </p>
            <div className="mt-2 flex h-16 items-end justify-center border-b border-foreground/20 pb-1 font-serif text-lg italic text-foreground/70">
              João Silva
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status="concluido" />
          <span className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
            FINALIZAR
          </span>
        </div>
      </div>
    </HelpAppFrame>
  )
}

export function MockCadastroFlow() {
  return (
    <HelpAppFrame title="Gestor · Ordem de cadastro">
      <ol className="space-y-2 text-xs">
        {[
          { n: '1', t: 'Clientes', d: 'Cadastre a empresa contratante' },
          { n: '2', t: 'Obras', d: 'Crie as unidades/canteiros' },
          { n: '3', t: 'Equipamentos', d: 'Registre a frota' },
          { n: '4', t: 'Alocação', d: 'Vincule equipamento à obra' },
          { n: '5', t: 'Estoque', d: 'Cadastre peças (opcional)' },
          { n: '6', t: 'Usuários', d: 'Crie técnicos e clientes' },
        ].map((item) => (
          <li
            key={item.n}
            className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
              {item.n}
            </span>
            <div>
              <p className="font-semibold text-foreground">{item.t}</p>
              <p className="text-muted-foreground">{item.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </HelpAppFrame>
  )
}

function Field({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}
