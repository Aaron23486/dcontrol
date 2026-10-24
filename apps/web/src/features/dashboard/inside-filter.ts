import {
  normalizeIdentification,
  normalizeSearchText,
  type InsideVisit,
  type PersonType,
} from '@cedi/shared';

export type InsideTypeFilter = PersonType | 'ALL';

/** Filtra «Personas dentro» por tipo y por nombre o cédula, sin importar tildes ni guiones. */
export function filterInside(
  visits: InsideVisit[],
  type: InsideTypeFilter,
  query: string,
): InsideVisit[] {
  const name = normalizeSearchText(query);
  const identification = normalizeIdentification(query);
  return visits.filter(
    (visit) =>
      (type === 'ALL' || visit.personType === type) &&
      (!name ||
        normalizeSearchText(visit.person.fullName).includes(name) ||
        visit.person.identification.startsWith(identification)),
  );
}

/** Cuántas visitas abiertas hay de cada tipo, para las pestañas. */
export function countByType(visits: InsideVisit[]): Record<InsideTypeFilter, number> {
  const counts = { ALL: visits.length } as Record<InsideTypeFilter, number>;
  for (const visit of visits) counts[visit.personType] = (counts[visit.personType] ?? 0) + 1;
  return counts;
}
