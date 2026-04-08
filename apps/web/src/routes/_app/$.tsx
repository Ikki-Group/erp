import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/feedback/error-pages'

export const Route = createFileRoute('/_app/$')({ component: NotFoundPage })
