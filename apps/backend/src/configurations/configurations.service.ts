import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role, TenantConfigurationType } from "@repo/db";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../common/storage/minio.service";
import { FILE_VALIDATION } from "../common/uploads/file-validation.constants";
import {
  PROFILE_FIELD_TYPES,
  PROFILE_FILTER_OPERATORS,
  PROFILE_ROLES,
  type ProfileFieldType,
  type ProfileRole,
} from "./configurations.constants";
import { ApplyConfigurationDto } from "./dto/apply-configuration.dto";
import { CreateTenantProfileFieldDto } from "./dto/create-tenant-profile-field.dto";
import { UpdateTenantProfileFieldDto } from "./dto/update-tenant-profile-field.dto";
import { ProfileFieldValueDto } from "./dto/profile-field-value.dto";
import { FilterProfilesDto } from "./dto/filter-profiles.dto";
import { ExportProfilesDto } from "./dto/export-profiles.dto";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const PROFILE_CONFIGURATION_TYPE = TenantConfigurationType.PROFILE;
const CONFIGURATION_TYPES = [TenantConfigurationType.PROFILE] as const;

type ConfigurationFieldOption = {
  label: string;
  value: string;
  order?: number;
};

type ConfigurationField = {
  key: string;
  label: string;
  type: ProfileFieldType;
  helpText?: string | null;
  options?: ConfigurationFieldOption[] | null;
  validation?: Record<string, unknown> | null;
  order?: number | null;
  isEnabled?: boolean | null;
};

type AssessmentTypeConfigurationField = {
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
  isEnabled?: boolean | null;
};

type ProfileConfigurationPayload = {
  profile: {
    customFields: {
      student: ConfigurationField[];
      teacher: ConfigurationField[];
    };
  };
};

type ConfigurationPayload = ProfileConfigurationPayload & {
  assessmentTypes?: AssessmentTypeConfigurationField[];
};

type ConfigurationTemplate = {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  profile: ProfileConfigurationPayload["profile"];
  assessmentTypes?: AssessmentTypeConfigurationField[];
};

type TenantAssessmentTypeRecord = {
  id: string;
  tenantId: string;
  key: string;
  label: string;
  description: string | null;
  order: number | null;
  isEnabled: boolean;
  sourceTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TenantAssessmentTypeCreateInput = {
  tenantId: string;
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
  isEnabled?: boolean;
  sourceTemplateId?: string | null;
};

type TenantAssessmentTypeDelegate = {
  findMany: (args: {
    where?: {
      tenantId?: string;
      isEnabled?: boolean;
      key?: { in: string[] };
    };
    orderBy?: Array<{ order?: "asc" | "desc" } | { label?: "asc" | "desc" }>;
    select?: {
      id?: boolean;
      key?: boolean;
      label?: boolean;
      description?: boolean;
      order?: boolean;
      isEnabled?: boolean;
    };
  }) => Promise<TenantAssessmentTypeRecord[]>;
  findFirst: (args: {
    where: { id?: string; tenantId?: string; key?: string };
  }) => Promise<TenantAssessmentTypeRecord | null>;
  createMany: (args: { data: TenantAssessmentTypeCreateInput[] }) => Promise<{
    count: number;
  }>;
  create: (args: {
    data: TenantAssessmentTypeCreateInput;
  }) => Promise<TenantAssessmentTypeRecord>;
  update: (args: {
    where: { id: string };
    data: Partial<TenantAssessmentTypeCreateInput>;
  }) => Promise<TenantAssessmentTypeRecord>;
  updateMany: (args: {
    where: { id?: { in: string[] }; tenantId?: string; key?: { in: string[] } };
    data: Partial<TenantAssessmentTypeCreateInput>;
  }) => Promise<{ count: number }>;
};

@Injectable()
export class ConfigurationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  private templatesCache: ConfigurationTemplate[] | null = null;

  private resolveTemplatesDir() {
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, "dist", "configurations", "templates"),
      path.join(cwd, "src", "configurations", "templates"),
      path.join(cwd, "apps", "backend", "dist", "configurations", "templates"),
      path.join(cwd, "apps", "backend", "src", "configurations", "templates"),
    ];

    const resolved = candidates.find((candidate) => existsSync(candidate));

    if (!resolved) {
      throw new BadRequestException("Templates directory not found");
    }

    return resolved;
  }

  private async loadTemplates() {
    if (this.templatesCache) {
      return this.templatesCache;
    }

    const templatesDir = this.resolveTemplatesDir();
    const entries = await readdir(templatesDir, { withFileTypes: true });
    const templateFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(templatesDir, entry.name));

    if (templateFiles.length === 0) {
      throw new BadRequestException("No templates found");
    }

    const templates: ConfigurationTemplate[] = [];
    const seenIds = new Set<string>();

    for (const filePath of templateFiles) {
      const raw = await readFile(filePath, "utf-8");
      let parsed: ConfigurationTemplate;
      try {
        parsed = JSON.parse(raw) as ConfigurationTemplate;
      } catch {
        throw new BadRequestException(
          `Invalid JSON in template file: ${filePath}`,
        );
      }

      this.assertTemplateShape(parsed);

      if (seenIds.has(parsed.id)) {
        throw new BadRequestException(
          `Duplicate template id found: ${parsed.id}`,
        );
      }

      seenIds.add(parsed.id);
      templates.push(parsed);
    }

    this.templatesCache = templates;
    return templates;
  }

  private assertTemplateShape(template: ConfigurationTemplate) {
    if (!template.id || !template.name || !template.profile?.customFields) {
      throw new BadRequestException("Invalid template structure");
    }

    const { customFields } = template.profile;
    this.assertFieldsShape(customFields.student, "student");
    this.assertFieldsShape(customFields.teacher, "teacher");

    if (template.assessmentTypes) {
      this.assertAssessmentTypesShape(template.assessmentTypes);
    }
  }

  private assertAssessmentTypesShape(
    types: AssessmentTypeConfigurationField[],
  ) {
    if (!Array.isArray(types)) {
      throw new BadRequestException("Invalid assessment types configuration");
    }

    const keys = new Set<string>();

    types.forEach((type) => {
      if (!type.key || !type.label) {
        throw new BadRequestException(
          "Assessment type key and label are required",
        );
      }

      if (keys.has(type.key)) {
        throw new BadRequestException(
          `Duplicate assessment type key found: ${type.key}`,
        );
      }

      keys.add(type.key);
    });
  }

  private assertFieldsShape(fields: ConfigurationField[], role: ProfileRole) {
    if (!Array.isArray(fields)) {
      throw new BadRequestException(
        `Invalid custom field configuration for ${role}`,
      );
    }

    fields.forEach((field) => {
      if (!field.key || !field.label) {
        throw new BadRequestException(
          `Field key and label are required for ${role}`,
        );
      }

      if (!PROFILE_FIELD_TYPES.includes(field.type)) {
        throw new BadRequestException(
          `Unsupported field type ${field.type} for ${role}`,
        );
      }

      if (
        (field.type === "select" || field.type === "multiSelect") &&
        (!field.options || field.options.length === 0)
      ) {
        throw new BadRequestException(
          `Options are required for ${field.type} fields in ${role}`,
        );
      }
    });
  }

  async listTemplates(_role?: string) {
    const templates = await this.loadTemplates();
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description ?? null,
      isActive: template.isActive ?? true,
    }));
  }

  async getTemplate(templateId: string) {
    const templates = await this.loadTemplates();
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      throw new NotFoundException("Profile template not found");
    }

    return template;
  }

  async applyTemplate(tenantId: string, dto: ApplyConfigurationDto) {
    if (!dto.templateId && !dto.config) {
      throw new BadRequestException(
        "Either templateId or config payload must be provided",
      );
    }

    let payload: ConfigurationPayload;
    let sourceTemplateId: string | null = null;

    if (dto.templateId) {
      const templates = await this.loadTemplates();
      const template = templates.find((item) => item.id === dto.templateId);

      if (!template) {
        throw new NotFoundException("Template not found");
      }

      payload = {
        profile: template.profile,
        assessmentTypes: template.assessmentTypes ?? undefined,
      };
      sourceTemplateId = template.id;
    } else {
      payload = this.assertConfigurationPayload(dto.config ?? {});
    }

    const shouldPrune = !sourceTemplateId;
    const createdCounts = await Promise.all(
      PROFILE_ROLES.map((role) =>
        this.applyConfigurationForRole(
          tenantId,
          role,
          payload,
          sourceTemplateId,
          shouldPrune,
        ),
      ),
    );

    if (payload.assessmentTypes) {
      await this.applyAssessmentTypes(
        tenantId,
        payload.assessmentTypes,
        sourceTemplateId,
        shouldPrune,
      );
    }

    await this.upsertProfileConfiguration(tenantId, {
      templateId: sourceTemplateId,
      isCustomized: !sourceTemplateId,
      appliedAt: new Date(),
    });

    return {
      applied: true,
      created: createdCounts.reduce((sum, count) => sum + count, 0),
    };
  }

  private assertConfigurationPayload(
    payload: Record<string, unknown>,
  ): ConfigurationPayload {
    const profile = payload.profile as ProfileConfigurationPayload["profile"];
    if (!profile || typeof profile !== "object") {
      throw new BadRequestException("Invalid configuration payload");
    }

    const customFields = profile.customFields as
      | ProfileConfigurationPayload["profile"]["customFields"]
      | undefined;

    if (!customFields) {
      throw new BadRequestException("Custom fields configuration is required");
    }

    this.assertFieldsShape(customFields.student, "student");
    this.assertFieldsShape(customFields.teacher, "teacher");

    const assessmentTypes = payload.assessmentTypes as
      | AssessmentTypeConfigurationField[]
      | undefined;

    if (assessmentTypes) {
      this.assertAssessmentTypesShape(assessmentTypes);
    }

    return payload as ConfigurationPayload;
  }

  private async applyConfigurationForRole(
    tenantId: string,
    role: ProfileRole,
    payload: ProfileConfigurationPayload,
    sourceTemplateId: string | null,
    shouldPrune: boolean,
  ) {
    const fields = payload.profile.customFields[role] ?? [];
    this.assertFieldsShape(fields, role);

    const existingFields = await this.prisma.client.tenantProfileField.findMany(
      {
        where: { tenantId, role },
        select: { key: true },
      },
    );

    const existingKeys = new Set(existingFields.map((field) => field.key));
    const incomingKeys = new Set(fields.map((field) => field.key));

    const createData = fields
      .filter((field) => !existingKeys.has(field.key))
      .map((field) => ({
        tenantId,
        role,
        key: field.key,
        label: field.label,
        type: field.type,
        helpText: field.helpText ?? undefined,
        options: field.options
          ? (field.options as Prisma.InputJsonValue)
          : undefined,
        validation: field.validation
          ? (field.validation as Prisma.InputJsonValue)
          : undefined,
        order: field.order ?? undefined,
        isEnabled: field.isEnabled ?? true,
        sourceTemplateId,
      }));

    const updatePromises = fields
      .filter((field) => existingKeys.has(field.key))
      .map((field) =>
        this.prisma.client.tenantProfileField.update({
          where: {
            tenantId_role_key: {
              tenantId,
              role,
              key: field.key,
            },
          },
          data: {
            label: field.label,
            type: field.type,
            helpText: field.helpText ?? undefined,
            options: field.options
              ? (field.options as Prisma.InputJsonValue)
              : undefined,
            validation: field.validation
              ? (field.validation as Prisma.InputJsonValue)
              : undefined,
            order: field.order ?? undefined,
            isEnabled: field.isEnabled ?? true,
            sourceTemplateId,
          },
        }),
      );

    if (createData.length > 0) {
      await this.prisma.client.tenantProfileField.createMany({
        data: createData,
      });
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    if (shouldPrune) {
      const keysToKeep = Array.from(incomingKeys);
      await this.prisma.client.tenantProfileField.deleteMany({
        where: {
          tenantId,
          role,
          key: keysToKeep.length > 0 ? { notIn: keysToKeep } : undefined,
        },
      });
    }

    return createData.length;
  }

  private getAssessmentTypeModel() {
    return (
      this.prisma.client as unknown as {
        tenantAssessmentType: TenantAssessmentTypeDelegate;
      }
    ).tenantAssessmentType;
  }

  private async applyAssessmentTypes(
    tenantId: string,
    types: AssessmentTypeConfigurationField[],
    sourceTemplateId: string | null,
    shouldPrune: boolean,
  ) {
    this.assertAssessmentTypesShape(types);
    const model = this.getAssessmentTypeModel();

    const existingTypes = await model.findMany({
      where: { tenantId },
      select: { id: true, key: true },
    });

    const existingMap = new Map(
      existingTypes.map((type) => [type.key, type.id]),
    );
    const incomingKeys = new Set(types.map((type) => type.key));

    const createData: TenantAssessmentTypeCreateInput[] = types
      .filter((type) => !existingMap.has(type.key))
      .map((type) => ({
        tenantId,
        key: type.key,
        label: type.label,
        description: type.description ?? undefined,
        order: type.order ?? undefined,
        isEnabled: type.isEnabled ?? true,
        sourceTemplateId,
      }));

    const updatePromises = types
      .filter((type) => existingMap.has(type.key))
      .map((type) =>
        model.update({
          where: { id: existingMap.get(type.key) ?? "" },
          data: {
            label: type.label,
            description: type.description ?? undefined,
            order: type.order ?? undefined,
            isEnabled: type.isEnabled ?? true,
            sourceTemplateId,
          },
        }),
      );

    if (createData.length > 0) {
      await model.createMany({ data: createData });
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    if (shouldPrune) {
      const keysToDisable = Array.from(existingMap.keys()).filter(
        (key) => !incomingKeys.has(key),
      );

      if (keysToDisable.length > 0) {
        await model.updateMany({
          where: { tenantId, key: { in: keysToDisable } },
          data: { isEnabled: false },
        });
      }
    }
  }

  async listTenantFields(tenantId: string, role: string) {
    const parsedRole = this.ensureRole(role);

    return this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: parsedRole },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });
  }

  async createTenantField(tenantId: string, dto: CreateTenantProfileFieldDto) {
    const role = this.ensureRole(dto.role);
    const type = this.ensureFieldType(dto.type);

    if ((type === "select" || type === "multiSelect") && !dto.options) {
      throw new BadRequestException("Options are required for select fields");
    }

    const existing = await this.prisma.client.tenantProfileField.findFirst({
      where: { tenantId, role, key: dto.key },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Field key already exists");
    }

    const field = await this.prisma.client.tenantProfileField.create({
      data: {
        tenantId,
        role,
        key: dto.key,
        label: dto.label,
        type,
        helpText: dto.helpText ?? undefined,
        options: dto.options
          ? (dto.options as unknown as Prisma.InputJsonValue)
          : undefined,
        validation: dto.validation
          ? (dto.validation as Prisma.InputJsonValue)
          : undefined,
        order: dto.order ?? undefined,
        isEnabled: true,
      },
    });

    await this.markProfileConfigurationCustomized(tenantId);
    return field;
  }

  async updateTenantField(
    tenantId: string,
    fieldId: string,
    dto: UpdateTenantProfileFieldDto,
  ) {
    const field = await this.prisma.client.tenantProfileField.findFirst({
      where: { id: fieldId, tenantId },
    });

    if (!field) {
      throw new NotFoundException("Field not found");
    }

    if (
      dto.type &&
      !PROFILE_FIELD_TYPES.includes(dto.type as ProfileFieldType)
    ) {
      throw new BadRequestException("Invalid field type");
    }

    if (
      (dto.type === "select" || dto.type === "multiSelect") &&
      dto.options &&
      dto.options.length === 0
    ) {
      throw new BadRequestException("Options cannot be empty");
    }

    const updated = await this.prisma.client.tenantProfileField.update({
      where: { id: field.id },
      data: {
        label: dto.label ?? undefined,
        type: dto.type ?? undefined,
        helpText: dto.helpText ?? undefined,
        options: dto.options
          ? (dto.options as unknown as Prisma.InputJsonValue)
          : undefined,
        validation: dto.validation
          ? (dto.validation as Prisma.InputJsonValue)
          : undefined,
        order: dto.order ?? undefined,
        isEnabled: dto.isEnabled ?? undefined,
      },
    });

    await this.markProfileConfigurationCustomized(tenantId);
    return updated;
  }

  async setFieldEnabled(tenantId: string, fieldId: string, enabled: boolean) {
    const field = await this.prisma.client.tenantProfileField.findFirst({
      where: { id: fieldId, tenantId },
      select: { id: true },
    });

    if (!field) {
      throw new NotFoundException("Field not found");
    }

    const updated = await this.prisma.client.tenantProfileField.update({
      where: { id: field.id },
      data: { isEnabled: enabled },
    });

    await this.markProfileConfigurationCustomized(tenantId);
    return updated;
  }

  async getTenantProfileConfiguration(tenantId: string) {
    return this.prisma.client.tenantConfiguration.findUnique({
      where: {
        tenantId_configType: {
          tenantId,
          configType: PROFILE_CONFIGURATION_TYPE,
        },
      },
    });
  }

  async getTenantProfileConfigurationFull(tenantId: string) {
    const [configuration, studentFields, teacherFields] =
      await this.prisma.client.$transaction([
        this.prisma.client.tenantConfiguration.findUnique({
          where: {
            tenantId_configType: {
              tenantId,
              configType: PROFILE_CONFIGURATION_TYPE,
            },
          },
        }),
        this.prisma.client.tenantProfileField.findMany({
          where: { tenantId, role: "student" },
          orderBy: [{ order: "asc" }, { label: "asc" }],
        }),
        this.prisma.client.tenantProfileField.findMany({
          where: { tenantId, role: "teacher" },
          orderBy: [{ order: "asc" }, { label: "asc" }],
        }),
      ]);

    const assessmentTypes = await this.listTenantAssessmentTypes(tenantId, {
      includeDisabled: true,
    });

    return {
      configuration,
      studentFields,
      teacherFields,
      assessmentTypes,
    };
  }

  async getTenantConfigurationsBatch(
    tenantId: string,
    types: Array<(typeof CONFIGURATION_TYPES)[number]>,
  ) {
    const invalidTypes = types.filter(
      (type) => !CONFIGURATION_TYPES.includes(type),
    );
    if (invalidTypes.length > 0) {
      throw new BadRequestException(
        `Unsupported configuration types: ${invalidTypes.join(", ")}`,
      );
    }

    const result: Record<string, unknown> = {};

    for (const type of types) {
      switch (type) {
        case TenantConfigurationType.PROFILE: {
          result[type] = await this.getTenantProfileConfigurationFull(tenantId);
          break;
        }
        default:
          break;
      }
    }

    return result;
  }

  async getProfileFieldsAndValues(
    tenantId: string,
    role: string,
    profileId: string,
    options?: { includeDisabled?: boolean },
  ) {
    const parsedRole = this.ensureRole(role);
    await this.ensureProfileExists(tenantId, parsedRole, profileId);

    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: {
        tenantId,
        role: parsedRole,
        ...(options?.includeDisabled ? {} : { isEnabled: true }),
      },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });

    const values = await this.fetchProfileValues(
      tenantId,
      parsedRole,
      profileId,
    );

    const valuesWithUrls = await Promise.all(
      values.map(async (value) => {
        if (!value.valueFile) {
          return value;
        }

        const valueFile = value.valueFile as Record<string, unknown> | null;
        const fileKey = valueFile?.fileKey;

        if (!fileKey || typeof fileKey !== "string") {
          return value;
        }

        const url = await this.minio.getPresignedDownloadUrl({
          objectKey: fileKey,
        });

        return {
          ...value,
          valueFile: {
            ...valueFile,
            url,
          },
        };
      }),
    );

    return { fields, values: valuesWithUrls };
  }

  async listTenantAssessmentTypes(
    tenantId: string,
    options?: { includeDisabled?: boolean },
  ) {
    const model = this.getAssessmentTypeModel();

    return model.findMany({
      where: {
        tenantId,
        ...(options?.includeDisabled ? {} : { isEnabled: true }),
      },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });
  }

  async createTenantAssessmentType(
    tenantId: string,
    dto: {
      key: string;
      label: string;
      description?: string;
      order?: number;
    },
  ) {
    const model = this.getAssessmentTypeModel();
    const existing = await model.findFirst({
      where: { tenantId, key: dto.key },
    });

    if (existing) {
      throw new BadRequestException("Assessment type key already exists");
    }

    const created = await model.create({
      data: {
        tenantId,
        key: dto.key,
        label: dto.label,
        description: dto.description ?? undefined,
        order: dto.order ?? undefined,
        isEnabled: true,
      },
    });

    await this.markProfileConfigurationCustomized(tenantId);
    return created;
  }

  async updateTenantAssessmentType(
    tenantId: string,
    typeId: string,
    dto: {
      label?: string;
      description?: string;
      order?: number;
      isEnabled?: boolean;
    },
  ) {
    const model = this.getAssessmentTypeModel();
    const type = await model.findFirst({ where: { id: typeId, tenantId } });

    if (!type) {
      throw new NotFoundException("Assessment type not found");
    }

    const updated = await model.update({
      where: { id: type.id },
      data: {
        label: dto.label ?? undefined,
        description: dto.description ?? undefined,
        order: dto.order ?? undefined,
        isEnabled: dto.isEnabled ?? undefined,
      },
    });

    await this.markProfileConfigurationCustomized(tenantId);
    return updated;
  }

  async setAssessmentTypeEnabled(
    tenantId: string,
    typeId: string,
    enabled: boolean,
  ) {
    return this.updateTenantAssessmentType(tenantId, typeId, {
      isEnabled: enabled,
    });
  }

  async upsertProfileValues(
    tenantId: string,
    role: string,
    profileId: string,
    values: ProfileFieldValueDto[],
  ) {
    const parsedRole = this.ensureRole(role);
    await this.ensureProfileExists(tenantId, parsedRole, profileId);

    const fieldIds = values.map((value) => value.fieldId);
    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: {
        tenantId,
        role: parsedRole,
        id: { in: fieldIds },
      },
    });

    const fieldMap = new Map(fields.map((field) => [field.id, field]));

    const upsertPayloads = values.map((value) => {
      const field = fieldMap.get(value.fieldId);
      if (!field) {
        throw new BadRequestException("Field not found for tenant");
      }

      if (!field.isEnabled) {
        throw new BadRequestException("Field is disabled");
      }

      const data = this.buildValuePayload(field, value);

      return { field, data };
    });

    const operations = upsertPayloads.map(({ field, data }) => {
      if (parsedRole === "student") {
        return this.prisma.client.studentProfileFieldValue.upsert({
          where: {
            studentProfileId_fieldId: {
              studentProfileId: profileId,
              fieldId: field.id,
            },
          },
          create: {
            tenantId,
            studentProfileId: profileId,
            fieldId: field.id,
            ...data,
          },
          update: data,
        });
      }

      return this.prisma.client.teacherProfileFieldValue.upsert({
        where: {
          teacherProfileId_fieldId: {
            teacherProfileId: profileId,
            fieldId: field.id,
          },
        },
        create: {
          tenantId,
          teacherProfileId: profileId,
          fieldId: field.id,
          ...data,
        },
        update: data,
      });
    });

    await this.prisma.client.$transaction(operations);
    return { updated: true };
  }

  async filterProfiles(tenantId: string, role: string, dto: FilterProfilesDto) {
    const parsedRole = this.ensureRole(role);
    const filters = dto.filters ?? [];

    const fieldKeys = filters.map((filter) => filter.fieldKey);
    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: parsedRole, key: { in: fieldKeys } },
    });
    const fieldMap = new Map(fields.map((field) => [field.key, field]));

    const filterClauses = filters.map((filter) => {
      const field = fieldMap.get(filter.fieldKey);
      if (!field) {
        throw new BadRequestException("Filter field not found");
      }

      return this.buildFilterClause(parsedRole, field, filter.op, filter.value);
    });

    const pagination = dto.pagination ?? { page: 1, pageSize: 20 };
    const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
    const pageSize =
      pagination.pageSize && pagination.pageSize > 0 ? pagination.pageSize : 20;
    const offset = (page - 1) * pageSize;

    const result =
      parsedRole === "student"
        ? await this.filterStudentProfiles(
            tenantId,
            dto,
            filterClauses,
            offset,
            pageSize,
          )
        : await this.filterTeacherProfiles(
            tenantId,
            dto,
            filterClauses,
            offset,
            pageSize,
          );

    if (!dto.includeCustomFields) {
      return result;
    }

    const profiles = result.data;
    const profileIds = profiles.map((profile) => profile.id);

    if (profileIds.length === 0) {
      return {
        data: profiles.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total: result.total,
      };
    }

    const enabledFields = await this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: parsedRole, isEnabled: true },
      select: { id: true },
    });

    const enabledFieldIds = enabledFields.map((field) => field.id);
    if (enabledFieldIds.length === 0) {
      return {
        data: profiles.map((profile) => ({
          ...profile,
          customFieldValues: [],
        })),
        total: result.total,
      };
    }

    const values = await this.fetchProfileValuesByRole(
      tenantId,
      parsedRole,
      profileIds,
      enabledFieldIds,
    );

    type CustomFieldValue = {
      id: string;
      tenantId: string;
      role: ProfileRole;
      profileId: string;
      fieldId: string;
      valueText: string | null;
      valueNumber: number | null;
      valueDate: Date | null;
      valueBoolean: boolean | null;
      valueSelect: string | null;
      valueMultiSelect: string[];
      valueFile: Prisma.JsonValue | null;
      updatedAt: Date;
    };

    const valueMap = new Map<string, CustomFieldValue[]>();

    for (const value of values) {
      const profileId =
        "studentProfileId" in value
          ? value.studentProfileId
          : value.teacherProfileId;

      if (!valueMap.has(profileId)) {
        valueMap.set(profileId, []);
      }

      valueMap.get(profileId)?.push({
        id: value.id,
        tenantId: value.tenantId,
        role: parsedRole,
        profileId,
        fieldId: value.fieldId,
        valueText: value.valueText,
        valueNumber: value.valueNumber,
        valueDate: value.valueDate,
        valueBoolean: value.valueBoolean,
        valueSelect: value.valueSelect,
        valueMultiSelect: value.valueMultiSelect,
        valueFile: value.valueFile,
        updatedAt: value.updatedAt,
      });
    }

    return {
      data: profiles.map((profile) => ({
        ...profile,
        customFieldValues: valueMap.get(profile.id) ?? [],
      })),
      total: result.total,
    };
  }

  async exportProfiles(tenantId: string, role: string, dto: ExportProfilesDto) {
    if (dto.format !== "csv") {
      throw new BadRequestException("Only CSV export is supported for now");
    }

    const parsedRole = this.ensureRole(role);
    const filterResult = await this.filterProfiles(tenantId, parsedRole, dto);
    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: { tenantId, role: parsedRole, isEnabled: true },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });

    const profiles = filterResult.data;
    const profileIds = profiles.map((profile) => profile.id);

    const values = await this.fetchProfileValuesByRole(
      tenantId,
      parsedRole,
      profileIds,
    );

    const valueMap = new Map<string, Record<string, string>>();

    for (const value of values) {
      const profileId =
        "studentProfileId" in value
          ? value.studentProfileId
          : value.teacherProfileId;

      if (!valueMap.has(profileId)) {
        valueMap.set(profileId, {});
      }

      const profileValues = valueMap.get(profileId);
      if (!profileValues) {
        continue;
      }

      profileValues[value.fieldId] = this.formatValueForExport(value);
    }

    const header = [
      "id",
      "name",
      "email",
      ...fields.map((field) => field.label),
    ];

    const rows = profiles.map((profile) => {
      const profileValues = valueMap.get(profile.id) ?? {};
      const base = [profile.id, profile.user.name, profile.user.email];
      const custom = fields.map((field) => profileValues[field.id] ?? "");
      return [...base, ...custom];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => this.escapeCsv(cell)).join(","))
      .join("\n");

    const fileKey = `${tenantId}/exports/custom-profiles-${parsedRole}-${Date.now()}.csv`;
    await this.minio.putObject({
      objectKey: fileKey,
      content: csv,
      contentType: "text/csv",
    });

    const downloadUrl = await this.minio.getPresignedDownloadUrl({
      objectKey: fileKey,
    });

    return { downloadUrl };
  }

  async assertTenantAccess(tenantId: string, userTenantId: string) {
    if (tenantId !== userTenantId) {
      throw new ForbiddenException("Tenant access denied");
    }
  }

  async assertProfileAccess(
    tenantId: string,
    role: string,
    profileId: string,
    user: { id: string; role: Role },
  ) {
    const parsedRole = this.ensureRole(role);
    const profile = await this.getProfileByRole(
      tenantId,
      parsedRole,
      profileId,
    );

    if (user.role === Role.TEACHER && parsedRole === "teacher") {
      if (profile.userId !== user.id) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    if (user.role === Role.STUDENT && parsedRole === "student") {
      if (profile.userId !== user.id) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }
  }

  private ensureRole(role?: string): ProfileRole {
    if (!role || !PROFILE_ROLES.includes(role as ProfileRole)) {
      throw new BadRequestException("Invalid profile role");
    }
    return role as ProfileRole;
  }

  private ensureFieldType(type: string): ProfileFieldType {
    if (!PROFILE_FIELD_TYPES.includes(type as ProfileFieldType)) {
      throw new BadRequestException("Invalid field type");
    }
    return type as ProfileFieldType;
  }

  private async ensureProfileExists(
    tenantId: string,
    role: ProfileRole,
    profileId: string,
  ) {
    await this.getProfileByRole(tenantId, role, profileId);
  }

  private async getProfileByRole(
    tenantId: string,
    role: ProfileRole,
    profileId: string,
  ) {
    if (role === "student") {
      const profile = await this.prisma.client.studentProfile.findFirst({
        where: { id: profileId, tenantId },
        select: { id: true, userId: true, user: { select: { id: true } } },
      });
      if (!profile) {
        throw new NotFoundException("Student profile not found");
      }
      return profile;
    }

    const profile = await this.prisma.client.teacherProfile.findFirst({
      where: { id: profileId, tenantId },
      select: { id: true, userId: true, user: { select: { id: true } } },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return profile;
  }

  private buildValuePayload(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: ProfileFieldValueDto,
  ) {
    const validation = field.validation as Record<string, unknown> | null;
    const required = Boolean(validation?.required);

    const payload = {
      valueText: undefined as string | undefined,
      valueNumber: undefined as number | undefined,
      valueDate: undefined as Date | undefined,
      valueBoolean: undefined as boolean | undefined,
      valueSelect: undefined as string | undefined,
      valueMultiSelect: undefined as string[] | undefined,
      valueFile: undefined as Prisma.InputJsonValue | undefined,
    };

    switch (field.type) {
      case "text": {
        const text = value.valueText?.trim();
        if (required && !text) {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (text) {
          this.validateText(field, text);
        }
        payload.valueText = text;
        break;
      }
      case "number": {
        const numberValue = value.valueNumber;
        if (required && typeof numberValue !== "number") {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (typeof numberValue === "number") {
          this.validateNumber(field, numberValue);
          payload.valueNumber = numberValue;
        }
        break;
      }
      case "date": {
        const dateValue = value.valueDate ? new Date(value.valueDate) : null;
        if (required && !dateValue) {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (dateValue) {
          this.validateDate(field, dateValue);
          payload.valueDate = dateValue;
        }
        break;
      }
      case "boolean": {
        if (required && typeof value.valueBoolean !== "boolean") {
          throw new BadRequestException(`${field.label} is required`);
        }
        payload.valueBoolean = value.valueBoolean;
        break;
      }
      case "select": {
        const selectValue = value.valueSelect;
        if (required && !selectValue) {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (selectValue) {
          this.validateSelect(field, selectValue);
          payload.valueSelect = selectValue;
        }
        break;
      }
      case "multiSelect": {
        const multiValue = value.valueMultiSelect ?? [];
        if (required && multiValue.length === 0) {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (multiValue.length > 0) {
          this.validateMultiSelect(field, multiValue);
        }
        payload.valueMultiSelect = multiValue;
        break;
      }
      case "file": {
        const fileValue = value.valueFile as
          | Record<string, unknown>
          | undefined;
        if (required && !fileValue) {
          throw new BadRequestException(`${field.label} is required`);
        }
        if (fileValue) {
          this.validateFile(field, fileValue);
          payload.valueFile = fileValue as Prisma.InputJsonValue;
        }
        break;
      }
      default:
        throw new BadRequestException("Unsupported field type");
    }

    return payload;
  }

  private validateText(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: string,
  ) {
    const validation = field.validation as Record<string, unknown> | null;
    const min = validation?.min as number | undefined;
    const max = validation?.max as number | undefined;
    const regex = validation?.regex as string | undefined;

    if (typeof min === "number" && value.length < min) {
      throw new BadRequestException(`${field.label} minimum length is ${min}`);
    }
    if (typeof max === "number" && value.length > max) {
      throw new BadRequestException(`${field.label} maximum length is ${max}`);
    }
    if (regex) {
      const pattern = new RegExp(regex);
      if (!pattern.test(value)) {
        throw new BadRequestException(`${field.label} format is invalid`);
      }
    }
  }

  private validateNumber(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: number,
  ) {
    const validation = field.validation as Record<string, unknown> | null;
    const min = validation?.min as number | undefined;
    const max = validation?.max as number | undefined;

    if (typeof min === "number" && value < min) {
      throw new BadRequestException(`${field.label} minimum value is ${min}`);
    }
    if (typeof max === "number" && value > max) {
      throw new BadRequestException(`${field.label} maximum value is ${max}`);
    }
  }

  private validateDate(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: Date,
  ) {
    const validation = field.validation as Record<string, unknown> | null;
    const dateRange = validation?.dateRange as
      | { min?: string; max?: string }
      | undefined;

    if (dateRange?.min) {
      const minDate = new Date(dateRange.min);
      if (value < minDate) {
        throw new BadRequestException(`${field.label} is before minimum date`);
      }
    }

    if (dateRange?.max) {
      const maxDate = new Date(dateRange.max);
      if (value > maxDate) {
        throw new BadRequestException(`${field.label} is after maximum date`);
      }
    }
  }

  private validateSelect(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: string,
  ) {
    const options = (field.options as Array<{ value: string }> | null) ?? [];
    if (
      options.length > 0 &&
      !options.some((option) => option.value === value)
    ) {
      throw new BadRequestException(`${field.label} value is not allowed`);
    }
  }

  private validateMultiSelect(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: string[],
  ) {
    const options = (field.options as Array<{ value: string }> | null) ?? [];
    if (options.length > 0) {
      const allowed = new Set(options.map((option) => option.value));
      for (const item of value) {
        if (!allowed.has(item)) {
          throw new BadRequestException(`${field.label} value is not allowed`);
        }
      }
    }
  }

  private validateFile(
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    value: Record<string, unknown>,
  ) {
    const validation = field.validation as Record<string, unknown> | null;
    const constraints = validation?.fileConstraints as
      | { maxSizeBytes?: number; allowedMimeTypes?: string[] }
      | undefined;

    const fileSize = value.sizeBytes;
    const mimeType = value.mimeType;

    if (typeof fileSize !== "number") {
      throw new BadRequestException(`${field.label} file size is missing`);
    }
    if (typeof mimeType !== "string") {
      throw new BadRequestException(`${field.label} mime type is missing`);
    }

    const maxSize = constraints?.maxSizeBytes ?? FILE_SIZE_LIMIT;
    if (fileSize > maxSize) {
      throw new BadRequestException(`${field.label} exceeds max size`);
    }

    if (constraints?.allowedMimeTypes?.length) {
      if (!constraints.allowedMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          `${field.label} file type is not allowed`,
        );
      }
    } else if (
      !(FILE_VALIDATION.ALLOWED_MIME_TYPES as readonly string[]).includes(
        mimeType,
      )
    ) {
      throw new BadRequestException(`${field.label} file type is not allowed`);
    }
  }

  private async fetchProfileValues(
    tenantId: string,
    role: ProfileRole,
    profileId: string,
  ) {
    if (role === "student") {
      return this.prisma.client.studentProfileFieldValue.findMany({
        where: { tenantId, studentProfileId: profileId },
      });
    }

    return this.prisma.client.teacherProfileFieldValue.findMany({
      where: { tenantId, teacherProfileId: profileId },
    });
  }

  private async fetchProfileValuesByRole(
    tenantId: string,
    role: ProfileRole,
    profileIds: string[],
    fieldIds?: string[],
  ) {
    if (role === "student") {
      return this.prisma.client.studentProfileFieldValue.findMany({
        where: {
          tenantId,
          studentProfileId: { in: profileIds },
          ...(fieldIds && fieldIds.length > 0
            ? { fieldId: { in: fieldIds } }
            : {}),
        },
      });
    }

    return this.prisma.client.teacherProfileFieldValue.findMany({
      where: {
        tenantId,
        teacherProfileId: { in: profileIds },
        ...(fieldIds && fieldIds.length > 0
          ? { fieldId: { in: fieldIds } }
          : {}),
      },
    });
  }

  private buildFilterClause(
    role: ProfileRole,
    field: Prisma.TenantProfileFieldGetPayload<{}>,
    op: string,
    rawValue: unknown,
  ) {
    const allowedOps = PROFILE_FILTER_OPERATORS[field.type as ProfileFieldType];
    if (!allowedOps || !allowedOps.includes(op as never)) {
      throw new BadRequestException("Invalid filter operator");
    }

    const valueCondition = this.buildValueCondition(
      field.type as ProfileFieldType,
      op,
      rawValue,
    );

    if (role === "student") {
      return {
        customFieldValues: {
          some: {
            fieldId: field.id,
            ...valueCondition,
          },
        },
      } satisfies Prisma.StudentProfileWhereInput;
    }

    return {
      customFieldValues: {
        some: {
          fieldId: field.id,
          ...valueCondition,
        },
      },
    } satisfies Prisma.TeacherProfileWhereInput;
  }

  private buildValueCondition(
    fieldType: ProfileFieldType,
    op: string,
    rawValue: unknown,
  ) {
    switch (fieldType) {
      case "text":
        return this.buildTextCondition(op, rawValue);
      case "number":
        return this.buildNumberCondition(op, rawValue);
      case "date":
        return this.buildDateCondition(op, rawValue);
      case "boolean":
        return { valueBoolean: Boolean(rawValue) };
      case "select":
        return this.buildSelectCondition(op, rawValue);
      case "multiSelect":
        return this.buildMultiSelectCondition(op, rawValue);
      default:
        throw new BadRequestException("Unsupported filter field type");
    }
  }

  private buildTextCondition(op: string, rawValue: unknown) {
    const value = String(rawValue);
    switch (op) {
      case "eq":
        return { valueText: value };
      case "neq":
        return { valueText: { not: value } };
      case "contains":
        return { valueText: { contains: value } };
      case "startsWith":
        return { valueText: { startsWith: value } };
      case "endsWith":
        return { valueText: { endsWith: value } };
      case "in":
        if (!Array.isArray(rawValue)) {
          throw new BadRequestException("Value must be an array");
        }
        return { valueText: { in: rawValue as string[] } };
      default:
        throw new BadRequestException("Invalid operator for text field");
    }
  }

  private buildNumberCondition(op: string, rawValue: unknown) {
    switch (op) {
      case "eq":
        return { valueNumber: Number(rawValue) };
      case "neq":
        return { valueNumber: { not: Number(rawValue) } };
      case "gt":
        return { valueNumber: { gt: Number(rawValue) } };
      case "gte":
        return { valueNumber: { gte: Number(rawValue) } };
      case "lt":
        return { valueNumber: { lt: Number(rawValue) } };
      case "lte":
        return { valueNumber: { lte: Number(rawValue) } };
      case "between": {
        if (!Array.isArray(rawValue) || rawValue.length < 2) {
          throw new BadRequestException("Between requires [min, max]");
        }
        const [min, max] = rawValue as number[];
        return { valueNumber: { gte: min, lte: max } };
      }
      case "in":
        if (!Array.isArray(rawValue)) {
          throw new BadRequestException("Value must be an array");
        }
        return { valueNumber: { in: rawValue as number[] } };
      default:
        throw new BadRequestException("Invalid operator for number field");
    }
  }

  private buildDateCondition(op: string, rawValue: unknown) {
    switch (op) {
      case "eq":
        return { valueDate: new Date(String(rawValue)) };
      case "before":
        return { valueDate: { lt: new Date(String(rawValue)) } };
      case "after":
        return { valueDate: { gt: new Date(String(rawValue)) } };
      case "between": {
        if (!Array.isArray(rawValue) || rawValue.length < 2) {
          throw new BadRequestException("Between requires [start, end]");
        }
        const [start, end] = rawValue as string[];
        return { valueDate: { gte: new Date(start), lte: new Date(end) } };
      }
      default:
        throw new BadRequestException("Invalid operator for date field");
    }
  }

  private buildSelectCondition(op: string, rawValue: unknown) {
    const value = String(rawValue);
    switch (op) {
      case "eq":
        return { valueSelect: value };
      case "neq":
        return { valueSelect: { not: value } };
      case "in":
        if (!Array.isArray(rawValue)) {
          throw new BadRequestException("Value must be an array");
        }
        return { valueSelect: { in: rawValue as string[] } };
      default:
        throw new BadRequestException("Invalid operator for select field");
    }
  }

  private buildMultiSelectCondition(op: string, rawValue: unknown) {
    if (!Array.isArray(rawValue)) {
      throw new BadRequestException("Value must be an array");
    }
    switch (op) {
      case "hasAny":
        return { valueMultiSelect: { hasSome: rawValue as string[] } };
      case "hasAll":
        return { valueMultiSelect: { hasEvery: rawValue as string[] } };
      default:
        throw new BadRequestException("Invalid operator for multiSelect field");
    }
  }

  private async filterStudentProfiles(
    tenantId: string,
    dto: FilterProfilesDto,
    filterClauses: Prisma.StudentProfileWhereInput[],
    offset: number,
    limit: number,
  ) {
    const where: Prisma.StudentProfileWhereInput = { tenantId };
    const andFilters: Prisma.StudentProfileWhereInput[] = [];

    if (dto.search) {
      andFilters.push({
        OR: [
          { user: { name: { contains: dto.search, mode: "insensitive" } } },
          { user: { email: { contains: dto.search, mode: "insensitive" } } },
        ],
      });
    }

    const enrollmentFilter: Prisma.ClassEnrollmentWhereInput = {
      endDate: null,
      ...(dto.academicYearId
        ? { class: { academicYearId: dto.academicYearId } }
        : {}),
      ...(dto.classId && !dto.withoutClass ? { classId: dto.classId } : {}),
    };

    if (dto.withoutClass) {
      andFilters.push({
        classEnrollments: {
          none: enrollmentFilter,
        },
      });
    } else if (dto.academicYearId || dto.classId) {
      andFilters.push({
        classEnrollments: {
          some: enrollmentFilter,
        },
      });
    }

    if (filterClauses.length > 0) {
      andFilters.push(...filterClauses);
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.studentProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
          classEnrollments: {
            where: {
              endDate: null,
              ...(dto.academicYearId
                ? { class: { academicYearId: dto.academicYearId } }
                : {}),
            },
            orderBy: { startDate: "desc" },
            take: 1,
            select: {
              startDate: true,
              endDate: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  academicYearId: true,
                  academicYear: { select: { id: true, label: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.client.studentProfile.count({ where }),
    ]);

    const mapped = data.map((profile) => {
      const activeEnrollment = profile.classEnrollments[0];
      const currentClass = activeEnrollment
        ? {
            id: activeEnrollment.class.id,
            name: activeEnrollment.class.name,
            academicYearId: activeEnrollment.class.academicYearId,
            academicYearLabel:
              activeEnrollment.class.academicYear?.label ?? null,
          }
        : null;

      return {
        id: profile.id,
        tenantId: profile.tenantId,
        userId: profile.userId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        user: profile.user,
        currentClass,
      };
    });

    return { data: mapped, total };
  }

  private async filterTeacherProfiles(
    tenantId: string,
    dto: FilterProfilesDto,
    filterClauses: Prisma.TeacherProfileWhereInput[],
    offset: number,
    limit: number,
  ) {
    const where: Prisma.TeacherProfileWhereInput = { tenantId };
    const andFilters: Prisma.TeacherProfileWhereInput[] = [];

    if (dto.search) {
      andFilters.push({
        user: {
          OR: [
            { name: { contains: dto.search, mode: "insensitive" } },
            { email: { contains: dto.search, mode: "insensitive" } },
          ],
        },
      });
    }

    if (filterClauses.length > 0) {
      andFilters.push(...filterClauses);
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.teacherProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          hiredAt: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.client.teacherProfile.count({ where }),
    ]);

    return { data, total };
  }

  private async upsertProfileConfiguration(
    tenantId: string,
    data: {
      templateId: string | null;
      isCustomized: boolean;
      appliedAt: Date | null;
      templateHash?: string | null;
    },
  ) {
    await this.prisma.client.tenantConfiguration.upsert({
      where: {
        tenantId_configType: {
          tenantId,
          configType: PROFILE_CONFIGURATION_TYPE,
        },
      },
      create: {
        tenantId,
        configType: PROFILE_CONFIGURATION_TYPE,
        templateId: data.templateId,
        isCustomized: data.isCustomized,
        appliedAt: data.appliedAt,
        templateHash: data.templateHash ?? null,
      },
      update: {
        templateId: data.templateId,
        isCustomized: data.isCustomized,
        appliedAt: data.appliedAt,
        templateHash: data.templateHash ?? undefined,
      },
    });
  }

  private async markProfileConfigurationCustomized(tenantId: string) {
    await this.upsertProfileConfiguration(tenantId, {
      templateId: null,
      isCustomized: true,
      appliedAt: new Date(),
    });
  }

  private escapeCsv(value: string) {
    if (value.includes(",") || value.includes("\n") || value.includes('"')) {
      return `"${value.replace(/\"/g, '""')}"`;
    }
    return value;
  }

  private formatValueForExport(value: {
    valueText?: string | null;
    valueNumber?: number | null;
    valueDate?: Date | null;
    valueBoolean?: boolean | null;
    valueSelect?: string | null;
    valueMultiSelect?: string[] | null;
    valueFile?: Prisma.JsonValue | null;
  }) {
    if (value.valueText) return value.valueText;
    if (typeof value.valueNumber === "number") return String(value.valueNumber);
    if (value.valueDate) return value.valueDate.toISOString();
    if (typeof value.valueBoolean === "boolean")
      return value.valueBoolean ? "true" : "false";
    if (value.valueSelect) return value.valueSelect;
    if (value.valueMultiSelect?.length) return value.valueMultiSelect.join(";");
    if (value.valueFile) {
      const file = value.valueFile as { fileName?: string };
      return file.fileName ?? "";
    }
    return "";
  }
}
