import { createFormHookContexts } from '@tanstack/react-form'

/**
 * Shared field/form contexts. Created once — every field component in
 * `@/lib/form/fields` and every consumer of `useAppForm` reads from these.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts()
