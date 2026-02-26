import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/examples/dialog-form/')({
  component: DialogFormPage,
})

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  dueDate: z.string().min(1, 'Due date is required'),
})

type Task = z.infer<typeof taskSchema>

function DialogFormPage() {
  const [open, setOpen] = useState(false)

  return (
    <Page>
      <Page.BlockHeader
        title="Dialog Form"
        description="Example of a form inside a modal dialog using TanStack Form."
      />

      <Page.Content>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4 border border-dashed rounded-lg bg-muted/10">
          <p className="text-muted-foreground text-sm">
            No tasks found. Create a new task to get started.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create New Task
                </Button>
              }
            />
            <DialogContent className="sm:max-w-125">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your project. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <TaskForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </Page.Content>
    </Page>
  )
}

function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({
    defaultValues: {
      title: '',
      priority: 'medium' as Task['priority'],
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
    },
    // @ts-ignore
    validatorAdapter: zodValidator(),
    validators: {
      // @ts-ignore
      onChange: taskSchema,
    },
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Submitted:', value)
      toast.success('Task created successfully')
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <form.Field
          name="title"
          children={(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Title</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Fix login bug"
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-xs">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="priority"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Priority</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val: any) => field.handleChange(val)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors ? (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="dueDate"
            children={(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Due Date</Label>
                <Input
                  id={field.name}
                  type="date"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors ? (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>

        <form.Field
          name="description"
          children={(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Description</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Additional details..."
              />
              {field.state.meta.errors ? (
                <p className="text-destructive text-xs">
                  {field.state.meta.errors.join(', ')}
                </p>
              ) : null}
            </div>
          )}
        />
      </div>

      <DialogFooter>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Button>
          )}
        />
      </DialogFooter>
    </form>
  )
}
