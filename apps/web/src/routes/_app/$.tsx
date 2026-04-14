import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/blocks/feedback/error-pages'

export const Route = createFileRoute('/_app/$')({ component: NotFoundPage })
