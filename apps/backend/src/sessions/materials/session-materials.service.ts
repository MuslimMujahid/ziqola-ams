import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/db";
import { randomUUID } from "crypto";

import { MinioService } from "../../common/storage/minio.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSessionMaterialDto } from "./dto/create-session-material.dto";
import type {
  SessionMaterialAttachmentSummary,
  SessionMaterialContent,
  SessionMaterialSummary,
} from "./session-materials.types";

type SessionMaterialActor = {
  sub: string;
  tenantId: string;
  role: Role;
};

type SessionMaterialRecord = {
  id: string;
  tenantId: string;
  sessionId: string;
  content: SessionMaterialContent | null;
  links: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

type SessionMaterialAttachmentRecord = {
  id: string;
  tenantId: string;
  sessionMaterialId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
]);

@Injectable()
export class SessionMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  private getSessionMaterialClient() {
    const client = this.prisma.client as unknown as {
      sessionMaterial: {
        findFirst: (args: unknown) => Promise<SessionMaterialRecord | null>;
        create: (args: unknown) => Promise<SessionMaterialRecord>;
        upsert: (args: unknown) => Promise<SessionMaterialRecord>;
      };
      sessionMaterialAttachment: {
        findMany: (args: unknown) => Promise<SessionMaterialAttachmentRecord[]>;
        create: (args: unknown) => Promise<SessionMaterialAttachmentRecord>;
        findFirst: (
          args: unknown,
        ) => Promise<SessionMaterialAttachmentRecord | null>;
        delete: (args: unknown) => Promise<{ id: string }>;
      };
    };

    return client.sessionMaterial;
  }

  private getSessionMaterialAttachmentClient() {
    const client = this.prisma.client as unknown as {
      sessionMaterialAttachment: {
        findMany: (args: unknown) => Promise<SessionMaterialAttachmentRecord[]>;
        create: (args: unknown) => Promise<SessionMaterialAttachmentRecord>;
        findFirst: (
          args: unknown,
        ) => Promise<SessionMaterialAttachmentRecord | null>;
        delete: (args: unknown) => Promise<{ id: string }>;
      };
    };

    return client.sessionMaterialAttachment;
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

  private async resolveStudentProfileId(tenantId: string, userId: string) {
    const studentProfile = await this.prisma.client.studentProfile.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!studentProfile) {
      throw new NotFoundException("Student profile not found");
    }

    return studentProfile.id;
  }

  private async getSessionOrThrow(tenantId: string, sessionId: string) {
    const session = await this.prisma.client.session.findFirst({
      where: { id: sessionId, tenantId },
      select: {
        id: true,
        tenantId: true,
        classId: true,
        date: true,
        classSubject: { select: { teacherProfileId: true } },
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    return session;
  }

  private async ensureTeacherAccess(
    tenantId: string,
    sessionId: string,
    actor: SessionMaterialActor,
  ) {
    const session = await this.getSessionOrThrow(tenantId, sessionId);
    const teacherProfileId = await this.resolveTeacherProfileId(
      tenantId,
      actor.sub,
    );

    if (session.classSubject.teacherProfileId !== teacherProfileId) {
      throw new ForbiddenException("Teacher cannot access this session");
    }

    return { session, teacherProfileId };
  }

  private async ensureStudentAccess(
    tenantId: string,
    sessionId: string,
    actor: SessionMaterialActor,
  ) {
    const session = await this.getSessionOrThrow(tenantId, sessionId);
    const studentProfileId = await this.resolveStudentProfileId(
      tenantId,
      actor.sub,
    );

    const enrollment = await this.prisma.client.classEnrollment.findFirst({
      where: {
        tenantId,
        classId: session.classId,
        studentProfileId,
        startDate: { lte: session.date },
        OR: [{ endDate: null }, { endDate: { gte: session.date } }],
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ForbiddenException("Student cannot access this session");
    }

    return session;
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  private assertFileAllowed(params: { mimeType: string; size: number }) {
    if (params.size > MAX_FILE_SIZE) {
      throw new BadRequestException("File exceeds 5 MB limit");
    }

    if (
      params.mimeType.startsWith("image/") ||
      params.mimeType.startsWith("video/")
    ) {
      throw new BadRequestException("Images and videos are not allowed");
    }

    if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
      throw new BadRequestException("File type is not allowed");
    }
  }

  private async mapAttachments(
    attachments: SessionMaterialAttachmentRecord[],
  ): Promise<SessionMaterialAttachmentSummary[]> {
    return Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        downloadUrl: await this.minio.getPresignedDownloadUrl({
          objectKey: attachment.fileKey,
        }),
      })),
    );
  }

  private buildEmptyMaterial(params: {
    tenantId: string;
    sessionId: string;
  }): SessionMaterialSummary {
    return {
      id: null,
      tenantId: params.tenantId,
      sessionId: params.sessionId,
      content: null,
      links: [],
      createdById: null,
      createdAt: null,
      updatedAt: null,
      attachments: [],
    };
  }

  async listSessionMaterials(
    tenantId: string,
    sessionId: string,
    actor: SessionMaterialActor,
  ) {
    if (actor.role === Role.TEACHER) {
      await this.ensureTeacherAccess(tenantId, sessionId, actor);
    } else if (actor.role === Role.STUDENT) {
      await this.ensureStudentAccess(tenantId, sessionId, actor);
    } else {
      await this.getSessionOrThrow(tenantId, sessionId);
    }

    const material = await this.getSessionMaterialClient().findFirst({
      where: { tenantId, sessionId },
      select: {
        id: true,
        tenantId: true,
        sessionId: true,
        content: true,
        links: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!material) {
      return this.buildEmptyMaterial({ tenantId, sessionId });
    }

    const attachments =
      await this.getSessionMaterialAttachmentClient().findMany({
        where: { tenantId, sessionMaterialId: material.id },
        orderBy: { createdAt: "desc" },
      });

    return {
      ...material,
      attachments: await this.mapAttachments(attachments),
    };
  }

  async upsertSessionMaterial(
    tenantId: string,
    sessionId: string,
    dto: CreateSessionMaterialDto,
    actor: SessionMaterialActor,
  ) {
    const { teacherProfileId } = await this.ensureTeacherAccess(
      tenantId,
      sessionId,
      actor,
    );

    // Parse content if provided
    let parsedContent: SessionMaterialContent | null = null;
    if (dto.content) {
      try {
        parsedContent = JSON.parse(dto.content) as SessionMaterialContent;
      } catch {
        throw new BadRequestException("Invalid content payload");
      }
    }

    // Use transaction for atomic operation
    return await this.prisma.client.$transaction(async (tx) => {
      // 1. Upsert SessionMaterial
      const material = await (
        tx as unknown as {
          sessionMaterial: {
            upsert: (args: unknown) => Promise<SessionMaterialRecord>;
          };
        }
      ).sessionMaterial.upsert({
        where: { tenantId_sessionId: { tenantId, sessionId } },
        update: {
          content: dto.content ? parsedContent : undefined,
          links: dto.links ?? undefined,
          updatedAt: new Date(),
        },
        create: {
          tenantId,
          sessionId,
          content: parsedContent,
          links: dto.links ?? [],
          createdById: teacherProfileId,
        },
        select: {
          id: true,
          tenantId: true,
          sessionId: true,
          content: true,
          links: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 2. Handle attachments if provided
      if (dto.attachments && dto.attachments.length > 0) {
        // Delete all existing attachments for this material
        await (
          tx as unknown as {
            sessionMaterialAttachment: {
              deleteMany: (args: unknown) => Promise<{ count: number }>;
            };
          }
        ).sessionMaterialAttachment.deleteMany({
          where: {
            tenantId,
            sessionMaterialId: material.id,
          },
        });

        // Create new attachment records
        const attachmentRecords = dto.attachments.map((attachment) => ({
          id: randomUUID(),
          tenantId,
          sessionMaterialId: material.id,
          fileKey: attachment.fileKey,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          createdAt: new Date(),
        }));

        await (
          tx as unknown as {
            sessionMaterialAttachment: {
              createMany: (args: unknown) => Promise<{ count: number }>;
            };
          }
        ).sessionMaterialAttachment.createMany({
          data: attachmentRecords,
        });
      }

      // 3. Fetch and return updated material with attachments
      const attachments = await (
        tx as unknown as {
          sessionMaterialAttachment: {
            findMany: (
              args: unknown,
            ) => Promise<SessionMaterialAttachmentRecord[]>;
          };
        }
      ).sessionMaterialAttachment.findMany({
        where: { tenantId, sessionMaterialId: material.id },
        orderBy: { createdAt: "desc" },
      });

      return {
        ...material,
        attachments: await this.mapAttachments(attachments),
      };
    });
  }

  async deleteSessionAttachment(
    tenantId: string,
    sessionId: string,
    attachmentId: string,
    actor: SessionMaterialActor,
  ) {
    await this.ensureTeacherAccess(tenantId, sessionId, actor);

    const material = await this.getSessionMaterialClient().findFirst({
      where: { tenantId, sessionId },
      select: { id: true },
    });

    if (!material) {
      throw new NotFoundException("Material not found");
    }

    const attachment =
      await this.getSessionMaterialAttachmentClient().findFirst({
        where: {
          id: attachmentId,
          tenantId,
          sessionMaterialId: material.id,
        },
      });

    if (!attachment) {
      throw new NotFoundException("Attachment not found");
    }

    await this.getSessionMaterialAttachmentClient().delete({
      where: { id: attachment.id },
    });

    return { id: attachment.id };
  }
}
