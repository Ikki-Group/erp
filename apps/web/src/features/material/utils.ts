import type { BadgeDotProps } from '@/components/common/badge-dot'
import type { MaterialType } from './dto'

export const MaterialBadgeProps = {
  raw: {
    variant: 'success-outline',
    children: 'Bahan Mentah',
  },
  semi: {
    variant: 'warning-outline',
    children: 'Bahan Setengah Jadi',
  },
} satisfies Record<MaterialType, BadgeDotProps>
