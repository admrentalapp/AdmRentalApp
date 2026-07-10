import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PagePanel({
  active,
  children,
  className,
}: {
  active: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(!active && 'hidden', className)}
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}
