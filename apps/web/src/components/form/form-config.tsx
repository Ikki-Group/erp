import { LinkOptions } from '@tanstack/react-router'
import { createContext, useContext, type PropsWithChildren } from 'react'

export type FormConfigProps = {
  mode: 'create' | 'edit'
  id?: string
  backTo?: LinkOptions
}

const Ctx = createContext<FormConfigProps | null>(null)

export function FormConfig({
  children,
  ...props
}: PropsWithChildren<FormConfigProps>) {
  return <Ctx.Provider value={props}>{children}</Ctx.Provider>
}

export function useFormConfig(): FormConfigProps {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('useFormConfig must be used within <form.Config>')
  }

  return ctx
}
