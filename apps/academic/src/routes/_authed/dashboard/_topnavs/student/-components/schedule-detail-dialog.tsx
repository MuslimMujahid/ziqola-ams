import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { BookOpenIcon, FileTextIcon, Link2Icon } from "lucide-react";
import { createEditor, type Descendant, type Editor } from "slate";
import { withHistory } from "slate-history";
import { Slate, withReact } from "slate-react";

import {
  RICH_TEXT_EMPTY_VALUE,
  RichTextEditable,
  normalizeValue,
  withLinks,
} from "@/components/rich-text-editor/rich-text-editor";
import { useSessionMaterials } from "@/lib/services/api/session-materials";
import { formatDateLongId } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/file";
import { isRichTextEmpty } from "@/lib/utils/rich-text";

export type StudentScheduleItem = {
  id: string;
  scheduleId?: string | null;
  sessionId?: string | null;
  dateKey: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  className?: string | null;
  location?: string | null;
};

export function parseMaterialContent(value: unknown): Descendant[] {
  if (!value) return RICH_TEXT_EMPTY_VALUE;

  if (Array.isArray(value)) {
    return normalizeValue(value as Descendant[]);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeValue(parsed as Descendant[]);
      }
    } catch {
      return RICH_TEXT_EMPTY_VALUE;
    }
  }

  return RICH_TEXT_EMPTY_VALUE;
}

type ScheduleDetailDialogProps = {
  schedule: StudentScheduleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScheduleDetailDialog({
  schedule,
  open,
  onOpenChange,
}: ScheduleDetailDialogProps) {
  const sessionId = schedule?.sessionId ?? null;

  const materialsQuery = useSessionMaterials(sessionId ?? "", {
    enabled: open && Boolean(sessionId),
  });

  const materialContent = React.useMemo(
    () => parseMaterialContent(materialsQuery.data?.content ?? null),
    [materialsQuery.data?.content],
  );

  const attachments = materialsQuery.data?.attachments ?? [];
  const links = materialsQuery.data?.links ?? [];
  const hasMaterial =
    !isRichTextEmpty(materialContent) ||
    attachments.length > 0 ||
    links.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {!schedule ? (
          <p className="text-sm text-ink-muted">Data jadwal tidak tersedia.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Mata pelajaran"
                value={schedule.subjectName}
              />
              <DetailField label="Pengajar" value={schedule.teacherName} />
              {schedule.className ? (
                <DetailField label="Kelas" value={schedule.className} />
              ) : null}
              <DetailField
                label="Tanggal"
                value={formatDateLongId(schedule.dateKey)}
              />
              <DetailField
                label="Jam"
                value={`${schedule.startTime} - ${schedule.endTime}`}
              />
              {schedule.location ? (
                <DetailField label="Lokasi" value={schedule.location} />
              ) : null}
            </div>

            {sessionId ? (
              materialsQuery.isLoading ||
              materialsQuery.isFetching ||
              materialsQuery.isError ||
              hasMaterial ? (
                <div className="space-y-3 rounded-2xl bg-surface-contrast p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
                      <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
                      <span>Catatan Guru</span>
                    </div>
                    {materialsQuery.isFetching ? (
                      <div
                        aria-label="Memuat materi"
                        className="h-4 w-4 animate-spin rounded-full border-b-2 border-ink-strong"
                      />
                    ) : null}
                  </div>

                  {materialsQuery.isLoading ? (
                    <div className="space-y-3">
                      <div className="h-16 animate-pulse rounded-2xl bg-surface-1" />
                      <div className="h-6 animate-pulse rounded bg-surface-1" />
                      <div className="h-6 w-1/2 animate-pulse rounded bg-surface-1" />
                    </div>
                  ) : materialsQuery.isError ? (
                    <p className="text-sm text-error">
                      Tidak dapat memuat materi sesi.
                    </p>
                  ) : (
                    <ScheduleMaterialContent
                      content={materialContent}
                      attachments={attachments}
                      links={links}
                    />
                  )}
                </div>
              ) : null
            ) : (
              <p className="text-sm text-ink-muted">
                Sesi ini belum memiliki data sesi terjadwal.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type DetailFieldProps = {
  label: string;
  value: React.ReactNode;
};

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-subtle">{label}</p>
      <p className="text-sm font-semibold text-ink-strong">{value ?? "-"}</p>
    </div>
  );
}

type ScheduleMaterialContentProps = {
  content: Descendant[];
  attachments: Array<{
    id: string;
    fileName: string;
    downloadUrl?: string | null;
    size?: number | null;
  }>;
  links: string[];
};

function ScheduleMaterialContent({
  content,
  attachments,
  links,
}: ScheduleMaterialContentProps) {
  const editor = React.useMemo<Editor>(
    () => withLinks(withHistory(withReact(createEditor()))),
    [],
  );

  const normalizedContent = React.useMemo(
    () => normalizeValue(content),
    [content],
  );
  const isContentEmpty = isRichTextEmpty(normalizedContent);

  return (
    <div className="space-y-4">
      {!isContentEmpty ? (
        <Slate
          editor={editor}
          initialValue={normalizedContent}
          onChange={() => undefined}
        >
          <RichTextEditable readOnly className="min-h-0" />
        </Slate>
      ) : null}

      <div className="my-3 h-px bg-surface-1" aria-hidden="true" />

      {attachments.length + links.length > 0 ? (
        <ul className="space-y-2 text-sm text-ink-strong">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-2">
              <FileTextIcon
                className="h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1 truncate">
                {attachment.downloadUrl ? (
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {attachment.fileName}
                  </a>
                ) : (
                  <span>{attachment.fileName}</span>
                )}
              </div>
              {attachment.size ? (
                <span className="text-xs text-ink-muted">
                  {formatFileSize(attachment.size)}
                </span>
              ) : null}
            </li>
          ))}
          {links.map((link) => (
            <li key={link} className="flex items-center gap-2">
              <Link2Icon
                className="h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary underline-offset-4 hover:underline"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
