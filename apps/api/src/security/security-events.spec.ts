import { describe, expect, it } from 'vitest';
import { SecurityEvents, type SecurityEvent, SecurityEventSink } from './security-events';

class MemorySink extends SecurityEventSink {
  readonly events: SecurityEvent[] = [];
  write(event: SecurityEvent): void {
    this.events.push(event);
  }
}

function setup(threshold = 3) {
  let now = new Date('2026-10-24T15:00:00Z').getTime();
  const sink = new MemorySink();
  const events = new SecurityEvents(
    sink,
    { now: () => new Date(now) },
    {
      securityAlertFailedLogins: threshold,
    },
  );
  const fail = () => events.record({ event: 'auth.login_failed', level: 'warn', ip: '10.0.0.1' });
  const alerts = () => sink.events.filter((e) => e.event === 'security.alert');
  return { sink, events, fail, alerts, advance: (ms: number) => (now += ms) };
}

describe('SecurityEvents (SEC-04)', () => {
  it('escribe cada evento en el destino', () => {
    const { sink, events } = setup();
    events.record({ event: 'auth.logout', level: 'info', userId: 'u1' });
    expect(sink.events).toEqual([{ event: 'auth.logout', level: 'info', userId: 'u1' }]);
  });

  it('alerta al alcanzar el umbral de logins fallidos en 10 minutos, una vez por ventana', () => {
    const { fail, alerts } = setup(3);
    fail();
    fail();
    expect(alerts()).toHaveLength(0);
    fail();
    expect(alerts()).toEqual([
      expect.objectContaining({ level: 'error', reason: 'failed_logins_threshold' }),
    ]);
    fail();
    expect(alerts()).toHaveLength(1);
  });

  it('los fallos de hace más de 10 minutos no cuentan', () => {
    const { fail, alerts, advance } = setup(3);
    fail();
    fail();
    advance(11 * 60 * 1000);
    fail();
    expect(alerts()).toHaveLength(0);
  });
});
