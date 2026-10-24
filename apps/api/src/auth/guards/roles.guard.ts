import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@cedi/shared';
import { AppException } from '../../common/errors/app.exception';
import type { AuthenticatedRequest } from '../authenticated-request';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Guard global: se ejecuta después de SessionGuard y aplica @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<Partial<AuthenticatedRequest>>();
    if (!user || !roles.includes(user.role)) {
      throw AppException.forbidden();
    }
    return true;
  }
}
