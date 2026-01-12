import { SetMetadata } from "@nestjs/common";
import { Role } from "../enums/role.enum";

export const ROLES_KEY = "roles";

/**
 * Mark an endpoint with required roles
 * User must have at least one of the specified roles
 *
 * @example
 * @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
 * @Get('users')
 * findAll() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
