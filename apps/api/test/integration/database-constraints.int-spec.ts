import { PersonType, Role } from '@cedi/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { clearDatabase, createTestPrisma } from './test-database';

const prisma = createTestPrisma();

let userId: string;
let companyId: string;
let personSeq = 0;

async function createPerson(type: PersonType = PersonType.EXTERNAL_WORKER) {
  personSeq += 1;
  return prisma.person.create({
    data: {
      fullName: `Persona ${personSeq}`,
      nameNormalized: `PERSONA ${personSeq}`,
      identification: `CED${String(personSeq).padStart(5, '0')}`,
      type,
      companyId,
    },
  });
}

/** Motivo y área válidos según el tipo (R18): el trabajador externo no los lleva. */
const detailsFor = (type: PersonType) =>
  type === PersonType.EXTERNAL_WORKER ? {} : { purpose: 'Reparación', area: 'Bodega' };

type PersonRow = Awaited<ReturnType<typeof createPerson>>;

/** Abre una visita copiando el tipo y la empresa vigentes de la persona (R17). */
const openVisit = (person: PersonRow) =>
  prisma.visit.create({
    data: {
      personId: person.id,
      personType: person.type,
      companyId: person.companyId,
      entryById: userId,
      ...detailsFor(person.type),
    },
  });

/** Código SQLSTATE o mensaje de la violación, sin depender del formato de error de Prisma. */
async function violation(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return String(error instanceof Error ? error.message : error);
  }
  throw new Error('Se esperaba que la base de datos rechazara la operación');
}

const clearTables = () => clearDatabase(prisma);

beforeEach(async () => {
  await clearTables();
  userId = (
    await prisma.user.create({
      data: { name: 'Guardia', email: 'guardia@cedi.test', passwordHash: 'x', role: Role.SECURITY },
    })
  ).id;
  companyId = (await prisma.company.create({ data: { name: 'Acme', nameNormalized: 'ACME' } })).id;
});

// Deja la base vacía: datos sobrantes podrían hacer fallar una migración futura.
afterAll(async () => {
  await clearTables();
  await prisma.$disconnect();
});

describe('R1: una persona solo puede tener una visita abierta', () => {
  it('rechaza una segunda visita abierta', async () => {
    const person = await createPerson();
    await openVisit(person);
    expect(await violation(openVisit(person))).toMatch(
      /visits_one_open_per_person|Unique constraint/i,
    );
  });

  it('permite una nueva visita después de cerrar la anterior', async () => {
    const person = await createPerson();
    const visit = await openVisit(person);
    await prisma.visit.update({
      where: { id: visit.id },
      data: { exitAt: new Date(), exitById: userId },
    });
    await expect(openVisit(person)).resolves.toBeDefined();
  });

  it('con escaneos simultáneos desde varias casetas solo una entrada prospera', async () => {
    const person = await createPerson();
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => openVisit(person)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.visit.count({ where: { personId: person.id, exitAt: null } })).toBe(1);
  });
});

describe('R11 y R12: coherencia de la salida', () => {
  it('rechaza una salida anterior a la entrada', async () => {
    const person = await createPerson();
    const visit = await openVisit(person);
    const before = new Date(visit.entryAt.getTime() - 60_000);
    expect(
      await violation(
        prisma.visit.update({
          where: { id: visit.id },
          data: { exitAt: before, exitById: userId },
        }),
      ),
    ).toMatch(/visits_exit_after_entry/);
  });

  it('rechaza una hora de salida sin usuario que la registre', async () => {
    const person = await createPerson();
    const visit = await openVisit(person);
    expect(
      await violation(
        prisma.visit.update({ where: { id: visit.id }, data: { exitAt: new Date() } }),
      ),
    ).toMatch(/visits_exit_by_iff_exit_at/);
  });

  it('rechaza un usuario de salida sin hora de salida', async () => {
    const person = await createPerson();
    const visit = await openVisit(person);
    expect(
      await violation(prisma.visit.update({ where: { id: visit.id }, data: { exitById: userId } })),
    ).toMatch(/visits_exit_by_iff_exit_at/);
  });
});

describe('R18: campos de la visita según el tipo de persona', () => {
  const visitData = (type: PersonType, personId: string, extra: object) => ({
    data: { personId, personType: type, companyId, entryById: userId, ...extra },
  });

  it('trabajador externo: la visita no admite motivo ni área', async () => {
    const person = await createPerson(PersonType.EXTERNAL_WORKER);
    expect(
      await violation(
        prisma.visit.create(visitData(person.type, person.id, { purpose: 'x', area: 'y' })),
      ),
    ).toMatch(/visits_fields_by_person_type/);
  });

  it.each([PersonType.CONTRACTOR, PersonType.MAINTENANCE_TECHNICIAN, PersonType.VISITOR])(
    '%s: exige motivo y área',
    async (type) => {
      const person = await createPerson(type);
      expect(
        await violation(prisma.visit.create(visitData(type, person.id, { area: 'Bodega' }))),
      ).toMatch(/visits_fields_by_person_type/);
      expect(
        await violation(
          prisma.visit.create(visitData(type, person.id, { purpose: 'Reparación', area: '  ' })),
        ),
      ).toMatch(/visits_fields_by_person_type/);
    },
  );

  it.each([
    PersonType.EXTERNAL_WORKER,
    PersonType.CONTRACTOR,
    PersonType.MAINTENANCE_TECHNICIAN,
    PersonType.VISITOR,
  ])('%s: acepta una visita con los campos que le corresponden', async (type) => {
    await expect(openVisit(await createPerson(type))).resolves.toBeDefined();
  });
});

describe('R13 y D10: cédula única y normalizada', () => {
  it('rechaza una cédula repetida', async () => {
    const person = await createPerson();
    expect(
      await violation(
        prisma.person.create({
          data: {
            fullName: 'Otro',
            nameNormalized: 'OTRO',
            identification: person.identification,
            type: PersonType.VISITOR,
            companyId,
          },
        }),
      ),
    ).toMatch(
      /Unique constraint failed on the fields: (`identification`)|persons_identification_key/,
    );
  });

  it.each(['123', '1-234-567', 'ab12345', '12 34567'])(
    'rechaza la cédula sin normalizar %s',
    async (identification) => {
      expect(
        await violation(
          prisma.person.create({
            data: {
              fullName: 'Otro',
              nameNormalized: 'OTRO',
              identification,
              type: PersonType.VISITOR,
              companyId,
            },
          }),
        ),
      ).toMatch(/persons_identification_normalized/);
    },
  );
});

describe('R17: la visita conserva la empresa y el tipo de cuando entró', () => {
  it('cambiar la empresa de la persona no altera sus visitas anteriores', async () => {
    const person = await createPerson();
    const visit = await openVisit(person);
    const otherCompany = await prisma.company.create({
      data: { name: 'Otra', nameNormalized: 'OTRA' },
    });
    await prisma.person.update({
      where: { id: person.id },
      data: { companyId: otherCompany.id, type: PersonType.CONTRACTOR },
    });
    const stored = await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } });
    expect(stored.companyId).toBe(companyId);
    expect(stored.personType).toBe(PersonType.EXTERNAL_WORKER);
  });
});

describe('herramientas', () => {
  it('rechaza una cantidad no positiva', async () => {
    const person = await createPerson(PersonType.MAINTENANCE_TECHNICIAN);
    const visit = await openVisit(person);
    expect(
      await violation(
        prisma.visitTool.create({ data: { visitId: visit.id, name: 'Taladro', quantity: 0 } }),
      ),
    ).toMatch(/visit_tools_quantity_positive/);
  });
});
