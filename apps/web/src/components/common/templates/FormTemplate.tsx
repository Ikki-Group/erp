import * as React from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormTemplateProps<TData extends Record<string, any>> {
  schema: z.ZodType<TData>;
  defaultValues: TData;
  onSubmit: (values: TData) => Promise<void> | void;
  renderFields: (form: any) => React.ReactNode;
  submitLabel?: string;
  className?: string;
}

export function FormTemplate<TData extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  renderFields,
  submitLabel = "Submit",
  className,
}: FormTemplateProps<TData>) {
  const form = useForm({
    defaultValues,
    // @ts-ignore
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  const formErrors = useStore(form.store, (state: any) => state.errors);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className={cn("space-y-6", className)}
    >
      <div className="space-y-4">{renderFields(form as any)}</div>

      {formErrors.length > 0 && (
        <div className="text-sm font-medium text-destructive">
          {formErrors.map((error: any) => (
            <p key={error as unknown as string}>{error as unknown as string}</p>
          ))}
        </div>
      )}

      <form.Subscribe
        selector={(state: any) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit} className="w-full">
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        )}
      />
    </form>
  );
}

// Helper component for form fields to reduce Shadcn boilerplate
interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-[0.8rem] font-medium text-destructive">{error}</p>}
    </div>
  );
}
