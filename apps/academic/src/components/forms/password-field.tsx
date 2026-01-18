import React from "react";
import { useStore } from "@tanstack/react-form";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useFieldContext } from "@/lib/utils/form";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ErrorMessages } from "@/components/ui/error-messages";

export function PasswordField({
  label,
  placeholder,
  id,
}: {
  label: string;
  placeholder?: string;
  id?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors ?? []);
  const inputId = id ?? label;
  const [show, setShow] = React.useState(false);

  return (
    <div>
      <Label htmlFor={inputId} className="mb-2 text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          type={show ? "text" : "password"}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          className="pr-10 [::-ms-reveal]:hidden [::-ms-clear]:hidden"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 flex items-center text-ink-muted hover:text-ink"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {show ? (
            <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {field.state.meta.isTouched ? (
        <ErrorMessages
          errors={
            (errors ?? []).filter(Boolean) as Array<
              string | { message: string }
            >
          }
        />
      ) : null}
    </div>
  );
}
