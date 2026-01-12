import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { prisma } from "@repo/db";

@Injectable()
export class PrismaService implements OnModuleInit {
  client: typeof prisma;

  async onModuleInit() {
    this.client = prisma;
  }

  async enableShutdownHooks(app: INestApplication) {
    // Shared client handles lifecycle; keep hook minimal
    (this as any).$on?.("beforeExit", async () => {
      await app.close();
    });
  }
}
