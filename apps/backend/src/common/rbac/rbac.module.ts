import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { PermissionsGuard } from "../guards/permissions.guard";

/**
 * Common module for RBAC functionality
 * Provides guards and decorators for role-based and permission-based access control
 *
 * Guards are applied globally in the following order:
 * 1. JwtAuthGuard - Validates JWT and attaches user to request
 * 2. RolesGuard - Checks user role against @Roles decorator
 * 3. PermissionsGuard - Checks user permissions against @RequirePermissions decorator
 *
 * Use @Public() decorator to bypass authentication on specific endpoints
 */
@Module({
  providers: [
    // Apply JWT authentication globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply role-based access control globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Apply permission-based access control globally
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class RbacModule {}
