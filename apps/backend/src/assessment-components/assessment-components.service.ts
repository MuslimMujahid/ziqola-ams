import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssessmentComponentDto } from "./dto/create-assessment-component.dto";
import { ListAssessmentComponentsDto } from "./dto/list-assessment-components.dto";
import { ListAssessmentTypeWeightsDto } from "./dto/list-assessment-type-weights.dto";
import { UpdateAssessmentComponentDto } from "./dto/update-assessment-component.dto";
import { UpsertAssessmentTypeWeightDto } from "./dto/upsert-assessment-type-weight.dto";

export type AssessmentComponentSummary = {
  id: string;
  tenantId: string;
  classSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  assessmentType: {
    id: string;
    key: string;
    label: string;
    isEnabled: boolean;
  };
  name: string;
  scoreSummary: {
    totalStudents: number;
    scoredStudents: number;
    isComplete: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentTypeWeightSummary = {
  id: string;
  tenantId: string;
  teacherSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentTypeWeightList = {
  weights: AssessmentTypeWeightSummary[];
  totalWeight: number;
};

type AssessmentActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

@Injectable()
export class AssessmentComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly componentSelect: Prisma.AssessmentComponentSelect = {
    id: true,
    tenantId: true,
    classSubjectId: true,
    academicPeriodId: true,
    assessmentTypeId: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    assessmentType: {
      select: { id: true, key: true, label: true, isEnabled: true },
    },
  } as const;

  private getAssessmentTypeWeightClient() {
    const client = this.prisma.client as unknown as {
      assessmentTypeWeight: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            tenantId: string;
            teacherSubjectId: string;
            academicPeriodId: string;
            assessmentTypeId: string;
            weight: number;
            createdAt: Date;
            updatedAt: Date;
          }>
        >;
        upsert: (args: unknown) => Promise<{
          id: string;
        }>;
      };
    };

    return client.assessmentTypeWeight;
  }

  private getTeacherSubjectClient() {
    const client = this.prisma.client as unknown as {
      teacherSubject: {
        findFirst: (args: unknown) => Promise<{
          id: string;
          teacherProfileId: string;
          subjectId: string;
        } | null>;
      };
    };

    return client.teacherSubject;
  }

  private mapComponent(item: {
    id: string;
    tenantId: string;
    classSubjectId: string;
    academicPeriodId: string;
    assessmentTypeId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    assessmentType: {
      id: string;
      key: string;
      label: string;
      isEnabled: boolean;
    };
    scoreSummary?: {
      totalStudents: number;
      scoredStudents: number;
      isComplete: boolean;
    };
  }): AssessmentComponentSummary {
    const scoreSummary = item.scoreSummary ?? {
      totalStudents: 0,
      scoredStudents: 0,
      isComplete: false,
    };

    return {
      id: item.id,
      tenantId: item.tenantId,
      classSubjectId: item.classSubjectId,
      academicPeriodId: item.academicPeriodId,
      assessmentTypeId: item.assessmentTypeId,
      assessmentType: item.assessmentType,
      name: item.name,
      scoreSummary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async getClassRosterIds(params: {
    tenantId: string;
    classId: string;
    referenceDate: Date;
  }) {
    const { tenantId, classId, referenceDate } = params;

    const roster = await this.prisma.client.classEnrollment.findMany({
      where: {
        tenantId,
        classId,
        startDate: { lte: referenceDate },
        OR: [{ endDate: null }, { endDate: { gte: referenceDate } }],
      },
      select: { studentProfileId: true },
    });

    return roster.map((item) => item.studentProfileId);
  }

  private mapTypeWeight(item: {
    id: string;
    tenantId: string;
    teacherSubjectId: string;
    academicPeriodId: string;
    assessmentTypeId: string;
    weight: number;
    createdAt: Date;
    updatedAt: Date;
  }): AssessmentTypeWeightSummary {
    return {
      id: item.id,
      tenantId: item.tenantId,
      teacherSubjectId: item.teacherSubjectId,
      academicPeriodId: item.academicPeriodId,
      assessmentTypeId: item.assessmentTypeId,
      weight: item.weight,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async resolveTeacherProfileId(tenantId: string, userId: string) {
    const teacherProfile = await this.prisma.client.teacherProfile.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!teacherProfile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return teacherProfile.id;
  }

  private async resolveAcademicPeriod(tenantId: string, id: string) {
    const period = await this.prisma.client.academicPeriod.findFirst({
      where: { id, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!period) {
      throw new NotFoundException("Academic period not found");
    }

    return period;
  }

  private async resolveTeacherSubject(tenantId: string, id: string) {
    const teacherSubject = await this.getTeacherSubjectClient().findFirst({
      where: { id, tenantId },
      select: { id: true, teacherProfileId: true, subjectId: true },
    });

    if (!teacherSubject) {
      throw new NotFoundException("Teacher subject not found");
    }

    return teacherSubject;
  }

  private async resolveClassSubject(
    tenantId: string,
    id: string,
    actor: AssessmentActor,
  ) {
    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: { id, tenantId, isDeleted: false },
      select: {
        id: true,
        classId: true,
        academicYearId: true,
        teacherProfileId: true,
      },
    });

    if (!classSubject) {
      throw new NotFoundException("Class subject not found");
    }

    if (actor.role === Role.TEACHER) {
      const teacherProfileId = await this.resolveTeacherProfileId(
        tenantId,
        actor.sub,
      );

      if (classSubject.teacherProfileId !== teacherProfileId) {
        throw new ForbiddenException(
          "Teacher cannot access this class subject",
        );
      }
    }

    return classSubject;
  }

  private async ensureAssessmentType(
    tenantId: string,
    assessmentTypeId: string,
  ) {
    const assessmentType =
      await this.prisma.client.tenantAssessmentType.findFirst({
        where: { id: assessmentTypeId, tenantId, isEnabled: true },
        select: { id: true },
      });

    if (!assessmentType) {
      throw new NotFoundException("Assessment type not found or disabled");
    }

    return assessmentType;
  }

  private async ensureAcademicPeriodMatch(
    tenantId: string,
    classSubjectId: string,
    academicPeriodId: string,
    actor: AssessmentActor,
  ) {
    const [classSubject, academicPeriod] = await Promise.all([
      this.resolveClassSubject(tenantId, classSubjectId, actor),
      this.resolveAcademicPeriod(tenantId, academicPeriodId),
    ]);

    if (classSubject.academicYearId !== academicPeriod.academicYearId) {
      throw new BadRequestException(
        "Academic period does not match class subject academic year",
      );
    }

    return { classSubject, academicPeriod };
  }

  private async ensureTeacherSubjectPeriodMatch(
    tenantId: string,
    teacherSubjectId: string,
    academicPeriodId: string,
    actor: AssessmentActor,
  ) {
    const [teacherSubject, academicPeriod] = await Promise.all([
      this.resolveTeacherSubject(tenantId, teacherSubjectId),
      this.resolveAcademicPeriod(tenantId, academicPeriodId),
    ]);

    if (actor.role === Role.TEACHER) {
      const teacherProfileId = await this.resolveTeacherProfileId(
        tenantId,
        actor.sub,
      );

      if (teacherSubject.teacherProfileId !== teacherProfileId) {
        throw new ForbiddenException(
          "Teacher cannot access this teacher subject",
        );
      }
    }

    const hasAssignment = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        academicYearId: academicPeriod.academicYearId,
        subjectId: teacherSubject.subjectId,
        teacherProfileId: teacherSubject.teacherProfileId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!hasAssignment) {
      throw new BadRequestException(
        "Teacher subject is not assigned in this academic year",
      );
    }

    return { teacherSubject, academicPeriod };
  }

  async listComponents(
    tenantId: string,
    query: ListAssessmentComponentsDto,
    actor: AssessmentActor,
  ) {
    if (!query.classSubjectId || !query.academicPeriodId) {
      throw new BadRequestException(
        "classSubjectId and academicPeriodId are required",
      );
    }

    const { classSubject } = await this.ensureAcademicPeriodMatch(
      tenantId,
      query.classSubjectId,
      query.academicPeriodId,
      actor,
    );

    const items = await this.prisma.client.assessmentComponent.findMany({
      where: {
        tenantId,
        classSubjectId: query.classSubjectId,
        academicPeriodId: query.academicPeriodId,
      },
      orderBy: { createdAt: "asc" },
      select: this.componentSelect,
    });

    const rosterIds = await this.getClassRosterIds({
      tenantId,
      classId: classSubject.classId,
      referenceDate: new Date(),
    });

    const componentIds = items.map((item) => item.id);
    const scoreCounts =
      rosterIds.length && componentIds.length
        ? await this.prisma.client.assessmentScore.groupBy({
            by: ["componentId"],
            where: {
              tenantId,
              componentId: { in: componentIds },
              studentProfileId: { in: rosterIds },
            },
            _count: { _all: true },
          })
        : [];

    const scoreCountMap = new Map(
      scoreCounts.map((item) => [item.componentId, item._count._all]),
    );
    const totalStudents = rosterIds.length;

    return items.map((item) =>
      this.mapComponent({
        ...item,
        scoreSummary: {
          totalStudents,
          scoredStudents: scoreCountMap.get(item.id) ?? 0,
          isComplete:
            totalStudents > 0 &&
            (scoreCountMap.get(item.id) ?? 0) === totalStudents,
        },
      }),
    );
  }

  async createComponent(
    tenantId: string,
    dto: CreateAssessmentComponentDto,
    actor: AssessmentActor,
  ) {
    await this.ensureAcademicPeriodMatch(
      tenantId,
      dto.classSubjectId,
      dto.academicPeriodId,
      actor,
    );
    await this.ensureAssessmentType(tenantId, dto.assessmentTypeId);

    const created = await this.prisma.client.assessmentComponent.create({
      data: {
        tenantId,
        classSubjectId: dto.classSubjectId,
        academicPeriodId: dto.academicPeriodId,
        assessmentTypeId: dto.assessmentTypeId,
        name: dto.name.trim(),
        weight: 0,
      },
      select: this.componentSelect,
    });

    return this.mapComponent(created);
  }

  async updateComponent(
    tenantId: string,
    id: string,
    dto: UpdateAssessmentComponentDto,
    actor: AssessmentActor,
  ) {
    const component = await this.prisma.client.assessmentComponent.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        classSubjectId: true,
        academicPeriodId: true,
        assessmentTypeId: true,
        name: true,
      },
    });

    if (!component) {
      throw new NotFoundException("Assessment component not found");
    }

    await this.ensureAcademicPeriodMatch(
      tenantId,
      component.classSubjectId,
      component.academicPeriodId,
      actor,
    );

    const lockedScore = await this.prisma.client.assessmentScore.findFirst({
      where: { componentId: component.id, isLocked: true },
      select: { id: true },
    });

    if (lockedScore) {
      throw new ConflictException("Scores are locked for this component");
    }

    if (dto.assessmentTypeId) {
      await this.ensureAssessmentType(tenantId, dto.assessmentTypeId);
    }

    const updated = await this.prisma.client.assessmentComponent.update({
      where: { id: component.id },
      data: {
        name: dto.name?.trim() ?? component.name,
        assessmentTypeId: dto.assessmentTypeId ?? component.assessmentTypeId,
      },
      select: this.componentSelect,
    });

    return this.mapComponent(updated);
  }

  async deleteComponent(tenantId: string, id: string, actor: AssessmentActor) {
    const component = await this.prisma.client.assessmentComponent.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        classSubjectId: true,
        academicPeriodId: true,
      },
    });

    if (!component) {
      throw new NotFoundException("Assessment component not found");
    }

    await this.ensureAcademicPeriodMatch(
      tenantId,
      component.classSubjectId,
      component.academicPeriodId,
      actor,
    );

    await this.prisma.client.$transaction(async (tx) => {
      await tx.assessmentScore.deleteMany({
        where: { tenantId, componentId: component.id },
      });

      await tx.assessmentComponent.delete({
        where: { id: component.id },
      });
    });

    return { id: component.id };
  }

  async listTypeWeights(
    tenantId: string,
    query: ListAssessmentTypeWeightsDto,
    actor: AssessmentActor,
  ): Promise<AssessmentTypeWeightList> {
    await this.ensureTeacherSubjectPeriodMatch(
      tenantId,
      query.teacherSubjectId,
      query.academicPeriodId,
      actor,
    );

    const weights = await this.getAssessmentTypeWeightClient().findMany({
      where: {
        tenantId,
        teacherSubjectId: query.teacherSubjectId,
        academicPeriodId: query.academicPeriodId,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        tenantId: true,
        teacherSubjectId: true,
        academicPeriodId: true,
        assessmentTypeId: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalWeight = weights.reduce((total, item) => total + item.weight, 0);

    return {
      weights: weights.map((item) => this.mapTypeWeight(item)),
      totalWeight,
    };
  }

  async upsertTypeWeight(
    tenantId: string,
    dto: UpsertAssessmentTypeWeightDto,
    actor: AssessmentActor,
  ): Promise<AssessmentTypeWeightList> {
    await this.ensureTeacherSubjectPeriodMatch(
      tenantId,
      dto.teacherSubjectId,
      dto.academicPeriodId,
      actor,
    );
    await this.ensureAssessmentType(tenantId, dto.assessmentTypeId);

    await this.getAssessmentTypeWeightClient().upsert({
      where: {
        teacherSubjectId_academicPeriodId_assessmentTypeId: {
          teacherSubjectId: dto.teacherSubjectId,
          academicPeriodId: dto.academicPeriodId,
          assessmentTypeId: dto.assessmentTypeId,
        },
      },
      create: {
        tenantId,
        teacherSubjectId: dto.teacherSubjectId,
        academicPeriodId: dto.academicPeriodId,
        assessmentTypeId: dto.assessmentTypeId,
        weight: dto.weight,
      },
      update: { weight: dto.weight },
    });

    return this.listTypeWeights(
      tenantId,
      {
        teacherSubjectId: dto.teacherSubjectId,
        academicPeriodId: dto.academicPeriodId,
      },
      actor,
    );
  }
}
