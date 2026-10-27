import { PersonType, VISIT_FIELDS_BY_TYPE } from '@cedi/shared';

/** Una sección (pestaña) por tipo de persona, para no mezclar información (FR-9). */
export interface PersonSection {
  type: PersonType;
  slug: string;
  title: string;
}

export const PERSON_SECTIONS: readonly PersonSection[] = [
  {
    type: PersonType.EXTERNAL_WORKER,
    slug: 'trabajadores-externos',
    title: 'Trabajadores externos',
  },
  { type: PersonType.CONTRACTOR, slug: 'contratistas', title: 'Contratistas' },
  {
    type: PersonType.MAINTENANCE_TECHNICIAN,
    slug: 'mantenimiento',
    title: 'Mantenimiento / Técnicos',
  },
  { type: PersonType.VISITOR, slug: 'visitantes', title: 'Visitantes' },
];

export const DEFAULT_SECTION = PERSON_SECTIONS[0] as PersonSection;

export const sectionBySlug = (slug: string | undefined) =>
  PERSON_SECTIONS.find((section) => section.slug === slug);

export const sectionByType = (type: PersonType) =>
  PERSON_SECTIONS.find((section) => section.type === type) ?? DEFAULT_SECTION;

/** Columnas extra de cada sección, derivadas de los campos de visita de su tipo (FR-2). */
export function visitColumnsFor(type: PersonType) {
  const fields: readonly string[] = VISIT_FIELDS_BY_TYPE[type];
  return {
    purpose: fields.includes('purpose'),
    area: fields.includes('area'),
    tools: fields.includes('tools'),
  };
}
