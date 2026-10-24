import { Role } from '@cedi/shared';
import { randomUUID } from 'node:crypto';
import type { CreateUserData, UserRecord } from '../src/users/users.repository';
import { UsersRepository } from '../src/users/users.repository';

/** Repositorio en memoria para probar autenticación sin base de datos. */
export class InMemoryUsersRepository extends UsersRepository {
  private readonly users = new Map<string, UserRecord>();

  findByEmail(email: string): Promise<UserRecord | null> {
    return Promise.resolve([...this.users.values()].find((u) => u.email === email) ?? null);
  }

  findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  create(data: CreateUserData): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      isActive: true,
      sessionsValidFrom: new Date(),
      ...data,
    };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  list(): Promise<UserRecord[]> {
    return Promise.resolve([...this.users.values()]);
  }

  setActive(id: string, isActive: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, {
        ...user,
        isActive,
        ...(!isActive && { sessionsValidFrom: new Date(user.sessionsValidFrom.getTime() + 1) }),
      });
    }
    return Promise.resolve();
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, {
        ...user,
        passwordHash,
        sessionsValidFrom: new Date(user.sessionsValidFrom.getTime() + 1),
      });
    }
    return Promise.resolve();
  }

  countActiveAdmins(): Promise<number> {
    return Promise.resolve(
      [...this.users.values()].filter((u) => u.role === Role.ADMIN && u.isActive).length,
    );
  }
}
