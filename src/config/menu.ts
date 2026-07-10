import {
  Building2,
  CheckSquare,
  ClipboardList,
  CircleHelp,
  FileBarChart,
  LayoutDashboard,
  Package,
  Users,
  Wrench,
} from 'lucide-react'
import type { MenuItem } from '@/types'

export const managerMenuItems: MenuItem[] = [
  { label: 'Visão geral', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Chamados', page: 'chamados', icon: ClipboardList },
  { label: 'Clientes', page: 'clientes', icon: Building2 },
  { label: 'Usuários', page: 'tecnicos', icon: Users },
  { label: 'Equipamentos', page: 'equipamentos', icon: Wrench },
  { label: 'Estoque', page: 'estoque', icon: Package },
  { label: 'Checklist', page: 'checklist', icon: CheckSquare },
  { label: 'Relatórios', page: 'relatorios', icon: FileBarChart },
  { label: 'Help', page: 'help', icon: CircleHelp },
]
