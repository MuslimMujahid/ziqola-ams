import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ClassSubjectsController } from "./class-subjects.controller";
import { ClassSubjectsService } from "./class-subjects.service";

@Module({
  imports: [PrismaModule],
  controllers: [ClassSubjectsController],
  providers: [ClassSubjectsService],
})
export class ClassSubjectsModule {}
