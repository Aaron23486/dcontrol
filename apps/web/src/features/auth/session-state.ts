import type { QueryClient } from '@tanstack/react-query';

export const SESSION_KEY = ['auth', 'session'] as const;

/** `true` para la consulta de la sesión. */
export const isSessionQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey[0] === SESSION_KEY[0] && queryKey[1] === SESSION_KEY[1];

let expiredNotice = false;

/**
 * Termina la sesión en la interfaz: primero la marca como cerrada (las rutas protegidas
 * redirigen al login) y después descarta los demás datos en memoria. No usar `clear()`:
 * desconecta a quien escucha la sesión y la pantalla seguiría mostrando los datos cargados.
 */
export function endSession(queryClient: QueryClient, { expired = false } = {}): void {
  expiredNotice = expired;
  queryClient.setQueryData(SESSION_KEY, null);
  queryClient.removeQueries({ predicate: (query) => !isSessionQuery(query.queryKey) });
}

/** ¿La última sesión terminó por vencimiento? Se informa en el login hasta volver a entrar. */
export const wasSessionExpired = (): boolean => expiredNotice;

export function startSession(): void {
  expiredNotice = false;
}
