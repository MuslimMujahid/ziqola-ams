import { SetMetadata } from "@nestjs/common";
import { Permission } from "../enums/permission.enum";

export const PERMISSIONS_KEY = "permissions";

/**
 * Mark an endpoint with required permissions
 * User must have ALL of the specified permissions
 *
 * @example
 * @RequirePermissions(Permission.USER_READ, Permission.USER_CREATE)
 * @Post('users')
 * create() { ... }
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
