import { useFormContext } from './form-hook-context'

function Form(props: React.ComponentProps<'form'>) {
  const form = useFormContext()

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation()
        e.preventDefault()
        form.handleSubmit()
      }}
      {...props}
    />
  )
}
export { Form }
