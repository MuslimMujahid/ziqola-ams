import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AssessmentRecapController } from "./assessment-recap.controller";
import { AssessmentRecapService } from "./assessment-recap.service";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentRecapController],
  providers: [AssessmentRecapService],
})
export class AssessmentRecapModule {}
