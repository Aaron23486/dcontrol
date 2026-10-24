/** Roles del sistema. Solo existen estos dos (spec §5). */
export const Role = {
  SECURITY: 'SECURITY',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const ROLES = Object.values(Role);

/** Tipos de persona externa (spec §7). */
export const PersonType = {
  EXTERNAL_WORKER: 'EXTERNAL_WORKER',
  CONTRACTOR: 'CONTRACTOR',
  MAINTENANCE_TECHNICIAN: 'MAINTENANCE_TECHNICIAN',
  VISITOR: 'VISITOR',
} as const;
export type PersonType = (typeof PersonType)[keyof typeof PersonType];
export const PERSON_TYPES = Object.values(PersonType);
