import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { SessionGuard } from './guards/session.guard';
import { PasswordHasher } from './password-hasher';

const ONE_MINUTE_MS = 60_000;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.sessionTtlHours * 60 * 60 },
      }),
    }),
    // Solo se aplica en POST /auth/login (ThrottlerGuard no es global).
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => [
        { ttl: ONE_MINUTE_MS, limit: config.loginRateLimitPerMinute },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasher,
    // El orden importa: primero se resuelve la sesión y después el rol.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [PasswordHasher],
})
export class AuthModule {}
