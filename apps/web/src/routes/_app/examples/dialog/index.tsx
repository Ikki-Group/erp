import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useConfirm } from '@/providers/confirm-provider'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is installed as per package.json

export const Route = createFileRoute('/_app/examples/dialog/')({
  component: DialogPage,
})

function DialogPage() {
  const { confirm } = useConfirm()

  const handleDestructive = () => {
    confirm({
      title: 'Delete Project?',
      description:
        'This action cannot be undone. This will permanently delete your project and remove your data from our servers.',
      confirmText: 'Delete Project',
      variant: 'destructive',
      onConfirm: async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 2000))
        toast.success('Project deleted successfully')
      },
    })
  }

  const handleInfo = () => {
    confirm({
      title: 'Update Available',
      description:
        'A new version of the application is available. Would you like to update now?',
      confirmText: 'Update Now',
      variant: 'info',
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        toast.info('Application updated')
      },
    })
  }

  const handleWarning = () => {
    confirm({
      title: 'Unsaved Changes',
      description:
        'You have unsaved changes. Are you sure you want to leave without saving?',
      confirmText: 'Leave',
      variant: 'warning',
      onConfirm: () => {
        toast.warning('Changes discarded')
      },
    })
  }

  const handleDefault = () => {
    confirm({
      title: 'Confirm Action',
      description: 'Please confirm that you want to proceed with this action.',
      onConfirm: () => {
        toast.success('Action confirmed')
      },
    })
  }

  return (
    <Page>
      <PageHeader sticky>
        <PageTitleContainer>
          <PageTitle>Confirmation Dialogs</PageTitle>
          <PageDescription>
            Reusable confirmation dialogs with async support.
          </PageDescription>
        </PageTitleContainer>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2Icon className="text-destructive h-5 w-5" />
                Destructive Action
              </CardTitle>
              <CardDescription>
                Use for actions that result in data loss.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDestructive}>
                Delete Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="text-yellow-500 h-5 w-5" />
                Warning Action
              </CardTitle>
              <CardDescription>
                Use for actions that might have consequences but aren't
                destructive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                onClick={handleWarning}
              >
                Discard Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="text-blue-500 h-5 w-5" />
                Info Confirmation
              </CardTitle>
              <CardDescription>
                Use for general confirmations or informational prompts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={handleInfo}>
                Update Application
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2Icon className="text-primary h-5 w-5" />
                Default Confirmation
              </CardTitle>
              <CardDescription>Standard confirmation dialog.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDefault}>Confirm Action</Button>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  )
}
