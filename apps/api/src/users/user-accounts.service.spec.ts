import { Role } from '@cedi/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUsersRepository } from '../../test/in-memory-users.repository';
import { PasswordHasher } from '../auth/password-hasher';
import { UserAccountError, UserAccountsService } from './user-accounts.service';

const PASSWORD = 'una-contraseña-segura';

describe('UserAccountsService', () => {
  let users: InMemoryUsersRepository;
  let hasher: PasswordHasher;
  let service: UserAccountsService;

  const createAdmin = (email = 'admin@cedi.test') =>
    service.create({ name: 'Admin', email, password: PASSWORD, role: Role.ADMIN });
  const createGuard = (email = 'guarda@cedi.test') =>
    service.create({ name: 'Guarda', email, password: PASSWORD, role: Role.SECURITY });

  beforeEach(() => {
    users = new InMemoryUsersRepository();
    hasher = new PasswordHasher();
    service = new UserAccountsService(users, hasher);
  });

  it('crea un guarda con la contraseña hasheada y sin exponer el hash', async () => {
    const guard = await createGuard();
    expect(guard).toMatchObject({ email: 'guarda@cedi.test', role: Role.SECURITY, isActive: true });
    expect(guard).not.toHaveProperty('passwordHash');
    const stored = await users.findByEmail('guarda@cedi.test');
    expect(await hasher.verify(stored!.passwordHash, PASSWORD)).toBe(true);
  });

  it('rechaza un correo repetido', async () => {
    await createGuard();
    await expect(createGuard()).rejects.toThrow(UserAccountError);
  });

  it('desactiva y reactiva a un guarda', async () => {
    await createGuard();
    expect((await service.setActive('guarda@cedi.test', false)).isActive).toBe(false);
    expect((await service.setActive('guarda@cedi.test', true)).isActive).toBe(true);
  });

  it('no permite desactivar al último administrador activo', async () => {
    await createAdmin();
    await expect(service.setActive('admin@cedi.test', false)).rejects.toThrow(
      /último administrador activo/,
    );
  });

  it('permite desactivar un administrador si queda otro activo', async () => {
    await createAdmin('a@cedi.test');
    await createAdmin('b@cedi.test');
    expect((await service.setActive('a@cedi.test', false)).isActive).toBe(false);
  });

  it('restablece la contraseña', async () => {
    await createGuard();
    await service.resetPassword('guarda@cedi.test', 'otra-contraseña-nueva');
    const stored = await users.findByEmail('guarda@cedi.test');
    expect(await hasher.verify(stored!.passwordHash, 'otra-contraseña-nueva')).toBe(true);
    expect(await hasher.verify(stored!.passwordHash, PASSWORD)).toBe(false);
  });

  it('informa si el correo no existe', async () => {
    await expect(service.resetPassword('nadie@cedi.test', PASSWORD)).rejects.toThrow(
      /No existe un usuario/,
    );
  });

  it('lista usuarios sin hashes de contraseña', async () => {
    await createAdmin();
    await createGuard();
    const list = await service.list();
    expect(list).toHaveLength(2);
    list.forEach((user) => expect(user).not.toHaveProperty('passwordHash'));
  });
});
