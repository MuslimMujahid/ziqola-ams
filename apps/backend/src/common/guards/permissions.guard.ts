import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permission, DefaultRolePermissions } from "../enums/permission.enum";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Guard that checks if the authenticated user has all required permissions
 * Works in combination with JwtAuthGuard
 *
 * Permission resolution:
 * 1. Check default role permissions from DefaultRolePermissions
 * 2. In future: Check custom permissions from database
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions specified, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request (set by JWT strategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException("User role not found");
    }

    // Get user permissions based on role
    const userPermissions = this.getUserPermissions(user.role);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission)
      );

      throw new ForbiddenException(
        `Insufficient permissions. Missing: ${missingPermissions.join(", ")}`
      );
    }

    return true;
  }

  /**
   * Get permissions for a user role
   * Currently uses default role permissions
   * In future: can be extended to load custom permissions from database
   */
  private getUserPermissions(role: string): Permission[] {
    return DefaultRolePermissions[role] || [];
  }
}
