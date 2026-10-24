import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

const NODE_ENVS = ['development', 'test', 'production'] as const;

const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const databaseUrlSchema = z
  .string({ error: 'DATABASE_URL es obligatoria.' })
  .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL debe ser una URL de PostgreSQL.');

/** Una variable vacía en .env (`CLAVE=`) cuenta como no definida. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default('development'),
  API_PORT: optional(z.coerce.number().int().positive()),
  /** Puerto que asignan muchas plataformas; se usa si no hay API_PORT (ADR 0010). */
  PORT: optional(z.coerce.number().int().positive()),
  DATABASE_URL: databaseUrlSchema,
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET es obligatoria.' })
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres.'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24).default(12),
  WEB_ORIGIN: z.url('WEB_ORIGIN debe ser una URL.'),
  CEDI_TIMEZONE: z
    .string({ error: 'CEDI_TIMEZONE es obligatoria.' })
    .refine(isValidTimeZone, 'CEDI_TIMEZONE no es una zona horaria IANA válida.'),
  LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(5),
  /** Carpeta con la web compilada que la API sirve en producción (ADR 0010). */
  WEB_DIST_DIR: optional(z.string()),
  /** `true` detrás de un proxy con HTTPS: IP real del cliente y cookie Secure. */
  TRUST_PROXY: z
    .enum(['true', 'false'], { error: 'TRUST_PROXY debe ser true o false.' })
    .default('false')
    .transform((value) => value === 'true'),
});

export interface AppConfig {
  nodeEnv: (typeof NODE_ENVS)[number];
  isProduction: boolean;
  apiPort: number;
  databaseUrl: string;
  jwtSecret: string;
  sessionTtlHours: number;
  webOrigin: string;
  timezone: string;
  loginRateLimitPerMinute: number;
  webDistDir?: string;
  trustProxy: boolean;
}

/** Valida las variables de entorno al arrancar; si algo falta, la API no inicia. */
export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida. Revisa tu archivo .env:\n${details}`);
  }
  const e = result.data;
  return {
    nodeEnv: e.NODE_ENV,
    isProduction: e.NODE_ENV === 'production',
    apiPort: e.API_PORT ?? e.PORT ?? 3000,
    databaseUrl: e.DATABASE_URL,
    jwtSecret: e.JWT_SECRET,
    sessionTtlHours: e.SESSION_TTL_HOURS,
    webOrigin: e.WEB_ORIGIN,
    timezone: e.CEDI_TIMEZONE,
    loginRateLimitPerMinute: e.LOGIN_RATE_LIMIT_PER_MINUTE,
    webDistDir: e.WEB_DIST_DIR,
    trustProxy: e.TRUST_PROXY,
  };
}
