import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction, AuditEntityType, Role } from "@repo/db";
import type { Prisma } from "@repo/db";
import { PrismaService } from "../prisma/prisma.service";
import {
  ListAssessmentRecapDto,
  RequestAssessmentRecapChangeDto,
  UpdateAssessmentRecapKkmDto,
} from "./dto";

const SUBMISSION_STATUS = {
  SUBMITTED: "submitted",
  RETURNED: "returned",
  RESUBMITTED: "resubmitted",
} as const;

type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

type AssessmentRecapPeriod = {
  id: string;
  name: string;
  academicYearLabel: string;
};

type AssessmentRecapClass = {
  id: string;
  name: string;
  kkm: number;
};

type AssessmentRecapClassSubject = {
  id: string;
  classId: string;
  subjectId: string;
  kkm: number;
};

type AssessmentRecapSubject = {
  id: string;
  name: string;
};

type AssessmentRecapAssessmentType = {
  id: string;
  label: string;
};

type AssessmentRecapComponentScore = {
  componentId: string;
  componentName: string;
  assessmentTypeId: string;
  assessmentTypeLabel: string;
  score: number | null;
};

type AssessmentRecapStudent = {
  id: string;
  studentProfileId: string;
  studentName: string;
  nis: string | null;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  periodId: string;
  finalScore: number;
  componentScores: AssessmentRecapComponentScore[];
};

type AssessmentRecapSummary = {
  average: number;
  median: number;
  passRate: number;
  remedialCount: number;
  totalStudents: number;
  maxScore: number;
  minScore: number;
};

type AssessmentRecapReadiness = {
  missingScoreCount: number;
  missingStudentCount: number;
  weightTotal: number;
  isWeightValid: boolean;
  isReady: boolean;
};

type AssessmentRecapSubmission = {
  id: string;
  status: SubmissionStatus;
  submittedAt: Date;
  returnedAt: Date | null;
  teacherProfileId: string;
};

type AssessmentRecapChangeRequest = {
  id: string;
  status: string;
  requestedAt: Date;
  teacherProfileId: string;
};

export type TeacherAssessmentRecap = {
  activePeriodId: string | null;
  periods: AssessmentRecapPeriod[];
  classes: AssessmentRecapClass[];
  subjects: AssessmentRecapSubject[];
  assessmentTypes: AssessmentRecapAssessmentType[];
  classSubjects: AssessmentRecapClassSubject[];
  students: AssessmentRecapStudent[];
  summary: AssessmentRecapSummary;
  hasSubmittedRecap: boolean;
  readiness: AssessmentRecapReadiness | null;
  submission: AssessmentRecapSubmission | null;
  changeRequest: AssessmentRecapChangeRequest | null;
};

type AssessmentActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

type ComponentScoreData = {
  componentId: string;
  componentName: string;
  assessmentTypeId: string;
  assessmentTypeLabel: string;
  score: number | null;
};

type StudentScoreInput = {
  studentProfileId: string;
  studentName: string;
  nis: string | null;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  periodId: string;
  componentScores: ComponentScoreData[];
  typeWeights: Map<string, number>;
};

type ComponentGroup = {
  classSubjectId: string;
  periodId: string;
  components: {
    id: string;
    name: string;
    assessmentTypeId: string;
    assessmentTypeLabel: string;
  }[];
};

@Injectable()
export class AssessmentRecapService {
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

  private calculateFinalScore({
    componentScores,
    typeWeights,
  }: Pick<StudentScoreInput, "componentScores" | "typeWeights">) {
    if (componentScores.length === 0) return 0;

    const componentsByType = new Map<
      string,
      { total: number; count: number }
    >();

    for (const component of componentScores) {
      if (component.score === null) continue;

      const current = componentsByType.get(component.assessmentTypeId) ?? {
        total: 0,
        count: 0,
      };

      current.total += component.score;
      current.count += 1;
      componentsByType.set(component.assessmentTypeId, current);
    }

    if (componentsByType.size === 0) return 0;

    let weightedTotal = 0;
    let weightSum = 0;

    for (const [typeId, summary] of componentsByType.entries()) {
      const weight = typeWeights.get(typeId) ?? 0;
      if (weight <= 0 || summary.count === 0) continue;

      const average = summary.total / summary.count;
      weightedTotal += average * weight;
      weightSum += weight;
    }

    if (weightSum === 0) return 0;

    return weightedTotal / weightSum;
  }

  private computeSummary(
    students: AssessmentRecapStudent[],
    kkmMap: Map<string, number>,
  ): AssessmentRecapSummary {
    if (students.length === 0) {
      return {
        average: 0,
        median: 0,
        passRate: 0,
        remedialCount: 0,
        totalStudents: 0,
        maxScore: 0,
        minScore: 0,
      };
    }

    const scores = students.map((student) => student.finalScore);
    const sortedScores = [...scores].sort((a, b) => a - b);
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = total / scores.length;
    const middle = Math.floor(sortedScores.length / 2);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[middle - 1] + sortedScores[middle]) / 2
        : sortedScores[middle];
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    const passCount = students.filter((student) => {
      const kkm = kkmMap.get(`${student.classId}:${student.subjectId}`) ?? 0;
      return student.finalScore >= kkm;
    }).length;

    const remedialCount = students.length - passCount;
    const passRate = (passCount / students.length) * 100;

    return {
      average,
      median,
      passRate,
      remedialCount,
      totalStudents: students.length,
      maxScore,
      minScore,
    };
  }

  private async resolveStudentIdentifierValues(
    tenantId: string,
    profileIds: string[],
  ) {
    if (profileIds.length === 0) {
      return new Map<string, { nis?: string | null }>();
    }

    const fields = await this.prisma.client.tenantProfileField.findMany({
      where: {
        tenantId,
        role: "student",
        key: { in: ["nis"] },
      },
      select: { id: true, key: true },
    });

    if (fields.length === 0) {
      return new Map<string, { nis?: string | null }>();
    }

    const fieldIds = fields.map((field) => field.id);
    const fieldKeyMap = new Map(fields.map((field) => [field.id, field.key]));

    const values = await this.prisma.client.studentProfileFieldValue.findMany({
      where: {
        tenantId,
        studentProfileId: { in: profileIds },
        fieldId: { in: fieldIds },
      },
      select: {
        studentProfileId: true,
        fieldId: true,
        valueText: true,
      },
    });

    const result = new Map<string, { nis?: string | null }>();

    for (const value of values) {
      const key = fieldKeyMap.get(value.fieldId);
      if (!key) continue;

      const current = result.get(value.studentProfileId) ?? { nis: null };

      if (key === "nis") {
        current.nis = value.valueText ?? null;
      }

      result.set(value.studentProfileId, current);
    }

    return result;
  }

  private getActiveStudents(referenceDate: Date) {
    return {
      startDate: { lte: referenceDate },
      OR: [{ endDate: null }, { endDate: { gte: referenceDate } }],
    } satisfies Prisma.ClassEnrollmentWhereInput;
  }

  private async getClassRoster(tenantId: string, classId: string) {
    return this.prisma.client.classEnrollment.findMany({
      where: {
        tenantId,
        classId,
        ...this.getActiveStudents(new Date()),
      },
      select: {
        studentProfileId: true,
      },
    });
  }

  private buildReadiness(params: {
    classSubjectId: string;
    classId: string;
    periodId: string;
    teacherSubjectId: string | null;
    componentGroups: Map<string, ComponentGroup>;
    scoreMap: Map<string, number>;
    rosterByClassId: Map<string, string[]>;
    weightMap: Map<string, Map<string, number>>;
  }): AssessmentRecapReadiness {
    const {
      classSubjectId,
      classId,
      periodId,
      teacherSubjectId,
      componentGroups,
      scoreMap,
      rosterByClassId,
      weightMap,
    } = params;

    const groupKey = `${classSubjectId}:${periodId}`;
    const group = componentGroups.get(groupKey);
    const componentIds = group?.components.map((item) => item.id) ?? [];
    const rosterIds = rosterByClassId.get(classId) ?? [];

    const expectedCount = componentIds.length * rosterIds.length;
    const seenScores = new Set<string>();
    const missingStudents = new Set<string>();

    for (const studentId of rosterIds) {
      for (const componentId of componentIds) {
        const key = `${studentId}:${componentId}`;
        if (scoreMap.has(key)) {
          seenScores.add(key);
        } else {
          missingStudents.add(studentId);
        }
      }
    }

    const missingScoreCount = Math.max(expectedCount - seenScores.size, 0);
    const missingStudentCount = missingStudents.size;

    const weightKey = teacherSubjectId
      ? `${teacherSubjectId}:${periodId}`
      : null;
    const weightMapForPeriod = weightKey
      ? (weightMap.get(weightKey) ?? new Map<string, number>())
      : new Map<string, number>();
    const weightTotal = Array.from(weightMapForPeriod.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    const isWeightValid = weightTotal === 100;
    const hasRoster = rosterIds.length > 0;
    const hasComponents = componentIds.length > 0;

    return {
      missingScoreCount,
      missingStudentCount,
      weightTotal,
      isWeightValid,
      isReady:
        missingScoreCount === 0 && isWeightValid && hasRoster && hasComponents,
    };
  }

  async getTeacherRecap(
    tenantId: string,
    query: ListAssessmentRecapDto,
    actor: AssessmentActor,
  ): Promise<TeacherAssessmentRecap> {
    let teacherProfileId: string | undefined = undefined;

    const tenant = await this.prisma.client.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, activeAcademicYearId: true },
    });

    const activeYear = tenant?.activeAcademicYearId
      ? await this.prisma.client.academicYear.findFirst({
          where: {
            id: tenant.activeAcademicYearId,
            tenantId,
            deletedAt: null,
          },
          select: { id: true, activePeriodId: true },
        })
      : await this.prisma.client.academicYear.findFirst({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, activePeriodId: true },
        });

    const activePeriodId = activeYear?.activePeriodId ?? null;
    const effectivePeriodId = query.periodId ?? activePeriodId ?? undefined;

    if (actor.role === Role.TEACHER) {
      teacherProfileId = await this.resolveTeacherProfileId(
        tenantId,
        actor.sub,
      );
    }

    const availableClassSubjects =
      await this.prisma.client.classSubject.findMany({
        where: {
          tenantId,
          isDeleted: false,
          ...(teacherProfileId ? { teacherProfileId } : {}),
        },
        select: {
          id: true,
          classId: true,
          kkm: true,
          class: { select: { id: true, name: true } },
          subjectId: true,
          subject: { select: { id: true, name: true } },
          teacherProfileId: true,
        },
      });

    if (availableClassSubjects.length === 0) {
      return {
        activePeriodId,
        periods: [],
        classes: [],
        subjects: [],
        assessmentTypes: [],
        classSubjects: [],
        students: [],
        summary: {
          average: 0,
          median: 0,
          passRate: 0,
          remedialCount: 0,
          totalStudents: 0,
          maxScore: 0,
          minScore: 0,
        },
        hasSubmittedRecap: false,
        readiness: null,
        submission: null,
        changeRequest: null,
      };
    }

    const periodScopedClassSubjectIds = effectivePeriodId
      ? await this.prisma.client.assessmentComponent.findMany({
          where: {
            tenantId,
            classSubjectId: {
              in: availableClassSubjects.map((item) => item.id),
            },
            academicPeriodId: effectivePeriodId,
          },
          select: { classSubjectId: true },
        })
      : [];

    const periodScopedSet = new Set(
      periodScopedClassSubjectIds.map((item) => item.classSubjectId),
    );

    const scopedClassSubjects = effectivePeriodId
      ? availableClassSubjects.filter((item) => periodScopedSet.has(item.id))
      : availableClassSubjects;

    const subjectScopedClassSubjectIds =
      effectivePeriodId && query.subjectId
        ? scopedClassSubjects
            .filter((item) => item.subjectId === query.subjectId)
            .map((item) => item.id)
        : [];

    const hasSubmittedRecap =
      effectivePeriodId && subjectScopedClassSubjectIds.length > 0
        ? Boolean(
            await this.prisma.client.assessmentSubmission.findFirst({
              where: {
                tenantId,
                academicPeriodId: effectivePeriodId,
                classSubjectId: { in: subjectScopedClassSubjectIds },
                status: {
                  in: [
                    SUBMISSION_STATUS.SUBMITTED,
                    SUBMISSION_STATUS.RESUBMITTED,
                  ],
                },
              },
              select: { id: true },
            }),
          )
        : false;

    const filteredClassSubjects = scopedClassSubjects.filter((item) => {
      if (query.classId && item.classId !== query.classId) return false;
      if (query.subjectId && item.subjectId !== query.subjectId) return false;
      return true;
    });

    const availableClassMap = new Map(
      scopedClassSubjects.map((item) => [item.classId, item.class]),
    );
    const availableSubjectMap = new Map(
      scopedClassSubjects.map((item) => [item.subjectId, item.subject]),
    );

    const availableClasses = Array.from(availableClassMap.values()).map(
      (item) => {
        const fallback = scopedClassSubjects.find(
          (subject) => subject.classId === item.id,
        );

        return {
          id: item.id,
          name: item.name,
          kkm: fallback?.kkm ?? 0,
        };
      },
    );

    const availableSubjects = Array.from(availableSubjectMap.values()).map(
      (item) => ({
        id: item.id,
        name: item.name,
      }),
    );

    let periods = activeYear?.id
      ? await this.prisma.client.academicPeriod.findMany({
          where: {
            tenantId,
            academicYearId: activeYear.id,
          },
          select: {
            id: true,
            name: true,
            academicYear: { select: { label: true } },
          },
          orderBy: { orderIndex: "asc" },
        })
      : [];

    let periodIds = periods.map((period) => period.id);

    if (periodIds.length === 0) {
      const periodComponentIds =
        await this.prisma.client.assessmentComponent.findMany({
          where: {
            tenantId,
            classSubjectId: {
              in: availableClassSubjects.map((item) => item.id),
            },
          },
          select: {
            academicPeriodId: true,
          },
        });

      periodIds = Array.from(
        new Set(periodComponentIds.map((item) => item.academicPeriodId)),
      );

      periods = periodIds.length
        ? await this.prisma.client.academicPeriod.findMany({
            where: {
              tenantId,
              id: { in: periodIds },
            },
            select: {
              id: true,
              name: true,
              academicYear: { select: { label: true } },
            },
            orderBy: { orderIndex: "asc" },
          })
        : [];
    }

    const recapPeriods = periods.map((period) => ({
      id: period.id,
      name: period.name,
      academicYearLabel: period.academicYear.label,
    }));

    if (filteredClassSubjects.length === 0) {
      return {
        activePeriodId,
        periods: recapPeriods,
        classes: availableClasses,
        subjects: availableSubjects,
        assessmentTypes: [],
        classSubjects: scopedClassSubjects.map((item) => ({
          id: item.id,
          classId: item.classId,
          subjectId: item.subjectId,
          kkm: item.kkm,
        })),
        students: [],
        summary: {
          average: 0,
          median: 0,
          passRate: 0,
          remedialCount: 0,
          totalStudents: 0,
          maxScore: 0,
          minScore: 0,
        },
        hasSubmittedRecap,
        readiness: null,
        submission: null,
        changeRequest: null,
      };
    }

    const filteredClassSubjectIds = filteredClassSubjects.map(
      (item) => item.id,
    );
    const classMap = new Map(
      filteredClassSubjects.map((item) => [item.classId, item.class]),
    );
    const subjectMap = new Map(
      filteredClassSubjects.map((item) => [item.subjectId, item.subject]),
    );
    const kkmMap = new Map(
      filteredClassSubjects.map((item) => [
        `${item.classId}:${item.subjectId}`,
        item.kkm,
      ]),
    );

    const components = await this.prisma.client.assessmentComponent.findMany({
      where: {
        tenantId,
        classSubjectId: { in: filteredClassSubjectIds },
        ...(effectivePeriodId ? { academicPeriodId: effectivePeriodId } : {}),
      },
      select: {
        id: true,
        name: true,
        classSubjectId: true,
        academicPeriodId: true,
        assessmentTypeId: true,
        assessmentType: {
          select: {
            id: true,
            label: true,
          },
        },
      },
    });

    if (components.length === 0) {
      return {
        activePeriodId,
        periods: recapPeriods,
        classes: availableClasses,
        subjects: availableSubjects,
        assessmentTypes: [],
        classSubjects: scopedClassSubjects.map((item) => ({
          id: item.id,
          classId: item.classId,
          subjectId: item.subjectId,
          kkm: item.kkm,
        })),
        students: [],
        summary: {
          average: 0,
          median: 0,
          passRate: 0,
          remedialCount: 0,
          totalStudents: 0,
          maxScore: 0,
          minScore: 0,
        },
        hasSubmittedRecap,
        readiness: null,
        submission: null,
        changeRequest: null,
      };
    }

    const componentIds = components.map((item) => item.id);
    const assessmentTypeMap = new Map<string, string>();
    const componentGroups = new Map<string, ComponentGroup>();

    for (const component of components) {
      if (component.assessmentType?.id) {
        assessmentTypeMap.set(
          component.assessmentType.id,
          component.assessmentType.label,
        );
      }

      const key = `${component.classSubjectId}:${component.academicPeriodId}`;
      const current = componentGroups.get(key) ?? {
        classSubjectId: component.classSubjectId,
        periodId: component.academicPeriodId,
        components: [],
      };

      current.components.push({
        id: component.id,
        name: component.name,
        assessmentTypeId: component.assessmentTypeId,
        assessmentTypeLabel: component.assessmentType?.label ?? "-",
      });
      componentGroups.set(key, current);
    }

    const assessmentTypes = Array.from(assessmentTypeMap.entries()).map(
      ([id, label]) => ({ id, label }),
    );

    const teacherSubjects = await this.prisma.client.teacherSubject.findMany({
      where: {
        tenantId,
        subjectId: { in: Array.from(availableSubjectMap.keys()) },
        ...(teacherProfileId ? { teacherProfileId } : {}),
      },
      select: { id: true, subjectId: true, teacherProfileId: true },
    });

    const teacherSubjectMap = new Map(
      teacherSubjects.map((item) => [
        `${item.teacherProfileId}:${item.subjectId}`,
        item.id,
      ]),
    );

    const teacherSubjectIds = Array.from(
      new Set(teacherSubjects.map((item) => item.id)),
    );

    const typeWeights = teacherSubjectIds.length
      ? await this.prisma.client.assessmentTypeWeight.findMany({
          where: {
            tenantId,
            academicPeriodId: { in: periodIds },
            teacherSubjectId: { in: teacherSubjectIds },
          },
          select: {
            teacherSubjectId: true,
            academicPeriodId: true,
            assessmentTypeId: true,
            weight: true,
          },
        })
      : [];

    const weightMap = new Map<string, Map<string, number>>();

    for (const weight of typeWeights) {
      const key = `${weight.teacherSubjectId}:${weight.academicPeriodId}`;
      const current = weightMap.get(key) ?? new Map<string, number>();
      current.set(weight.assessmentTypeId, weight.weight);
      weightMap.set(key, current);
    }

    const scores = await this.prisma.client.assessmentScore.findMany({
      where: {
        tenantId,
        componentId: { in: componentIds },
      },
      select: {
        studentProfileId: true,
        componentId: true,
        score: true,
      },
    });

    const scoreMap = new Map<string, number>();

    for (const score of scores) {
      scoreMap.set(
        `${score.studentProfileId}:${score.componentId}`,
        Number(score.score),
      );
    }

    const referenceDate = new Date();
    const roster: Prisma.ClassEnrollmentGetPayload<{
      select: {
        classId: true;
        studentProfileId: true;
        studentProfile: { select: { user: { select: { name: true } } } };
      };
    }>[] = await this.prisma.client.classEnrollment.findMany({
      where: {
        tenantId,
        classId: { in: filteredClassSubjects.map((item) => item.classId) },
        ...this.getActiveStudents(referenceDate),
      },
      select: {
        classId: true,
        studentProfileId: true,
        studentProfile: { select: { user: { select: { name: true } } } },
      },
      orderBy: {
        studentProfile: { user: { name: "asc" } },
      },
    });

    const rosterProfileIds = roster.map((item) => item.studentProfileId);
    const identifiers = await this.resolveStudentIdentifierValues(
      tenantId,
      rosterProfileIds,
    );

    const rosterByClassId = new Map<string, string[]>();
    for (const item of roster) {
      const current = rosterByClassId.get(item.classId) ?? [];
      current.push(item.studentProfileId);
      rosterByClassId.set(item.classId, current);
    }

    const students: AssessmentRecapStudent[] = [];

    for (const rosterItem of roster) {
      const classItem = classMap.get(rosterItem.classId);
      if (!classItem) continue;

      for (const classSubject of filteredClassSubjects) {
        if (classSubject.classId !== rosterItem.classId) continue;

        const subject = subjectMap.get(classSubject.subjectId);
        if (!subject) continue;

        const teacherSubjectId = teacherSubjectMap.get(
          `${classSubject.teacherProfileId}:${subject.id}`,
        );

        const subjectComponentGroups = Array.from(
          componentGroups.values(),
        ).filter((group) => group.classSubjectId === classSubject.id);

        for (const group of subjectComponentGroups) {
          const typeWeightMap = teacherSubjectId
            ? (weightMap.get(`${teacherSubjectId}:${group.periodId}`) ??
              new Map<string, number>())
            : new Map<string, number>();

          const componentScores = group.components.map((component) => ({
            componentId: component.id,
            componentName: component.name,
            assessmentTypeId: component.assessmentTypeId,
            assessmentTypeLabel: component.assessmentTypeLabel,
            score:
              scoreMap.get(`${rosterItem.studentProfileId}:${component.id}`) ??
              null,
          }));

          const studentScoreInput: StudentScoreInput = {
            studentProfileId: rosterItem.studentProfileId,
            studentName: rosterItem.studentProfile.user.name,
            nis: identifiers.get(rosterItem.studentProfileId)?.nis ?? null,
            classId: classItem.id,
            className: classItem.name,
            subjectId: subject.id,
            subjectName: subject.name,
            periodId: group.periodId,
            componentScores,
            typeWeights: typeWeightMap,
          };

          const finalScore = this.calculateFinalScore(studentScoreInput);

          students.push({
            id: `${rosterItem.studentProfileId}:${classSubject.id}:${group.periodId}`,
            studentProfileId: rosterItem.studentProfileId,
            studentName: studentScoreInput.studentName,
            nis: studentScoreInput.nis,
            classId: studentScoreInput.classId,
            className: studentScoreInput.className,
            subjectId: studentScoreInput.subjectId,
            subjectName: studentScoreInput.subjectName,
            periodId: studentScoreInput.periodId,
            finalScore,
            componentScores: componentScores.map((item) => ({
              componentId: item.componentId,
              componentName: item.componentName,
              assessmentTypeId: item.assessmentTypeId,
              assessmentTypeLabel: item.assessmentTypeLabel,
              score: item.score,
            })),
          });
        }
      }
    }

    const summary = this.computeSummary(students, kkmMap);

    const targetClassSubject =
      query.classId && query.subjectId
        ? filteredClassSubjects.find(
            (item) =>
              item.classId === query.classId &&
              item.subjectId === query.subjectId,
          )
        : null;

    const readiness =
      targetClassSubject && effectivePeriodId
        ? this.buildReadiness({
            classSubjectId: targetClassSubject.id,
            classId: targetClassSubject.classId,
            periodId: effectivePeriodId,
            teacherSubjectId:
              teacherSubjectMap.get(
                `${targetClassSubject.teacherProfileId}:${targetClassSubject.subjectId}`,
              ) ?? null,
            componentGroups,
            scoreMap,
            rosterByClassId,
            weightMap,
          })
        : null;

    const submission =
      targetClassSubject && effectivePeriodId
        ? await this.prisma.client.assessmentSubmission.findFirst({
            where: {
              tenantId,
              classSubjectId: targetClassSubject.id,
              academicPeriodId: effectivePeriodId,
            },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              returnedAt: true,
              teacherProfileId: true,
            },
          })
        : null;

    const changeRequest =
      targetClassSubject && effectivePeriodId
        ? await this.prisma.client.assessmentScoreChangeRequest.findFirst({
            where: {
              tenantId,
              classSubjectId: targetClassSubject.id,
              academicPeriodId: effectivePeriodId,
              isActive: true,
            },
            select: {
              id: true,
              status: true,
              requestedAt: true,
              teacherProfileId: true,
            },
          })
        : null;

    return {
      activePeriodId,
      periods: recapPeriods,
      classes: availableClasses,
      subjects: availableSubjects,
      assessmentTypes,
      classSubjects: scopedClassSubjects.map((item) => ({
        id: item.id,
        classId: item.classId,
        subjectId: item.subjectId,
        kkm: item.kkm,
      })),
      students,
      summary,
      hasSubmittedRecap,
      readiness,
      submission: submission
        ? {
            id: submission.id,
            status: submission.status as SubmissionStatus,
            submittedAt: submission.submittedAt,
            returnedAt: submission.returnedAt,
            teacherProfileId: submission.teacherProfileId,
          }
        : null,
      changeRequest: changeRequest
        ? {
            id: changeRequest.id,
            status: changeRequest.status,
            requestedAt: changeRequest.requestedAt,
            teacherProfileId: changeRequest.teacherProfileId,
          }
        : null,
    };
  }

  async submitTeacherRecap(
    tenantId: string,
    dto: { classId: string; subjectId: string; periodId: string },
    actor: AssessmentActor,
  ) {
    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException("Only teachers can submit recap");
    }

    const teacherProfileId = await this.resolveTeacherProfileId(
      tenantId,
      actor.sub,
    );

    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: {
        tenantId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherProfileId,
        isDeleted: false,
      },
      select: {
        id: true,
        classId: true,
        academicYearId: true,
        subjectId: true,
      },
    });

    if (!classSubject) {
      throw new NotFoundException("Class subject not found for teacher");
    }

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id: dto.periodId, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    if (academicPeriod.academicYearId !== classSubject.academicYearId) {
      throw new BadRequestException(
        "Academic period does not match class subject academic year",
      );
    }

    const teacherSubject = await this.prisma.client.teacherSubject.findFirst({
      where: {
        tenantId,
        teacherProfileId,
        subjectId: dto.subjectId,
      },
      select: { id: true },
    });

    const components = await this.prisma.client.assessmentComponent.findMany({
      where: {
        tenantId,
        classSubjectId: classSubject.id,
        academicPeriodId: dto.periodId,
      },
      select: { id: true },
    });

    if (components.length === 0) {
      throw new BadRequestException("No assessment components found");
    }

    const roster = await this.getClassRoster(tenantId, classSubject.classId);
    const rosterIds = roster.map((item) => item.studentProfileId);

    if (rosterIds.length === 0) {
      throw new BadRequestException("Class roster is empty");
    }

    const componentIds = components.map((item) => item.id);
    const scores = await this.prisma.client.assessmentScore.findMany({
      where: {
        tenantId,
        componentId: { in: componentIds },
        studentProfileId: { in: rosterIds },
      },
      select: { componentId: true, studentProfileId: true },
    });

    const scoreSet = new Set(
      scores.map((item) => `${item.studentProfileId}:${item.componentId}`),
    );

    let missingScoreCount = 0;
    const missingStudents = new Set<string>();

    for (const studentId of rosterIds) {
      for (const componentId of componentIds) {
        const key = `${studentId}:${componentId}`;
        if (!scoreSet.has(key)) {
          missingScoreCount += 1;
          missingStudents.add(studentId);
        }
      }
    }

    const weightTotal = teacherSubject
      ? await this.prisma.client.assessmentTypeWeight
          .findMany({
            where: {
              tenantId,
              teacherSubjectId: teacherSubject.id,
              academicPeriodId: dto.periodId,
            },
            select: { weight: true },
          })
          .then((items) => items.reduce((sum, item) => sum + item.weight, 0))
      : 0;

    const isWeightValid = weightTotal === 100;
    const readiness: AssessmentRecapReadiness = {
      missingScoreCount,
      missingStudentCount: missingStudents.size,
      weightTotal,
      isWeightValid,
      isReady: missingScoreCount === 0 && isWeightValid && rosterIds.length > 0,
    };

    if (!readiness.isReady) {
      throw new BadRequestException("Assessment recap is not ready to submit");
    }

    const existingSubmission =
      await this.prisma.client.assessmentSubmission.findFirst({
        where: {
          tenantId,
          classSubjectId: classSubject.id,
          academicPeriodId: dto.periodId,
        },
        select: { id: true, status: true },
      });

    if (
      existingSubmission &&
      existingSubmission.status !== SUBMISSION_STATUS.RETURNED
    ) {
      throw new ConflictException("Assessment recap already submitted");
    }

    await this.prisma.client.assessmentScore.updateMany({
      where: {
        tenantId,
        componentId: { in: componentIds },
        studentProfileId: { in: rosterIds },
        isLocked: false,
      },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    const submittedAt = new Date();
    const submission = existingSubmission
      ? await this.prisma.client.assessmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            status: SUBMISSION_STATUS.RESUBMITTED,
            submittedAt,
            returnedAt: null,
            teacherProfileId,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            returnedAt: true,
            teacherProfileId: true,
          },
        })
      : await this.prisma.client.assessmentSubmission.create({
          data: {
            tenantId,
            classSubjectId: classSubject.id,
            academicPeriodId: dto.periodId,
            teacherProfileId,
            status: SUBMISSION_STATUS.SUBMITTED,
            submittedAt,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            returnedAt: true,
            teacherProfileId: true,
          },
        });

    await this.prisma.client.auditLog.create({
      data: {
        tenantId,
        entityType: AuditEntityType.GRADE,
        entityId: submission.id,
        action: AuditAction.LOCK,
        actorId: actor.sub,
        metadata: {
          classSubjectId: classSubject.id,
          academicPeriodId: dto.periodId,
        },
      },
    });

    return {
      submission: {
        id: submission.id,
        status: submission.status as SubmissionStatus,
        submittedAt: submission.submittedAt,
        returnedAt: submission.returnedAt,
        teacherProfileId: submission.teacherProfileId,
      },
      readiness,
    };
  }

  async requestTeacherRecapChange(
    tenantId: string,
    dto: RequestAssessmentRecapChangeDto,
    actor: AssessmentActor,
  ) {
    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException("Only teachers can request changes");
    }

    const teacherProfileId = await this.resolveTeacherProfileId(
      tenantId,
      actor.sub,
    );

    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: {
        id: dto.classSubjectId,
        tenantId,
        teacherProfileId,
        isDeleted: false,
      },
      select: { id: true, academicYearId: true },
    });

    if (!classSubject) {
      throw new NotFoundException("Class subject not found for teacher");
    }

    const academicPeriod = await this.prisma.client.academicPeriod.findFirst({
      where: { id: dto.periodId, tenantId },
      select: { id: true, academicYearId: true },
    });

    if (!academicPeriod) {
      throw new NotFoundException("Academic period not found");
    }

    if (academicPeriod.academicYearId !== classSubject.academicYearId) {
      throw new BadRequestException(
        "Academic period does not match class subject academic year",
      );
    }

    const submission = await this.prisma.client.assessmentSubmission.findFirst({
      where: {
        tenantId,
        classSubjectId: classSubject.id,
        academicPeriodId: academicPeriod.id,
      },
      select: { id: true, status: true },
    });

    if (!submission) {
      throw new BadRequestException("Assessment recap not submitted");
    }

    if (
      submission.status !== SUBMISSION_STATUS.SUBMITTED &&
      submission.status !== SUBMISSION_STATUS.RESUBMITTED
    ) {
      throw new BadRequestException("Assessment recap is not locked");
    }

    const existingRequest =
      await this.prisma.client.assessmentScoreChangeRequest.findFirst({
        where: {
          tenantId,
          classSubjectId: classSubject.id,
          academicPeriodId: academicPeriod.id,
          isActive: true,
        },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          teacherProfileId: true,
        },
      });

    if (existingRequest) {
      return {
        id: existingRequest.id,
        status: existingRequest.status,
        requestedAt: existingRequest.requestedAt,
        teacherProfileId: existingRequest.teacherProfileId,
      };
    }

    const created =
      await this.prisma.client.assessmentScoreChangeRequest.create({
        data: {
          tenantId,
          classSubjectId: classSubject.id,
          academicPeriodId: academicPeriod.id,
          teacherProfileId,
          status: "pending",
          isActive: true,
          requestedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          teacherProfileId: true,
        },
      });

    await this.prisma.client.auditLog.create({
      data: {
        tenantId,
        entityType: AuditEntityType.GRADE,
        entityId: created.id,
        action: AuditAction.UPDATE,
        actorId: actor.sub,
        metadata: {
          classSubjectId: classSubject.id,
          academicPeriodId: academicPeriod.id,
          action: "request_score_change",
        },
      },
    });

    return {
      id: created.id,
      status: created.status,
      requestedAt: created.requestedAt,
      teacherProfileId: created.teacherProfileId,
    };
  }

  async updateTeacherRecapKkm(
    tenantId: string,
    dto: UpdateAssessmentRecapKkmDto,
    actor: AssessmentActor,
  ) {
    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException("Only teachers can update KKM");
    }

    const teacherProfileId = await this.resolveTeacherProfileId(
      tenantId,
      actor.sub,
    );

    const classSubject = await this.prisma.client.classSubject.findFirst({
      where: {
        id: dto.classSubjectId,
        tenantId,
        teacherProfileId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!classSubject) {
      throw new NotFoundException("Class subject not found for teacher");
    }

    const updated = await this.prisma.client.classSubject.update({
      where: { id: classSubject.id },
      data: { kkm: dto.kkm },
      select: { id: true, kkm: true, updatedAt: true },
    });

    return {
      classSubjectId: updated.id,
      kkm: updated.kkm,
      updatedAt: updated.updatedAt,
    };
  }
}
