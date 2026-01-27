import React from "react";
import { formOptions } from "@tanstack/react-form";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@repo/ui/button";
import * as SelectBase from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
} from "@repo/ui/table";
import { useAuthStore } from "@/stores/auth.store";
import { useConfirm } from "@/lib/utils/use-confirm";
import { useFeedbackDialog } from "@/lib/utils/use-feedback-dialog";
import { useAppForm, withForm } from "@/lib/utils/form";
import {
  type AssessmentTypeConfiguration,
  type ConfigurationField,
  type FieldOption,
  type FieldType,
  type FieldValidation,
  type ProfileRole,
  type ProfileTemplateDetail,
  type ProfileTemplateSummary,
  type TenantAssessmentType,
  type TenantProfileField,
  useApplyProfileTemplate,
  useProfileTemplate,
  useSuspenseProfileTemplates,
  useSuspenseTenantConfigurationsBatch,
} from "@/lib/services/api/profile-custom-fields";
import { ProfileFieldEditorModal } from "./profile-field-editor-modal";
import { AssessmentTypeEditorModal } from "./assessment-type-editor-modal";

const CUSTOM_TEMPLATE_VALUE = "custom";

const FIELD_TYPE_LABELS = {
  text: "Teks",
  number: "Angka",
  date: "Tanggal",
  boolean: "Ya/Tidak",
  select: "Pilihan",
  multiSelect: "Pilihan majemuk",
  file: "Berkas",
} satisfies Record<FieldType, string>;

type ProfileFieldFormValue = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  helpText?: string | null;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  order?: number | null;
  isEnabled: boolean;
};

type AssessmentTypeFormValue = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
  isEnabled: boolean;
};

type ProfileCustomizationFormValues = {
  templateId: string;
  studentFields: ProfileFieldFormValue[];
  teacherFields: ProfileFieldFormValue[];
  assessmentTypes: AssessmentTypeFormValue[];
};

const profileCustomizationDefaults: ProfileCustomizationFormValues = {
  templateId: CUSTOM_TEMPLATE_VALUE,
  studentFields: [],
  teacherFields: [],
  assessmentTypes: [],
};

const profileCustomizationFormOptions = formOptions({
  defaultValues: profileCustomizationDefaults,
});

type TemplateSectionProps = {
  templates: ProfileTemplateSummary[];
  onTemplateChange: (templateId: string) => void;
  onReset: () => void;
  isTemplateLoading: boolean;
};

const TemplateSectionForm = withForm({
  ...profileCustomizationFormOptions,
  props: {
    templates: [] as ProfileTemplateSummary[],
    onTemplateChange: (_templateId: string) => {},
    onReset: () => {},
    isTemplateLoading: false as boolean,
  } satisfies TemplateSectionProps,
  render: function Render({
    form,
    templates,
    onTemplateChange,
    onReset,
    isTemplateLoading,
  }) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-strong">
              Template
            </h2>
            <p className="text-sm text-ink-muted">
              Mulai dengan memilih template yang sudah disediakan.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.4fr_auto]">
          <form.Field name="templateId">
            {(field) => (
              <div className="w-fit">
                <SelectBase.Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => {
                    void onTemplateChange(value);
                  }}
                  disabled={isTemplateLoading}
                >
                  <SelectBase.SelectTrigger className="w-full">
                    <SelectBase.SelectValue placeholder="Pilih template" />
                  </SelectBase.SelectTrigger>
                  <SelectBase.SelectContent>
                    <SelectBase.SelectGroup>
                      <SelectBase.SelectItem
                        key={CUSTOM_TEMPLATE_VALUE}
                        value={CUSTOM_TEMPLATE_VALUE}
                      >
                        Kustom
                      </SelectBase.SelectItem>
                      {templates.map((template) => (
                        <SelectBase.SelectItem
                          key={template.id}
                          value={template.id}
                        >
                          {template.name}
                        </SelectBase.SelectItem>
                      ))}
                    </SelectBase.SelectGroup>
                  </SelectBase.SelectContent>
                </SelectBase.Select>
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.isDefaultValue, state.isSubmitting]}
          >
            {([isDefaultValue, isSubmitting]) =>
              isDefaultValue ? null : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isSubmitting || isTemplateLoading}
                    onClick={onReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting || isTemplateLoading}
                  >
                    {isSubmitting && (
                      <Loader2Icon
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    Terapkan
                  </Button>
                </div>
              )
            }
          </form.Subscribe>
        </div>
      </div>
    );
  },
});

type ProfileFieldsSectionProps = {
  role: ProfileRole;
  title: string;
  description: string;
  onAddField: (role: ProfileRole) => void;
  onEditField: (role: ProfileRole, field: ProfileFieldFormValue) => void;
  onRemoveField: (
    role: ProfileRole,
    field: ProfileFieldFormValue,
    index: number,
  ) => void;
  isLoading: boolean;
};

const ProfileFieldsSectionForm = withForm({
  ...profileCustomizationFormOptions,
  props: {
    role: "student",
    title: "",
    description: "",
    onAddField: (_role: ProfileRole) => {},
    onEditField: (_role: ProfileRole, _field: ProfileFieldFormValue) => {},
    onRemoveField: (
      _role: ProfileRole,
      _field: ProfileFieldFormValue,
      _index: number,
    ) => {},
    isLoading: false,
  } as ProfileFieldsSectionProps,
  render: function Render({
    form,
    role,
    title,
    description,
    onAddField,
    onEditField,
    onRemoveField,
    isLoading,
  }) {
    const fieldKey = `${role}Fields` as const;

    return (
      <section className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-strong">{title}</h2>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onAddField(role)}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah kolom
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat kolom...
          </div>
        ) : null}

        <form.Field name={fieldKey} mode="array">
          {(arrayField) =>
            arrayField.state.value.length > 0 ? (
              <TableContainer>
                <TableScroll>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kolom</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktif</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arrayField.state.value.map((field, index) => {
                        const fieldPath = `${fieldKey}[${index}]` as const;
                        const isEnabledPath = `${fieldPath}.isEnabled` as const;

                        return (
                          <TableRow key={`${field.id}-${index}`}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-ink-strong">
                                  {field.label}
                                </p>
                                {field.helpText ? (
                                  <p className="text-xs text-ink-muted">
                                    {field.helpText}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-ink-muted">
                              {getFieldTypeLabel(field.type)}
                            </TableCell>
                            <TableCell className="text-sm text-ink-muted">
                              {field.validation?.required
                                ? "Wajib"
                                : "Opsional"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <form.Field name={isEnabledPath}>
                                  {(formField) => (
                                    <Switch
                                      checked={formField.state.value}
                                      onCheckedChange={(checked) => {
                                        if (checked !== formField.state.value) {
                                          formField.handleChange(checked);
                                        }
                                      }}
                                      aria-label={`Aktifkan field ${field.label}`}
                                    />
                                  )}
                                </form.Field>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="hover:bg-surface-2"
                                  onClick={() => onEditField(role, field)}
                                >
                                  <PencilIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-surface-2"
                                  onClick={() =>
                                    onRemoveField(role, field, index)
                                  }
                                >
                                  <Trash2Icon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Hapus
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableScroll>
              </TableContainer>
            ) : (
              <div className="rounded-lg bg-surface-1 p-4 text-sm text-ink-muted">
                Belum ada field tambahan untuk profil ini.
              </div>
            )
          }
        </form.Field>
      </section>
    );
  },
});

type AssessmentTypesSectionProps = {
  onAddType: () => void;
  onEditType: (type: AssessmentTypeFormValue) => void;
  onRemoveType: (type: AssessmentTypeFormValue) => void;
  isLoading: boolean;
};

const AssessmentTypesSectionForm = withForm({
  ...profileCustomizationFormOptions,
  props: {
    onAddType: () => {},
    onEditType: (_type: AssessmentTypeFormValue) => {},
    onRemoveType: (_type: AssessmentTypeFormValue) => {},
    isLoading: false,
  } as AssessmentTypesSectionProps,
  render: function Render({
    form,
    onAddType,
    onEditType,
    onRemoveType,
    isLoading,
  }) {
    return (
      <section className="rounded-xl bg-surface-contrast p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-strong">
              Tipe penilaian
            </h2>
            <p className="text-sm text-ink-muted">
              Kelola kategori penilaian yang digunakan guru.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onAddType}>
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Tambah tipe
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat tipe penilaian...
          </div>
        ) : null}

        <form.Field name="assessmentTypes" mode="array">
          {(arrayField) =>
            arrayField.state.value.length > 0 ? (
              <TableContainer>
                <TableScroll>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Aktif</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arrayField.state.value.map((type, index) => {
                        const fieldPath = `assessmentTypes[${index}]` as const;
                        const isEnabledPath = `${fieldPath}.isEnabled` as const;

                        return (
                          <TableRow key={`${type.id}-${index}`}>
                            <TableCell>
                              <p className="text-sm font-semibold text-ink-strong">
                                {type.label}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm text-ink-muted">
                              {type.description ? type.description : "-"}
                            </TableCell>
                            <TableCell>
                              <form.Field name={isEnabledPath}>
                                {(formField) => (
                                  <Switch
                                    checked={formField.state.value}
                                    onCheckedChange={(checked) => {
                                      if (checked !== formField.state.value) {
                                        formField.handleChange(checked);
                                      }
                                    }}
                                    aria-label={`Aktifkan tipe ${type.label}`}
                                  />
                                )}
                              </form.Field>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="hover:bg-surface-2"
                                  onClick={() => onEditType(type)}
                                >
                                  <PencilIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-surface-2"
                                  onClick={() => onRemoveType(type)}
                                  disabled={!type.isEnabled}
                                >
                                  <Trash2Icon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Nonaktifkan
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableScroll>
              </TableContainer>
            ) : (
              <div className="rounded-lg bg-surface-1 p-4 text-sm text-ink-muted">
                Belum ada tipe penilaian.
              </div>
            )
          }
        </form.Field>
      </section>
    );
  },
});

function createLocalId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function mapTenantField(field: TenantProfileField): ProfileFieldFormValue {
  return {
    id: field.id,
    key: field.key,
    label: field.label,
    type: field.type,
    helpText: field.helpText ?? null,
    options: field.options ?? null,
    validation: field.validation ?? null,
    order: field.order ?? null,
    isEnabled: field.isEnabled,
  };
}

function mapTemplateField(field: ConfigurationField): ProfileFieldFormValue {
  return {
    id: createLocalId(),
    key: field.key,
    label: field.label,
    type: field.type,
    helpText: field.helpText ?? null,
    options: field.options ?? null,
    validation: field.validation ?? null,
    order: field.order ?? null,
    isEnabled: field.isEnabled ?? true,
  };
}

function mapTenantAssessmentType(
  type: TenantAssessmentType,
): AssessmentTypeFormValue {
  return {
    id: type.id,
    key: type.key,
    label: type.label,
    description: type.description ?? null,
    order: type.order ?? null,
    isEnabled: type.isEnabled,
  };
}

function mapTemplateAssessmentType(
  type: AssessmentTypeConfiguration,
): AssessmentTypeFormValue {
  return {
    id: createLocalId(),
    key: type.key,
    label: type.label,
    description: type.description ?? null,
    order: type.order ?? null,
    isEnabled: type.isEnabled ?? true,
  };
}

function mapToAssessmentTypeConfiguration(
  type: AssessmentTypeFormValue,
): AssessmentTypeConfiguration {
  return {
    key: type.key,
    label: type.label,
    description: type.description ?? null,
    order: type.order ?? null,
    isEnabled: type.isEnabled,
  };
}

function mapToConfigurationField(
  field: ProfileFieldFormValue,
): ConfigurationField {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    helpText: field.helpText ?? null,
    options: field.options ?? null,
    validation: field.validation ?? null,
    order: field.order ?? null,
    isEnabled: field.isEnabled,
  };
}

function getFieldTypeLabel(type: FieldType) {
  return FIELD_TYPE_LABELS[type] ?? type;
}

type ProfileCustomizationContentProps = {
  tenantId: string;
};

function ProfileCustomizationContent({
  tenantId,
}: ProfileCustomizationContentProps) {
  const { showFeedback, FeedbackDialog } = useFeedbackDialog();
  const { confirm, ConfirmDialog } = useConfirm();

  const isSyncingTemplateRef = React.useRef(false);
  const [pendingTemplateId, setPendingTemplateId] = React.useState<
    string | null
  >(null);

  const templatesQuery = useSuspenseProfileTemplates();
  const configurationsBatchQuery = useSuspenseTenantConfigurationsBatch(
    tenantId,
    ["PROFILE"],
  );

  const templateDetailQuery = useProfileTemplate(pendingTemplateId ?? "", {
    enabled:
      Boolean(pendingTemplateId) && pendingTemplateId !== CUSTOM_TEMPLATE_VALUE,
  });

  const applyTemplate = useApplyProfileTemplate();

  const templates = React.useMemo(() => {
    const seen = new Set<string>();
    return templatesQuery.data.data.filter((template) => {
      if (seen.has(template.name)) return false;
      seen.add(template.name);
      return true;
    });
  }, [templatesQuery.data?.data]);

  const profileConfigurationPayload =
    configurationsBatchQuery.data.data.PROFILE ?? null;
  const tenantConfiguration =
    profileConfigurationPayload?.configuration ?? null;
  const appliedTemplateId = React.useMemo(
    () =>
      !tenantConfiguration?.isCustomized
        ? (tenantConfiguration?.templateId ?? null)
        : null,
    [tenantConfiguration],
  );

  const initialValues = React.useMemo(() => {
    const studentFields = (
      profileConfigurationPayload?.studentFields ?? []
    ).map(mapTenantField);
    const teacherFields = (
      profileConfigurationPayload?.teacherFields ?? []
    ).map(mapTenantField);
    const assessmentTypes = (
      profileConfigurationPayload?.assessmentTypes ?? []
    ).map(mapTenantAssessmentType);

    return {
      templateId: appliedTemplateId ?? CUSTOM_TEMPLATE_VALUE,
      studentFields,
      teacherFields,
      assessmentTypes,
    } satisfies ProfileCustomizationFormValues;
  }, [
    appliedTemplateId,
    profileConfigurationPayload?.studentFields,
    profileConfigurationPayload?.teacherFields,
    profileConfigurationPayload?.assessmentTypes,
  ]);

  const form = useAppForm({
    ...profileCustomizationFormOptions,
    defaultValues: initialValues,
    listeners: {
      onChangeDebounceMs: 300,
      onChange: ({ fieldApi, formApi }) => {
        if (isSyncingTemplateRef.current) return;
        if (fieldApi.name === "templateId") return;

        const currentTemplateId = formApi.state.values.templateId;
        if (currentTemplateId !== CUSTOM_TEMPLATE_VALUE) {
          <TemplateSectionForm
            form={form}
            templates={templates}
            onTemplateChange={handleTemplateChange}
            onReset={handleReset}
            isTemplateLoading={templateDetailQuery.isFetching}
          />;
          formApi.setFieldValue("templateId", CUSTOM_TEMPLATE_VALUE);
        }
      },
    },
    onSubmit: async ({ value }) => {
      if (!tenantId) return;

      if (value.templateId === CUSTOM_TEMPLATE_VALUE) {
        if (
          value.studentFields.length === 0 &&
          value.teacherFields.length === 0 &&
          value.assessmentTypes.length === 0
        ) {
          showFeedback({
            tone: "warning",
            title: "Konfigurasi kosong",
            description: "Tambahkan kolom terlebih dahulu sebelum menerapkan.",
          });
          return;
        }

        await applyTemplate.mutateAsync({
          tenantId,
          config: {
            profile: {
              customFields: {
                student: value.studentFields.map(mapToConfigurationField),
                teacher: value.teacherFields.map(mapToConfigurationField),
              },
            },
            assessmentTypes: value.assessmentTypes.map(
              mapToAssessmentTypeConfiguration,
            ),
          },
        });

        showFeedback({
          tone: "success",
          title: "Konfigurasi disimpan",
          description: "Konfigurasi berhasil diterapkan.",
        });
      } else {
        await applyTemplate.mutateAsync({
          tenantId,
          templateId: value.templateId,
        });

        showFeedback({
          tone: "success",
          title: "Template diterapkan",
          description: "Kolom berhasil ditambahkan ke konfigurasi tenant.",
        });
      }
    },
  });

  React.useEffect(() => {
    isSyncingTemplateRef.current = true;
    form.reset(initialValues);
    isSyncingTemplateRef.current = false;
  }, [form, initialValues]);

  const configurationIsLoading = configurationsBatchQuery.isLoading;

  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">(
    "create",
  );
  const [editorRole, setEditorRole] = React.useState<ProfileRole>("student");
  const [editingField, setEditingField] =
    React.useState<ProfileFieldFormValue | null>(null);

  const [isAssessmentEditorOpen, setIsAssessmentEditorOpen] =
    React.useState(false);
  const [assessmentEditorMode, setAssessmentEditorMode] = React.useState<
    "create" | "edit"
  >("create");
  const [editingAssessmentType, setEditingAssessmentType] =
    React.useState<AssessmentTypeFormValue | null>(null);

  const openCreate = React.useCallback((nextRole: ProfileRole) => {
    setEditorMode("create");
    setEditorRole(nextRole);
    setEditingField(null);
    setIsEditorOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (nextRole: ProfileRole, field: ProfileFieldFormValue) => {
      setEditorMode("edit");
      setEditorRole(nextRole);
      setEditingField(field);
      setIsEditorOpen(true);
    },
    [],
  );

  const handleSubmitField = React.useCallback(
    async (values: {
      key: string;
      label: string;
      type: FieldType;
      helpText?: string;
      options?: Array<{ label: string; value: string }>;
      validation?: FieldValidation;
      order?: number;
    }) => {
      const fieldListKey =
        editorRole === "student" ? "studentFields" : "teacherFields";
      const currentValues = form.state.values;
      const fields =
        editorRole === "student"
          ? currentValues.studentFields
          : currentValues.teacherFields;

      if (editorMode === "create") {
        if (fields.some((field) => field.key === values.key)) {
          showFeedback({
            tone: "warning",
            title: "Key sudah ada",
            description: "Gunakan key lain untuk kolom baru.",
          });
          return;
        }

        const nextField: ProfileFieldFormValue = {
          id: createLocalId(),
          key: values.key,
          label: values.label,
          type: values.type,
          helpText: values.helpText ?? null,
          options: values.options ?? null,
          validation: values.validation ?? null,
          order: values.order ?? null,
          isEnabled: true,
        };

        form.setFieldValue(fieldListKey, [...fields, nextField]);
      } else if (editingField) {
        const nextFields = fields.map((field) =>
          field.id === editingField.id
            ? {
                ...field,
                label: values.label,
                type: values.type,
                helpText: values.helpText ?? null,
                options: values.options ?? null,
                validation: values.validation ?? null,
                order: values.order ?? null,
              }
            : field,
        );

        form.setFieldValue(fieldListKey, nextFields);
      }

      setIsEditorOpen(false);
    },
    [editorMode, editorRole, editingField, form, showFeedback],
  );

  const handleRemoveField = React.useCallback(
    async (role: ProfileRole, field: ProfileFieldFormValue, index: number) => {
      if (!field) return;
      const shouldRemove = await confirm({
        title: "Hapus field?",
        description: `Field ${field.label ?? ""} akan dihapus dari konfigurasi.`,
        confirmText: "Hapus",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!shouldRemove) return;

      const fieldListKey =
        role === "student" ? "studentFields" : "teacherFields";
      await form.removeFieldValue(fieldListKey, index);
    },
    [confirm, form],
  );

  const handleReset = React.useCallback(() => {
    isSyncingTemplateRef.current = true;
    form.reset(initialValues);
    isSyncingTemplateRef.current = false;
  }, [form, initialValues]);

  const handleTemplateChange = React.useCallback(
    async (nextTemplateId: string) => {
      const currentTemplateId = form.state.values.templateId;

      if (nextTemplateId === currentTemplateId) return;

      if (nextTemplateId === CUSTOM_TEMPLATE_VALUE) {
        form.setFieldValue("templateId", CUSTOM_TEMPLATE_VALUE);
        return;
      }

      const hasUnstagedChanges = !form.state.isDefaultValue;
      if (hasUnstagedChanges) {
        const shouldApply = await confirm({
          title: "Terapkan template?",
          description:
            "Perubahan yang belum disimpan akan ditimpa oleh template yang dipilih.",
          confirmText: "Terapkan template",
          cancelText: "Batal",
          confirmVariant: "default",
        });

        if (!shouldApply) return;
      }

      form.setFieldValue("templateId", nextTemplateId);
      setPendingTemplateId(nextTemplateId);
    },
    [confirm, form],
  );

  const applyTemplateToForm = React.useCallback(
    (template: ProfileTemplateDetail) => {
      const studentFields =
        template.profile.customFields.student.map(mapTemplateField);
      const teacherFields =
        template.profile.customFields.teacher.map(mapTemplateField);
      const assessmentTypes = (template.assessmentTypes ?? []).map(
        mapTemplateAssessmentType,
      );

      isSyncingTemplateRef.current = true;
      form.setFieldValue("studentFields", studentFields);
      form.setFieldValue("teacherFields", teacherFields);
      form.setFieldValue("assessmentTypes", assessmentTypes);
      isSyncingTemplateRef.current = false;
    },
    [form],
  );

  React.useEffect(() => {
    if (!pendingTemplateId) return;

    const template = templateDetailQuery.data?.data;
    if (!template || template.id !== pendingTemplateId) return;

    applyTemplateToForm(template);
    setPendingTemplateId(null);
  }, [applyTemplateToForm, pendingTemplateId, templateDetailQuery.data]);

  const openAssessmentCreate = React.useCallback(() => {
    setAssessmentEditorMode("create");
    setEditingAssessmentType(null);
    setIsAssessmentEditorOpen(true);
  }, []);

  const openAssessmentEdit = React.useCallback(
    (type: AssessmentTypeFormValue) => {
      setAssessmentEditorMode("edit");
      setEditingAssessmentType(type);
      setIsAssessmentEditorOpen(true);
    },
    [],
  );

  const handleSubmitAssessmentType = React.useCallback(
    async (values: {
      key: string;
      label: string;
      description?: string;
      order?: number;
    }) => {
      const types = form.state.values.assessmentTypes;

      if (assessmentEditorMode === "create") {
        if (types.some((type) => type.key === values.key)) {
          showFeedback({
            tone: "warning",
            title: "Key sudah ada",
            description: "Gunakan label lain untuk tipe baru.",
          });
          return;
        }

        const nextType: AssessmentTypeFormValue = {
          id: createLocalId(),
          key: values.key,
          label: values.label,
          description: values.description ?? null,
          order: values.order ?? null,
          isEnabled: true,
        };

        form.setFieldValue("assessmentTypes", [...types, nextType]);
      } else if (editingAssessmentType) {
        const nextTypes = types.map((type) =>
          type.id === editingAssessmentType.id
            ? {
                ...type,
                label: values.label,
                description: values.description ?? null,
                order: values.order ?? null,
              }
            : type,
        );

        form.setFieldValue("assessmentTypes", nextTypes);
      }

      setIsAssessmentEditorOpen(false);
    },
    [assessmentEditorMode, editingAssessmentType, form, showFeedback],
  );

  const handleRemoveAssessmentType = React.useCallback(
    async (type: AssessmentTypeFormValue) => {
      if (!type.isEnabled) return;

      const shouldDisable = await confirm({
        title: "Nonaktifkan tipe penilaian?",
        description: `Tipe ${type.label} akan dinonaktifkan dan tidak dapat dipilih lagi.`,
        confirmText: "Nonaktifkan",
        cancelText: "Batal",
        confirmVariant: "destructive",
      });

      if (!shouldDisable) return;

      const nextTypes = form.state.values.assessmentTypes.map((item) =>
        item.id === type.id ? { ...item, isEnabled: false } : item,
      );

      form.setFieldValue("assessmentTypes", nextTypes);
    },
    [confirm, form],
  );

  return (
    <form
      className="space-y-6 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      noValidate
    >
      <div>
        <h1 className="text-xl font-semibold text-ink-strong">Kustomisasi</h1>
        <p className="text-sm text-ink-muted">
          Atur sistem manajemen akademik sesuai kebutuhan sekolah Anda.
        </p>
      </div>

      <Tabs defaultValue="profile" className="gap-6">
        <section className="rounded-xl bg-surface-contrast pt-6 px-6">
          <div className="space-y-6">
            <TemplateSectionForm
              form={form}
              templates={templates}
              onTemplateChange={handleTemplateChange}
              onReset={handleReset}
              isTemplateLoading={templateDetailQuery.isFetching}
            />
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="assessment">Tipe penilaian</TabsTrigger>
            </TabsList>
          </div>
        </section>

        <TabsContent value="profile">
          <div className="space-y-4">
            <ProfileFieldsSectionForm
              form={form}
              role="student"
              title="Profil siswa"
              description="Kelola kolom tambahan untuk data siswa."
              onAddField={openCreate}
              onEditField={openEdit}
              onRemoveField={handleRemoveField}
              isLoading={configurationIsLoading}
            />
            <ProfileFieldsSectionForm
              form={form}
              role="teacher"
              title="Profil guru"
              description="Kelola kolom tambahan untuk data guru."
              onAddField={openCreate}
              onEditField={openEdit}
              onRemoveField={handleRemoveField}
              isLoading={configurationIsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="assessment">
          <AssessmentTypesSectionForm
            form={form}
            onAddType={openAssessmentCreate}
            onEditType={openAssessmentEdit}
            onRemoveType={handleRemoveAssessmentType}
            isLoading={configurationIsLoading}
          />
        </TabsContent>
      </Tabs>

      <ProfileFieldEditorModal
        isOpen={isEditorOpen}
        mode={editorMode}
        role={editorRole}
        field={editingField}
        isSubmitting={false}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleSubmitField}
      />

      <AssessmentTypeEditorModal
        isOpen={isAssessmentEditorOpen}
        mode={assessmentEditorMode}
        type={editingAssessmentType}
        isSubmitting={false}
        onClose={() => setIsAssessmentEditorOpen(false)}
        onSubmit={handleSubmitAssessmentType}
      />

      <FeedbackDialog />
      <ConfirmDialog />
    </form>
  );
}

export function ProfileCustomizationPage() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? "";

  if (!tenantId) {
    return (
      <div className="p-6 text-sm text-ink-muted">
        Tenant tidak ditemukan. Silakan muat ulang halaman.
      </div>
    );
  }

  return <ProfileCustomizationContent tenantId={tenantId} />;
}
