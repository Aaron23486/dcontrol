import { describe, expect, it } from 'vitest';
import { LoginAttempts } from './login-attempts';

const MINUTE = 60 * 1000;

function setup(maxFailures = 3, lockoutMinutes = 15) {
  let now = new Date('2026-10-24T15:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  const attempts = new LoginAttempts(clock, {
    loginMaxFailuresPerAccount: maxFailures,
    loginLockoutMinutes: lockoutMinutes,
  });
  return { attempts, advance: (ms: number) => (now += ms) };
}

describe('LoginAttempts (SEC-05)', () => {
  it('bloquea un correo al llegar al máximo de fallos seguidos', () => {
    const { attempts } = setup();
    expect(attempts.recordFailure('a@cedi.test')).toBe(false);
    expect(attempts.recordFailure('a@cedi.test')).toBe(false);
    expect(attempts.isLocked('a@cedi.test')).toBe(false);
    expect(attempts.recordFailure('a@cedi.test')).toBe(true);
    expect(attempts.isLocked('a@cedi.test')).toBe(true);
    // Otros correos no se ven afectados.
    expect(attempts.isLocked('b@cedi.test')).toBe(false);
  });

  it('el bloqueo vence pasado el tiempo configurado', () => {
    const { attempts, advance } = setup();
    for (let i = 0; i < 3; i++) attempts.recordFailure('a@cedi.test');
    advance(14 * MINUTE);
    expect(attempts.isLocked('a@cedi.test')).toBe(true);
    advance(MINUTE);
    expect(attempts.isLocked('a@cedi.test')).toBe(false);
  });

  it('los fallos fuera de la ventana no se acumulan', () => {
    const { attempts, advance } = setup();
    attempts.recordFailure('a@cedi.test');
    attempts.recordFailure('a@cedi.test');
    advance(16 * MINUTE);
    expect(attempts.recordFailure('a@cedi.test')).toBe(false);
    expect(attempts.isLocked('a@cedi.test')).toBe(false);
  });

  it('un login correcto borra los fallos acumulados', () => {
    const { attempts } = setup();
    attempts.recordFailure('a@cedi.test');
    attempts.recordFailure('a@cedi.test');
    attempts.reset('a@cedi.test');
    expect(attempts.recordFailure('a@cedi.test')).toBe(false);
  });

  it('no crece sin límite con correos inventados', () => {
    const { attempts } = setup(3);
    for (let i = 0; i < 10_050; i++) attempts.recordFailure(`intruso${i}@x.test`);
    expect((attempts as unknown as { byEmail: Map<string, unknown> }).byEmail.size).toBe(10_000);
  });
});
