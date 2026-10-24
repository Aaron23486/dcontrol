import { describe, expect, it } from 'vitest';
import { isSessionQuery } from './session-state';

describe('isSessionQuery', () => {
  it('reconoce solo la consulta de la sesión, que se conserva al cerrar sesión', () => {
    expect(isSessionQuery(['auth', 'session'])).toBe(true);
    expect(isSessionQuery(['audit', 'list', {}])).toBe(false);
    expect(isSessionQuery(['persons'])).toBe(false);
  });
});

describe('aviso de sesión vencida', () => {
  it('se mantiene hasta volver a iniciar sesión', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    const { endSession, startSession, wasSessionExpired } = await import('./session-state');
    const client = new QueryClient();
    client.setQueryData(['persons'], ['datos']);

    endSession(client, { expired: true });
    expect(wasSessionExpired()).toBe(true);
    expect(wasSessionExpired()).toBe(true);
    expect(client.getQueryData(['persons'])).toBeUndefined();
    expect(client.getQueryData(['auth', 'session'])).toBeNull();

    startSession();
    expect(wasSessionExpired()).toBe(false);
  });

  it('cerrar sesión a propósito no muestra el aviso', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    const { endSession, wasSessionExpired } = await import('./session-state');
    endSession(new QueryClient());
    expect(wasSessionExpired()).toBe(false);
  });
});
