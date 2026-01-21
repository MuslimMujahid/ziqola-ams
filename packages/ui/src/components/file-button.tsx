import React from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

type FileButtonProps = React.ComponentProps<typeof Button> & {
  onChange?: (files: File[]) => void;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
  >;
};

function FileButton({
  asChild,
  className,
  onChange,
  inputProps,
  ...props
}: FileButtonProps) {
  const Comp = asChild ? Slot : Button;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const { onClick, disabled, ...restProps } = props;

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      onChange?.(files);
      event.target.value = "";
    },
    [onChange],
  );

  const handleClick = React.useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) {
        return;
      }
      inputRef.current?.click();
    },
    [disabled, onClick],
  );

  return (
    <>
      <Comp
        className={cn(
          "rounded-full bg-surface-1 hover:bg-surface-2",
          className,
        )}
        {...restProps}
        onClick={handleClick}
      />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
        {...inputProps}
      />
    </>
  );
}

export { FileButton };
