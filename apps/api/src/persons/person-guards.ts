import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@cedi/shared';
import { AppException } from '../common/errors/app.exception';
import { CompaniesRepository } from '../companies/companies.repository';
import { IdentificationTakenError } from './persons.repository';

/** Ejecuta una escritura y traduce una cédula duplicada (R13) a un error claro para el usuario. */
export async function guardIdentification<T>(
  identification: string,
  write: () => Promise<T>,
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof IdentificationTakenError) {
      throw new AppException(
        ErrorCode.CONFLICT,
        `Ya existe una persona registrada con la cédula ${identification}.`,
        HttpStatus.CONFLICT,
      );
    }
    throw error;
  }
}

export async function ensureCompanyExists(
  companies: CompaniesRepository,
  companyId: string,
): Promise<void> {
  if (!(await companies.findById(companyId))) {
    throw AppException.validation('La empresa seleccionada no existe.');
  }
}

export function personNotFound(): never {
  throw new AppException(ErrorCode.NOT_FOUND, 'La persona no existe.', HttpStatus.NOT_FOUND);
}
