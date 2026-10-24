import { ErrorCode, loginSchema } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { AppException } from '../errors/app.exception';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(loginSchema);

  it('devuelve los datos normalizados', () => {
    expect(pipe.transform({ email: ' A@B.CO ', password: 'x' })).toEqual({
      email: 'a@b.co',
      password: 'x',
    });
  });

  it('lanza VALIDATION_ERROR con el mensaje del campo', () => {
    try {
      pipe.transform({ email: 'mal', password: 'x' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).getResponse()).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Ingresa un correo válido.',
      });
    }
  });

  it('usa un mensaje genérico si el cuerpo no es un objeto', () => {
    expect(() => pipe.transform(undefined)).toThrow('La petición no es válida.');
  });
});
