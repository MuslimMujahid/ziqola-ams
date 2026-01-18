"use client";

import React from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ConfirmDialogProps } from "@/components/ui/confirm-dialog";

export type ConfirmOptions = Pick<
  ConfirmDialogProps,
  "title" | "description" | "confirmText" | "cancelText" | "confirmVariant"
>;

export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleCancel = React.useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const handleConfirm = React.useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const ConfirmDialogElement = React.useCallback(() => {
    if (!options) {
      return null;
    }

    return React.createElement(ConfirmDialog, {
      open: Boolean(options),
      title: options.title,
      description: options.description,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      confirmVariant: options.confirmVariant,
      onCancel: handleCancel,
      onConfirm: handleConfirm,
    });
  }, [options, handleCancel, handleConfirm]);

  return { confirm, ConfirmDialog: ConfirmDialogElement };
}
