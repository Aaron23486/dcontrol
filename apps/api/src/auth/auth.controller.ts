import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthUser, LoginInput, loginSchema } from '@cedi/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SESSION_COOKIE, sessionCookieOptions, sessionMaxAgeMs } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUser> {
    const { user, token } = await this.auth.login(input, { ip: request.ip });
    response.cookie(SESSION_COOKIE, token, {
      ...sessionCookieOptions(this.config),
      maxAge: sessionMaxAgeMs(this.config),
    });
    return user;
  }

  /** Pública para poder limpiar la cookie aunque la sesión ya no sea válida. */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    await this.auth.logout(typeof token === 'string' ? token : undefined, { ip: request.ip });
    response.clearCookie(SESSION_COOKIE, sessionCookieOptions(this.config));
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
