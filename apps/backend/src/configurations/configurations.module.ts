import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../common/storage/storage.module";
import { ConfigurationsController } from "./configurations.controller";
import { ConfigurationsService } from "./configurations.service";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
})
export class ConfigurationsModule {}
