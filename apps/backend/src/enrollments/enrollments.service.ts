import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { UpdateEnrollmentDto } from "./dto/update-enrollment.dto";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnrollment(tenantId: string, dto: CreateEnrollmentDto) {
    const studentProfile = await this.prisma.client.studentProfile.findFirst({
      where: { id: dto.studentProfileId, tenantId },
      select: { id: true },
    });

    if (!studentProfile) {
      throw new NotFoundException("Student profile not found");
    }

    const classItem = await this.prisma.client.class.findFirst({
      where: { id: dto.classId, tenantId },
      select: { id: true, academicYearId: true, name: true },
    });

    if (!classItem) {
      throw new NotFoundException("Class not found");
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException("Invalid startDate");
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid endDate");
    }

    if (endDate && endDate < startDate) {
      throw new BadRequestException("endDate must be after startDate");
    }

    const activeEnrollment = await this.prisma.client.classEnrollment.findFirst(
      {
        where: {
          tenantId,
          studentProfileId: dto.studentProfileId,
          endDate: null,
          class: { academicYearId: classItem.academicYearId },
        },
        select: {
          id: true,
          classId: true,
          startDate: true,
        },
      },
    );

    if (activeEnrollment && activeEnrollment.classId === dto.classId) {
      return {
        id: activeEnrollment.id,
        studentProfileId: dto.studentProfileId,
        classId: activeEnrollment.classId,
        academicYearId: classItem.academicYearId,
        startDate: activeEnrollment.startDate,
        endDate: null,
        className: classItem.name,
      };
    }

    const enrollment = await this.prisma.client.$transaction(async (tx) => {
      if (activeEnrollment) {
        await tx.classEnrollment.updateMany({
          where: {
            tenantId,
            studentProfileId: dto.studentProfileId,
            endDate: null,
            class: { academicYearId: classItem.academicYearId },
          },
          data: {
            endDate: startDate,
          },
        });
      }

      return tx.classEnrollment.create({
        data: {
          tenantId,
          classId: dto.classId,
          studentProfileId: dto.studentProfileId,
          startDate,
          endDate,
        },
        select: {
          id: true,
          studentProfileId: true,
          classId: true,
          startDate: true,
          endDate: true,
        },
      });
    });

    return {
      id: enrollment.id,
      studentProfileId: enrollment.studentProfileId,
      classId: enrollment.classId,
      academicYearId: classItem.academicYearId,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      className: classItem.name,
    };
  }

  async updateEnrollment(
    tenantId: string,
    id: string,
    dto: UpdateEnrollmentDto,
  ) {
    const enrollment = await this.prisma.client.classEnrollment.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        studentProfileId: true,
        classId: true,
        startDate: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Enrollment not found");
    }

    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    if (Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid endDate");
    }

    if (endDate < enrollment.startDate) {
      throw new BadRequestException("endDate must be after startDate");
    }

    const updated = await this.prisma.client.classEnrollment.update({
      where: { id },
      data: { endDate },
      select: {
        id: true,
        studentProfileId: true,
        classId: true,
        startDate: true,
        endDate: true,
      },
    });

    return updated;
  }
}
