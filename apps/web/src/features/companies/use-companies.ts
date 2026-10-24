import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeCompanyName, type CompanySummary } from '@cedi/shared';
import { useDebouncedValue } from '../../lib/use-debounced-value';
import { companiesApi } from './companies.api';

const COMPANIES_KEY = ['companies'] as const;

export function useCompanySearch(text: string, enabled: boolean) {
  const q = useDebouncedValue(text.trim());
  const query = useQuery({
    queryKey: [...COMPANIES_KEY, q],
    queryFn: () => companiesApi.search(q),
    enabled,
    placeholderData: keepPreviousData,
  });
  // Mientras se escribe, los resultados mostrados son de un texto anterior: no deben elegirse.
  const isStale = q !== text.trim() || query.isPlaceholderData;
  return { companies: query.data ?? [], isStale };
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANIES_KEY }),
  });
}

/** Ofrecer «Crear empresa» solo si el texto no coincide con una empresa ya listada (D9). */
export function canOfferNewCompany(text: string, options: CompanySummary[]): boolean {
  const normalized = normalizeCompanyName(text);
  return (
    normalized.length >= 2 &&
    !options.some((company) => normalizeCompanyName(company.name) === normalized)
  );
}
