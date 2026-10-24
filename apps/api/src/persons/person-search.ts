import { normalizeCompanyName, normalizeIdentification, normalizeSearchText } from '@cedi/shared';

/** Términos de búsqueda normalizados para nombre, prefijo de cédula y empresa (D15). */
export interface SearchTerms {
  name: string;
  identificationPrefix: string;
  company: string;
}

/** `undefined` si no hay texto que buscar. */
export function searchTermsOf(query: string | undefined): SearchTerms | undefined {
  const name = normalizeSearchText(query ?? '');
  if (!name) return undefined;
  return {
    name,
    company: normalizeCompanyName(query ?? ''),
    identificationPrefix: identificationPrefixOf(query ?? ''),
  };
}

/** Prefijo de cédula solo si el texto puede ser parte de una (letras y dígitos sin tildes). */
function identificationPrefixOf(query: string): string {
  const prefix = normalizeIdentification(query);
  return /^[A-Z0-9]+$/.test(prefix) ? prefix : '';
}
