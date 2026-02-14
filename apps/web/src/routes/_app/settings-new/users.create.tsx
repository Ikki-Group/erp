import { useAppForm, useTypedAppFormContext } from '@/components/form'
import { FormLayout } from '@/components/layout/form-layout'
import { Page } from '@/components/layout/page'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table } from '@/components/ui/table'
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
          <FormLayout>
            <FormLayout.Grid>
              <UserInformationCard />
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
                      <field.Switch
                        label="Status Aktif"
                        description="Pengguna dapat login ke sisten"
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="isRoot">
                    {(field) => (
                      <field.Switch
                        label="Super Admin"
                        description="Akses penuh ke semua fitur dan lokasi"
                      />
                    )}
                  </form.AppField>
                  <form.Subscribe selector={(state) => state.values.isRoot}>
                    {(isRoot) => (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Role & Lokasi
                        </Label>
                        {isRoot ? (
                          <Alert
                            variant="destructive"
                            className="border-dashed border-destructive bg-destructive/5"
                          >
                            <Alert.Title>
                              Super Admin memiliki akses ke semua role dan
                              lokasi
                            </Alert.Title>
                          </Alert>
                        ) : (
                          <>
                            <div className="rounded-md border">
                              <Table>
                                <Table.Header>
                                  <Table.Row>
                                    <Table.Head>Role</Table.Head>
                                    <Table.Head>Lokasi</Table.Head>
                                    <Table.Head className="w-[50px]"></Table.Head>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  <form.Subscribe
                                    selector={(state) => state.values.roles}
                                  >
                                    {(roles) => (
                                      <>
                                        {roles.map((_, index) => (
                                          <Table.Row key={index}>
                                            <Table.Cell className="min-w-[200px]">
                                              <form.AppField
                                                name={
                                                  `roles[${index}].roleId` as any
                                                }
                                              >
                                                {(field) => (
                                                  <field.Select
                                                    placeholder="Pilih Role"
                                                    options={MOCK_ROLES.map(
                                                      (role) => ({
                                                        label: role.name,
                                                        value: role.id,
                                                      }),
                                                    )}
                                                  />
                                                )}
                                              </form.AppField>
                                            </Table.Cell>
                                            <Table.Cell className="min-w-[200px]">
                                              <form.AppField
                                                name={
                                                  `roles[${index}].locationId` as any
                                                }
                                              >
                                                {(field) => (
                                                  <field.Select
                                                    placeholder="Semua Lokasi"
                                                    options={[
                                                      {
                                                        label: 'Semua Lokasi',
                                                        value: '',
                                                      },
                                                      ...locations.map(
                                                        (loc) => ({
                                                          label: loc.name,
                                                          value: loc.id,
                                                        }),
                                                      ),
                                                    ]}
                                                  />
                                                )}
                                              </form.AppField>
                                            </Table.Cell>
                                            <Table.Cell>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const currentRoles =
                                                    form.getFieldValue(
                                                      'roles' as any,
                                                    ) as unknown as FormValues['roles']
                                                  ;(form.setFieldValue as any)(
                                                    'roles',
                                                    currentRoles.filter(
                                                      (_: any, i: number) =>
                                                        i !== index,
                                                    ),
                                                  )
                                                }}
                                              >
                                                ✕
                                              </Button>
                                            </Table.Cell>
                                          </Table.Row>
                                        ))}
                                        {roles.length === 0 && (
                                          <Table.Row>
                                            <Table.Cell
                                              colSpan={3}
                                              className="text-center text-muted-foreground bg-muted/20 h-24"
                                            >
                                              Belum ada role yang ditambahkan
                                            </Table.Cell>
                                          </Table.Row>
                                        )}
                                      </>
                                    )}
                                  </form.Subscribe>
                                </Table.Body>
                              </Table>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
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
                      </div>
                    )}
                  </form.Subscribe>
                </Card.Content>
              </Card>
            </FormLayout.Grid>

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
          </FormLayout>
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
            <field.Input
              label="Email"
              required
              type="email"
              placeholder="user@example.com"
            />
          )}
        </form.AppField>

        <form.AppField name="username">
          {(field) => (
            <field.Input label="Username" required placeholder="username" />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.Input
              label="Password"
              required
              type="password"
              placeholder="••••••••"
            />
          )}
        </form.AppField>

        <form.AppField name="fullname">
          {(field) => (
            <field.Input label="Nama Lengkap" required placeholder="John Doe" />
          )}
        </form.AppField>
      </Card.Content>
    </Card>
  )
}
