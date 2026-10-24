import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import {
  CompanySummary,
  CreateCompanyInput,
  companySearchSchema,
  createCompanySchema,
} from '@cedi/shared';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  search(
    @Query(new ZodValidationPipe(companySearchSchema)) { q }: { q?: string },
  ): Promise<CompanySummary[]> {
    return this.companies.search(q);
  }

  /** 201 si la crea; 200 si ya existía una con el mismo nombre normalizado. */
  @Post()
  async create(
    @Body(new ZodValidationPipe(createCompanySchema)) { name }: CreateCompanyInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CompanySummary> {
    const { company, created } = await this.companies.findOrCreate(name);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return company;
  }
}
