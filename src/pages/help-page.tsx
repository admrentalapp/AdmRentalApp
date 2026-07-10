import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  Lightbulb,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  MockCadastroFlow,
  MockClientApproval,
  MockClientOpenTicket,
  MockCompletionSignatures,
  MockGestorTriage,
  MockSidebarMenu,
  MockTechnicianInspection,
} from '@/components/help/help-mocks'
import { HelpCallout, HelpStep } from '@/components/help/help-ui'
import { AppLogo } from '@/components/shared/app-logo'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { RoleBadge } from '@/components/shared/role-badge'
import { cn } from '@/lib/utils'
import type { AppPage, TicketStatus } from '@/types'

type HelpSectionId =
  | 'inicio'
  | 'perfis'
  | 'cadastros'
  | 'fluxo'
  | 'simulacao'
  | 'situacoes'
  | 'faq'

const SECTIONS: Array<{
  id: HelpSectionId
  label: string
  icon: typeof CircleHelp
}> = [
  { id: 'inicio', label: 'Começar aqui', icon: Sparkles },
  { id: 'perfis', label: 'Perfis de acesso', icon: Users },
  { id: 'cadastros', label: 'Cadastros iniciais', icon: Building2 },
  { id: 'fluxo', label: 'Fluxo do chamado', icon: Compass },
  { id: 'simulacao', label: 'Simulação guiada', icon: PlayCircle },
  { id: 'situacoes', label: 'Todas as situações', icon: Lightbulb },
  { id: 'faq', label: 'Dúvidas rápidas', icon: CircleHelp },
]

const STATUS_GUIDE: Array<{
  status: TicketStatus
  meaning: string
  who: string
}> = [
  {
    status: 'aberto',
    meaning: 'Chamado recém-criado, aguardando triagem.',
    who: 'Cliente criou · Gestor deve agir',
  },
  {
    status: 'triagem',
    meaning: 'Gestor está analisando e classificando.',
    who: 'Gestor',
  },
  {
    status: 'em_inspecao',
    meaning: 'Técnico está avaliando o equipamento.',
    who: 'Técnico',
  },
  {
    status: 'aguardando_aprovacao',
    meaning: 'Cliente precisa aprovar ou recusar o serviço.',
    who: 'Cliente',
  },
  {
    status: 'em_execucao',
    meaning: 'Manutenção em andamento na obra.',
    who: 'Técnico',
  },
  {
    status: 'aguardando_pecas',
    meaning: 'Serviço pausado por falta de peça.',
    who: 'Gestor / Estoque',
  },
  {
    status: 'concluido',
    meaning: 'Serviço finalizado com assinaturas.',
    who: 'Todos consultam',
  },
  {
    status: 'cancelado',
    meaning: 'Chamado encerrado sem conclusão.',
    who: 'Gestor',
  },
]

export function HelpPage({
  onNavigate,
}: {
  onNavigate: (page: AppPage) => void
}) {
  const [activeSection, setActiveSection] = useState<HelpSectionId>('inicio')
  const [simStep, setSimStep] = useState(0)

  const simSteps = useMemo(
    () => [
      {
        title: '1. Cliente abre o chamado',
        body: 'Marina (cliente) registra a falha com fotos, obra, equipamento e contato na obra. O status inicia como Aberto.',
        mock: <MockClientOpenTicket />,
      },
      {
        title: '2. Gestor faz a triagem',
        body: 'Ana (gestora) define prioridade Alta, status Em inspeção e atribui Carlos como técnico.',
        mock: <MockGestorTriage />,
      },
      {
        title: '3. Técnico registra o laudo',
        body: 'Carlos inspeciona, anexa evidências e salva o laudo. Se a responsabilidade for do Cliente, o chamado vai para Aguard. aprovação.',
        mock: <MockTechnicianInspection />,
      },
      {
        title: '4. Cliente aprova o serviço',
        body: 'Marina lê as recomendações e aprova a execução. O chamado segue para Em execução.',
        mock: <MockClientApproval />,
      },
      {
        title: '5. Conclusão com assinaturas',
        body: 'Carlos finaliza o serviço, coleta assinaturas do técnico e do responsável na obra. Status: Concluído.',
        mock: <MockCompletionSignatures />,
      },
    ],
    [],
  )

  useEffect(() => {
    const el = document.getElementById(`help-${activeSection}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeSection])

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-card via-card/85 to-background p-7 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-sky-600/8 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AppLogo className="h-10 w-auto max-w-[120px] object-contain" />
              <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <BookOpen size={13} className="text-red-600" />
                Central de Ajuda · v1.0
              </span>
            </div>
            <h3 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Aprenda o ADM Manutenção
              <span className="block text-red-600">de forma simples e visual</span>
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Este manual vive dentro do sistema. Sempre que o programa evoluir,
              a ajuda acompanha. Use os atalhos abaixo para ir direto ao que
              precisa — do cadastro inicial até a conclusão do chamado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickLink
              label="Ir para Clientes"
              onClick={() => onNavigate('clientes')}
            />
            <QuickLink
              label="Ir para Chamados"
              onClick={() => onNavigate('chamados')}
            />
            <QuickLink
              label="Ir para Usuários"
              onClick={() => onNavigate('tecnicos')}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="h-fit rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-6">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conteúdo
          </p>
          <ul className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const active = activeSection === section.id
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition',
                      active
                        ? 'bg-red-600 font-semibold text-white shadow-md shadow-red-600/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="space-y-10">
          <section id="help-inicio" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Boas-vindas"
              title="Como este Help funciona"
              subtitle="Um guia interativo com telas reais do programa, fluxos e simulações."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                icon={Compass}
                title="Passo a passo"
                text="Cadastros na ordem certa e operação do chamado sem adivinhar."
              />
              <FeatureCard
                icon={PlayCircle}
                title="Simulação guiada"
                text="Veja um atendimento completo: do cliente até o status Concluído."
              />
              <FeatureCard
                icon={Sparkles}
                title="Telas do próprio app"
                text="As ilustrações usam a identidade visual e os badges reais do sistema."
              />
            </div>
            <MockSidebarMenu />
            <HelpCallout tone="tip" title="Dica de ouro">
              Comece sempre pelos cadastros (clientes → obras → equipamentos →
              usuários). Só depois opere chamados. Se pular essa ordem, o cliente
              pode não ver equipamentos ao abrir a OS.
            </HelpCallout>
          </section>

          <section id="help-perfis" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Quem faz o quê"
              title="Perfis de acesso"
              subtitle="Cada login enxerga apenas o que precisa para trabalhar."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <RoleCard
                role="gestor_adm"
                title="Gestor ADM"
                points={[
                  'Cadastra clientes, obras, usuários, equipamentos e peças',
                  'Faz triagem e atribui técnico',
                  'Acompanha painel e exporta relatórios',
                ]}
              />
              <RoleCard
                role="manutencao_adm"
                title="Técnico (ADM ou Externa)"
                points={[
                  'Vê só chamados atribuídos a ele',
                  'Registra laudo, anexos e anotações',
                  'Conclui com assinaturas na obra',
                ]}
              />
              <RoleCard
                role="cliente"
                title="Cliente"
                points={[
                  'Abre chamados da própria empresa',
                  'Acompanha a timeline do atendimento',
                  'Aprova ou recusa serviços quando solicitado',
                ]}
              />
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">
                  Prioridades do chamado
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PriorityBadge priority="baixa" />
                  <PriorityBadge priority="media" />
                  <PriorityBadge priority="alta" />
                  <PriorityBadge priority="critica" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  O cliente abre com prioridade <strong>Média</strong>. O gestor
                  pode elevar para Alta ou Crítica na triagem.
                </p>
              </div>
            </div>
          </section>

          <section id="help-cadastros" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Implantação"
              title="Cadastros iniciais (ordem correta)"
              subtitle="Siga esta sequência uma vez por empresa. Depois é só operar."
            />
            <div className="grid gap-5 xl:grid-cols-2">
              <MockCadastroFlow />
              <div className="space-y-0 rounded-2xl border border-border bg-card p-5">
                <HelpStep number={1} title="Clientes">
                  Menu <strong>Clientes</strong> → Novo cliente. Preencha razão
                  social, fantasia, CNPJ e contato. Depois crie as{' '}
                  <strong>obras</strong> (Ver obras → Nova obra).
                </HelpStep>
                <HelpStep number={2} title="Equipamentos">
                  Menu <strong>Equipamentos</strong> → cadastre a frota →{' '}
                  <strong>Alocar</strong> ao cliente/obra. Sem alocação, o
                  cliente não vê o equipamento.
                </HelpStep>
                <HelpStep number={3} title="Estoque de peças">
                  Menu <strong>Estoque</strong> → Nova peça (SKU, nome, mínimo).
                  Use entradas/saídas durante o atendimento.
                </HelpStep>
                <HelpStep number={4} title="Usuários">
                  Menu <strong>Usuários</strong> → Novo usuário. Para perfil
                  Cliente, vincule a empresa correta.
                </HelpStep>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickLink label="Abrir Clientes" onClick={() => onNavigate('clientes')} />
              <QuickLink
                label="Abrir Equipamentos"
                onClick={() => onNavigate('equipamentos')}
              />
              <QuickLink label="Abrir Estoque" onClick={() => onNavigate('estoque')} />
              <QuickLink label="Abrir Usuários" onClick={() => onNavigate('tecnicos')} />
            </div>
          </section>

          <section id="help-fluxo" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Operação"
              title="Fluxo completo do chamado"
              subtitle="Do pedido do cliente até a assinatura final."
            />

            <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5">
              <div className="flex min-w-[720px] items-center gap-2">
                {[
                  'Cliente abre',
                  'Gestor tria',
                  'Técnico avalia',
                  'Cliente aprova*',
                  'Técnico executa',
                  'Concluído',
                ].map((label, index, arr) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="rounded-xl border border-border bg-background px-3 py-2 text-center text-xs font-semibold text-foreground">
                      {label}
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight size={16} className="shrink-0 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                * Aprovação só ocorre quando o laudo indica responsabilidade do
                Cliente.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h4 className="font-semibold text-foreground">
                  Dicionário de status
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os mesmos badges coloridos que você vê nas telas do sistema.
                </p>
              </div>
              <div className="divide-y divide-border">
                {STATUS_GUIDE.map((row) => (
                  <div
                    key={row.status}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[160px_1fr_180px] sm:items-center"
                  >
                    <StatusBadge status={row.status} />
                    <p className="text-sm text-foreground">{row.meaning}</p>
                    <p className="text-xs text-muted-foreground">{row.who}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="help-simulacao" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Pratique mentalmente"
              title="Simulação guiada ponta a ponta"
              subtitle="Personagens: Marina (cliente), Ana (gestora) e Carlos (técnico)."
            />

            <div className="flex flex-wrap gap-2">
              {simSteps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setSimStep(index)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                    simStep === index
                      ? 'bg-red-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  Etapa {index + 1}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
                  <PlayCircle size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    {simSteps[simStep].title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {simSteps[simStep].body}
                  </p>
                </div>
              </div>
              <div className="mt-5">{simSteps[simStep].mock}</div>
              <div className="mt-5 flex justify-between">
                <button
                  type="button"
                  disabled={simStep === 0}
                  onClick={() => setSimStep((s) => Math.max(0, s - 1))}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={simStep === simSteps.length - 1}
                  onClick={() =>
                    setSimStep((s) => Math.min(simSteps.length - 1, s + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Próxima etapa
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <section id="help-situacoes" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="Casos reais"
              title="Todas as situações importantes"
              subtitle="O que fazer em cada desvio do fluxo feliz."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SituationCard
                title="Responsabilidade ADM"
                text="Laudo com responsabilidade ADM → vai direto para Em execução, sem aprovação do cliente."
              />
              <SituationCard
                title="Cliente recusa"
                text="Em Aguard. aprovação, o cliente pode recusar. O gestor analisa e decide o próximo passo."
              />
              <SituationCard
                title="Aguardando peças"
                text="Pause em Aguard. peças, registre entrada no Estoque e retome Em execução."
              />
              <SituationCard
                title="Editar / excluir chamado"
                text="Cliente só edita ou exclui enquanto o status for Aberto. Depois, apenas acompanha."
              />
              <SituationCard
                title="Prioridade crítica"
                text="Gestor eleva para Crítica na triagem. O painel destaca esses chamados."
              />
              <SituationCard
                title="Cancelamento"
                text="Gestor define Cancelado quando a OS não deve seguir (ex.: solicitação indevida)."
              />
              <SituationCard
                title="Checklist"
                text="Use templates em Checklist para inspeções preventivas padronizadas."
              />
              <SituationCard
                title="Relatórios"
                text="Em Relatórios, filtre o período e exporte Excel com chamados, estoque e mais."
              />
            </div>
          </section>

          <section id="help-faq" className="scroll-mt-6 space-y-5">
            <SectionTitle
              eyebrow="FAQ"
              title="Dúvidas rápidas"
              subtitle="Respostas curtas para os problemas mais comuns."
            />
            <div className="space-y-3">
              <Faq
                q="O cliente não vê equipamentos ao abrir chamado"
                a="Alocar o equipamento à obra e vincular o usuário cliente à empresa correta."
              />
              <Faq
                q="O técnico não vê chamados"
                a="O gestor precisa atribuir o técnico na triagem do chamado."
              />
              <Faq
                q="Quais arquivos posso anexar?"
                a="JPEG, PNG, WebP, GIF e PDF — até 10 MB por arquivo."
              />
              <Faq
                q="Como usar no celular?"
                a="Abra no Chrome/Safari e use Adicionar à tela inicial / Instalar app (PWA)."
              />
              <Faq
                q="Onde fica a conclusão com assinaturas?"
                a="No detalhe da OS, o técnico clica em Concluir serviço e coleta as duas assinaturas."
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Checklist rápido de implantação
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-800/90 dark:text-emerald-100/90">
                    <li>✓ Cliente e obras cadastrados</li>
                    <li>✓ Equipamentos alocados</li>
                    <li>✓ Usuários (gestor, técnico, cliente) criados</li>
                    <li>✓ Teste: abrir → triar → laudo → aprovar → concluir</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              ADM Rental Service · Manual interno do ADM Manutenção · Atualizado
              junto com o sistema
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Compass
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
        <Icon size={18} />
      </div>
      <h4 className="mt-3 font-semibold text-foreground">{title}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function RoleCard({
  role,
  title,
  points,
}: {
  role: 'gestor_adm' | 'manutencao_adm' | 'cliente'
  title: string
  points: string[]
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <RoleBadge role={role} />
      <h4 className="mt-3 font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li
            key={point}
            className="flex gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-red-600" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SituationCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Lightbulb size={16} className="text-amber-500" />
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card px-5 py-4">
      <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none">
        <span className="flex items-center justify-between gap-3">
          {q}
          <ChevronRight
            size={16}
            className="shrink-0 text-muted-foreground transition group-open:rotate-90"
          />
        </span>
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </details>
  )
}

function QuickLink({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-red-500/40 hover:text-red-600"
    >
      {label}
      <ArrowRight size={12} />
    </button>
  )
}