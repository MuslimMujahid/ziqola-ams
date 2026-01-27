import { useFormContext } from "@/lib/utils/form";
import { Button } from "@repo/ui/button";
import { Loader2Icon } from "lucide-react";

export interface SubmitButtonProps {
  label: string;
  onClick?: () => void;
}

export function SubmitButton({ label, onClick }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [
        state.canSubmit,
        state.isSubmitting,
        state.isPristine,
      ]}
    >
      {([canSubmit, isSubmitting, isPristine]) => (
        <Button
          type="submit"
          onClick={onClick}
          disabled={!canSubmit || isSubmitting || isPristine}
        >
          {isSubmitting ? (
            <Loader2Icon
              className="h-4 w-4 animate-spin mx-auto"
              aria-hidden="true"
            />
          ) : null}
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}
