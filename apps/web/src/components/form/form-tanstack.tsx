import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import * as scn from "@/components/ui/field";

import { cn } from "@/lib/utils";
import { useFieldContext } from "./form-hook-context";
import { useStore } from "@tanstack/react-form";

function useFormField() {
  const itemContext = React.useContext(FormItemContext);
  const fieldContext = useFieldContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <field.Container>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldContext.state.meta,
  };
}

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.ComponentProps<typeof scn.Field>) {
  const id = React.useId();
  const field = useFieldContext();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isTouched = useStore(field.store, (state) => state.meta.isTouched);
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const showError = isTouched || submissionAttempts > 0;
  const hasError = showError && errors.length > 0;

  return (
    <FormItemContext.Provider value={{ id }}>
      <scn.Field
        data-slot="form-item"
        data-invalid={hasError ? "true" : undefined}
        className={className}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FieldLabel({
  className,
  required,
  ...props
}: React.ComponentProps<typeof scn.FieldLabel> & {
  required?: boolean;
}) {
  const { formItemId, isValid } = useFormField();

  return (
    <scn.FieldLabel
      data-error={!isValid}
      htmlFor={formItemId}
      aria-required={required}
      className={cn(
        "data-[error=true]:text-destructive",
        required && "after:text-destructive after:content-['*'] after:-ml-1 after:font-bold",
        className,
      )}
      {...props}
    />
  );
}

function FieldControl({ children = <div /> }: { children?: useRender.RenderProp }) {
  const { formItemId, isValid, formDescriptionId, formMessageId } = useFormField();

  return useRender({
    render: children,
    props: {
      "data-slot": "field-control",
      id: formItemId,
      "aria-describedby": isValid
        ? `${formDescriptionId}`
        : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !isValid,
    },
  });
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <scn.FieldDescription
      data-slot="form-description"
      id={formDescriptionId}
      className={className}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<typeof scn.FieldError>) {
  const { formMessageId, isValid, errors } = useFormField();

  if (props.children) return props.children;

  const body = isValid
    ? props.children
    : String(errors.map((error) => error.message).join(", ") ?? "");

  if (!body) return null;

  return (
    <scn.FieldError data-slot="form-message" id={formMessageId} className={className} {...props}>
      {body}
    </scn.FieldError>
  );
}

export {
  useFieldContext,
  FormItem,
  FormItem as Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  useFormField,
};
