import React from "react";
import { useStore } from "@tanstack/react-form";

import { useFieldContext } from "@/lib/utils/form";
import { cn } from "@/lib/utils";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

type DateFieldProps = {
  label: string;
  id?: string;
  disabled?: boolean;
  showErrors?: boolean;
  inputClassName?: string;
  ariaInvalid?: boolean;
};

export function DateField({
  label,
  id,
  disabled,
  showErrors = true,
  inputClassName,
  ariaInvalid,
}: DateFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const inputId = id ?? label;

  return (
    <div>
      <Label htmlFor={inputId} className="mb-2 text-sm font-medium">
        {label}
      </Label>
      <Input
        id={inputId}
        type="date"
        value={field.state.value}
        disabled={disabled}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        className={cn(inputClassName)}
        aria-invalid={ariaInvalid}
      />
      {showErrors && field.state.meta.isTouched ? (
        <ErrorMessages errors={errors} />
      ) : null}
    </div>
  );
}
