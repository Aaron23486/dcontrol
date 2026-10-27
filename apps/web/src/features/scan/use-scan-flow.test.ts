import { PersonType, ScanResultCode, type PersonSummary, type VisitSummary } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { formatToolLabel } from '../../lib/format';
import { stepOf } from './use-scan-flow';

const person: PersonSummary = {
  id: 'p1',
  fullName: 'Carlos Medina',
  identification: 'PA998877',
  type: PersonType.MAINTENANCE_TECHNICIAN,
  company: { id: 'c1', name: 'Acme' },
  isInside: false,
  lastVisit: null,
};

const visit: VisitSummary = {
  id: 'v1',
  personType: PersonType.MAINTENANCE_TECHNICIAN,
  company: { id: 'c1', name: 'Acme' },
  entryAt: '2026-10-23T14:00:00.000Z',
  exitAt: '2026-10-23T18:00:00.000Z',
  purpose: 'Revisión',
  area: 'Taller',
  tools: [
    { name: 'Taladro', description: 'inalámbrico', quantity: 2 },
    { name: 'Escalera', description: null, quantity: null },
  ],
};

describe('stepOf: salida registrada', () => {
  it('vuelve al campo de cédula y lleva las herramientas para verificarlas (FR-12)', () => {
    expect(stepOf({ result: ScanResultCode.EXIT_REGISTERED, person, visit })).toEqual({
      step: { kind: 'idle' },
      feedback: {
        kind: 'exit',
        personName: 'Carlos Medina',
        at: '2026-10-23T18:00:00.000Z',
        tools: visit.tools,
      },
    });
  });
});

describe('formatToolLabel', () => {
  it('incluye cantidad y descripción solo si existen', () => {
    expect(visit.tools.map(formatToolLabel)).toEqual(['Taladro ×2 · inalámbrico', 'Escalera']);
  });
});
