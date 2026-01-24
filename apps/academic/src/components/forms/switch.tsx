import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/lib/utils/form";

import { Switch as SwitchBase } from "@repo/ui/switch";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

export function Switch({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <SwitchBase
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
