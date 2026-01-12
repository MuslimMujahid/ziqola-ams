import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/lib/utils/form";

import { Textarea as TextareaBase } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

export function TextArea({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <TextareaBase
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
