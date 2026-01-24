import React from "react";

type OutsideHandler = (event: MouseEvent | TouchEvent) => void;

type UseOnClickOutsideOptions = {
  enabled?: boolean;
  eventType?: "mousedown" | "mouseup" | "touchstart" | "touchend";
};

export function useOnClickOutside(
  refs: Array<React.RefObject<HTMLElement | null>>,
  handler: OutsideHandler,
  options: UseOnClickOutsideOptions = {},
) {
  const { enabled = true, eventType = "mousedown" } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const isInside = refs.some((ref) =>
        ref.current ? ref.current.contains(target) : false,
      );

      if (!isInside) {
        handler(event);
      }
    };

    document.addEventListener(eventType, listener);

    return () => {
      document.removeEventListener(eventType, listener);
    };
  }, [enabled, eventType, handler, refs]);
}
