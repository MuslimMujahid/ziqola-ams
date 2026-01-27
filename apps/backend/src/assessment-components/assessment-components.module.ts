import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AssessmentComponentsController } from "./assessment-components.controller";
import { AssessmentComponentsService } from "./assessment-components.service";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentComponentsController],
  providers: [AssessmentComponentsService],
})
export class AssessmentComponentsModule {}
