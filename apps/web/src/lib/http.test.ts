import { ErrorCode } from '@cedi/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, apiRequest } from './http';

const respond = (status: number, body?: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      body === undefined
        ? new Response(null, { status })
        : new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
    ),
  );

const errorOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiRequestError);
    const { status, code, message } = error as ApiRequestError;
    return { status, code, message };
  }
  throw new Error('Se esperaba un error');
};

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('envía JSON a /api con la cookie del mismo origen y devuelve la respuesta', async () => {
    respond(200, { ok: true });
    await expect(apiRequest('/persons', { method: 'POST', body: { a: 1 } })).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith('/api/persons', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":1}',
    });
  });

  it('204 sin contenido devuelve undefined', async () => {
    respond(204);
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('conserva el código y el mensaje de error de la API', async () => {
    respond(409, { code: ErrorCode.CONFLICT, message: 'Ana ya está dentro del CEDI.' });
    expect(await errorOf(apiRequest('/visits'))).toEqual({
      status: 409,
      code: ErrorCode.CONFLICT,
      message: 'Ana ya está dentro del CEDI.',
    });
  });

  it('un error sin el formato esperado se muestra como error genérico', async () => {
    respond(502, '<html>Bad gateway</html>');
    expect(await errorOf(apiRequest('/visits'))).toEqual({
      status: 502,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Ocurrió un error inesperado.',
    });
  });

  it('sin conexión con el servidor da un mensaje claro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(await errorOf(apiRequest('/scans'))).toEqual({
      status: 0,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'No hay conexión con el servidor.',
    });
  });
});
