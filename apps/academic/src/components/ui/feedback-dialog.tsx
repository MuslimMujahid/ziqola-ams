"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";

const FEEDBACK_TONE = ["success", "error", "warning", "info"] as const;

export type FeedbackTone = (typeof FEEDBACK_TONE)[number];

export type FeedbackDialogProps = {
  open: boolean;
  tone: FeedbackTone;
  title: string;
  description?: string;
  closeText?: string;
  onClose: () => void;
};

const toneStyles: Record<FeedbackTone, { bg: string; text: string }> = {
  success: { bg: "bg-success/10", text: "text-success" },
  error: { bg: "bg-error/10", text: "text-error" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  info: { bg: "bg-info/10", text: "text-info" },
};

const toneIcons: Record<FeedbackTone, typeof CheckCircle2Icon> = {
  success: CheckCircle2Icon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

export function FeedbackDialog({
  open,
  tone,
  title,
  description,
  closeText = "Tutup",
  onClose,
}: FeedbackDialogProps) {
  const styles = toneStyles[tone];
  const Icon = toneIcons[tone];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`flex h-20 w-20 items-center justify-center rounded-full ${styles.bg}`}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            >
              <Icon className={`h-10 w-10 ${styles.text}`} aria-hidden="true" />
            </motion.div>
          </motion.div>
          <DialogTitle className="mt-3">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={onClose}>
            {closeText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
