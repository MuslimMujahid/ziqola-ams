import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

const STATUS_INVITED = "INVITED";

@Injectable()
export class UserInvitePruneService {
  private readonly logger = new Logger(UserInvitePruneService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 * * * *")
  async pruneExpiredInvites() {
    const now = new Date();
    const result = await this.prisma.client.user.deleteMany({
      where: {
        status: STATUS_INVITED,
        inviteExpiresAt: {
          lt: now,
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Pruned ${result.count} expired invited users`);
    }
  }
}
