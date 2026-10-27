/**
 * Cuentas y datos de demostración para que un evaluador pruebe la app sin depender del autor
 * (ADR 0016). Solo inserta: no borra ni modifica datos, salvo la contraseña de las dos cuentas
 * de demostración. Las visitas se calculan a partir de `now` en la zona horaria del CEDI.
 */
import {
  AuditAction,
  AuditEntity,
  PersonType,
  Role,
  normalizeCompanyName,
  normalizeSearchText,
} from '@cedi/shared';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { calendarDate, startOfLocalDate } from '../../src/common/time/clock';
import type { Prisma } from '../../src/generated/prisma/client';
import type { PrismaService } from '../../src/prisma/prisma.service';
import { UserAccountsService } from '../../src/users/user-accounts.service';
import { PrismaUsersRepository } from '../../src/users/users.repository';
import { DEMO_COMPANIES, ensureDemoCompanies, type DemoCompany } from './demo-companies';
import { generateDemoPassword } from './demo-password';

export const DEMO_EMAIL_DOMAIN = 'demo.cedi.test';

export const DEMO_ACCOUNTS = [
  { name: 'Guarda de demostración', email: `seguridad@${DEMO_EMAIL_DOMAIN}`, role: Role.SECURITY },
  { name: 'Administrador de demostración', email: `admin@${DEMO_EMAIL_DOMAIN}`, role: Role.ADMIN },
] as const;

export interface DemoAccountAccess {
  email: string;
  role: Role;
  /** Generada en esta ejecución; no se guarda en ningún archivo. */
  password: string;
}

export interface DemoSetupResult {
  accounts: DemoAccountAccess[];
  /** `false` si los datos ya existían de una ejecución anterior (no se duplican). */
  dataCreated: boolean;
  persons: number;
  visits: number;
}

export interface DemoSetupOptions {
  now: Date;
  timezone: string;
  nodeEnv: string | undefined;
}

interface DemoTool {
  name: string;
  quantity?: number;
  description?: string;
}

interface DemoVisit {
  entryAt: Date;
  /** Sin salida: la persona sigue dentro. */
  exitAt?: Date;
  /** Visita olvidada que el administrador cerró después con la hora real (D3). */
  closedManuallyAt?: Date;
  purpose?: string;
  area?: string;
  tools?: DemoTool[];
}

interface DemoPerson {
  fullName: string;
  identification: string;
  type: PersonType;
  company: DemoCompany;
  /** En orden cronológico; solo la última puede seguir abierta. */
  visits: DemoVisit[];
}

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/** Personas y visitas ficticias: los cuatro tipos, gente dentro, historial y una visita olvidada. */
function demoPeople(now: Date, timezone: string): DemoPerson[] {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * MINUTE);
  const daysAgoAt = (days: number, hour: number, minute = 0) =>
    new Date(
      startOfLocalDate(
        calendarDate(new Date(now.getTime() - days * DAY), timezone),
        timezone,
      ).getTime() +
        (hour * 60 + minute) * MINUTE,
    );
  const workday = (days: number) => ({ entryAt: daysAgoAt(days, 8), exitAt: daysAgoAt(days, 17) });

  return [
    {
      fullName: 'Luis Hernández Soto',
      identification: 'DEMO0001',
      type: PersonType.EXTERNAL_WORKER,
      company: 'Limpieza Total',
      visits: [workday(2), workday(1), { entryAt: ago(180) }],
    },
    {
      fullName: 'María Fernanda Ruiz',
      identification: 'DEMO0002',
      type: PersonType.EXTERNAL_WORKER,
      company: 'Transportes del Norte S.A.',
      visits: [workday(1), { entryAt: ago(360), exitAt: ago(60) }],
    },
    {
      fullName: 'Jorge Castillo Méndez',
      identification: 'DEMO0003',
      type: PersonType.CONTRACTOR,
      company: 'Servicios Industriales Rivera',
      visits: [
        {
          entryAt: daysAgoAt(3, 9),
          exitAt: daysAgoAt(3, 13, 30),
          purpose: 'Medición para estanterías',
          area: 'Nave 2',
        },
        { entryAt: ago(120), purpose: 'Instalación de estanterías', area: 'Nave 2' },
      ],
    },
    {
      fullName: 'Ana Lucía Torres',
      identification: 'DEMO0004',
      type: PersonType.CONTRACTOR,
      company: 'Servicios Industriales Rivera',
      visits: [
        {
          entryAt: ago(240),
          exitAt: ago(110),
          purpose: 'Pintura de señalización',
          area: 'Andén 3',
        },
      ],
    },
    {
      fullName: 'Elena Navarro Cruz',
      identification: 'DEMO0005',
      type: PersonType.CONTRACTOR,
      company: 'Servicios Industriales Rivera',
      visits: [
        {
          entryAt: daysAgoAt(5, 10),
          exitAt: daysAgoAt(5, 15),
          purpose: 'Reparación de puerta de andén',
          area: 'Andén 1',
        },
      ],
    },
    {
      fullName: 'Ricardo Gómez Peña',
      identification: 'DEMO0006',
      type: PersonType.MAINTENANCE_TECHNICIAN,
      company: 'Mantenimiento Integral MX',
      visits: [
        {
          entryAt: ago(90),
          purpose: 'Mantenimiento preventivo de montacargas',
          area: 'Taller',
          tools: [
            { name: 'Llave de impacto', description: 'inalámbrica' },
            { name: 'Multímetro' },
            { name: 'Gato hidráulico', quantity: 2 },
          ],
        },
      ],
    },
    {
      fullName: 'Patricia Vega Luna',
      identification: 'DEMO0007',
      type: PersonType.MAINTENANCE_TECHNICIAN,
      company: 'Mantenimiento Integral MX',
      visits: [
        {
          entryAt: daysAgoAt(1, 9),
          exitAt: daysAgoAt(1, 15, 30),
          closedManuallyAt: daysAgoAt(1, 19),
          purpose: 'Revisión de luminarias',
          area: 'Nave 1',
          tools: [{ name: 'Escalera de tijera' }],
        },
      ],
    },
    {
      fullName: 'Carlos Ramírez Ortiz',
      identification: 'DEMO0008',
      type: PersonType.VISITOR,
      company: 'Particular',
      // D3: sigue «dentro» desde ayer; el panel lo marca como visita sin salida.
      visits: [
        { entryAt: daysAgoAt(1, 10), purpose: 'Entrevista de trabajo', area: 'Recursos Humanos' },
      ],
    },
    {
      fullName: 'Sofía Morales Díaz',
      identification: 'DEMO0009',
      type: PersonType.VISITOR,
      company: 'Transportes del Norte S.A.',
      visits: [
        { entryAt: ago(300), exitAt: ago(250), purpose: 'Reunión con logística', area: 'Oficinas' },
      ],
    },
    {
      fullName: 'Daniel Ortega Silva',
      identification: 'DEMO0010',
      type: PersonType.VISITOR,
      company: 'Limpieza Total',
      visits: [
        {
          entryAt: daysAgoAt(2, 11),
          exitAt: daysAgoAt(2, 12),
          purpose: 'Auditoría del servicio',
          area: 'Oficinas',
        },
      ],
    },
  ];
}

/** Crea las dos cuentas o, si ya existen, les asigna una contraseña nueva y las activa. */
async function setupAccounts(prisma: PrismaService): Promise<DemoAccountAccess[]> {
  const users = new PrismaUsersRepository(prisma);
  const accounts = new UserAccountsService(users, new PasswordHasher());
  const access: DemoAccountAccess[] = [];
  for (const account of DEMO_ACCOUNTS) {
    const password = generateDemoPassword(account);
    const existing = await users.findByEmail(account.email);
    if (!existing) {
      await accounts.create({ ...account, password });
    } else {
      if (existing.role !== account.role) {
        throw new Error(`${account.email} ya existe con otro rol; no se modifica.`);
      }
      await accounts.resetPassword(account.email, password);
      if (!existing.isActive) await accounts.setActive(account.email, true);
    }
    access.push({ email: account.email, role: account.role, password });
  }
  return access;
}

/** Inserta personas, visitas, herramientas y su auditoría en una sola transacción. */
async function insertPeople(
  prisma: PrismaService,
  people: DemoPerson[],
  guardId: string,
  adminId: string,
): Promise<number> {
  await ensureDemoCompanies(prisma);
  const companies = await prisma.company.findMany({
    where: { nameNormalized: { in: DEMO_COMPANIES.map(normalizeCompanyName) } },
    select: { id: true, nameNormalized: true },
  });
  const companyId = (name: DemoCompany) => {
    const company = companies.find((c) => c.nameNormalized === normalizeCompanyName(name));
    if (!company) throw new Error(`Falta la empresa de demostración ${name}.`);
    return company.id;
  };

  let visits = 0;
  await prisma.$transaction(async (tx) => {
    for (const demo of people) {
      const firstEntry = demo.visits[0]?.entryAt ?? new Date();
      const person = await tx.person.create({
        data: {
          fullName: demo.fullName,
          nameNormalized: normalizeSearchText(demo.fullName),
          identification: demo.identification,
          type: demo.type,
          companyId: companyId(demo.company),
          createdAt: new Date(firstEntry.getTime() - MINUTE),
        },
      });
      const audit: Prisma.AuditLogCreateManyInput[] = [
        {
          userId: guardId,
          action: AuditAction.PERSON_CREATED,
          entity: AuditEntity.PERSON,
          entityId: person.id,
          changedFields: [],
          createdAt: person.createdAt,
        },
      ];
      for (const demoVisit of demo.visits) {
        const exitById = demoVisit.exitAt ? (demoVisit.closedManuallyAt ? adminId : guardId) : null;
        const visit = await tx.visit.create({
          data: {
            personId: person.id,
            personType: demo.type,
            companyId: person.companyId,
            entryAt: demoVisit.entryAt,
            exitAt: demoVisit.exitAt ?? null,
            entryById: guardId,
            exitById,
            purpose: demoVisit.purpose ?? null,
            area: demoVisit.area ?? null,
            tools: demoVisit.tools ? { create: demoVisit.tools } : undefined,
          },
        });
        visits += 1;
        audit.push({
          userId: guardId,
          action: AuditAction.VISIT_ENTRY_REGISTERED,
          entity: AuditEntity.VISIT,
          entityId: visit.id,
          changedFields: [],
          createdAt: visit.entryAt,
        });
        if (demoVisit.exitAt && exitById) {
          audit.push({
            userId: exitById,
            action: demoVisit.closedManuallyAt
              ? AuditAction.VISIT_CLOSED_MANUALLY
              : AuditAction.VISIT_EXIT_REGISTERED,
            entity: AuditEntity.VISIT,
            entityId: visit.id,
            changedFields: ['exitAt'],
            createdAt: demoVisit.closedManuallyAt ?? demoVisit.exitAt,
          });
        }
      }
      await tx.auditLog.createMany({ data: audit });
    }
  });
  return visits;
}

/** Prepara las cuentas y los datos de demostración. Se niega en producción. */
export async function setupDemo(
  prisma: PrismaService,
  { now, timezone, nodeEnv }: DemoSetupOptions,
): Promise<DemoSetupResult> {
  if (nodeEnv === 'production') {
    throw new Error(
      'demo:setup crea cuentas con contraseñas visibles: nunca se ejecuta en producción.',
    );
  }
  const accounts = await setupAccounts(prisma);
  const people = demoPeople(now, timezone);

  const existing = await prisma.person.count({
    where: { identification: { in: people.map((p) => p.identification) } },
  });
  if (existing > 0) {
    return { accounts, dataCreated: false, persons: people.length, visits: 0 };
  }

  const [guard, admin] = await Promise.all(
    DEMO_ACCOUNTS.map((account) =>
      prisma.user.findUniqueOrThrow({ where: { email: account.email }, select: { id: true } }),
    ),
  );
  if (!guard || !admin) throw new Error('No se encontraron las cuentas de demostración.');
  const visits = await insertPeople(prisma, people, guard.id, admin.id);
  return { accounts, dataCreated: true, persons: people.length, visits };
}
