import type { ComponentRegistry } from '../registry'

/**
 * Form Engine Registry
 * =====================
 * High-level form abstraction built on TanStack Form + Zod.
 * Provides type-safe form hooks, field components, and pre-configured elements.
 *
 * AI: Always use the Form Engine for any form. Never build raw <form> elements.
 *     Check `form-elements.tsx` for pre-built field types before creating custom ones.
 */
export const formRegistry: ComponentRegistry = {
  layer: 'form',
  title: 'Form Engine',
  description: 'Type-safe form builder system powered by TanStack Form and Zod. Provides hooks, context, field wrappers, and pre-configured input elements.',
  readonly: false,
  components: [
    {
      name: 'useAppForm / createFormHook',
      file: './form-hook',
      description: 'Core form hook factory using TanStack Form. Creates type-safe form instances with Zod validation.',
      usage: 'Use `useAppForm()` to create form instances in feature components. Connects to the form context system.',
      importPath: '@/components/form',
      tags: ['hook', 'form', 'tanstack', 'zod', 'validation'],
      exports: ['useAppForm', 'createFormHook'],
    },
    {
      name: 'FormFieldContext',
      file: './form-hook-context',
      description: 'React context for sharing field state between form components.',
      usage: 'Consumed internally by form field components. Use `useFieldContext()` to access field state in custom field renderers.',
      importPath: '@/components/form',
      tags: ['context', 'field', 'internal'],
      exports: ['useFieldContext'],
    },
    {
      name: 'FormTanstack (Field, FieldLabel, FieldControl, FieldError)',
      file: './form-tanstack',
      description: 'TanStack-integrated field primitives with automatic error display, validation states, and accessibility attributes.',
      usage: 'Use `<Field>` to wrap custom field inputs. `<FieldLabel>` auto-connects to field IDs. `<FieldError>` auto-reads validation errors.',
      importPath: '@/components/form/form-tanstack',
      tags: ['field', 'label', 'error', 'validation', 'accessibility'],
      exports: ['FormItem', 'Field', 'FieldLabel', 'FieldControl', 'FieldDescription', 'FieldError'],
    },
    {
      name: 'FormElements (FormInput, FormSelect, FormCheckbox, etc.)',
      file: './form-elements',
      description: 'Pre-configured form field components that combine the Form Engine with Shadcn UI inputs. Includes Input, Textarea, Select, Checkbox, Combobox, and Submit button.',
      usage: 'Use these for rapid form building. Example: `<FormInput form={form} name="email" label="Email" />`. Prefer these over manually wiring field state.',
      importPath: '@/components/form/form-elements',
      tags: ['input', 'select', 'checkbox', 'textarea', 'combobox', 'submit', 'pre-configured'],
      exports: ['Form', 'FormField', 'FormInput', 'FormTextarea', 'FormSelect', 'FormCheckbox', 'FormCombobox', 'FormSubmit'],
    },
    {
      name: 'FormComponent',
      file: './form-component',
      description: 'Reusable form component wrapper that provides standard form layout with submit/cancel actions.',
      usage: 'Use to wrap entire forms with consistent submit/cancel button placement.',
      importPath: '@/components/form/form-component',
      tags: ['wrapper', 'submit', 'cancel', 'actions'],
      exports: ['FormComponent'],
    },
    {
      name: 'FormFieldComponent',
      file: './form-field-component',
      description: 'Advanced field component with support for dynamic field types (text, number, select, date, etc.).',
      usage: 'Use when you need a single component that can render different field types based on configuration.',
      importPath: '@/components/form/form-field-component',
      tags: ['dynamic', 'field', 'configurable', 'advanced'],
      exports: ['FormFieldComponent'],
    },
  ],
}
