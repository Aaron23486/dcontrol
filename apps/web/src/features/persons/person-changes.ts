import type { PersonDetail, PersonInput, UpdatePersonInput } from '@cedi/shared';
import { normalizeIdentification } from '@cedi/shared';

/** Valores del formulario de edición. */
export type PersonFormValues = PersonInput;

export const formValuesOf = (person: PersonDetail): PersonFormValues => ({
  fullName: person.fullName,
  identification: person.identification,
  type: person.type,
  companyId: person.company.id,
});

/**
 * Solo los campos que realmente cambian, para que la API audite exactamente esos (D12)
 * y para no enviar nombre ni cédula cuando quien edita no puede corregirlos (D13).
 */
export function changesBetween(person: PersonDetail, values: PersonFormValues): UpdatePersonInput {
  const current = formValuesOf(person);
  const changes: UpdatePersonInput = {};
  if (values.fullName.trim().replace(/\s+/g, ' ') !== current.fullName) {
    changes.fullName = values.fullName;
  }
  if (normalizeIdentification(values.identification) !== current.identification) {
    changes.identification = values.identification;
  }
  if (values.type !== current.type) changes.type = values.type;
  if (values.companyId !== current.companyId) changes.companyId = values.companyId;
  return changes;
}
