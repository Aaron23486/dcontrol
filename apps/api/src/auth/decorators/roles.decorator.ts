import { SetMetadata } from '@nestjs/common';
import { Role } from '@cedi/shared';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a los roles indicados. Sin este decorador basta con tener sesión. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
