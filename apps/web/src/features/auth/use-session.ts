import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { SESSION_KEY, endSession, startSession } from './session-state';

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: authApi.me,
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      startSession();
      queryClient.setQueryData(SESSION_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => endSession(queryClient),
  });
}
