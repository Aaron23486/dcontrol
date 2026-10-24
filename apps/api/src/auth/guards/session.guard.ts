import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../../common/errors/app.exception';
import { AuthService } from '../auth.service';
import type { AuthenticatedRequest } from '../authenticated-request';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_COOKIE } from '../session-cookie';

/** Guard global: exige una sesión válida salvo en endpoints marcados con @Public(). */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || token.length === 0) {
      throw AppException.unauthenticated();
    }
    request.user = await this.auth.authenticate(token);
    return true;
  }
}
