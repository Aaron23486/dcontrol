import { Injectable } from '@nestjs/common';
import { Role } from '@cedi/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  /** Versión de sesión: las sesiones emitidas con otro valor ya no valen (docs/security.md). */
  sessionsValidFrom: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

/** Acceso a datos de usuarios. Clase abstracta para usarla como token de inyección. */
export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<UserRecord | null>;
  abstract findById(id: string): Promise<UserRecord | null>;
  abstract create(data: CreateUserData): Promise<UserRecord>;
  abstract list(): Promise<UserRecord[]>;
  /** Desactivar también revoca las sesiones abiertas (al reactivar no vuelven a valer). */
  abstract setActive(id: string, isActive: boolean): Promise<void>;
  /** Cambiar la contraseña revoca las sesiones abiertas. */
  abstract updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  abstract countActiveAdmins(): Promise<number>;
}

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  passwordHash: true,
  role: true,
  isActive: true,
  sessionsValidFrom: true,
} as const;

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { email }, select: USER_FIELDS });
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({ where: { id }, select: USER_FIELDS });
  }

  create(data: CreateUserData): Promise<UserRecord> {
    return this.prisma.user.create({ data, select: USER_FIELDS });
  }

  list(): Promise<UserRecord[]> {
    return this.prisma.user.findMany({ select: USER_FIELDS, orderBy: { name: 'asc' } });
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive, ...(!isActive && { sessionsValidFrom: new Date() }) },
    });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, sessionsValidFrom: new Date() },
    });
  }

  countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
  }
}
