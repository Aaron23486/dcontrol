import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdatePersonInput } from '@cedi/shared';
import { type PersonListParams, personsApi } from './persons.api';

const PERSONS_KEY = ['persons'] as const;

export function usePersonList(params: PersonListParams) {
  return useQuery({
    queryKey: [...PERSONS_KEY, 'list', params],
    queryFn: () => personsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePersonDetail(id: string) {
  return useQuery({
    queryKey: [...PERSONS_KEY, 'detail', id],
    queryFn: () => personsApi.detail(id),
    retry: false,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: personsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERSONS_KEY }),
  });
}

export function useUpdatePerson(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: UpdatePersonInput) => personsApi.update(id, changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERSONS_KEY }),
  });
}
