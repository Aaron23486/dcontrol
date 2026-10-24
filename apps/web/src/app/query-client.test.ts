import { ErrorCode } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../lib/http';
import { isSessionExpired, shouldRetry } from './query-client';

const error = (status: number, code: ErrorCode) => new ApiRequestError(status, code, 'x');

describe('shouldRetry', () => {
  it('reintenta hasta 2 veces sin conexión o con falla del servidor', () => {
    expect(shouldRetry(0, error(0, ErrorCode.INTERNAL_ERROR))).toBe(true);
    expect(shouldRetry(1, error(503, ErrorCode.INTERNAL_ERROR))).toBe(true);
    expect(shouldRetry(2, error(503, ErrorCode.INTERNAL_ERROR))).toBe(false);
  });

  it('no reintenta permisos, datos inválidos ni «no existe»', () => {
    expect(shouldRetry(0, error(403, ErrorCode.FORBIDDEN))).toBe(false);
    expect(shouldRetry(0, error(400, ErrorCode.VALIDATION_ERROR))).toBe(false);
    expect(shouldRetry(0, error(404, ErrorCode.NOT_FOUND))).toBe(false);
  });
});

describe('isSessionExpired', () => {
  it('solo la sesión vencida obliga a volver al login', () => {
    expect(isSessionExpired(error(401, ErrorCode.UNAUTHENTICATED))).toBe(true);
    // Una contraseña incorrecta en el login no es una sesión vencida.
    expect(isSessionExpired(error(401, ErrorCode.INVALID_CREDENTIALS))).toBe(false);
    expect(isSessionExpired(new Error('otro'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('una sesión vencida en cualquier consulta termina la sesión (vuelve al login)', async () => {
    const { createQueryClient } = await import('./query-client');
    const { wasSessionExpired, startSession } = await import('../features/auth/session-state');
    const client = createQueryClient();
    client.setQueryData(['auth', 'session'], { id: 'u1' });

    await client
      .fetchQuery({
        queryKey: ['persons'],
        queryFn: () => Promise.reject(error(401, ErrorCode.UNAUTHENTICATED)),
      })
      .catch(() => undefined);

    expect(client.getQueryData(['auth', 'session'])).toBeNull();
    expect(wasSessionExpired()).toBe(true);
    startSession();
  });

  it('otros errores no tocan la sesión', async () => {
    const { createQueryClient } = await import('./query-client');
    const client = createQueryClient();
    client.setQueryData(['auth', 'session'], { id: 'u1' });
    await client
      .fetchQuery({
        queryKey: ['persons'],
        queryFn: () => Promise.reject(error(403, ErrorCode.FORBIDDEN)),
      })
      .catch(() => undefined);
    expect(client.getQueryData(['auth', 'session'])).toEqual({ id: 'u1' });
  });
});
