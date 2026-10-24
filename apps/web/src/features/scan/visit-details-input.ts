import { VISIT_FIELDS_BY_TYPE, type PersonType, type VisitDetailsInput } from '@cedi/shared';

export interface ToolRow {
  name: string;
  description: string;
  quantity: string;
}

export interface VisitDetailsFormValues {
  purpose: string;
  area: string;
  tools: ToolRow[];
}

/**
 * Arma los datos de la visita con solo los campos de su tipo (R18, R19): un trabajador externo
 * no envía motivo ni área, y solo el técnico envía herramientas. Las filas vacías se ignoran.
 */
export function toVisitDetailsInput(
  personType: PersonType,
  values: VisitDetailsFormValues,
): VisitDetailsInput {
  const fields: readonly string[] = VISIT_FIELDS_BY_TYPE[personType];
  return {
    personType,
    ...(fields.includes('purpose') && { purpose: values.purpose }),
    ...(fields.includes('area') && { area: values.area }),
    ...(fields.includes('tools') && {
      tools: values.tools
        .filter((tool) => tool.name.trim())
        .map((tool) => ({
          name: tool.name,
          ...(tool.description.trim() && { description: tool.description }),
          ...(tool.quantity.trim() && { quantity: Number(tool.quantity) }),
        })),
    }),
  } as VisitDetailsInput;
}
