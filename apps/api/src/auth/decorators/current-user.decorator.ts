import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@cedi/shared';
import type { AuthenticatedRequest } from '../authenticated-request';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
