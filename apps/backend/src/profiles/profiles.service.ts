import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTeacherProfileDto } from "./dto/create-teacher-profile.dto";
import { UpdateTeacherProfileDto } from "./dto/update-teacher-profile.dto";
import { CreateStudentProfileDto } from "./dto/create-student-profile.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import { Prisma, Role } from "@repo/db";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeacherProfile(tenantId: string, dto: CreateTeacherProfileDto) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, tenantId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.TEACHER) {
      throw new BadRequestException("User role is not TEACHER");
    }

    const existing = await this.prisma.client.teacherProfile.findFirst({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("User already has a teacher profile");
    }

    if (dto.nip) {
      const nipExists = await this.prisma.client.teacherProfile.findFirst({
        where: { tenantId, nip: dto.nip },
        select: { id: true },
      });
      if (nipExists) {
        throw new ConflictException("NIP already exists");
      }
    }

    if (dto.nuptk) {
      const nuptkExists = await this.prisma.client.teacherProfile.findFirst({
        where: { tenantId, nuptk: dto.nuptk },
        select: { id: true },
      });
      if (nuptkExists) {
        throw new ConflictException("NUPTK already exists");
      }
    }

    return this.prisma.client.teacherProfile.create({
      data: {
        tenantId,
        userId: dto.userId,
        nip: dto.nip,
        nuptk: dto.nuptk,
        hiredAt: dto.hiredAt ? new Date(dto.hiredAt) : undefined,
        additionalIdentifiers: dto.additionalIdentifiers
          ? (dto.additionalIdentifiers as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        nip: true,
        nuptk: true,
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTeacherProfileById(tenantId: string, id: string) {
    const profile = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        nip: true,
        nuptk: true,
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return profile;
  }

  async findTeacherProfileByUserId(tenantId: string, userId: string) {
    const profile = await this.prisma.client.teacherProfile.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        nip: true,
        nuptk: true,
        hiredAt: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Teacher profile not found");
    }

    return profile;
  }

  async updateTeacherProfile(
    tenantId: string,
    id: string,
    dto: UpdateTeacherProfileDto
  ) {
    const existing = await this.prisma.client.teacherProfile.findFirst({
      where: { id, tenantId },
      select: { id: true, nip: true, nuptk: true },
    });

    if (!existing) {
      throw new NotFoundException("Teacher profile not found");
    }

    if (dto.nip && dto.nip !== existing.nip) {
      const nipExists = await this.prisma.client.teacherProfile.findFirst({
        where: { tenantId, nip: dto.nip },
        select: { id: true },
      });
      if (nipExists) {
        throw new ConflictException("NIP already exists");
      }
    }

    if (dto.nuptk && dto.nuptk !== existing.nuptk) {
      const nuptkExists = await this.prisma.client.teacherProfile.findFirst({
        where: { tenantId, nuptk: dto.nuptk },
        select: { id: true },
      });
      if (nuptkExists) {
        throw new ConflictException("NUPTK already exists");
      }
    }

    return this.prisma.client.teacherProfile.update({
      where: { id },
      data: {
        ...(dto.nip ? { nip: dto.nip } : {}),
        ...(dto.nuptk ? { nuptk: dto.nuptk } : {}),
        ...(dto.hiredAt ? { hiredAt: new Date(dto.hiredAt) } : {}),
        ...(dto.additionalIdentifiers
          ? {
              additionalIdentifiers:
                dto.additionalIdentifiers as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        nip: true,
        nuptk: true,
        hiredAt: true,
        additionalIdentifiers: true,
        updatedAt: true,
      },
    });
  }

  async createStudentProfile(tenantId: string, dto: CreateStudentProfileDto) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, tenantId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role !== Role.STUDENT) {
      throw new BadRequestException("User role is not STUDENT");
    }

    const existing = await this.prisma.client.studentProfile.findFirst({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("User already has a student profile");
    }

    if (dto.nis) {
      const nisExists = await this.prisma.client.studentProfile.findFirst({
        where: { tenantId, nis: dto.nis },
        select: { id: true },
      });
      if (nisExists) {
        throw new ConflictException("NIS already exists");
      }
    }

    if (dto.nisn) {
      const nisnExists = await this.prisma.client.studentProfile.findFirst({
        where: { tenantId, nisn: dto.nisn },
        select: { id: true },
      });
      if (nisnExists) {
        throw new ConflictException("NISN already exists");
      }
    }

    return this.prisma.client.studentProfile.create({
      data: {
        tenantId,
        userId: dto.userId,
        nis: dto.nis,
        nisn: dto.nisn,
        additionalIdentifiers: dto.additionalIdentifiers
          ? (dto.additionalIdentifiers as Prisma.InputJsonValue)
          : undefined,
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        nis: true,
        nisn: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findStudentProfileById(tenantId: string, id: string) {
    const profile = await this.prisma.client.studentProfile.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        nis: true,
        nisn: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return profile;
  }

  async findStudentProfileByUserId(tenantId: string, userId: string) {
    const profile = await this.prisma.client.studentProfile.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        nis: true,
        nisn: true,
        additionalIdentifiers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return profile;
  }

  async updateStudentProfile(
    tenantId: string,
    id: string,
    dto: UpdateStudentProfileDto
  ) {
    const existing = await this.prisma.client.studentProfile.findFirst({
      where: { id, tenantId },
      select: { id: true, nis: true, nisn: true },
    });

    if (!existing) {
      throw new NotFoundException("Student profile not found");
    }

    if (dto.nis && dto.nis !== existing.nis) {
      const nisExists = await this.prisma.client.studentProfile.findFirst({
        where: { tenantId, nis: dto.nis },
        select: { id: true },
      });
      if (nisExists) {
        throw new ConflictException("NIS already exists");
      }
    }

    if (dto.nisn && dto.nisn !== existing.nisn) {
      const nisnExists = await this.prisma.client.studentProfile.findFirst({
        where: { tenantId, nisn: dto.nisn },
        select: { id: true },
      });
      if (nisnExists) {
        throw new ConflictException("NISN already exists");
      }
    }

    return this.prisma.client.studentProfile.update({
      where: { id },
      data: {
        ...(dto.nis ? { nis: dto.nis } : {}),
        ...(dto.nisn ? { nisn: dto.nisn } : {}),
        ...(dto.additionalIdentifiers
          ? {
              additionalIdentifiers:
                dto.additionalIdentifiers as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        nis: true,
        nisn: true,
        additionalIdentifiers: true,
        updatedAt: true,
      },
    });
  }
}
