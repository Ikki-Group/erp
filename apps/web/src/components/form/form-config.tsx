import { createContext, use } from 'react'
import type { PropsWithChildren } from 'react'
import type { LinkOptions } from '@tanstack/react-router'

export type FormConfigProps = {
  mode: 'create' | 'update'
  id?: number
  backTo?: LinkOptions
}

// eslint-disable-next-line @eslint-react/naming-convention/context-name
const Ctx = createContext<FormConfigProps | null>(null)

export function FormConfig({
  children,
  ...props
}: PropsWithChildren<FormConfigProps>) {
  return <Ctx.Provider value={props}>{children}</Ctx.Provider>
}

export function useFormConfig(): FormConfigProps {
  const ctx = use(Ctx)
  if (!ctx) {
    throw new Error('useFormConfig must be used within <form.Config>')
  }

  return ctx
}
