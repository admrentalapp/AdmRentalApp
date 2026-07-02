import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { priorityLabel, statusLabel } from '@/lib/tickets'
import type {
  ChartSlice,
  EquipmentFailureRow,
  SlaDailyPoint,
} from '@/lib/dashboard-stats'
import type { TicketPriority, TicketStatus } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  aberto: '#f43f5e',
  triagem: '#f97316',
  em_inspecao: '#eab308',
  aguardando_aprovacao: '#a855f7',
  em_execucao: '#3b82f6',
  aguardando_pecas: '#06b6d4',
  concluido: '#22c55e',
  cancelado: '#71717a',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  critica: '#f43f5e',
  alta: '#f97316',
  media: '#eab308',
  baixa: '#22c55e',
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; payload?: { name?: string } }>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {payload.map((entry) => (
        <p key={entry.name} className="text-zinc-400">
          {entry.payload?.name ?? entry.name}:{' '}
          <span className="font-semibold text-zinc-100">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function SlaTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: SlaDailyPoint }>
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium text-zinc-200">{point.label}</p>
      <p className="mt-1 text-zinc-400">
        SLA: <span className="font-semibold text-emerald-400">{point.rate}%</span>
      </p>
      <p className="mt-0.5 text-zinc-500">
        {point.compliant}/{point.total} chamados
      </p>
    </div>
  )
}

function DonutChart({
  data,
  colorFor,
  centerLabel,
}: {
  data: Array<ChartSlice & { color: string }>
  colorFor: (item: ChartSlice) => string
  centerLabel: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={colorFor(entry)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-zinc-500">{centerLabel}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((entry) => {
          const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0

          return (
            <div key={entry.key} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorFor(entry) }}
              />
              <span className="flex-1 truncate text-sm text-zinc-300">
                {entry.name}
              </span>
              <span className="text-sm font-semibold text-white">
                {entry.value}
              </span>
              <span className="w-10 text-right text-xs text-zinc-500">
                {percent}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SlaTrendChart({ data }: { data: SlaDailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<SlaTooltip />} cursor={{ stroke: '#3f3f46' }} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#22c55e"
            strokeWidth={2.5}
            fill="url(#slaGradient)"
            dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#22c55e', stroke: '#052e16', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusDonutChart({ data }: { data: ChartSlice[] }) {
  const enriched = data.map((slice) => ({
    ...slice,
    name: statusLabel(slice.key as TicketStatus),
    color: STATUS_COLORS[slice.key] ?? '#71717a',
  }))

  return (
    <DonutChart
      data={enriched}
      colorFor={(item) => STATUS_COLORS[item.key] ?? '#71717a'}
      centerLabel="chamados"
    />
  )
}

export function PriorityDonutChart({ data }: { data: ChartSlice[] }) {
  const enriched = data.map((slice) => ({
    ...slice,
    name: priorityLabel(slice.key as TicketPriority),
    color: PRIORITY_COLORS[slice.key as TicketPriority] ?? '#71717a',
  }))

  return (
    <DonutChart
      data={enriched}
      colorFor={(item) =>
        PRIORITY_COLORS[item.key as TicketPriority] ?? '#71717a'
      }
      centerLabel="total"
    />
  )
}

export function EquipmentFailureChart({ data }: { data: EquipmentFailureRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
        Sem dados de equipamentos ainda.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="failGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fill: '#d4d4d8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#27272a55' }} />
          <Bar
            dataKey="count"
            fill="url(#failGradient)"
            radius={[0, 8, 8, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
