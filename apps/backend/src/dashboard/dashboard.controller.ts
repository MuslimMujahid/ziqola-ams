import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin-staff/summary')
  @Roles(Role.ADMIN_STAFF, Role.PRINCIPAL)
  async getAdminStaffSummary(@User() user: { tenantId: string }) {
    return this.dashboardService.getAdminStaffSummary(user.tenantId);
  }
}
