import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { SessionGuard } from './guards/session.guard';
import { LoginAttempts } from './login-attempts';
import { PasswordHasher } from './password-hasher';
import { rateLimitOptions } from './rate-limit';

/** I1: algoritmo, emisor y audiencia fijos; un token con otros valores no se acepta. */
export const SESSION_TOKEN = {
  algorithm: 'HS256',
  issuer: 'cedi-control-api',
  audience: 'cedi-control-web',
} as const;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const { algorithm, issuer, audience } = SESSION_TOKEN;
        return {
          secret: config.jwtSecret,
          signOptions: {
            expiresIn: config.sessionTtlHours * 60 * 60,
            algorithm,
            issuer,
            audience,
          },
          verifyOptions: { algorithms: [algorithm], issuer, audience },
        };
      },
    }),
    ThrottlerModule.forRootAsync({ inject: [APP_CONFIG], useFactory: rateLimitOptions }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginAttempts,
    PasswordHasher,
    // El orden importa: primero se resuelve la sesión, después el rol y al final el límite
    // de peticiones, que cuenta por usuario cuando ya se conoce.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [PasswordHasher],
})
export class AuthModule {}
