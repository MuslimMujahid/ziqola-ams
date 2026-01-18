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
import { AcademicStatus, PeriodStatus, type Prisma } from "@repo/db";

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

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
          where: { id: tenant.activeAcademicYearId, tenantId },
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
        where: { tenantId },
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
    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (start > end) {
          throw new BadRequestException(
            "End date must be on or after start date",
          );
        }
      }
    }
    const yearData: Prisma.AcademicYearUncheckedCreateInput = {
      tenantId,
      label: dto.label,
      status: dto.status ?? AcademicStatus.ACTIVE,
    };

    if (dto.startDate) {
      yearData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      yearData.endDate = new Date(dto.endDate);
    }

    const academicYear = await this.prisma.client.academicYear.create({
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

    if (dto.makeActive !== false) {
      await this.prisma.client.tenant.update({
        where: { id: tenantId },
        data: { activeAcademicYearId: academicYear.id },
        select: { id: true },
      });
    }

    return academicYear;
  }

  async createAcademicPeriod(tenantId: string, dto: CreateAcademicPeriodDto) {
    {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (start > end) {
          throw new BadRequestException(
            "End date must be on or after start date",
          );
        }
      }
    }
    const academicYear = await this.prisma.client.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId },
      select: { id: true, activePeriodId: true },
    });

    if (!academicYear) {
      throw new NotFoundException("Academic year not found");
    }

    const existingCount = await this.prisma.client.academicPeriod.count({
      where: { tenantId, academicYearId: dto.academicYearId },
    });

    const periodData: Prisma.AcademicPeriodUncheckedCreateInput = {
      tenantId,
      academicYearId: dto.academicYearId,
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      orderIndex: dto.orderIndex ?? existingCount + 1,
      status: dto.status ?? PeriodStatus.DRAFT,
    };

    const period = await this.prisma.client.academicPeriod.create({
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
      await this.prisma.client.academicYear.update({
        where: { id: academicYear.id },
        data: { activePeriodId: period.id },
        select: { id: true },
      });
    }

    return period;
  }

  async createAcademicSetup(tenantId: string, dto: CreateAcademicSetupDto) {
    if (dto.year.startDate && dto.year.endDate) {
      const start = new Date(dto.year.startDate);
      const end = new Date(dto.year.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (start > end) {
          throw new BadRequestException(
            "Year end date must be on or after start date",
          );
        }
      }
    }

    {
      const start = new Date(dto.period.startDate);
      const end = new Date(dto.period.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (start > end) {
          throw new BadRequestException(
            "Period end date must be on or after start date",
          );
        }
      }
    }
    return this.prisma.client.$transaction(async (tx) => {
      const yearData: Prisma.AcademicYearUncheckedCreateInput = {
        tenantId,
        label: dto.year.label,
        status: dto.year.status ?? AcademicStatus.ACTIVE,
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

      if (dto.year.makeActive !== false) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { activeAcademicYearId: academicYear.id },
          select: { id: true },
        });
      }

      const existingCount = await tx.academicPeriod.count({
        where: { tenantId, academicYearId: academicYear.id },
      });

      const periodData: Prisma.AcademicPeriodUncheckedCreateInput = {
        tenantId,
        academicYearId: academicYear.id,
        name: dto.period.name,
        startDate: new Date(dto.period.startDate),
        endDate: new Date(dto.period.endDate),
        orderIndex: dto.period.orderIndex ?? existingCount + 1,
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
          where: { id: tenant.activeAcademicYearId, tenantId },
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
        where: { tenantId },
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
        orderIndex: dto.period.orderIndex,
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
