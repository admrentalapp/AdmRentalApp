import {
  Building2,
  ClipboardList,
  LayoutDashboard,
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
]
