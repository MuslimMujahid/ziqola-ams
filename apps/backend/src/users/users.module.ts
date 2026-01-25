import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../common/email/email.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserInvitePruneService } from "./user-invite-prune.service";

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService, UserInvitePruneService],
  exports: [UsersService],
})
export class UsersModule {}
