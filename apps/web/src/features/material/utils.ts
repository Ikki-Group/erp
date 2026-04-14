import type { MaterialTypeDto } from './dto'

import type { BadgeDotProps } from '@/components/blocks/data-display/badge-dot'

export const MaterialBadgeProps = {
	raw: { variant: 'success-outline', children: 'Bahan Mentah' },
	semi: { variant: 'warning-outline', children: 'Bahan Setengah Jadi' },
	packaging: { variant: 'info-outline', children: 'Kemasan' },
} satisfies Record<MaterialTypeDto, BadgeDotProps>
