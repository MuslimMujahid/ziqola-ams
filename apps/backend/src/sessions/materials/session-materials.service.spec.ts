import { BadRequestException } from "@nestjs/common";
import { Role } from "@repo/db";

import { SessionMaterialsService } from "./session-materials.service";
import type { PrismaService } from "../../prisma/prisma.service";
import type { MinioService } from "../../common/storage/minio.service";
import type { CreateSessionMaterialDto } from "./dto/create-session-material.dto";

describe("SessionMaterialsService", () => {
  const tenantId = "tenant-1";
  const sessionId = "session-1";
  const actor = { sub: "user-1", tenantId, role: Role.TEACHER };

  const materialRecord = {
    id: "material-1",
    tenantId,
    sessionId,
    content: { nodes: [] },
    createdById: "teacher-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const attachmentRecord = {
    id: "attachment-1",
    tenantId,
    sessionMaterialId: materialRecord.id,
    fileKey: "tenant-1/uploads/key.pdf",
    fileName: "file.pdf",
    mimeType: "application/pdf",
    size: 1024,
    createdAt: new Date(),
  };

  function createService() {
    const tx = {
      sessionMaterial: {
        upsert: jest.fn().mockResolvedValue(materialRecord),
      },
      sessionMaterialAttachment: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([attachmentRecord]),
      },
    };

    const prismaService = {
      client: {
        $transaction: jest.fn(
          async (callback: (txClient: typeof tx) => unknown) => callback(tx),
        ),
        teacherProfile: {
          findFirst: jest.fn().mockResolvedValue({ id: "teacher-1" }),
        },
        session: {
          findFirst: jest.fn().mockResolvedValue({
            id: sessionId,
            tenantId,
            classId: "class-1",
            date: new Date(),
            classSubject: { teacherProfileId: "teacher-1" },
          }),
        },
      },
    } as unknown as PrismaService;

    const minioService = {
      getPresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue("https://download.url"),
    } as unknown as MinioService;

    return {
      service: new SessionMaterialsService(prismaService, minioService),
      prismaService,
      minioService,
      tx,
    };
  }

  it("upserts material with attachments atomically", async () => {
    const { service, tx } = createService();

    const dto: CreateSessionMaterialDto = {
      content: JSON.stringify([
        { type: "paragraph", children: [{ text: "Hi" }] },
      ]),
      links: ["https://example.com"],
      attachments: [
        {
          fileKey: attachmentRecord.fileKey,
          fileName: attachmentRecord.fileName,
          mimeType: attachmentRecord.mimeType,
          size: attachmentRecord.size,
        },
      ],
    };

    const result = await service.upsertSessionMaterial(
      tenantId,
      sessionId,
      dto,
      actor,
    );

    expect(tx.sessionMaterialAttachment.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.sessionMaterialAttachment.createMany).toHaveBeenCalledTimes(1);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].downloadUrl).toBe("https://download.url");
  });

  it("throws when content is invalid JSON", async () => {
    const { service } = createService();

    const dto: CreateSessionMaterialDto = {
      content: "{ invalid-json }",
    };

    await expect(
      service.upsertSessionMaterial(tenantId, sessionId, dto, actor),
    ).rejects.toThrow(BadRequestException);
  });
});
