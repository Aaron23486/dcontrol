import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser, ErrorCode, LoginInput } from '@cedi/shared';
import { AppException } from '../common/errors/app.exception';
import { UserRecord, UsersRepository } from '../users/users.repository';
import { PasswordHasher } from './password-hasher';

interface SessionPayload {
  sub: string;
  /** `sessionsValidFrom` del usuario al emitir la sesión; si cambió, la sesión fue revocada. */
  ver?: number;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

const toAuthUser = ({ id, name, email, role }: UserRecord): AuthUser => ({ id, name, email, role });

@Injectable()
export class AuthService {
  /** Hash de referencia para que un correo inexistente tarde lo mismo que uno real. */
  private readonly timingHash: Promise<string>;

  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {
    this.timingHash = hasher.hash('timing-equalizer-not-a-real-password');
  }

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    const passwordMatches = await this.hasher.verify(
      user?.passwordHash ?? (await this.timingHash),
      password,
    );
    if (!user || !passwordMatches) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Correo o contraseña incorrectos.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!user.isActive) {
      throw new AppException(
        ErrorCode.USER_INACTIVE,
        'Tu usuario está desactivado. Contacta a un administrador.',
        HttpStatus.FORBIDDEN,
      );
    }
    const token = await this.jwt.signAsync({
      sub: user.id,
      ver: user.sessionsValidFrom.getTime(),
    } satisfies SessionPayload);
    return { user: toAuthUser(user), token };
  }

  /**
   * Resuelve el usuario de una sesión. Rol y estado se leen siempre de la BD,
   * así un usuario desactivado pierde el acceso en su siguiente petición (R14).
   * Una sesión emitida antes de cambiar la contraseña o desactivar la cuenta ya no vale.
   */
  async authenticate(token: string): Promise<AuthUser> {
    const payload = await this.jwt.verifyAsync<SessionPayload>(token).catch(() => null);
    const user = payload ? await this.users.findById(payload.sub) : null;
    // Sesiones anteriores a esta versión: sin `ver` valen solo si nunca se revocó (epoch).
    const revoked = user && (payload?.ver ?? 0) !== user.sessionsValidFrom.getTime();
    if (!user || !user.isActive || revoked) {
      throw AppException.unauthenticated('Tu sesión no es válida. Inicia sesión de nuevo.');
    }
    return toAuthUser(user);
  }

  /**
   * SEC-01: cerrar sesión la invalida también en el servidor, no solo en el navegador.
   * Revoca todas las sesiones del usuario (p. ej. la de otra caseta con la misma cuenta).
   * Con un token ausente o ya inválido no hay nada que revocar.
   */
  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    const user = await this.authenticate(token).catch(() => null);
    if (user) await this.users.revokeSessions(user.id);
  }
}
