import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Clock } from '../common/time/clock';
import { APP_CONFIG, AppConfig } from '../config/app-config';

/**
 * Eventos de seguridad (SEC-04, ADR 0013). Van al log estructurado con el campo `event`
 * para que un monitoreo los filtre y alerte. Nunca llevan contraseñas, tokens ni cookies.
 */
export type SecurityEventName =
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  | 'auth.login_blocked'
  | 'auth.account_locked'
  | 'auth.logout'
  | 'auth.session_rejected'
  | 'auth.rate_limited'
  | 'access.forbidden'
  | 'security.alert';

export interface SecurityEvent {
  event: SecurityEventName;
  level: 'info' | 'warn' | 'error';
  ip?: string;
  userId?: string;
  email?: string;
  reason?: string;
  method?: string;
  /** Ruta sin parámetros de búsqueda (no deben llegar datos personales al log). */
  path?: string;
  detail?: string;
}

/** Destino de los eventos; en producción el log de pino, en las pruebas una lista en memoria. */
export abstract class SecurityEventSink {
  abstract write(event: SecurityEvent): void;
}

@Injectable()
export class PinoSecurityEventSink extends SecurityEventSink {
  constructor(@InjectPinoLogger('security') private readonly logger: PinoLogger) {
    super();
  }

  write({ level, ...fields }: SecurityEvent): void {
    this.logger[level](fields, fields.event);
  }
}

const ALERT_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class SecurityEvents {
  /** Instantes de los logins fallidos recientes, para la alerta por volumen. */
  private failures: number[] = [];
  private lastAlertAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly sink: SecurityEventSink,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'securityAlertFailedLogins'>,
  ) {}

  record(event: SecurityEvent): void {
    this.sink.write(event);
    if (event.event === 'auth.login_failed') this.trackFailure();
  }

  /**
   * Alerta (nivel error) si los logins fallidos de todo el sistema superan el umbral en 10 min:
   * un ataque de fuerza bruta o de credenciales robadas desde muchas IP. Una por ventana.
   */
  private trackFailure(): void {
    const now = this.clock.now().getTime();
    this.failures = this.failures.filter((at) => now - at < ALERT_WINDOW_MS);
    this.failures.push(now);
    const threshold = this.config.securityAlertFailedLogins;
    if (this.failures.length >= threshold && now - this.lastAlertAt >= ALERT_WINDOW_MS) {
      this.lastAlertAt = now;
      this.sink.write({
        event: 'security.alert',
        level: 'error',
        reason: 'failed_logins_threshold',
        detail: `${this.failures.length} logins fallidos en 10 minutos (umbral ${threshold}).`,
      });
    }
  }
}

@Global()
@Module({
  providers: [{ provide: SecurityEventSink, useClass: PinoSecurityEventSink }, SecurityEvents],
  exports: [SecurityEvents],
})
export class SecurityModule {}
