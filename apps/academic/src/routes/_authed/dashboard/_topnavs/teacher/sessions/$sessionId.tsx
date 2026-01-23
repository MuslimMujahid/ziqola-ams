import React from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  FileTextIcon,
  Link2Icon,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { createEditor, type Descendant, type Editor } from "slate";
import { withHistory } from "slate-history";
import { Slate, withReact } from "slate-react";
import { cn } from "@/lib/utils/cn";
import { formatDateLongId, formatTime24Id } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/file";
import { isRichTextEmpty } from "@/lib/utils/rich-text";
import { isApiError } from "@/lib/services/api/api";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAppForm } from "@/lib/utils/form";
import { useSessionDetail } from "@/lib/services/api/sessions";
import { getAllowedMimeTypesString } from "@/lib/constants/file-validation";
import { useUploadFiles } from "@/lib/services/api/uploads";
import {
  type AttendanceStatus,
  SessionAttendanceSummary,
  useRecordAttendance,
  useSessionAttendance,
} from "@/lib/services/api/attendance";
import {
  type SessionMaterialAttachment,
  type AttachmentMetadata,
  useDeleteSessionMaterialAttachment,
  useSessionMaterials,
  useUpsertSessionMaterial,
} from "@/lib/services/api/session-materials";
import {
  normalizeValue,
  RICH_TEXT_EMPTY_VALUE,
  RichTextEditable,
  withLinks,
} from "@/components/rich-text-editor/rich-text-editor";
import { EditNotesModal } from "../-components/edit-notes-modal";
import type { EditNotesFormValues } from "../-components/edit-notes-modal";

export const Route = createFileRoute(
  "/_authed/dashboard/_topnavs/teacher/sessions/$sessionId",
)({
  staticData: { topnavId: "teacher" },
  component: TeacherSessionDetailPage,
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-6 text-error">Terjadi kesalahan: {error.message}</div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-6">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink-strong" />
    </div>
  ),
});

const ATTENDANCE_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
  tone: string;
}> = [
  { value: "PRESENT", label: "Hadir", tone: "text-success" },
  { value: "EXCUSED", label: "Izin", tone: "text-info" },
  { value: "SICK", label: "Sakit", tone: "text-warning" },
  { value: "ABSENT", label: "Alpha", tone: "text-error" },
];

const STATUS_META: Record<
  "not_started" | "in_progress" | "completed",
  { label: string; className: string; icon: React.ReactNode }
> = {
  not_started: {
    label: "Belum mulai",
    className: "bg-surface-2 text-ink-muted",
    icon: <CircleDashedIcon className="h-4 w-4" aria-hidden="true" />,
  },
  in_progress: {
    label: "Sedang berlangsung",
    className: "bg-info/10 text-info",
    icon: <ClockIcon className="h-4 w-4" aria-hidden="true" />,
  },
  completed: {
    label: "Selesai",
    className: "bg-success/10 text-success",
    icon: <CheckCircle2Icon className="h-4 w-4" aria-hidden="true" />,
  },
};

function getSessionStatus(params: {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}) {
  const dateValue = params.date ? new Date(params.date) : null;
  const startValue = params.startTime ? new Date(params.startTime) : null;
  const endValue = params.endTime ? new Date(params.endTime) : null;

  if (!dateValue || Number.isNaN(dateValue.getTime())) {
    return "not_started" as const;
  }

  const today = new Date();
  const start = startValue ?? dateValue;
  const end = endValue ?? dateValue;

  if (today < start) return "not_started";
  if (today > end) return "completed";
  return "in_progress";
}

function getAttendanceDefaultValues(attendanceData?: SessionAttendanceSummary) {
  if (!attendanceData) return {} as AttendanceFormValues["attendance"];
  return attendanceData.students.reduce<AttendanceFormValues["attendance"]>(
    (acc, student) => {
      acc[student.studentProfileId] = student.status ?? null;
      return acc;
    },
    {},
  );
}

type SessionMaterialPreviewProps = {
  content: Descendant[];
  attachments: Array<{
    id: string;
    fileName: string;
    downloadUrl?: string | null;
    size?: number | null;
  }>;
  links: string[];
  onEdit: () => void;
};

function SessionMaterialPreview({
  content,
  attachments,
  links,
  onEdit,
}: SessionMaterialPreviewProps) {
  const editor = React.useMemo<Editor>(
    () => withLinks(withHistory(withReact(createEditor()))),
    [],
  );

  const safeValue = React.useMemo(() => normalizeValue(content), [content]);
  const isContentEmpty = isRichTextEmpty(safeValue);
  const isEmpty =
    !isContentEmpty && attachments.length === 0 && links.length === 0;

  if (isEmpty) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!isContentEmpty ? (
        <Slate
          editor={editor}
          initialValue={safeValue}
          onChange={() => undefined}
        >
          <div className="rounded-2xl bg-surface-1 px-4 py-4">
            <RichTextEditable readOnly className="min-h-0" />
          </div>
        </Slate>
      ) : null}

      {attachments.length + links.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-subtle">Tautan</p>
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
                      download
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                  ) : (
                    <span>{attachment.fileName}</span>
                  )}
                </div>
                <span className="text-xs text-ink-muted">
                  {formatFileSize(attachment.size)}
                </span>
              </li>
            ))}
            {links.map((link) => (
              <li key={link} className="truncate">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  <Link2Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{link}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button type="button" className="h-9 px-4 text-sm" onClick={onEdit}>
        Ubah
      </Button>
    </div>
  );
}

type AttendanceFormValues = {
  attendance: Record<string, AttendanceStatus | null>;
};

function TeacherSessionDetailPage() {
  const router = useRouter();
  const { sessionId } = Route.useParams();
  const sessionQuery = useSessionDetail(sessionId);
  const attendanceQuery = useSessionAttendance(sessionId);
  const recordAttendance = useRecordAttendance();
  const materialsQuery = useSessionMaterials(sessionId);
  const upsertMaterial = useUpsertSessionMaterial();
  const deleteAttachment = useDeleteSessionMaterialAttachment();
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const { uploadFiles, isUploading: isUploadingFiles } = useUploadFiles();
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = React.useState(false);
  const fileAccept = React.useMemo(() => getAllowedMimeTypesString(), []);
  const session = sessionQuery.data;
  const statusKey = getSessionStatus({
    date: session?.date ?? null,
    startTime: session?.startTime ?? null,
    endTime: session?.endTime ?? null,
  });
  const isAttendanceEditable = statusKey !== "not_started";

  const attendanceDefaultValues = React.useMemo(
    () => getAttendanceDefaultValues(attendanceQuery.data),
    [attendanceQuery.data],
  );

  const attendanceForm = useAppForm({
    defaultValues: {
      attendance: attendanceDefaultValues,
    },
    onSubmit: async ({ value }) => {
      if (!attendanceQuery.data) return;
      if (!isAttendanceEditable) return;

      const items = Object.entries(value.attendance)
        .filter(([, status]) => status)
        .map(([studentProfileId, status]) => ({
          studentProfileId,
          status: status as AttendanceStatus,
        }));

      if (items.length === 0) return;

      await recordAttendance.mutateAsync({ sessionId, items });
      showFeedback({
        tone: "success",
        title: "Kehadiran berhasil diperbarui",
        closeText: "Tutup",
      });
    },
  });

  React.useEffect(() => {
    attendanceForm.reset({ attendance: attendanceDefaultValues });
  }, [attendanceDefaultValues, attendanceForm]);

  const initialValues = React.useMemo<EditNotesFormValues>(() => {
    const data = materialsQuery.data;
    if (!data) {
      return {
        content: RICH_TEXT_EMPTY_VALUE,
        attachments: [],
      };
    }

    const content =
      Array.isArray(data.content) && data.content.length > 0
        ? (data.content as Descendant[])
        : RICH_TEXT_EMPTY_VALUE;

    return {
      content,
      attachments: [
        ...data.attachments.map((attachment) => ({
          type: "existing" as const,
          data: attachment,
        })),
        ...data.links.map((link) => ({
          type: "link" as const,
          data: link,
        })),
      ],
    };
  }, [materialsQuery.data]);

  const handleSaveContent = React.useCallback(
    async (value: EditNotesFormValues) => {
      let attachmentMetadata: AttachmentMetadata[] = [];

      try {
        const fileAttachments = value.attachments.filter(
          (attachment): attachment is { type: "file"; data: File } =>
            attachment.type === "file",
        );

        const existingAttachments = value.attachments.filter(
          (
            attachment,
          ): attachment is {
            type: "existing";
            data: SessionMaterialAttachment;
          } => attachment.type === "existing",
        );

        const linkAttachments = value.attachments.filter(
          (attachment): attachment is { type: "link"; data: string } =>
            attachment.type === "link",
        );

        if (fileAttachments.length > 0) {
          const uploadedFiles = await uploadFiles(
            fileAttachments.map((attachment) => attachment.data),
          );

          attachmentMetadata = uploadedFiles.map((file) => ({
            fileKey: file.fileKey,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.size,
          }));
        }

        const existingMetadata = existingAttachments.map((attachment) => ({
          fileKey: attachment.data.fileKey,
          fileName: attachment.data.fileName,
          mimeType: attachment.data.mimeType,
          size: attachment.data.size,
        }));

        const linkValues = linkAttachments.map((attachment) => attachment.data);

        const allAttachments = [...existingMetadata, ...attachmentMetadata];
        await upsertMaterial.mutateAsync({
          sessionId,
          content: JSON.stringify(value.content),
          links: linkValues,
          attachments: allAttachments.length > 0 ? allAttachments : undefined,
        });

        showFeedback({
          tone: "success",
          title: "Catatan tersimpan",
          closeText: "Tutup",
        });
        setIsMaterialDialogOpen(false);
      } catch (error) {
        showFeedback({
          tone: "error",
          title: "Terjadi kesalahan",
          description: isApiError(error)
            ? (error.response?.data?.message ?? "Gagal menyimpan catatan.")
            : "Gagal menyimpan catatan.",
          closeText: "Tutup",
        });
      }
    },
    [sessionId, showFeedback, upsertMaterial, uploadFiles],
  );

  const handleDeleteAttachment = React.useCallback(
    (attachmentId: string) => {
      deleteAttachment.mutate(
        { sessionId, attachmentId },
        {
          onError: () => {
            showFeedback({
              tone: "error",
              title: "Terjadi kesalahan",
              description: "Gagal menghapus lampiran.",
              closeText: "Tutup",
            });
          },
        },
      );
    },
    [deleteAttachment, sessionId, showFeedback],
  );

  const attendance = attendanceQuery.data;
  const isSavingContent = upsertMaterial.isPending || isUploadingFiles;
  const editorResetKey = materialsQuery.data?.updatedAt ?? sessionId;

  const existingMaterialAttachments = React.useMemo(() => {
    return initialValues.attachments.filter(
      (
        attachment,
      ): attachment is { type: "existing"; data: SessionMaterialAttachment } =>
        attachment.type === "existing",
    );
  }, [initialValues.attachments]);

  const materialLinks = React.useMemo(() => {
    return initialValues.attachments.filter(
      (attachment): attachment is { type: "link"; data: string } =>
        attachment.type === "link",
    );
  }, [initialValues.attachments]);

  const hasMaterialData =
    !isRichTextEmpty(initialValues.content) ||
    initialValues.attachments.length > 0;

  const statusMeta = STATUS_META[statusKey];

  const handleMaterialDialogChange = React.useCallback((isOpen: boolean) => {
    setIsMaterialDialogOpen(isOpen);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 text-sm text-ink-muted hover:text-ink-strong bg-surface-1 rounded-full"
            onClick={() => router.history.back()}
            aria-label="Kembali"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-ink-strong">
              Sesi Belajar
            </h1>
          </div>
        </div>

        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            statusMeta.className,
          )}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-surface-contrast p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-ink-subtle">
                  Mata Pelajaran
                </p>
                <p className="text-sm font-semibold text-ink-strong">
                  {session?.subjectName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-subtle">Kelas</p>
                <p className="text-sm font-semibold text-ink-strong">
                  {session?.className ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-subtle">
                  Periode Akademik
                </p>
                <p className="text-sm font-semibold text-ink-strong">
                  {session?.academicPeriodName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-subtle">Tanggal</p>
                <p className="text-sm font-semibold text-ink-strong">
                  {formatDateLongId(session?.date ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-subtle">Jam</p>
                <p className="text-sm font-semibold text-ink-strong">
                  {formatTime24Id(session?.startTime ?? null)} -{" "}
                  {formatTime24Id(session?.endTime ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-subtle">Pengajar</p>
                <p className="text-sm font-semibold text-ink-strong">
                  {session?.teacherName ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-contrast p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-strong">
                  Kehadiran Siswa
                </h2>
                <p className="text-xs text-ink-muted">
                  {attendance?.students.length ?? 0} siswa terdaftar
                </p>
              </div>
              <attendanceForm.Subscribe
                selector={(state) =>
                  [state.isDirty, state.isSubmitting] as const
                }
              >
                {isAttendanceEditable
                  ? ([isDirty, isSubmitting]) => (
                      <Button
                        type="button"
                        className="h-9 px-4 text-sm"
                        disabled={!isDirty || isSubmitting}
                        onClick={() => attendanceForm.handleSubmit()}
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                      </Button>
                    )
                  : null}
              </attendanceForm.Subscribe>
            </div>

            {!isAttendanceEditable ? (
              <p className="mb-4 text-xs text-warning">
                Kehadiran bisa diubah setelah sesi dimulai.
              </p>
            ) : null}

            <div className="space-y-3">
              {attendance?.students.map((student) => {
                return (
                  <div
                    key={student.studentProfileId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-1 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-strong">
                        {student.studentName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-muted">
                        {student.studentNis ? (
                          <span>NIS: {student.studentNis}</span>
                        ) : null}
                        {student.studentNisn ? (
                          <span>NISN: {student.studentNisn}</span>
                        ) : null}
                      </div>
                    </div>

                    <attendanceForm.Field
                      name={`attendance.${student.studentProfileId}`}
                    >
                      {(field) => {
                        const selected = (field.state.value ??
                          student.status ??
                          null) as AttendanceStatus | null;
                        const selectedMeta = ATTENDANCE_OPTIONS.find(
                          (option) => option.value === selected,
                        );

                        return (
                          <Select
                            value={selected ?? undefined}
                            onValueChange={(value) =>
                              field.handleChange(value as AttendanceStatus)
                            }
                            disabled={!isAttendanceEditable}
                          >
                            <SelectTrigger className="h-9 w-40 bg-surface-contrast text-sm">
                              <SelectValue
                                placeholder="Pilih status"
                                className={cn("text-sm", selectedMeta?.tone)}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <span className={option.tone}>
                                    {option.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    </attendanceForm.Field>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-surface-contrast p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-strong">
                  Catatan
                </h2>
                <p className="text-xs text-ink-muted">
                  Catatan atau dokumen pendukung untuk sesi pembelajaran.
                </p>
              </div>
            </div>

            {hasMaterialData ? (
              <SessionMaterialPreview
                content={initialValues.content}
                attachments={existingMaterialAttachments.map((attachment) => ({
                  id: attachment.data.id,
                  fileName: attachment.data.fileName,
                  downloadUrl: attachment.data.downloadUrl,
                  size: attachment.data.size,
                }))}
                links={materialLinks.map((link) => link.data)}
                onEdit={() => setIsMaterialDialogOpen(true)}
              />
            ) : (
              <div className="space-y-4 text-sm text-ink-muted text-center">
                <div className="space-y-1">
                  <FileTextIcon
                    className="h-8 w-8 mx-auto"
                    aria-hidden="true"
                  />
                  <p>Belum ada catatan</p>
                </div>
                <Button
                  type="button"
                  className="h-9 px-4 text-sm"
                  onClick={() => setIsMaterialDialogOpen(true)}
                >
                  Tambah
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-surface-contrast p-6">
            <h3 className="text-sm font-semibold text-ink-strong">
              Ringkasan Kehadiran
            </h3>
            <attendanceForm.Subscribe
              selector={(state) => state.values.attendance}
            >
              {(attendanceValues) => (
                <div className="mt-4 grid gap-3">
                  {ATTENDANCE_OPTIONS.map((option) => {
                    const count =
                      attendance?.students.filter((student) => {
                        const currentStatus =
                          attendanceValues?.[student.studentProfileId] ??
                          student.status;
                        return currentStatus === option.value;
                      }).length ?? 0;
                    return (
                      <div
                        key={option.value}
                        className="flex items-center justify-between rounded-2xl bg-surface-1 px-4 py-3"
                      >
                        <span
                          className={cn("text-sm font-medium", option.tone)}
                        >
                          {option.label}
                        </span>
                        <span className="text-sm font-semibold text-ink-strong">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </attendanceForm.Subscribe>
          </div>
        </div>
      </div>

      <FeedbackDialog />

      <EditNotesModal
        open={isMaterialDialogOpen}
        onOpenChange={handleMaterialDialogChange}
        editorResetKey={editorResetKey}
        isSaving={isSavingContent}
        initialValues={initialValues}
        onSubmit={handleSaveContent}
        onDeleteAttachment={handleDeleteAttachment}
        formatFileSize={formatFileSize}
        fileAccept={fileAccept}
        isUploading={isUploadingFiles}
      />
    </div>
  );
}
