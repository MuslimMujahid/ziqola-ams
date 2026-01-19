import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { CreateAcademicPeriodDto } from "./dto/create-academic-period.dto";
import { CreateAcademicSetupDto } from "./dto/create-academic-setup.dto";
import { CreateAcademicOnboardingDto } from "./dto/create-academic-onboarding.dto";
import { AcademicYearQueryDto } from "./dto/academic-year-query.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";
import { AcademicPeriodQueryDto } from "./dto/academic-period-query.dto";
import { UpdateAcademicPeriodDto } from "./dto/update-academic-period.dto";
import { AcademicStatus, PeriodStatus, type Prisma } from "@repo/db";

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  private validateDateRange(
    startDate?: string,
    endDate?: string,
    errorMessage = "End date must be on or after start date",
  ) {
    if (!startDate || !endDate) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    if (start > end) {
      throw new BadRequestException(errorMessage);
    }
  }

  private ensurePeriodWithinYearRange(
    academicYear: { startDate?: Date | null; endDate?: Date | null },
    startDate?: string,
    endDate?: string,
  ) {
    if (!startDate || !endDate) {
      return;
    }

    if (!academicYear.startDate && !academicYear.endDate) {
      return;
    }

    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      return;
    }

    const yearStart = academicYear.startDate
      ? new Date(academicYear.startDate)
      : null;
    const yearEnd = academicYear.endDate
      ? new Date(academicYear.endDate)
      : null;

    if (yearStart && periodStart < yearStart) {
      throw new BadRequestException(
        "Academic period must start on or after academic year start date",
      );
    }

    if (yearEnd && periodEnd > yearEnd) {
      throw new BadRequestException(
        "Academic period must end on or before academic year end date",
      );
    }
  }

  private async ensureNoPeriodOverlap(options: {
    tenantId: string;
    academicYearId: string;
    startDate?: string;
    endDate?: string;
    excludeId?: string;
  }) {
    const { tenantId, academicYearId, startDate, endDate, excludeId } = options;

    if (!startDate || !endDate) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    const overlap = await this.prisma.client.academicPeriod.findFirst({
      where: {
        tenantId,
        academicYearId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new BadRequestException(
        "Academic period dates overlap with an existing period",
      );
    }
  }

  private async ensureYearStartsAfterLatestPeriod(
    tenantId: string,
    startDate?: string,
  ) {
    if (!startDate) {
      return;
    }

    const start = new Date(startDate);

    if (Number.isNaN(start.getTime())) {
      return;
    }

    const latest = await this.prisma.client.academicPeriod.aggregate({
      where: {
        tenantId,
        academicYear: { deletedAt: null },
      },
      _max: { endDate: true },
    });

    const latestEnd = latest._max.endDate;

    if (latestEnd && start <= latestEnd) {
      throw new BadRequestException(
        "Academic year must start after the latest academic period ends",
      );
    }
  }

  private async ensureNoYearOverlap(options: {
    tenantId: string;
    startDate?: string;
    endDate?: string;
    excludeId?: string;
  }) {
    const { tenantId, startDate, endDate, excludeId } = options;

    if (!startDate || !endDate) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    const overlap = await this.prisma.client.academicYear.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new BadRequestException(
        "Academic year dates overlap with an existing academic year",
      );
    }
  }

  private async reorderAcademicPeriods(
    tx: Prisma.TransactionClient,
    tenantId: string,
    academicYearId: string,
  ) {
    const periods = await tx.academicPeriod.findMany({
      where: { tenantId, academicYearId },
      orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    await Promise.all(
      periods.map((period, index) =>
        tx.academicPeriod.update({
          where: { id: period.id },
          data: { orderIndex: index + 1 },
          select: { id: true },
        }),
      ),
    );
  }

  async getContext(tenantId: string) {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, activeAcademicYearId: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const activeYear = tenant.activeAcademicYearId
      ? await this.prisma.client.academicYear.findFirst({
          where: {
            id: tenant.activeAcademicYearId,
            tenantId,
            deletedAt: null,
          },
          select: {
            id: true,
            label: true,
            status: true,
            startDate: true,
            endDate: true,
            activePeriodId: true,
          },
        })
      : null;

    const yearFallback =
      activeYear ??
      (await this.prisma.client.academicYear.findFirst({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
        },
      }));

    const period = yearFallback?.activePeriodId
      ? await this.prisma.client.academicPeriod.findFirst({
          where: { id: yearFallback.activePeriodId, tenantId },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            orderIndex: true,
            status: true,
            academicYearId: true,
          },
        })
      : null;

    return {
      year: yearFallback,
      period,
    };
  }

  async createAcademicYear(tenantId: string, dto: CreateAcademicYearDto) {
    this.validateDateRange(dto.startDate, dto.endDate);
    await this.ensureYearStartsAfterLatestPeriod(tenantId, dto.startDate);
    await this.ensureNoYearOverlap({
      tenantId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    const shouldActivate = dto.makeActive !== false;

    const yearData: Prisma.AcademicYearUncheckedCreateInput = {
      tenantId,
      label: dto.label,
      status: shouldActivate ? AcademicStatus.ACTIVE : AcademicStatus.ARCHIVED,
    };

    if (dto.startDate) {
      yearData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      yearData.endDate = new Date(dto.endDate);
    }

    const academicYear = await this.prisma.client.$transaction(async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: tenantId },
        select: { activeAcademicYearId: true },
      });

      const created = await tx.academicYear.create({
        data: yearData,
        select: {
          id: true,
          tenantId: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
          createdAt: true,
        },
      });

      if (shouldActivate) {
        if (
          tenant?.activeAcademicYearId &&
          tenant.activeAcademicYearId !== created.id
        ) {
          await tx.academicYear.updateMany({
            where: {
              id: tenant.activeAcademicYearId,
              deletedAt: null,
            },
            data: { status: AcademicStatus.ARCHIVED },
          });
        }

        await tx.tenant.update({
          where: { id: tenantId },
          data: { activeAcademicYearId: created.id },
          select: { id: true },
        });
      }

      return created;
    });

    return academicYear;
  }

  async createAcademicPeriod(tenantId: string, dto: CreateAcademicPeriodDto) {
    this.validateDateRange(dto.startDate, dto.endDate);
    const academicYear = await this.prisma.client.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId, deletedAt: null },
      select: {
        id: true,
        activePeriodId: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }

    this.ensurePeriodWithinYearRange(academicYear, dto.startDate, dto.endDate);
    await this.ensureNoPeriodOverlap({
      tenantId,
      academicYearId: academicYear.id,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    return this.prisma.client.$transaction(async (tx) => {
      const periodData: Prisma.AcademicPeriodUncheckedCreateInput = {
        tenantId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        orderIndex: 1,
        status: dto.status ?? PeriodStatus.DRAFT,
      };

      const period = await tx.academicPeriod.create({
        data: periodData,
        select: {
          id: true,
          tenantId: true,
          academicYearId: true,
          name: true,
          startDate: true,
          endDate: true,
          orderIndex: true,
          status: true,
          createdAt: true,
        },
      });

      if (dto.makeActive !== false) {
        if (
          academicYear.activePeriodId &&
          academicYear.activePeriodId !== period.id
        ) {
          await tx.academicPeriod.updateMany({
            where: { id: academicYear.activePeriodId, tenantId },
            data: { status: PeriodStatus.ARCHIVED },
          });
        }

        await tx.academicYear.update({
          where: { id: academicYear.id },
          data: { activePeriodId: period.id },
          select: { id: true },
        });
      }

      await this.reorderAcademicPeriods(tx, tenantId, dto.academicYearId);

      return period;
    });
  }

  async getAcademicPeriods(tenantId: string, query: AcademicPeriodQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "asc";

    let academicYearId = query.academicYearId;

    if (!academicYearId) {
      const tenant = await this.prisma.client.tenant.findFirst({
        where: { id: tenantId },
        select: { activeAcademicYearId: true },
      });

      academicYearId = tenant?.activeAcademicYearId ?? undefined;
    }

    if (!academicYearId) {
      throw new BadRequestException(
        "Academic year is required to list academic periods",
      );
    }

    const academicYear = await this.prisma.client.academicYear.findFirst({
      where: { id: academicYearId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }

    const where: Prisma.AcademicPeriodWhereInput = {
      tenantId,
      academicYearId,
    };

    if (query.status) {
      where.status = query.status as PeriodStatus;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.academicPeriod.findMany({
        where,
        orderBy: [{ startDate: order }, { endDate: order }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          academicYearId: true,
          name: true,
          startDate: true,
          endDate: true,
          orderIndex: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.client.academicPeriod.count({ where }),
    ]);

    return {
      data,
      total,
    };
  }

  async updateAcademicPeriod(
    tenantId: string,
    id: string,
    dto: UpdateAcademicPeriodDto,
  ) {
    const existing = await this.prisma.client.academicPeriod.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        academicYearId: true,
        name: true,
        startDate: true,
        endDate: true,
        orderIndex: true,
        status: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Academic period not found");
    }

    const academicYear = await this.prisma.client.academicYear.findFirst({
      where: { id: existing.academicYearId, tenantId, deletedAt: null },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
      },
    });

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }

    const resolvedStart = dto.startDate ?? existing.startDate?.toISOString();
    const resolvedEnd = dto.endDate ?? existing.endDate?.toISOString();

    this.validateDateRange(resolvedStart, resolvedEnd);
    this.ensurePeriodWithinYearRange(academicYear, resolvedStart, resolvedEnd);
    await this.ensureNoPeriodOverlap({
      tenantId,
      academicYearId: academicYear.id,
      startDate: resolvedStart,
      endDate: resolvedEnd,
      excludeId: id,
    });

    const updateData: Prisma.AcademicPeriodUncheckedUpdateInput = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    if (dto.status) {
      updateData.status = dto.status as PeriodStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    return this.prisma.client.$transaction(async (tx) => {
      if (
        dto.status === PeriodStatus.ARCHIVED &&
        academicYear.activePeriodId === id
      ) {
        await tx.academicYear.update({
          where: { id: academicYear.id },
          data: { activePeriodId: null },
          select: { id: true },
        });
      }

      const updated = await tx.academicPeriod.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          tenantId: true,
          academicYearId: true,
          name: true,
          startDate: true,
          endDate: true,
          orderIndex: true,
          status: true,
          createdAt: true,
        },
      });

      await this.reorderAcademicPeriods(tx, tenantId, academicYear.id);

      return updated;
    });
  }

  async activateAcademicPeriod(tenantId: string, id: string) {
    const period = await this.prisma.client.academicPeriod.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        academicYearId: true,
        name: true,
        startDate: true,
        endDate: true,
        orderIndex: true,
        status: true,
        createdAt: true,
        academicYear: { select: { id: true, activePeriodId: true } },
      },
    });

    if (!period) {
      throw new NotFoundException("Academic period not found");
    }

    return this.prisma.client.$transaction(async (tx) => {
      if (
        period.academicYear.activePeriodId &&
        period.academicYear.activePeriodId !== id
      ) {
        await tx.academicPeriod.updateMany({
          where: { id: period.academicYear.activePeriodId, tenantId },
          data: { status: PeriodStatus.ARCHIVED },
        });
      }

      const updated = await tx.academicPeriod.update({
        where: { id },
        data: {
          status:
            period.status === PeriodStatus.ARCHIVED
              ? PeriodStatus.DRAFT
              : period.status,
        },
        select: {
          id: true,
          tenantId: true,
          academicYearId: true,
          name: true,
          startDate: true,
          endDate: true,
          orderIndex: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.academicYear.update({
        where: { id: period.academicYearId },
        data: { activePeriodId: id },
        select: { id: true },
      });

      return updated;
    });
  }

  async getAcademicYears(tenantId: string, query: AcademicYearQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 10;
    const order = query.order ?? "desc";

    const where: Prisma.AcademicYearWhereInput = { tenantId, deletedAt: null };

    if (query.status) {
      where.status = query.status as AcademicStatus;
    }

    if (query.search) {
      where.label = { contains: query.search, mode: "insensitive" };
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.academicYear.findMany({
        where,
        orderBy: { createdAt: order },
        skip: offset,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
          createdAt: true,
        },
      }),
      this.prisma.client.academicYear.count({ where }),
    ]);

    return {
      data,
      total,
    };
  }

  async updateAcademicYear(
    tenantId: string,
    id: string,
    dto: UpdateAcademicYearDto,
  ) {
    const existing = await this.prisma.client.academicYear.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        status: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
        label: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Academic year not found");
    }

    const resolvedStart = dto.startDate ?? existing.startDate?.toISOString();
    const resolvedEnd = dto.endDate ?? existing.endDate?.toISOString();

    this.validateDateRange(
      resolvedStart,
      resolvedEnd,
      "End date must be on or after start date",
    );
    await this.ensureNoYearOverlap({
      tenantId,
      startDate: resolvedStart,
      endDate: resolvedEnd,
      excludeId: id,
    });

    const updateData: Prisma.AcademicYearUncheckedUpdateInput = {};

    if (dto.label) {
      updateData.label = dto.label;
    }

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const updated = await this.prisma.client.academicYear.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        label: true,
        status: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async deleteAcademicYear(tenantId: string, id: string) {
    const existing = await this.prisma.client.academicYear.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        status: true,
        label: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Academic year not found");
    }

    if (existing.status !== AcademicStatus.ARCHIVED) {
      throw new BadRequestException(
        "Only archived academic years can be deleted",
      );
    }

    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: tenantId },
      select: { activeAcademicYearId: true },
    });

    if (tenant?.activeAcademicYearId === id) {
      throw new BadRequestException(
        "Cannot delete the currently active academic year",
      );
    }

    return this.prisma.client.academicYear.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        tenantId: true,
        label: true,
        status: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
        createdAt: true,
      },
    });
  }

  async activateAcademicYear(tenantId: string, id: string) {
    const target = await this.prisma.client.academicYear.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        label: true,
        status: true,
        startDate: true,
        endDate: true,
        activePeriodId: true,
        createdAt: true,
      },
    });

    if (!target) {
      throw new NotFoundException("Academic year not found");
    }

    return this.prisma.client.$transaction(async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: tenantId },
        select: { activeAcademicYearId: true },
      });

      const previousActiveId = tenant?.activeAcademicYearId;

      if (previousActiveId && previousActiveId !== id) {
        await tx.academicYear.updateMany({
          where: { id: previousActiveId, deletedAt: null },
          data: { status: AcademicStatus.ARCHIVED },
        });
      }

      const activatedYear = await tx.academicYear.update({
        where: { id },
        data: { status: AcademicStatus.ACTIVE },
        select: {
          id: true,
          tenantId: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
          createdAt: true,
        },
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: { activeAcademicYearId: id },
        select: { id: true },
      });

      return activatedYear;
    });
  }

  async createAcademicSetup(tenantId: string, dto: CreateAcademicSetupDto) {
    this.validateDateRange(
      dto.year.startDate,
      dto.year.endDate,
      "Year end date must be on or after start date",
    );

    await this.ensureYearStartsAfterLatestPeriod(tenantId, dto.year.startDate);

    this.validateDateRange(
      dto.period.startDate,
      dto.period.endDate,
      "Period end date must be on or after start date",
    );
    return this.prisma.client.$transaction(async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: tenantId },
        select: { activeAcademicYearId: true },
      });

      const yearData: Prisma.AcademicYearUncheckedCreateInput = {
        tenantId,
        label: dto.year.label,
        status: AcademicStatus.ACTIVE,
      };

      if (dto.year.startDate) {
        yearData.startDate = new Date(dto.year.startDate);
      }

      if (dto.year.endDate) {
        yearData.endDate = new Date(dto.year.endDate);
      }

      const academicYear = await tx.academicYear.create({
        data: yearData,
        select: {
          id: true,
          tenantId: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
          createdAt: true,
        },
      });

      this.ensurePeriodWithinYearRange(
        academicYear,
        dto.period.startDate,
        dto.period.endDate,
      );

      if (
        tenant?.activeAcademicYearId &&
        tenant.activeAcademicYearId !== academicYear.id
      ) {
        await tx.academicYear.updateMany({
          where: {
            id: tenant.activeAcademicYearId,
            deletedAt: null,
          },
          data: { status: AcademicStatus.ARCHIVED },
        });
      }

      await tx.tenant.update({
        where: { id: tenantId },
        data: { activeAcademicYearId: academicYear.id },
        select: { id: true },
      });

      const periodData: Prisma.AcademicPeriodUncheckedCreateInput = {
        tenantId,
        academicYearId: academicYear.id,
        name: dto.period.name,
        startDate: new Date(dto.period.startDate),
        endDate: new Date(dto.period.endDate),
        orderIndex: 1,
        status: dto.period.status ?? PeriodStatus.DRAFT,
      };

      const period = await tx.academicPeriod.create({
        data: periodData,
        select: {
          id: true,
          tenantId: true,
          academicYearId: true,
          name: true,
          startDate: true,
          endDate: true,
          orderIndex: true,
          status: true,
          createdAt: true,
        },
      });

      if (dto.period.makeActive !== false) {
        await tx.academicYear.update({
          where: { id: academicYear.id },
          data: { activePeriodId: period.id },
          select: { id: true },
        });
      }

      await this.reorderAcademicPeriods(tx, tenantId, academicYear.id);
      const yearWithActivePeriodId =
        dto.period.makeActive !== false
          ? { ...academicYear, activePeriodId: period.id }
          : academicYear;

      return { year: yearWithActivePeriodId, period };
    });
  }

  async createAcademicOnboarding(
    tenantId: string,
    dto: CreateAcademicOnboardingDto,
  ) {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, activeAcademicYearId: true },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const activeYear = tenant.activeAcademicYearId
      ? await this.prisma.client.academicYear.findFirst({
          where: {
            id: tenant.activeAcademicYearId,
            tenantId,
            deletedAt: null,
          },
          select: {
            id: true,
            label: true,
            status: true,
            startDate: true,
            endDate: true,
            activePeriodId: true,
          },
        })
      : null;

    const yearFallback =
      activeYear ??
      (await this.prisma.client.academicYear.findFirst({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          status: true,
          startDate: true,
          endDate: true,
          activePeriodId: true,
        },
      }));

    if (yearFallback) {
      const period = await this.createAcademicPeriod(tenantId, {
        academicYearId: yearFallback.id,
        name: dto.period.name,
        startDate: dto.period.startDate,
        endDate: dto.period.endDate,
        status: dto.period.status,
        makeActive: dto.period.makeActive,
      });

      if (!tenant.activeAcademicYearId) {
        await this.prisma.client.tenant.update({
          where: { id: tenantId },
          data: { activeAcademicYearId: yearFallback.id },
          select: { id: true },
        });
      }

      return {
        year: { ...yearFallback, activePeriodId: period.id },
        period,
      };
    }

    if (!dto.year) {
      throw new BadRequestException("Academic year is required");
    }

    return this.createAcademicSetup(tenantId, {
      year: dto.year,
      period: dto.period,
    });
  }
}
