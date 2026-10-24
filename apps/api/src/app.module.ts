import { Module, RequestMethod } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ApiExceptionFilter } from './common/errors/api-exception.filter';
import { ClockModule } from './common/time/clock';
import { CompaniesModule } from './companies/companies.module';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { PersonsModule } from './persons/persons.module';
import { PrismaModule } from './prisma/prisma.module';
import { VisitsModule } from './visits/visits.module';

const LOG_LEVEL: Record<AppConfig['nodeEnv'], string> = {
  development: 'debug',
  test: 'silent',
  production: 'info',
};

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        // Sintaxis de comodín de Express 5 (la de por defecto, `*`, genera un aviso).
        forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
        pinoHttp: {
          level: LOG_LEVEL[config.nodeEnv],
          transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
          // Nunca registrar la cookie de sesión.
          redact: ['req.headers.cookie', 'res.headers["set-cookie"]'],
        },
      }),
    }),
    PrismaModule,
    ClockModule,
    AuthModule,
    CompaniesModule,
    PersonsModule,
    // Antes que VisitsModule: `GET /visits/inside` debe registrarse antes que `GET /visits/:id`.
    DashboardModule,
    VisitsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
