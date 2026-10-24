import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@cedi/shared';
import { Public } from '../auth/decorators/public.decorator';
import { AppException } from '../common/errors/app.exception';
import { PrismaService } from '../prisma/prisma.service';

/** Chequeo de salud para la plataforma de despliegue (ADR 0010): la app y su base responden. */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppException(
        ErrorCode.INTERNAL_ERROR,
        'La base de datos no responde.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { status: 'ok' };
  }
}
