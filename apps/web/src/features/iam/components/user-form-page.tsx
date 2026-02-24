import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { FormLayout } from '@/components/layout/form-layout'
import { Page } from '@/components/layout/page'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table } from '@/components/ui/table'
import { useLocationStore } from '@/features/location/hooks/use-location-store'
import { formOptions, useStore } from '@tanstack/react-form'
import { LinkOptions } from '@tanstack/react-router'
import { PlusIcon, ShieldAlertIcon, Trash2Icon } from 'lucide-react'
import z from 'zod'

const FormDto = z.object({
  email: z.email(),
  fullname: z.string(),
  username: z.string(),
  password: z.string(),
  isRoot: z.boolean(),
  isActive: z.boolean(),
  roles: z.array(
    z.object({
      locationId: z.string().nullable(),
      roleId: z.string(),
    }),
  ),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(): FormDto {
  return {
    email: '',
    fullname: '',
    username: '',
    password: '',
    isRoot: false,
    isActive: true,
    roles: [],
  }
}

// Mock data for roles
const MOCK_ROLES = [
  { id: 'admin', name: 'Administrator' },
  { id: 'manager', name: 'Manager' },
  { id: 'staff', name: 'Staff' },
  { id: 'cashier', name: 'Kasir' },
  { id: 'warehouse', name: 'Gudang' },
]

interface UserFormPageProps {
  mode: 'create' | 'edit'
  id?: string
  backTo?: LinkOptions
}

export function UserFormPage({ mode, id, backTo }: UserFormPageProps) {
  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      console.log('Form submitted:', value)
    },
  })

  return (
    <FormConfig mode={mode} id={id} backTo={backTo}>
      <Page>
        <Page.SimpleHeader
          title={mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
          description={
            mode === 'create' ? 'Tambah pengguna baru' : 'Edit pengguna'
          }
          back={backTo}
        />
        <form.AppForm>
          <form.Form>
            <Page.Content>
              <FormLayout>
                <div className="grid @3xl:grid-cols-[auto_350px] gap-6 grid-cols-1">
                  <UserInformationCard />
                  <StatusAndRoleCard />
                </div>
                <RoleAndLocationCard />
                <form.SimpleActions />
              </FormLayout>
            </Page.Content>
          </form.Form>
        </form.AppForm>
      </Page>
    </FormConfig>
  )
}

function UserInformationCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <Card size="sm" className="h-full">
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

function StatusAndRoleCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <Card size="sm">
      <Card.Header className="border-b">
        <Card.Title>Status & Hak Akses</Card.Title>
        <Card.Description>
          Konfigurasi status dan level akses pengguna
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-2">
        <form.AppField name="isActive">
          {(field) => (
            <field.Switch
              label="Status Aktif"
              description="Pengguna dapat login ke sistem"
            />
          )}
        </form.AppField>
        <Separator />
        <form.AppField name="isRoot">
          {(field) => (
            <field.Switch
              label="Super Admin"
              description="Akses penuh ke semua fitur dan lokasi"
            />
          )}
        </form.AppField>
      </Card.Content>
    </Card>
  )
}

function RoleAndLocationCard() {
  const form = useTypedAppFormContext({ ...fopts })
  const isRoot = useStore(form.store, (s) => s.values.isRoot)
  const { locations } = useLocationStore()

  return (
    <Card size="sm">
      <Card.Header className="border-b">
        <Card.Title>Role & Lokasi</Card.Title>
        <Card.Description>
          Konfigurasi role dan lokasi pengguna
        </Card.Description>
      </Card.Header>
      {isRoot && (
        <Card.Content>
          <Alert
            variant="destructive"
            className="border-dashed border-destructive bg-destructive/5"
          >
            <Alert.Title>
              Super Admin memiliki akses ke semua role dan lokasi
            </Alert.Title>
          </Alert>
        </Card.Content>
      )}
      {!isRoot && (
        <Card.Content className="flex flex-col gap-2">
          <div className="border rounded-md">
            <Table className="table-fixed">
              <Table.Header className="bg-muted">
                <Table.Row>
                  <Table.Head>Role</Table.Head>
                  <Table.Head>Lokasi</Table.Head>
                  <Table.Head className="w-16">Aksi</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <form.AppField name="roles" mode="array">
                  {(field) => {
                    if (field.state.value.length <= 0) {
                      return (
                        <Table.Row>
                          <Table.Cell colSpan={3} className="text-center h-32">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <ShieldAlertIcon className="size-8 opacity-50" />
                              <p>Belum ada role yang ditambahkan</p>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      )
                    }
                    return field.state.value.map((_, i) => {
                      return (
                        <Table.Row key={i}>
                          <Table.Cell>
                            <form.AppField name={`roles[${i}].roleId`}>
                              {(field) => (
                                <field.Select
                                  required
                                  placeholder="Pilih Role"
                                  options={MOCK_ROLES.map((role) => ({
                                    label: role.name,
                                    value: role.id,
                                  }))}
                                />
                              )}
                            </form.AppField>
                          </Table.Cell>
                          <Table.Cell>
                            <form.AppField name={`roles[${i}].locationId`}>
                              {(field) => (
                                <field.Select
                                  required
                                  placeholder="Pilih Lokasi"
                                  options={locations.map((location) => ({
                                    label: location.name,
                                    value: location.id,
                                  }))}
                                />
                              )}
                            </form.AppField>
                          </Table.Cell>
                          <Table.Cell>
                            <Button variant="destructive" size="icon-sm">
                              <Trash2Icon />
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      )
                    })
                  }}
                </form.AppField>
              </Table.Body>
            </Table>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            className=""
            onClick={() => {
              form.pushFieldValue('roles', { locationId: null!, roleId: null! })
            }}
          >
            <PlusIcon />
            Tambah Role & Lokasi
          </Button>
        </Card.Content>
      )}
    </Card>
  )
}
