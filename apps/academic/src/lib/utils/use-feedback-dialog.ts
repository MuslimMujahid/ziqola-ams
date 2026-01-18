"use client";

import React from "react";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import type { FeedbackDialogProps } from "@/components/ui/feedback-dialog";

export type FeedbackOptions = Pick<
  FeedbackDialogProps,
  "tone" | "title" | "description" | "closeText"
>;

export function useFeedbackDialog() {
  const [options, setOptions] = React.useState<FeedbackOptions | null>(null);

  const showFeedback = React.useCallback((nextOptions: FeedbackOptions) => {
    setOptions(nextOptions);
  }, []);

  const handleClose = React.useCallback(() => {
    setOptions(null);
  }, []);

  const FeedbackDialogElement = React.useCallback(() => {
    if (!options) {
      return null;
    }

    return React.createElement(FeedbackDialog, {
      open: Boolean(options),
      tone: options.tone,
      title: options.title,
      description: options.description,
      closeText: options.closeText,
      onClose: handleClose,
    });
  }, [options, handleClose]);

  return { showFeedback, FeedbackDialog: FeedbackDialogElement };
}
