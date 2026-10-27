import { AuditAction, PersonType, Role } from '@cedi/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_ACCOUNTS, setupDemo } from '../../scripts/lib/demo-data';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { UserAccountsService } from '../../src/users/user-accounts.service';
import { PrismaUsersRepository } from '../../src/users/users.repository';
import { clearDatabase, createTestPrisma } from './test-database';

const prisma = createTestPrisma();
const hasher = new PasswordHasher();
const users = new PrismaUsersRepository(prisma);
const now = new Date();
const options = { now, timezone: 'America/Mexico_City', nodeEnv: 'development' };

const passwordWorks = async (email: string, password: string) => {
  const user = await users.findByEmail(email);
  return user !== null && (await hasher.verify(user.passwordHash, password));
};

describe('npm run demo:setup contra PostgreSQL (ADR 0016)', () => {
  beforeEach(() => clearDatabase(prisma));

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('se niega en producción sin tocar la base', async () => {
    await expect(setupDemo(prisma, { ...options, nodeEnv: 'production' })).rejects.toThrow(
      /producción/,
    );
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.person.count()).toBe(0);
  });

  it('crea una cuenta por rol cuya contraseña generada permite entrar', async () => {
    const { accounts } = await setupDemo(prisma, options);

    expect(accounts.map((a) => [a.email, a.role])).toEqual(
      DEMO_ACCOUNTS.map((a) => [a.email, a.role]),
    );
    for (const account of accounts) {
      expect(await passwordWorks(account.email, account.password)).toBe(true);
      expect((await users.findByEmail(account.email))?.isActive).toBe(true);
    }
  });

  it('crea personas de los cuatro tipos con solo los datos de su tipo (FR-2)', async () => {
    const result = await setupDemo(prisma, options);
    const persons = await prisma.person.findMany({
      include: { visits: { include: { tools: true } } },
    });

    expect(result.dataCreated).toBe(true);
    expect(persons).toHaveLength(result.persons);
    expect(new Set(persons.map((p) => p.type))).toEqual(new Set(Object.values(PersonType)));
    for (const person of persons) {
      for (const visit of person.visits) {
        expect(visit.personType).toBe(person.type);
        expect(visit.companyId).toBe(person.companyId);
        if (person.type === PersonType.EXTERNAL_WORKER) {
          expect([visit.purpose, visit.area]).toEqual([null, null]);
        } else {
          expect(visit.purpose).toBeTruthy();
          expect(visit.area).toBeTruthy();
        }
        if (person.type !== PersonType.MAINTENANCE_TECHNICIAN) expect(visit.tools).toEqual([]);
      }
    }
  });

  it('deja visitas coherentes: gente dentro, historial y ninguna fecha futura', async () => {
    const result = await setupDemo(prisma, options);
    const visits = await prisma.visit.findMany();

    expect(visits).toHaveLength(result.visits);
    const open = visits.filter((v) => v.exitAt === null);
    expect(open.length).toBeGreaterThan(0);
    // R1: nunca dos visitas abiertas de la misma persona.
    expect(new Set(open.map((v) => v.personId)).size).toBe(open.length);
    for (const visit of visits) {
      expect(visit.entryAt.getTime()).toBeLessThanOrEqual(now.getTime());
      if (visit.exitAt) expect(visit.exitAt.getTime()).toBeGreaterThan(visit.entryAt.getTime());
    }
  });

  it('registra la auditoría de cada persona, entrada y salida', async () => {
    const result = await setupDemo(prisma, options);
    const closed = await prisma.visit.count({ where: { exitAt: { not: null } } });
    const audit = await prisma.auditLog.groupBy({ by: ['action'], _count: true });
    const count = (action: AuditAction) => audit.find((a) => a.action === action)?._count ?? 0;

    expect(count(AuditAction.PERSON_CREATED)).toBe(result.persons);
    expect(count(AuditAction.VISIT_ENTRY_REGISTERED)).toBe(result.visits);
    expect(
      count(AuditAction.VISIT_EXIT_REGISTERED) + count(AuditAction.VISIT_CLOSED_MANUALLY),
    ).toBe(closed);
    expect(count(AuditAction.VISIT_CLOSED_MANUALLY)).toBe(1);
  });

  it('al repetirse no duplica datos y renueva las contraseñas', async () => {
    const first = await setupDemo(prisma, options);
    const counts = async () => [
      await prisma.user.count(),
      await prisma.person.count(),
      await prisma.visit.count(),
      await prisma.auditLog.count(),
    ];
    const before = await counts();
    await users.setActive((await users.findByEmail(DEMO_ACCOUNTS[0].email))?.id ?? '', false);

    const second = await setupDemo(prisma, options);

    expect(second.dataCreated).toBe(false);
    expect(await counts()).toEqual(before);
    for (const [index, account] of second.accounts.entries()) {
      expect(account.password).not.toBe(first.accounts[index]?.password);
      expect(await passwordWorks(account.email, account.password)).toBe(true);
      expect(await passwordWorks(account.email, first.accounts[index]?.password ?? '')).toBe(false);
      expect((await users.findByEmail(account.email))?.isActive).toBe(true);
    }
  });

  it('no toca cuentas que no son de demostración', async () => {
    const accounts = new UserAccountsService(users, hasher);
    await accounts.create({
      name: 'Admin real',
      email: 'admin@cedi.test',
      password: 'contraseña-de-prueba-1',
      role: Role.ADMIN,
    });
    const before = await users.findByEmail('admin@cedi.test');

    await setupDemo(prisma, options);

    expect(await users.findByEmail('admin@cedi.test')).toEqual(before);
  });
});
