import { Badge } from '@/components/reui/badge'
import { ComponentProps } from 'react'

export interface BadgeDotProps extends ComponentProps<typeof Badge> {}

export function BadgeDot({ children, ...props }: BadgeDotProps) {
  return (
    <Badge {...props}>
      <span className="ms-px size-1.25 rounded-full! bg-[currentColor]" />
      {children}
    </Badge>
  )
}

export function getActiveStatusBadge(isActive: boolean): BadgeDotProps {
  if (isActive) {
    return {
      variant: 'success-outline',
      children: 'Aktif',
    }
  }

  return {
    variant: 'destructive-outline',
    children: 'Tidak Aktif',
  }
}
