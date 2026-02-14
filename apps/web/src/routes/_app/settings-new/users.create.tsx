import { useAppForm } from '@/components/form'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formOptions } from '@tanstack/react-form'
import { createFileRoute, linkOptions } from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute('/_app/settings-new/users/create')({
  component: RouteComponent,
})

const back = linkOptions({
  from: Route.fullPath,
  to: '/settings-new',
  replace: true,
})

function RouteComponent() {
  return (
    <Page>
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
  name: z.string().min(3),
  email: z.string(),
  role: z.string(),
})

const fopts = formOptions({
  validators: { onSubmit: FormDto },
})

function Form() {
  const form = useAppForm({
    ...fopts,
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
  })

  return (
    <form.AppForm>
      <form.Form>
        <Page.Content>
          <Card size="sm">
            <Card.Header className="border-b">
              <Card.Title className="">Form Pengguna</Card.Title>
            </Card.Header>
            <Card.Content>
              <form.AppField name="name">
                {(field) => (
                  <form.Item>
                    <field.Label required>Nama</field.Label>
                    <field.Input />
                    <field.Error />
                  </form.Item>
                )}
              </form.AppField>
            </Card.Content>
            <Card.Footer className="gap-2 justify-end">
              <Button variant="outline">Batal</Button>
              <Button type="submit">Simpan</Button>
            </Card.Footer>
          </Card>
        </Page.Content>
      </form.Form>
    </form.AppForm>
  )
}
