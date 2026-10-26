import { describe, expect, it } from 'vitest';
import { requestLogSerializer } from './request-log';

describe('requestLogSerializer (SEC-13)', () => {
  it('registra la ruta sin la cadena de búsqueda', () => {
    expect(
      requestLogSerializer({
        id: 7,
        method: 'GET',
        url: '/api/persons?q=Ana%20G%C3%B3mez&type=VISITOR',
        remoteAddress: '10.0.0.5',
      }),
    ).toEqual({ id: 7, method: 'GET', path: '/api/persons', remoteAddress: '10.0.0.5' });
  });

  it('no copia parámetros, query ni encabezados aunque vengan en la petición', () => {
    const entry = requestLogSerializer({
      url: '/api/visits/123',
      query: { q: '1234567890' },
      params: { id: '123' },
      headers: { 'user-agent': 'x', cookie: 'cedi_session=token' },
    } as Parameters<typeof requestLogSerializer>[0]);
    expect(Object.keys(entry).sort()).toEqual(['id', 'method', 'path', 'remoteAddress']);
    expect(JSON.stringify(entry)).not.toMatch(/1234567890|cedi_session/);
  });
});
