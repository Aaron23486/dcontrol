/**
 * Normaliza texto para comparar y buscar sin depender de cómo se escribió:
 * sin acentos, sin puntuación, espacios simples y en mayúsculas.
 * Ej.: " José  Pérez." y "JOSE PEREZ" producen el mismo valor.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s&-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
