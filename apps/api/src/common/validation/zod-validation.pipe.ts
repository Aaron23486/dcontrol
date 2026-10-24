import { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { AppException } from '../errors/app.exception';

/** Valida la entrada con un esquema de @cedi/shared; devuelve los datos ya normalizados. */
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    const [issue] = result.error.issues;
    const isFieldIssue = issue !== undefined && issue.path.length > 0;
    throw AppException.validation(isFieldIssue ? issue.message : 'La petición no es válida.');
  }
}
