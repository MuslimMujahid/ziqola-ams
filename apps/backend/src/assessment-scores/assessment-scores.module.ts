import { Module } from "@nestjs/common";
import { AssessmentScoresController } from "./assessment-scores.controller";
import { AssessmentScoresService } from "./assessment-scores.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentScoresController],
  providers: [AssessmentScoresService],
})
export class AssessmentScoresModule {}
