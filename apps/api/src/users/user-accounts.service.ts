import { Injectable } from '@nestjs/common';
import { Role } from '@cedi/shared';
import { PasswordHasher } from '../auth/password-hasher';
import { UserRecord, UsersRepository } from './users.repository';

/** Error de gestión de cuentas con mensaje apto para mostrar en la terminal. */
export class UserAccountError extends Error {}

export type UserSummary = Omit<UserRecord, 'passwordHash'>;

export interface NewAccount {
  name: string;
  email: string;
  password: string;
  role: Role;
}

/**
 * Casos de uso de cuentas de usuario (ADR 0008: sin pantalla, se usan desde la terminal).
 * Recibe datos ya validados con los esquemas de @cedi/shared.
 */
@Injectable()
export class UserAccountsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async create({ name, email, password, role }: NewAccount): Promise<UserSummary> {
    if (await this.users.findByEmail(email)) {
      throw new UserAccountError(`Ya existe un usuario con el correo ${email}.`);
    }
    const passwordHash = await this.hasher.hash(password);
    return toSummary(await this.users.create({ name, email, passwordHash, role }));
  }

  async list(): Promise<UserSummary[]> {
    return (await this.users.list()).map(toSummary);
  }

  async setActive(email: string, isActive: boolean): Promise<UserSummary> {
    const user = await this.findExisting(email);
    const deactivatesAnAdmin = !isActive && user.isActive && user.role === Role.ADMIN;
    if (deactivatesAnAdmin && (await this.users.countActiveAdmins()) <= 1) {
      throw new UserAccountError(
        'No se puede desactivar al último administrador activo. Crea otro administrador primero.',
      );
    }
    await this.users.setActive(user.id, isActive);
    return toSummary({ ...user, isActive });
  }

  async resetPassword(email: string, password: string): Promise<void> {
    const user = await this.findExisting(email);
    await this.users.updatePasswordHash(user.id, await this.hasher.hash(password));
  }

  private async findExisting(email: string): Promise<UserRecord> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UserAccountError(`No existe un usuario con el correo ${email}.`);
    }
    return user;
  }
}

const toSummary = ({ passwordHash: _passwordHash, ...summary }: UserRecord): UserSummary => summary;
