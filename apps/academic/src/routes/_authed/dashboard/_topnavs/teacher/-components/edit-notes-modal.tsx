import React from "react";
import { LinkIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { FileButton } from "@repo/ui/file-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import type { Descendant } from "slate";
import { RichTextEditorBasic } from "@/components/rich-text-editor/basic";
import type { SessionMaterialAttachment } from "@/lib/services/api/session-materials";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAppForm } from "@/lib/utils/form";
import { validateFile } from "@/lib/constants/file-validation";

type AttachmentType =
  | {
      type: "file";
      data: File;
    }
  | {
      type: "link";
      data: string;
    }
  | {
      type: "existing";
      data: SessionMaterialAttachment;
    };

export type EditNotesFormValues = {
  content: Descendant[];
  attachments: AttachmentType[];
};

type AttachmentListItemProps = {
  attachment: AttachmentType;
  onRemove: () => void;
  formatFileSize: (value?: number | null) => string;
};

function AttachmentListItem({
  attachment,
  onRemove,
  formatFileSize,
}: AttachmentListItemProps) {
  if (attachment.type === "existing") {
    const existingAttachment = attachment.data;
    return (
      <li className="flex items-center gap-2">
        {existingAttachment.downloadUrl ? (
          <a
            href={existingAttachment.downloadUrl}
            download
            className="truncate text-primary underline-offset-4 hover:underline"
          >
            {existingAttachment.fileName}
          </a>
        ) : (
          <span className="truncate">{existingAttachment.fileName}</span>
        )}
        <span className="text-xs text-ink-muted">
          {formatFileSize(existingAttachment.size)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-ink-muted hover:text-ink-strong"
          onClick={onRemove}
        >
          <XIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Hapus</span>
        </Button>
      </li>
    );
  }

  if (attachment.type === "file") {
    return (
      <li className="flex items-center gap-2">
        <span className="truncate text-ink-muted">{attachment.data.name}</span>
        <span className="text-xs text-ink-subtle">
          ({formatFileSize(attachment.data.size)})
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-ink-muted hover:text-ink-strong"
          onClick={onRemove}
        >
          <XIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Hapus</span>
        </Button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <a
        href={attachment.data}
        target="_blank"
        rel="noreferrer"
        className="truncate text-primary underline-offset-4 hover:underline"
      >
        {attachment.data}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-ink-muted hover:text-ink-strong"
        onClick={onRemove}
      >
        <XIcon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Hapus tautan</span>
      </Button>
    </li>
  );
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type EditNotesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorResetKey: string | number | null;
  initialValues: EditNotesFormValues;
  isSaving: boolean;
  onSubmit: (value: EditNotesFormValues) => Promise<void> | void;
  onDeleteAttachment: (id: string) => void;
  formatFileSize: (value?: number | null) => string;
  fileAccept: string;
  isUploading?: boolean;
};

export function EditNotesModal({
  open,
  onOpenChange,
  editorResetKey,
  isSaving,
  initialValues,
  onSubmit,
  onDeleteAttachment,
  formatFileSize,
  fileAccept,
  isUploading,
}: EditNotesModalProps) {
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const [isOpenLinkInput, setIsOpenLinkInput] = React.useState(false);

  const form = useAppForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setIsOpenLinkInput(false);
  }, [initialValues, form, open]);

  const handleFileChange = React.useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const validFiles: File[] = [];
      const errorMessages: string[] = [];

      // Validate files
      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errorMessages.push(validationError);
          return;
        }
        validFiles.push(file);
      });

      // Show error feedback if any
      if (errorMessages.length > 0) {
        showFeedback({
          tone: "error",
          title: "File tidak valid",
          description: errorMessages[0],
          closeText: "Tutup",
        });
      }

      // No valid files to add
      if (validFiles.length === 0) {
        return;
      }

      // Add valid files to form state
      form.setFieldValue("attachments", (prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          type: "file" as const,
          data: file,
        })),
      ]);
    },
    [form, showFeedback],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Catatan</DialogTitle>
          <DialogDescription>
            Tambahkan ringkasan materi dan lampiran dokumen untuk sesi ini.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          noValidate
        >
          <form.Field name="content">
            {(field) => (
              <RichTextEditorBasic
                resetKey={editorResetKey}
                value={field.state.value}
                onChange={field.handleChange}
                placeholder="Tuliskan materi pembelajaran dan tautan penting di sini..."
                className="bg-surface-1"
                config={{
                  bold: true,
                  italic: true,
                  underline: true,
                  "bulleted-list": true,
                  "numbered-list": true,
                }}
              />
            )}
          </form.Field>

          <div className="space-y-3">
            <form.Field name="attachments" mode="array">
              {(attachmentsField) => {
                const attachmentsValue = attachmentsField.state.value;

                const handleRemoveExistingAttachment = (
                  attachmentId: string,
                  index: number,
                ) => {
                  onDeleteAttachment(attachmentId);
                  attachmentsField.removeValue(index);
                };

                const handleAddLink = (
                  value: string,
                  inputElement?: HTMLInputElement,
                ) => {
                  const trimmed = value.trim();
                  if (!trimmed) {
                    showFeedback({
                      tone: "warning",
                      title: "Tautan belum diisi",
                      description: "Masukkan URL terlebih dahulu.",
                      closeText: "Tutup",
                    });
                    return;
                  }

                  if (!isValidHttpUrl(trimmed)) {
                    showFeedback({
                      tone: "error",
                      title: "Tautan tidak valid",
                      description: "Gunakan tautan http atau https.",
                      closeText: "Tutup",
                    });
                    return;
                  }

                  attachmentsField.pushValue({
                    type: "link",
                    data: trimmed,
                  });
                  setIsOpenLinkInput(false);
                  if (inputElement) {
                    inputElement.value = "";
                  }
                };

                const hasAnyAttachment =
                  attachmentsValue.length > 0 || isOpenLinkInput;

                if (!hasAnyAttachment) {
                  return null;
                }

                return (
                  <ul className="text-sm text-ink-strong">
                    {attachmentsValue.map((attachment, index) => {
                      const key =
                        attachment.type === "existing"
                          ? attachment.data.id
                          : attachment.type === "file"
                            ? `pending-${index}`
                            : `${attachment.data}-${index}`;

                      return (
                        <AttachmentListItem
                          key={key}
                          attachment={attachment}
                          formatFileSize={formatFileSize}
                          onRemove={() => {
                            if (attachment.type === "existing") {
                              handleRemoveExistingAttachment(
                                attachment.data.id,
                                index,
                              );
                              return;
                            }
                            attachmentsField.removeValue(index);
                          }}
                        />
                      );
                    })}
                    {isOpenLinkInput ? (
                      <li className="flex items-center">
                        <Input
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddLink(
                                event.currentTarget.value,
                                event.currentTarget,
                              );
                            }
                          }}
                          onBlur={(event) =>
                            handleAddLink(
                              event.currentTarget.value,
                              event.currentTarget,
                            )
                          }
                          placeholder="https://"
                          className="h-9 w-full rounded-none border-0 border-b border-surface-2 bg-transparent px-0 text-sm text-ink-strong focus-visible:ring-0"
                        />
                      </li>
                    ) : null}
                  </ul>
                );
              }}
            </form.Field>

            <div className="flex items-center gap-2">
              <FileButton
                asChild
                onChange={handleFileChange}
                inputProps={{ accept: fileAccept }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-surface-1 hover:bg-surface-2"
                  disabled={isUploading}
                  onClick={() => {
                    setIsOpenLinkInput(false);
                  }}
                >
                  <UploadIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Unggah dokumen</span>
                </Button>
              </FileButton>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full bg-surface-1 hover:bg-surface-2"
                onClick={() => setIsOpenLinkInput(!isOpenLinkInput)}
              >
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Tambah tautan</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.isDirty, state.isSubmitting] as const}
            >
              {([isDirty, isSubmitting]) => {
                return (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isDirty || isSubmitting || isSaving}
                    >
                      {isSubmitting || isSaving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </>
                );
              }}
            </form.Subscribe>
          </DialogFooter>
          <FeedbackDialog />
        </form>
      </DialogContent>
    </Dialog>
  );
}
