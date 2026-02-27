import type { BadgeDotProps } from '@/components/common/badge-dot'

export function getUserStatusBadge(isActive: boolean): BadgeDotProps {
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
