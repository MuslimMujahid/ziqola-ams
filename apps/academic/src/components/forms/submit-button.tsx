import { useFormContext } from "@/lib/utils/form";
import { Button } from "@repo/ui/button";
import { Loader2Icon } from "lucide-react";

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon
              className="h-4 w-4 animate-spin mx-auto"
              aria-hidden="true"
            />
          ) : (
            label
          )}
        </Button>
      )}
    </form.Subscribe>
  );
}
