import { type ApiError, ErrorCode } from '@cedi/shared';

/** Error de la API ya traducido a `{ code, message }`, listo para mostrar al usuario. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const isApiError = (value: unknown): value is ApiError =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ApiError).code === 'string' &&
  typeof (value as ApiError).message === 'string';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(0, ErrorCode.INTERNAL_ERROR, 'No hay conexión con el servidor.');
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = isApiError(data)
      ? data
      : { code: ErrorCode.INTERNAL_ERROR, message: 'Ocurrió un error inesperado.' };
    throw new ApiRequestError(response.status, error.code, error.message);
  }
  return data as T;
}
