import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ErrorCode } from '@cedi/shared';
import { endSession } from '../features/auth/session-state';
import { ApiRequestError } from '../lib/http';

/** La sesión venció o se desactivó la cuenta (R14): hay que volver a iniciar sesión. */
export const isSessionExpired = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.code === ErrorCode.UNAUTHENTICATED;

/**
 * Reintentar solo lo que puede arreglarse solo: sin conexión o falla del servidor.
 * Permisos, datos inválidos o «no existe» no cambian por reintentar.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const transient = error instanceof ApiRequestError && (error.status === 0 || error.status >= 500);
  return transient && failureCount < 2;
}

export function createQueryClient(): QueryClient {
  const onError = (error: unknown) => {
    if (isSessionExpired(error)) endSession(client, { expired: true });
  };
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { retry: shouldRetry }, mutations: { retry: false } },
  });
  return client;
}
