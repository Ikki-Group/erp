import type { ComponentRegistry } from '../registry'

/**
 * Form Engine Registry
 * =====================
 * High-level form abstraction built on TanStack Form + Zod.
 * Provides type-safe form hooks, field components, and pre-configured elements.
 *
 * AI: Always use the Form Engine for any form. Never build raw <form> elements.
 *     Use `form.AppField` with the new "Smart" components (field.Input, field.Select, etc.)
 *     which automatically handle labels, descriptions, and error states.
 */
export const formRegistry: ComponentRegistry = {
  layer: 'form',
  title: 'Form Engine',
  description:
    'Unified, type-safe form builder system powered by TanStack Form and Zod. Provides hooks, context-aware field wrappers, and auto-configured input elements.',
  readonly: false,
  components: [
    {
      name: 'useAppForm / createFormHook',
      file: './form-hook',
      description:
        'Core form hook factory using TanStack Form. Creates type-safe form instances with Zod validation. Includes pre-bound "Smart" field components.',
      usage:
        'Use `useAppForm()` to create form instances. Access fields via `form.AppField` render props: `{(field) => <field.Input label="..." />}`.',
      importPath: '@/components/form',
      tags: ['hook', 'form', 'tanstack', 'zod', 'validation'],
      exports: ['useAppForm', 'createFormHook'],
    },
    {
      name: 'FormFieldContext',
      file: './form-hook-context',
      description: 'React context for sharing field state between form components.',
      usage: 'Internal. Use `useFieldContext()` to access field state in custom field renderers.',
      importPath: '@/components/form',
      tags: ['context', 'field', 'internal'],
      exports: ['useFieldContext'],
    },
    {
      name: 'FormTanstack (Field, FieldLabel, FieldControl, FieldError)',
      file: './form-tanstack',
      description:
        'TanStack-integrated field primitives with automatic error display, validation states, and accessibility attributes.',
      usage: 'Used by high-level field components. Standardizes ARIA attributes and error visibility logic.',
      importPath: '@/components/form/form-tanstack',
      tags: ['field', 'label', 'error', 'validation', 'accessibility'],
      exports: ['FormItem', 'Field', 'FieldLabel', 'FieldControl', 'FieldDescription', 'FieldError'],
    },
    {
      name: 'FormComponent',
      file: './form-component',
      description: 'Reusable form component wrapper and action buttons (Submit/Cancel).',
      usage: 'Use `<form.Form>` for layout and `<form.SimpleActions />` for standard save/cancel buttons.',
      importPath: '@/components/form/form-component',
      tags: ['wrapper', 'submit', 'cancel', 'actions'],
      exports: ['Form', 'FormSimpleActions', 'FormDialogActions'],
    },
    {
      name: 'FormFieldComponent',
      file: './form-field-component',
      description:
        'High-level "Smart" field components (Input, Select, Date, etc.) that automatically handle layout, labels, and error display.',
      usage:
        'Pass `label`, `description`, `required`, and `orientation` props directly to components inside `AppField`.',
      importPath: '@/components/form/form-field-component',
      tags: ['smart', 'field', 'input', 'select', 'date', 'checkbox', 'switch'],
      exports: [
        'FieldBase',
        'FieldInput',
        'FieldSelect',
        'FieldDatePicker',
        'FieldCheckbox',
        'FieldSwitch',
        'FieldNumber',
        'FieldCurrency',
        'FieldTextarea',
      ],
    },
  ],
}
