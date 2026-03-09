import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { materialApi } from '@/features/material'
import { MaterialDetailPage } from '@/features/material/components/material-detail-page'
import { Page } from '@/components/layout/page'

export const Route = createFileRoute('/_app/materials/$id/')({
  loader: async ({ context, params }) => {
    await context.qc.ensureQueryData(
      materialApi.detail.query({ id: Number(params.id) })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <Suspense
      fallback={
        <Page>
          <Page.BlockHeader title='Loading...' />
          <Page.Content>
            <div className='flex items-center justify-center h-64'>
              <div className='animate-pulse flex flex-col items-center gap-4'>
                <div className='size-12 rounded-full bg-muted' />
                <div className='h-4 w-48 bg-muted rounded' />
              </div>
            </div>
          </Page.Content>
        </Page>
      }
    >
      <MaterialDetailPage id={Number(id)} />
    </Suspense>
  )
}
