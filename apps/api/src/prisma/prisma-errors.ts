import { Prisma } from '../generated/prisma/client';

const hasCode = (error: unknown, code: string): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

/** Violación de un índice único (P2002). */
export const isUniqueViolation = (error: unknown): boolean => hasCode(error, 'P2002');

/** Violación de una clave foránea (P2003). */
export const isForeignKeyViolation = (error: unknown): boolean => hasCode(error, 'P2003');
