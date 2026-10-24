import type { CookieOptions } from 'express';
import type { AppConfig } from '../config/app-config';

export const SESSION_COOKIE = 'cedi_session';

/** Cookie de sesión: inaccesible desde JS y solo enviada por el mismo sitio (ADR 0004). */
export function sessionCookieOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    path: '/',
  };
}

export function sessionMaxAgeMs(config: AppConfig): number {
  return config.sessionTtlHours * 60 * 60 * 1000;
}
