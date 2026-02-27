import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";

import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// ============================================================================
// Form Wrapper Component
// ============================================================================

interface FormProps extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  form: any;
}

function Form({ form, className, children, ...props }: FormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </form>
  );
}

// ============================================================================
// FormField Component - Generic field wrapper
// ============================================================================

interface FormFieldProps {
  form: any;
  name: string;
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  validators?: any;
  children: (field: {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    errors: Array<string>;
  }) => React.ReactNode;
}

function FormField({
  form,
  name,
  label,
  description,
  orientation = "vertical",
  validators,
  children,
}: FormFieldProps) {
  return (
    <form.Field name={name} validators={validators}>
      {(field: any) => {
        const hasErrors = field.state.meta.errors.length > 0;
        const errors = field.state.meta.errors.map((error: string) => ({
          message: error,
        }));

        return (
          <Field orientation={orientation} data-invalid={hasErrors || undefined}>
            {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
            {description && <FieldDescription>{description}</FieldDescription>}
            {children({
              value: field.state.value,
              onChange: field.handleChange,
              onBlur: field.handleBlur,
              errors: field.state.meta.errors,
            })}
            <FieldError errors={errors} />
          </Field>
        );
      }}
    </form.Field>
  );
}

// ============================================================================
// FormInput Component - Pre-configured input field
// ============================================================================

interface FormInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "name" | "value" | "onChange" | "onBlur"
> {
  form: any;
  name: string;
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  validators?: any;
}

function FormInput({
  form,
  name,
  label,
  description,
  orientation,
  validators,
  className,
  ...inputProps
}: FormInputProps) {
  return (
    <FormField
      form={form}
      name={name}
      label={label}
      description={description}
      orientation={orientation}
      validators={validators}
    >
      {({ value, onChange, onBlur, errors }) => (
        <Input
          id={name}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={errors.length > 0 || undefined}
          className={className}
          {...inputProps}
        />
      )}
    </FormField>
  );
}

// ============================================================================
// FormTextarea Component - Pre-configured textarea field
// ============================================================================

interface FormTextareaProps extends Omit<
  React.ComponentProps<typeof Textarea>,
  "name" | "value" | "onChange" | "onBlur"
> {
  form: any;
  name: string;
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  validators?: any;
}

function FormTextarea({
  form,
  name,
  label,
  description,
  orientation,
  validators,
  className,
  ...textareaProps
}: FormTextareaProps) {
  return (
    <FormField
      form={form}
      name={name}
      label={label}
      description={description}
      orientation={orientation}
      validators={validators}
    >
      {({ value, onChange, onBlur, errors }) => (
        <Textarea
          id={name}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={errors.length > 0 || undefined}
          className={className}
          {...textareaProps}
        />
      )}
    </FormField>
  );
}

// ============================================================================
// FormSelect Component - Pre-configured select field
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  form: any;
  name: string;
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  validators?: any;
  options: Array<SelectOption>;
  placeholder?: string;
  className?: string;
}

function FormSelect({
  form,
  name,
  label,
  description,
  orientation,
  validators,
  options,
  placeholder = "Select an option",
  className,
}: FormSelectProps) {
  return (
    <FormField
      form={form}
      name={name}
      label={label}
      description={description}
      orientation={orientation}
      validators={validators}
    >
      {({ value, onChange, errors }) => (
        <Select
          value={(value as string) || undefined}
          onValueChange={(newValue) => onChange(newValue || "")}
        >
          <SelectTrigger
            className={cn("w-full", className)}
            aria-invalid={errors.length > 0 || undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

// ============================================================================
// FormCheckbox Component - Pre-configured checkbox field
// ============================================================================

interface FormCheckboxProps {
  form: any;
  name: string;
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  validators?: any;
  className?: string;
}

function FormCheckbox({
  form,
  name,
  label,
  description,
  orientation = "horizontal",
  validators,
  className,
}: FormCheckboxProps) {
  return (
    <FormField
      form={form}
      name={name}
      label={label}
      description={description}
      orientation={orientation}
      validators={validators}
    >
      {({ value, onChange, onBlur, errors }) => (
        <Checkbox
          id={name}
          checked={value as boolean}
          onCheckedChange={(checked) => onChange(checked)}
          onBlur={onBlur}
          aria-invalid={errors.length > 0 || undefined}
          className={className}
        />
      )}
    </FormField>
  );
}

// ============================================================================
// FormSubmit Component - Submit button with form state awareness
// ============================================================================

interface FormSubmitProps extends Omit<React.ComponentProps<typeof Button>, "type"> {
  form: any;
  loadingText?: string;
}

function FormSubmit({
  form,
  children = "Submit",
  loadingText = "Submitting...",
  disabled,
  ...buttonProps
}: FormSubmitProps) {
  return (
    <form.Subscribe
      selector={(state: any) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }: { canSubmit: boolean; isSubmitting: boolean }) => (
        <Button type="submit" disabled={!canSubmit || disabled} {...buttonProps}>
          {isSubmitting ? loadingText : children}
        </Button>
      )}
    </form.Subscribe>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSubmit,
  useForm,
  zodValidator,
  type SelectOption,
};
