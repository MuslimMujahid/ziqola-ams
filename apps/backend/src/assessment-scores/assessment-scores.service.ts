import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import { ListAssessmentScoresDto, UpsertAssessmentScoresDto } from "./dto";

export type AssessmentScoreStudentSummary = {
  studentProfileId: string;
  studentName: string;
  score: number | null;
  isLocked: boolean;
};

export type AssessmentScoreSummary = {
  component: {
    id: string;
    name: string;
    assessmentTypeId: string;
    assessmentTypeLabel: string;
  };
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  academicPeriod: {
    id: string;
    name: string;
  };
  students: AssessmentScoreStudentSummary[];
};

type AssessmentActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

@Injectable()
export class AssessmentScoresService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async resolveComponentContext(tenantId: string, componentId: string) {
    const component = await this.prisma.client.assessmentComponent.findFirst({
      where: { id: componentId, tenantId },
      select: {
        id: true,
        name: true,
        assessmentTypeId: true,
        assessmentType: {
          select: {
            id: true,
            label: true,
          },
        },
        classSubjectId: true,
        academicPeriodId: true,
        classSubject: {
          select: {
            id: true,
            classId: true,
            academicYearId: true,
            teacherProfileId: true,
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
        academicPeriod: {
          select: { id: true, name: true, academicYearId: true },
        },
      },
    });

    if (!component) {
      throw new NotFoundException("Assessment component not found");
    }

    if (
      component.classSubject.academicYearId !==
      component.academicPeriod.academicYearId
    ) {
      throw new BadRequestException(
        "Academic period does not match class subject academic year",
      );
    }

    return component;
  }

  private async ensureTeacherAccess(
    tenantId: string,
    teacherProfileId: string,
    actor: AssessmentActor,
  ) {
    if (actor.role !== Role.TEACHER) return;

    const currentTeacherProfileId = await this.resolveTeacherProfileId(
      tenantId,
      actor.sub,
    );

    if (currentTeacherProfileId !== teacherProfileId) {
      throw new ForbiddenException(
        "Teacher cannot access scores for this component",
      );
    }
  }

  private async getClassRoster(params: {
    tenantId: string;
    classId: string;
    referenceDate: Date;
  }) {
    const { tenantId, classId, referenceDate } = params;

    return this.prisma.client.classEnrollment.findMany({
      where: {
        tenantId,
        classId,
        startDate: { lte: referenceDate },
        OR: [{ endDate: null }, { endDate: { gte: referenceDate } }],
      },
      select: {
        studentProfileId: true,
        studentProfile: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: {
        studentProfile: {
          user: { name: "asc" },
        },
      },
    });
  }

  async listScores(
    tenantId: string,
    query: ListAssessmentScoresDto,
    actor: AssessmentActor,
  ): Promise<AssessmentScoreSummary> {
    const component = await this.resolveComponentContext(
      tenantId,
      query.componentId,
    );

    await this.ensureTeacherAccess(
      tenantId,
      component.classSubject.teacherProfileId,
      actor,
    );

    const roster = await this.getClassRoster({
      tenantId,
      classId: component.classSubject.classId,
      referenceDate: new Date(),
    });

    const profileIds = roster.map((item) => item.studentProfileId);

    const scores = profileIds.length
      ? await this.prisma.client.assessmentScore.findMany({
          where: {
            tenantId,
            componentId: component.id,
            studentProfileId: { in: profileIds },
          },
          select: {
            studentProfileId: true,
            score: true,
            isLocked: true,
          },
        })
      : [];

    const scoreMap = new Map(
      scores.map((item) => [
        item.studentProfileId,
        {
          score: Number(item.score),
          isLocked: item.isLocked,
        },
      ]),
    );

    return {
      component: {
        id: component.id,
        name: component.name,
        assessmentTypeId: component.assessmentTypeId,
        assessmentTypeLabel: component.assessmentType?.label ?? "-",
      },
      class: {
        id: component.classSubject.class.id,
        name: component.classSubject.class.name,
      },
      subject: {
        id: component.classSubject.subject.id,
        name: component.classSubject.subject.name,
      },
      academicPeriod: {
        id: component.academicPeriod.id,
        name: component.academicPeriod.name,
      },
      students: roster.map((item) => {
        const currentScore = scoreMap.get(item.studentProfileId) ?? null;
        return {
          studentProfileId: item.studentProfileId,
          studentName: item.studentProfile.user.name,
          score: currentScore?.score ?? null,
          isLocked: currentScore?.isLocked ?? false,
        };
      }),
    };
  }

  async upsertScores(
    tenantId: string,
    dto: UpsertAssessmentScoresDto,
    actor: AssessmentActor,
  ): Promise<AssessmentScoreSummary> {
    const component = await this.resolveComponentContext(
      tenantId,
      dto.componentId,
    );

    await this.ensureTeacherAccess(
      tenantId,
      component.classSubject.teacherProfileId,
      actor,
    );

    const roster = await this.getClassRoster({
      tenantId,
      classId: component.classSubject.classId,
      referenceDate: new Date(),
    });

    const rosterIds = new Set(roster.map((item) => item.studentProfileId));
    const requestIds = dto.items.map((item) => item.studentProfileId);

    for (const profileId of requestIds) {
      if (!rosterIds.has(profileId)) {
        throw new BadRequestException("Student does not belong to this class");
      }
    }

    const existingScores = requestIds.length
      ? await this.prisma.client.assessmentScore.findMany({
          where: {
            tenantId,
            componentId: component.id,
            studentProfileId: { in: requestIds },
          },
          select: {
            id: true,
            studentProfileId: true,
            isLocked: true,
          },
        })
      : [];

    const existingMap = new Map(
      existingScores.map((item) => [item.studentProfileId, item]),
    );

    await this.prisma.client.$transaction(async (tx) => {
      for (const item of dto.items) {
        const existing = existingMap.get(item.studentProfileId);

        if (existing?.isLocked) {
          throw new ConflictException("Score is locked for this student");
        }

        if (item.score === null) {
          if (existing) {
            await tx.assessmentScore.delete({
              where: { id: existing.id },
            });
          }
          continue;
        }

        await tx.assessmentScore.upsert({
          where: {
            componentId_studentProfileId: {
              componentId: component.id,
              studentProfileId: item.studentProfileId,
            },
          },
          create: {
            tenantId,
            componentId: component.id,
            studentProfileId: item.studentProfileId,
            score: item.score,
          },
          update: {
            score: item.score,
          },
        });
      }
    });

    return this.listScores(tenantId, { componentId: component.id }, actor);
  }
}
