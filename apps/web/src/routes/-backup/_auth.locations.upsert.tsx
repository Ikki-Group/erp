import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { MapPin, ArrowLeft, Save, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useLocation,
  useCreateLocation,
  useUpdateLocation,
} from '@/features/locations/hooks/locations.hooks'

export const Route = createFileRoute('/_auth/locations/upsert')({
  component: LocationUpsertPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: search.id ? Number(search.id) : undefined,
    }
  },
})

function LocationUpsertPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: location, isLoading: isLoadingDetail } = useLocation(id!)
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()

  const form = useForm({
    defaultValues: {
      code: '',
      name: '',
      type: 'store' as 'store' | 'warehouse' | 'central_warehouse',
      description: '',
    },
    onSubmit: async ({ value }) => {
      if (id) {
        await updateLocation.mutateAsync({ id, ...value })
      } else {
        await createLocation.mutateAsync(value)
      }
      navigate({ to: '/locations' })
    },
  })

  // Set form defaults when location data is loaded
  React.useEffect(() => {
    if (location) {
      form.setFieldValue('code', location.code)
      form.setFieldValue('name', location.name)
      form.setFieldValue('type', location.type)
      form.setFieldValue('description', location.description ?? '')
    }
  }, [location, form])

  if (id && isLoadingDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading location details...
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? 'Edit Location' : 'Add Location'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {id
                ? 'Update location details in your system.'
                : 'Create a new location for your operations.'}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="grid gap-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location Information
              </CardTitle>
              <CardDescription>
                Essential details about this store or warehouse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="code"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(2, 'Code must be at least 2 characters')
                        .safeParse(value)
                      return res.success
                        ? undefined
                        : res.error.issues[0].message
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Location Code</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. WH-JKT-01"
                        className={
                          field.state.meta.errors.length
                            ? 'border-destructive'
                            : ''
                        }
                      />
                      {field.state.meta.errors ? (
                        <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                          {field.state.meta.errors.join(', ')}
                        </em>
                      ) : null}
                    </div>
                  )}
                />

                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      const res = z
                        .string()
                        .min(2, 'Name must be at least 2 characters')
                        .safeParse(value)
                      return res.success
                        ? undefined
                        : res.error.issues[0].message
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Location Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Jakarta Central Warehouse"
                        className={
                          field.state.meta.errors.length
                            ? 'border-destructive'
                            : ''
                        }
                      />
                      {field.state.meta.errors ? (
                        <em className="text-[10px] text-destructive font-medium uppercase tracking-wider not-italic">
                          {field.state.meta.errors.join(', ')}
                        </em>
                      ) : null}
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="type"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="store">Store</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="central_warehouse">
                          Central Warehouse
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional description of the location..."
                      rows={4}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/locations' })}
              disabled={createLocation.isPending || updateLocation.isPending}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={
                    !canSubmit ||
                    isSubmitting ||
                    createLocation.isPending ||
                    updateLocation.isPending
                  }
                  className="min-w-[120px] shadow-lg shadow-primary/20"
                >
                  {isSubmitting ||
                  createLocation.isPending ||
                  updateLocation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {id ? 'Update Location' : 'Save Location'}
                    </>
                  )}
                </Button>
              )}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
