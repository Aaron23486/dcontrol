import { SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { AppConfig } from '../config/app-config';
import type { AuthenticatedRequest } from './authenticated-request';

const ONE_MINUTE_MS = 60_000;
const LOGIN_THROTTLE_KEY = 'cedi:login-throttle';

/** Marca el endpoint de login: además del límite general, lleva el límite por IP de login. */
export const LoginThrottle = () => SetMetadata(LOGIN_THROTTLE_KEY, true);

const isLoginEndpoint = (context: ExecutionContext): boolean =>
  Reflect.getMetadata(LOGIN_THROTTLE_KEY, context.getHandler()) === true;

/** Con sesión cuenta por usuario (varias casetas pueden compartir IP); sin sesión, por IP. */
const userOrIp = (request: Record<string, unknown>): string => {
  const { user, ip } = request as Partial<AuthenticatedRequest>;
  return user ? `user:${user.id}` : `ip:${ip ?? 'unknown'}`;
};

/**
 * Límites de peticiones (en memoria de la instancia, ADR 0010):
 * - `api` (SEC-07): toda la API, para que un cliente no pueda saturarla.
 * - `login`: intentos de login por IP y minuto, solo en el endpoint de login.
 */
export const rateLimitOptions = (config: AppConfig): ThrottlerModuleOptions => ({
  throttlers: [
    {
      name: 'api',
      ttl: ONE_MINUTE_MS,
      limit: config.apiRateLimitPerMinute,
      getTracker: userOrIp,
    },
    {
      name: 'login',
      ttl: ONE_MINUTE_MS,
      limit: config.loginRateLimitPerMinute,
      skipIf: (context) => !isLoginEndpoint(context),
    },
  ],
});
