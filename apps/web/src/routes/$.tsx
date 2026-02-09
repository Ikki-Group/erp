import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/common/error-pages'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})
