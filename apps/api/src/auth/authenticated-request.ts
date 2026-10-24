import type { AuthUser } from '@cedi/shared';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
