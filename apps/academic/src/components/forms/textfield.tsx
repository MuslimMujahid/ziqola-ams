import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/lib/utils/form";

import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

export function TextField({
  label,
  placeholder,
  type = "text",
  id,
  disabled,
  step,
  min,
  max,
  inputMode,
  pattern,
  lang,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  id?: string;
  disabled?: boolean;
  step?: number;
  min?: string;
  max?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  lang?: string;
}) {
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
        type={type}
        value={field.state.value}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        inputMode={inputMode}
        pattern={pattern}
        lang={lang}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
