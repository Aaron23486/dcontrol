import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './app-config';

const validEnv = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
  WEB_ORIGIN: 'http://localhost:5173',
  CEDI_TIMEZONE: 'America/Mexico_City',
};

describe('loadAppConfig', () => {
  it('aplica valores por defecto', () => {
    const config = loadAppConfig(validEnv);
    expect(config.sessionTtlHours).toBe(12);
    expect(config.isProduction).toBe(false);
  });

  it('toma el puerto de API_PORT o, si falta, de PORT (ADR 0010)', () => {
    expect(loadAppConfig({ ...validEnv, PORT: '8080' }).apiPort).toBe(8080);
    expect(loadAppConfig({ ...validEnv, PORT: '8080', API_PORT: '3001' }).apiPort).toBe(3001);
  });

  it('las variables opcionales vacías en .env cuentan como no definidas', () => {
    const config = loadAppConfig({ ...validEnv, WEB_DIST_DIR: '', PORT: '', API_PORT: '' });
    expect(config.webDistDir).toBeUndefined();
    expect(config.apiPort).toBe(3000);
  });

  it('TRUST_PROXY solo acepta true o false', () => {
    expect(loadAppConfig({ ...validEnv, TRUST_PROXY: 'true' }).trustProxy).toBe(true);
    expect(loadAppConfig(validEnv).trustProxy).toBe(false);
    expect(() => loadAppConfig({ ...validEnv, TRUST_PROXY: 'si' })).toThrow(/TRUST_PROXY/);
  });

  it('rechaza un secreto corto', () => {
    expect(() => loadAppConfig({ ...validEnv, JWT_SECRET: 'corto' })).toThrow(/JWT_SECRET/);
  });

  it('SEC-05: bloqueo por cuenta con valores por defecto y mínimo de 3 intentos', () => {
    const config = loadAppConfig(validEnv);
    expect(config.loginMaxFailuresPerAccount).toBe(5);
    expect(config.loginLockoutMinutes).toBe(15);
    expect(config.securityAlertFailedLogins).toBe(20);
    expect(() => loadAppConfig({ ...validEnv, LOGIN_MAX_FAILURES_PER_ACCOUNT: '1' })).toThrow(
      /LOGIN_MAX_FAILURES_PER_ACCOUNT/,
    );
  });

  it('SEC-12: en producción rechaza los valores de ejemplo de .env.example', () => {
    const production = { ...validEnv, NODE_ENV: 'production' };
    expect(() =>
      loadAppConfig({
        ...production,
        DATABASE_URL: 'postgresql://cedi_api:cambia-esta-contrasena-api@db:5432/cedi',
      }),
    ).toThrow(/valor de ejemplo/);
    expect(loadAppConfig(production).isProduction).toBe(true);
    // En desarrollo se permiten, para poder arrancar con .env.example tal cual.
    expect(() =>
      loadAppConfig({ ...validEnv, DATABASE_URL: 'postgresql://u:cambia-esta@localhost/db' }),
    ).not.toThrow();
  });

  it('rechaza una zona horaria inexistente', () => {
    expect(() => loadAppConfig({ ...validEnv, CEDI_TIMEZONE: 'Marte/Olympus' })).toThrow(
      /CEDI_TIMEZONE/,
    );
  });
});
