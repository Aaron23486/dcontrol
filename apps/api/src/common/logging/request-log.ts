/** Petición tal como la entrega el serializador estándar de pino-http. */
export interface SerializedRequest {
  id?: unknown;
  method?: string;
  url?: string;
  remoteAddress?: string;
}

export interface RequestLogEntry {
  id?: unknown;
  method?: string;
  path?: string;
  remoteAddress?: string;
}

/**
 * SEC-13: lo que se registra de cada petición. Sin la cadena de búsqueda (lleva nombres
 * o cédulas), sin parámetros ni encabezados: solo lo necesario para seguir una petición.
 */
export function requestLogSerializer({
  id,
  method,
  url,
  remoteAddress,
}: SerializedRequest): RequestLogEntry {
  return { id, method, path: url?.split('?')[0], remoteAddress };
}
