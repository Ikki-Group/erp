import { useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useLocationStore } from '@/features/locations/hooks/use-location-store'
import { formOptions } from '@tanstack/react-form'
import { createFileRoute, linkOptions } from '@tanstack/react-router'
import { toast } from 'sonner'
import z from 'zod'

export const Route = createFileRoute('/_app/settings-new/users/create')({
  component: RouteComponent,
})

const back = linkOptions({
  from: Route.fullPath,
  to: '/settings-new',
  replace: true,
})

// Mock data for roles
const MOCK_ROLES = [
  { id: 'admin', name: 'Administrator' },
  { id: 'manager', name: 'Manager' },
  { id: 'staff', name: 'Staff' },
  { id: 'cashier', name: 'Kasir' },
  { id: 'warehouse', name: 'Gudang' },
]

function RouteComponent() {
  return (
    <Page size="sm">
      <Page.SimpleHeader
        title="Tambah Pengguna"
        description="Tambahkan pengguna baru ke dalam sistem."
        back={back}
      />
      <Form />
    </Page>
  )
}

const FormDto = z.object({
  email: z.email('Email tidak valid'),
  fullname: z.string().min(3, 'Nama minimal 3 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(3, 'Password minimal 3 karakter'),
  isRoot: z.boolean(),
  isActive: z.boolean(),
  // Disable is root = true
  roles: z.array(
    z.object({
      locationId: z.string().nullable(),
      roleId: z.string(),
    }),
  ),
})

type FormValues = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
})

function Form() {
  const { locations } = useLocationStore()

  const form = useAppForm({
    ...fopts,
    defaultValues: {
      email: '',
      fullname: '',
      username: '',
      password: '',
      isRoot: false,
      isActive: true,
      roles: [],
    } as FormValues,
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Form submitted:', value)
      toast.success('Pengguna berhasil ditambahkan!', {
        description: `${value.fullname} telah ditambahkan ke sistem.`,
      })
    },
  })

  return (
    <form.AppForm>
      <form.Form>
        <Page.Content>
          <div className="grid gap-6 lg:grid-cols-2">
            <UserInformationCard />
            {/* Status & Hak Akses */}
            <Card size="sm">
              <Card.Header className="border-b">
                <Card.Title>Status & Hak Akses</Card.Title>
                <Card.Description>
                  Konfigurasi status dan level akses pengguna
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-4">
                <form.AppField name="isActive">
                  {(field) => (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Status Aktif
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Pengguna dapat login ke sistem
                        </p>
                      </div>
                      <field.Switch />
                    </div>
                  )}
                </form.AppField>

                <form.AppField name="isRoot">
                  {(field) => (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Super Admin
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Akses penuh ke semua fitur dan lokasi
                        </p>
                      </div>
                      <field.Switch />
                    </div>
                  )}
                </form.AppField>

                <form.Subscribe selector={(state) => state.values.isRoot}>
                  {(isRoot) => (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Role & Lokasi
                      </Label>
                      {isRoot ? (
                        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                          Super Admin memiliki akses ke semua role dan lokasi
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <form.Subscribe
                            selector={(state) => state.values.roles}
                          >
                            {(roles) => (
                              <>
                                {roles.map((_, index) => (
                                  <div
                                    key={index}
                                    className="flex gap-2 rounded-lg border p-3"
                                  >
                                    <div className="flex-1 space-y-2">
                                      <form.AppField
                                        name={`roles[${index}].roleId` as any}
                                      >
                                        {(field) => (
                                          <div className="space-y-1">
                                            <Label className="text-xs">
                                              Role
                                            </Label>
                                            <select
                                              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                              value={String(
                                                field.state.value || '',
                                              )}
                                              onChange={(e) =>
                                                (field.handleChange as any)(
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              <option value="">
                                                Pilih Role
                                              </option>
                                              {MOCK_ROLES.map((role) => (
                                                <option
                                                  key={role.id}
                                                  value={role.id}
                                                >
                                                  {role.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </form.AppField>

                                      <form.AppField
                                        name={
                                          `roles[${index}].locationId` as any
                                        }
                                      >
                                        {(field) => (
                                          <div className="space-y-1">
                                            <Label className="text-xs">
                                              Lokasi
                                            </Label>
                                            <select
                                              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                              value={String(
                                                field.state.value || '',
                                              )}
                                              onChange={(e) =>
                                                (field.handleChange as any)(
                                                  e.target.value || null,
                                                )
                                              }
                                            >
                                              <option value="">
                                                Semua Lokasi
                                              </option>
                                              {locations.map((loc) => (
                                                <option
                                                  key={loc.id}
                                                  value={loc.id}
                                                >
                                                  {loc.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </form.AppField>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto px-2"
                                      onClick={() => {
                                        const currentRoles = form.getFieldValue(
                                          'roles' as any,
                                        ) as unknown as FormValues['roles']
                                        ;(form.setFieldValue as any)(
                                          'roles',
                                          currentRoles.filter(
                                            (_: any, i: number) => i !== index,
                                          ),
                                        )
                                      }}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    const currentRoles = form.getFieldValue(
                                      'roles' as any,
                                    ) as unknown as FormValues['roles']
                                    ;(form.setFieldValue as any)('roles', [
                                      ...currentRoles,
                                      { roleId: '', locationId: null },
                                    ])
                                  }}
                                >
                                  + Tambah Role
                                </Button>
                              </>
                            )}
                          </form.Subscribe>
                        </div>
                      )}
                    </div>
                  )}
                </form.Subscribe>
              </Card.Content>
            </Card>
          </div>

          {/* Footer Actions */}
          <Card size="sm">
            <Card.Footer className="gap-2 justify-end">
              <Button variant="outline" type="button">
                Batal
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                )}
              </form.Subscribe>
            </Card.Footer>
          </Card>
        </Page.Content>
      </form.Form>
    </form.AppForm>
  )
}

function UserInformationCard() {
  const form = useTypedAppFormContext({ ...formOptions })

  return (
    <Card size="sm">
      <Card.Header className="border-b">
        <Card.Title>Informasi Akun</Card.Title>
        <Card.Description>Data login dan identitas pengguna</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <form.AppField name="email">
          {(field) => (
            <field.FieldBase label="Email" required>
              <field.Input type="email" placeholder="user@example.com" />
            </field.FieldBase>
          )}
        </form.AppField>

        <form.AppField name="username">
          {(field) => (
            <field.FieldBase label="Username" required>
              <field.Input placeholder="username" />
            </field.FieldBase>
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.FieldBase label="Password" required>
              <field.Input type="password" placeholder="••••••••" />
            </field.FieldBase>
          )}
        </form.AppField>

        <form.AppField name="fullname">
          {(field) => (
            <field.FieldBase label="Nama Lengkap" required>
              <field.Input placeholder="John Doe" />
            </field.FieldBase>
          )}
        </form.AppField>
      </Card.Content>
    </Card>
  )
}
