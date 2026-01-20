import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { SessionsModule } from "../sessions/sessions.module";
import { SchedulesController } from "./schedules.controller";
import { SchedulesService } from "./schedules.service";

@Module({
  imports: [PrismaModule, SessionsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
