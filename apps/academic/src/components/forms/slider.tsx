import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/lib/utils/form";

import { Slider as SliderBase } from "@repo/ui/slider";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <SliderBase
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
