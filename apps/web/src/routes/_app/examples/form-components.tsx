import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  Form,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSubmit,
  useForm,
} from '@/components/common/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_app/examples/form-components')({
  component: FormComponentsExample,
})

// Schema untuk validasi form
// const formSchema = z.object({
//   // Text inputs
//   fullName: z.string().min(3, "Nama minimal 3 karakter"),
//   email: z.string().email("Email tidak valid"),
//   phone: z.string().min(10, "Nomor telepon minimal 10 digit"),

//   // Textarea
//   bio: z.string().min(10, "Bio minimal 10 karakter").max(500, "Bio maksimal 500 karakter"),

//   // Select
//   country: z.string().min(1, "Pilih negara"),
//   role: z.string().min(1, "Pilih role"),

//   // Checkboxes
//   newsletter: z.boolean(),
//   terms: z.boolean().refine((val) => val === true, {
//     message: "Anda harus menyetujui syarat dan ketentuan",
//   }),

//   // Number input
//   age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 18, {
//     message: "Umur minimal 18 tahun",
//   }),
// });

function FormComponentsExample() {
  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      bio: '',
      country: '',
      role: '',
      newsletter: false,
      terms: false,
      age: '',
    },
    onSubmit: async ({ value }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log('Form submitted:', value)

      toast.success('Form berhasil disubmit!', {
        description: 'Data telah disimpan ke console.',
      })
    },
  })

  const countryOptions = [
    { value: 'id', label: 'Indonesia' },
    { value: 'my', label: 'Malaysia' },
    { value: 'sg', label: 'Singapore' },
    { value: 'th', label: 'Thailand' },
    { value: 'ph', label: 'Philippines' },
  ]

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'user', label: 'User' },
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Form Components Example
          </h1>
          <p className="text-muted-foreground mt-2">
            Demonstrasi penggunaan semua komponen form dengan Tanstack Form dan
            Zod validation
          </p>
        </div>

        <Separator />

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Form Example</CardTitle>
            <CardDescription>
              Form ini mendemonstrasikan semua komponen: Input, Textarea,
              Select, dan Checkbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form form={form} className="space-y-6">
              {/* Section: Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                {/* FormInput - Text */}
                <FormInput
                  form={form}
                  name="fullName"
                  label="Full Name"
                  placeholder="John Doe"
                  description="Masukkan nama lengkap Anda"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .min(3, 'Nama minimal 3 karakter')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />

                {/* FormInput - Email */}
                <FormInput
                  form={form}
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="john.doe@example.com"
                  description="Email akan digunakan untuk login"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .email('Email tidak valid')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />

                {/* FormInput - Phone */}
                <FormInput
                  form={form}
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="08123456789"
                  description="Nomor telepon aktif"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .min(10, 'Nomor telepon minimal 10 digit')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />

                {/* FormInput - Number */}
                <FormInput
                  form={form}
                  name="age"
                  label="Age"
                  type="number"
                  placeholder="25"
                  description="Umur minimal 18 tahun"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .refine(
                          (val) => !isNaN(Number(val)) && Number(val) >= 18,
                          {
                            message: 'Umur minimal 18 tahun',
                          },
                        )
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />
              </div>

              <Separator />

              {/* Section: Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>

                {/* FormTextarea */}
                <FormTextarea
                  form={form}
                  name="bio"
                  label="Bio"
                  placeholder="Ceritakan tentang diri Anda..."
                  description="Minimal 10 karakter, maksimal 500 karakter"
                  rows={4}
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .min(10, 'Bio minimal 10 karakter')
                        .max(500, 'Bio maksimal 500 karakter')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />

                {/* FormSelect - Country */}
                <FormSelect
                  form={form}
                  name="country"
                  label="Country"
                  options={countryOptions}
                  placeholder="Pilih negara"
                  description="Negara tempat tinggal"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .min(1, 'Pilih negara')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />

                {/* FormSelect - Role */}
                <FormSelect
                  form={form}
                  name="role"
                  label="Role"
                  options={roleOptions}
                  placeholder="Pilih role"
                  description="Role dalam sistem"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .string()
                        .min(1, 'Pilih role')
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />
              </div>

              <Separator />

              {/* Section: Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preferences</h3>

                {/* FormCheckbox - Newsletter */}
                <FormCheckbox
                  form={form}
                  name="newsletter"
                  label="Subscribe to newsletter"
                  description="Dapatkan update terbaru via email"
                />

                {/* FormCheckbox - Terms (Required) */}
                <FormCheckbox
                  form={form}
                  name="terms"
                  label="I agree to the terms and conditions"
                  description="Anda harus menyetujui syarat dan ketentuan untuk melanjutkan"
                  validators={{
                    onChange: ({ value }: { value: any }) => {
                      const result = z
                        .boolean()
                        .refine((val) => val === true, {
                          message: 'Anda harus menyetujui syarat dan ketentuan',
                        })
                        .safeParse(value)
                      return result.success
                        ? undefined
                        : result.error.issues[0].message
                    },
                  }}
                />
              </div>

              <Separator />

              {/* Submit Button */}
              <FormSubmit
                form={form}
                className="w-full"
                loadingText="Menyimpan..."
              >
                Submit Form
              </FormSubmit>
            </Form>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
            <CardDescription>Contoh kode untuk setiap komponen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">FormInput</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`<FormInput
  form={form}
  name="email"
  label="Email"
  type="email"
  placeholder="email@example.com"
  description="Your email address"
/>`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">FormTextarea</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`<FormTextarea
  form={form}
  name="bio"
  label="Bio"
  placeholder="Tell us about yourself..."
  rows={4}
/>`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">FormSelect</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`<FormSelect
  form={form}
  name="country"
  label="Country"
  options={[
    { value: 'id', label: 'Indonesia' },
    { value: 'my', label: 'Malaysia' },
  ]}
  placeholder="Select country"
/>`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">FormCheckbox</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`<FormCheckbox
  form={form}
  name="newsletter"
  label="Subscribe to newsletter"
  description="Get updates via email"
/>`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">FormSubmit</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {`<FormSubmit
  form={form}
  loadingText="Submitting..."
>
  Submit
</FormSubmit>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
