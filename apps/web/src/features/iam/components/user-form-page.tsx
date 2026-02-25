import { CardSection } from '@/components/card/card-section'
import {
  FormConfig,
  useAppForm,
  useFormConfig,
  useTypedAppFormContext,
} from '@/components/form'
import { Page } from '@/components/layout/page'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LinkOptions, useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { userApi } from '../api'
import { toast } from 'sonner'
import { UserDto } from '../dto'
import { toastLabelMessage } from '@/lib/toast-message'

const FormDto = z.object({
  fullname: z.string().min(1),
  username: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).optional(),
  isRoot: z.boolean(),
  isActive: z.boolean(),
  assignments: z.array(
    z.object({
      locationId: z.string(),
      roleId: z.string(),
    }),
  ),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: UserDto): FormDto {
  return {
    email: v?.email ?? '',
    fullname: v?.fullname ?? '',
    username: v?.username ?? '',
    password: v ? undefined : '',
    isRoot: v?.isRoot ?? false,
    isActive: v?.isActive ?? true,
    assignments: [],
  }
}

interface UserFormPageProps {
  mode: 'create' | 'update'
  id?: string
  backTo?: LinkOptions
}

export function UserFormPage({ mode, id, backTo }: UserFormPageProps) {
  const navigate = useNavigate()
  const selectedUser = useQuery({
    ...userApi.detail.query({ id: Number(id) }),
    enabled: !!id,
  })

  const create = useMutation({ mutationFn: userApi.create.mutationFn })
  const update = useMutation({ mutationFn: userApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedUser.data?.data),
    onSubmit: async ({ value }) => {
      const promise = selectedUser.data?.data
        ? update.mutateAsync({
            body: {
              id: selectedUser.data.data.id,
              ...value,
            },
          })
        : create.mutateAsync({
            body: {
              ...value,
              password: value.password ?? '',
            },
          })

      await toast.promise(promise, toastLabelMessage(mode, 'pengguna')).unwrap()

      if (backTo) {
        navigate({ ...backTo, replace: true })
      }
    },
  })

  return (
    <form.AppForm>
      <FormConfig mode={mode} id={id} backTo={backTo}>
        <Page size="sm">
          <Page.BlockHeader
            title={mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
            back={backTo}
          />
          <form.Form>
            <Page.Content className="gap-6 flex flex-col">
              <UserInformationCard />
              <StatusAndRoleCard />
              {/* <RoleAndLocationCard /> */}
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

function UserInformationCard() {
  const form = useTypedAppFormContext({ ...fopts })
  const isCreate = useFormConfig().mode === 'create'

  return (
    <CardSection title="Informasi Akun">
      <form.AppField name="fullname">
        {(field) => (
          <field.Base label="Nama Lengkap" required>
            <field.Input placeholder="John Doe" />
          </field.Base>
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <field.Base label="Email" required>
            <field.Input type="email" placeholder="user@example.com" />
          </field.Base>
        )}
      </form.AppField>
      <form.AppField name="username">
        {(field) => (
          <field.Base label="Username" required>
            <field.Input placeholder="username" />
          </field.Base>
        )}
      </form.AppField>
      {isCreate && (
        <form.AppField name="password">
          {(field) => (
            <field.Base label="Password" required>
              <field.Input
                type="password"
                autoComplete="off"
                placeholder="••••••••"
              />
            </field.Base>
          )}
        </form.AppField>
      )}
    </CardSection>
  )
}

function StatusAndRoleCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <Card size="sm">
      <Card.Header className="border-b">
        <Card.Title>Status & Hak Akses</Card.Title>
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

// function RoleAndLocationCard() {
//   const form = useTypedAppFormContext({ ...fopts })
//   const isRoot = useStore(form.store, (s) => s.values.isRoot)
//   const locations = []

//   return (
//     <Card size="sm">
//       <Card.Header className="border-b">
//         <Card.Title>Role & Lokasi</Card.Title>
//         <Card.Description>
//           Konfigurasi role dan lokasi pengguna
//         </Card.Description>
//       </Card.Header>
//       {isRoot && (
//         <Card.Content>
//           <Alert
//             variant="destructive"
//             className="border-dashed border-destructive bg-destructive/5"
//           >
//             <Alert.Title>
//               Super Admin memiliki akses ke semua role dan lokasi
//             </Alert.Title>
//           </Alert>
//         </Card.Content>
//       )}
//       {!isRoot && (
//         <Card.Content className="flex flex-col gap-2">
//           <div className="border rounded-md">
//             <Table className="table-fixed">
//               <Table.Header className="bg-muted">
//                 <Table.Row>
//                   <Table.Head>Role</Table.Head>
//                   <Table.Head>Lokasi</Table.Head>
//                   <Table.Head className="w-16">Aksi</Table.Head>
//                 </Table.Row>
//               </Table.Header>
//               <Table.Body>
//                 <form.AppField name="roles" mode="array">
//                   {(field) => {
//                     if (field.state.value.length <= 0) {
//                       return (
//                         <Table.Row>
//                           <Table.Cell colSpan={3} className="text-center h-32">
//                             <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
//                               <ShieldAlertIcon className="size-8 opacity-50" />
//                               <p>Belum ada role yang ditambahkan</p>
//                             </div>
//                           </Table.Cell>
//                         </Table.Row>
//                       )
//                     }
//                     return field.state.value.map((_, i) => {
//                       return (
//                         <Table.Row key={i}>
//                           <Table.Cell>
//                             <form.AppField name={`roles[${i}].roleId`}>
//                               {(field) => (
//                                 <field.Select
//                                   required
//                                   placeholder="Pilih Role"
//                                   options={MOCK_ROLES.map((role) => ({
//                                     label: role.name,
//                                     value: role.id,
//                                   }))}
//                                 />
//                               )}
//                             </form.AppField>
//                           </Table.Cell>
//                           <Table.Cell>
//                             <form.AppField name={`roles[${i}].locationId`}>
//                               {(field) => (
//                                 <field.Select
//                                   required
//                                   placeholder="Pilih Lokasi"
//                                   options={locations.map((location) => ({
//                                     label: location.name,
//                                     value: location.id,
//                                   }))}
//                                 />
//                               )}
//                             </form.AppField>
//                           </Table.Cell>
//                           <Table.Cell>
//                             <Button variant="destructive" size="icon-sm">
//                               <Trash2Icon />
//                             </Button>
//                           </Table.Cell>
//                         </Table.Row>
//                       )
//                     })
//                   }}
//                 </form.AppField>
//               </Table.Body>
//             </Table>
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             type="button"
//             className=""
//             onClick={() => {
//               form.pushFieldValue('roles', { locationId: null!, roleId: null! })
//             }}
//           >
//             <PlusIcon />
//             Tambah Role & Lokasi
//           </Button>
//         </Card.Content>
//       )}
//     </Card>
//   )
// }
