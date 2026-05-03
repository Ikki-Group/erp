import { createFileRoute } from '@tanstack/react-router'

import { PosScreen } from '@/features/pos/pages/pos-screen'

export const Route = createFileRoute('/pos/')({ component: PosScreen })
