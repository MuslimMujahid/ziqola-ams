import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/lib/utils/form";
import * as SelectBase from "@repo/ui/select";

import { ErrorMessages } from "@/components/ui";
import { Label } from "@repo/ui/label";

export function Select({
  label,
  values,
  placeholder,
  id,
}: {
  label: string;
  values: Array<{ label: string; value: string }>;
  placeholder?: string;
  id?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const inputId = id ?? label;

  return (
    <div>
      <SelectBase.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <Label htmlFor={inputId} className="mb-2 text-sm font-medium">
          {label}
        </Label>
        <SelectBase.SelectTrigger className="w-full">
          <SelectBase.SelectValue placeholder={placeholder} />
        </SelectBase.SelectTrigger>
        <SelectBase.SelectContent>
          <SelectBase.SelectGroup>
            <SelectBase.SelectLabel>{label}</SelectBase.SelectLabel>
            {values.map((value) => (
              <SelectBase.SelectItem key={value.value} value={value.value}>
                {value.label}
              </SelectBase.SelectItem>
            ))}
          </SelectBase.SelectGroup>
        </SelectBase.SelectContent>
      </SelectBase.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
