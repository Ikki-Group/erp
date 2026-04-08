import type { BadgeDotProps } from '@/components/blocks/data-display/badge-dot'

import type { MaterialTypeDto } from './dto'

export const MaterialBadgeProps = {
  raw: { variant: 'success-outline', children: 'Bahan Mentah' },
  semi: { variant: 'warning-outline', children: 'Bahan Setengah Jadi' },
} satisfies Record<MaterialTypeDto, BadgeDotProps>
