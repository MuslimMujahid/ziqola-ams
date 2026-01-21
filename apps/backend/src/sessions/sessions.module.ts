import { Module } from "@nestjs/common";

import { StorageModule } from "../common/storage/storage.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SessionsController } from "./sessions.controller";
import { SessionMaterialsService } from "./materials/session-materials.service";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionMaterialsService],
  exports: [SessionsService],
})
export class SessionsModule {}
