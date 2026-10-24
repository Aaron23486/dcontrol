import { Inject, Injectable } from '@nestjs/common';
import { Clock } from '../common/time/clock';
import { APP_CONFIG, AppConfig } from '../config/app-config';

interface Attempts {
  failures: number;
  /** Primer fallo de la ventana actual. */
  since: number;
  lockedUntil?: number;
}

/** Tope de correos vigilados a la vez: evita que alguien llene la memoria con correos inventados. */
const MAX_TRACKED = 10_000;

/**
 * SEC-05 (ADR 0013): bloqueo temporal por correo tras varios intentos fallidos seguidos,
 * además del límite por IP. Aplica igual a correos que existen y que no, así no revela cuáles
 * son cuentas reales. Vive en memoria de la instancia, como el límite por IP.
 */
@Injectable()
export class LoginAttempts {
  private readonly byEmail = new Map<string, Attempts>();

  constructor(
    private readonly clock: Clock,
    @Inject(APP_CONFIG)
    private readonly config: Pick<AppConfig, 'loginMaxFailuresPerAccount' | 'loginLockoutMinutes'>,
  ) {}

  private get windowMs(): number {
    return this.config.loginLockoutMinutes * 60 * 1000;
  }

  isLocked(email: string): boolean {
    const lockedUntil = this.byEmail.get(email)?.lockedUntil;
    return lockedUntil !== undefined && lockedUntil > this.clock.now().getTime();
  }

  /** Registra un fallo. Devuelve `true` si con este fallo el correo queda bloqueado. */
  recordFailure(email: string): boolean {
    const now = this.clock.now().getTime();
    this.forgetExpired(now);
    const current = this.byEmail.get(email);
    const attempts: Attempts =
      current && now - current.since < this.windowMs ? current : { failures: 0, since: now };
    attempts.failures += 1;
    const locks = attempts.failures >= this.config.loginMaxFailuresPerAccount;
    if (locks) {
      attempts.lockedUntil = now + this.windowMs;
      attempts.failures = 0;
      attempts.since = now;
    }
    // Reinsertar mantiene el orden por actividad reciente; se descartan los más antiguos.
    this.byEmail.delete(email);
    this.byEmail.set(email, attempts);
    if (this.byEmail.size > MAX_TRACKED) {
      const oldest = this.byEmail.keys().next().value;
      if (oldest !== undefined) this.byEmail.delete(oldest);
    }
    return locks;
  }

  /** Un login correcto borra los fallos de ese correo. */
  reset(email: string): void {
    this.byEmail.delete(email);
  }

  private forgetExpired(now: number): void {
    for (const [email, attempts] of this.byEmail) {
      const locked = attempts.lockedUntil !== undefined && attempts.lockedUntil > now;
      if (!locked && now - attempts.since >= this.windowMs) this.byEmail.delete(email);
    }
  }
}
