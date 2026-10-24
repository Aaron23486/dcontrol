import type { PersonData, VisitDetails } from '@cedi/shared';
import { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { PersonForm } from '../persons/PersonForm';
import { VisitDetailsForm } from './VisitDetailsForm';

interface NewPersonEntryPanelProps {
  identification: string;
  pending: boolean;
  error?: string;
  onRegister: (person: PersonData, details: VisitDetails) => void;
  onCancel: () => void;
}

/**
 * Persona no registrada (spec §10): primero sus datos, después los de la visita según su tipo.
 * Ambos se guardan juntos al final.
 */
export function NewPersonEntryPanel({
  identification,
  pending,
  error,
  onRegister,
  onCancel,
}: NewPersonEntryPanelProps) {
  const [person, setPerson] = useState<PersonData | null>(null);

  if (!person) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Cédula no registrada</h2>
          <p className="text-sm text-slate-600">
            Registra a la persona; después se pedirán los datos de esta visita.
          </p>
        </div>
        <PersonForm
          defaultValues={{ identification }}
          submitLabel="Continuar"
          pending={false}
          onSubmit={setPerson}
        />
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{person.fullName}</h2>
        <p className="text-sm text-slate-600">
          Cédula <span className="font-mono">{person.identification}</span> ·{' '}
          <button type="button" className="underline" onClick={() => setPerson(null)}>
            corregir datos
          </button>
        </p>
      </div>
      <VisitDetailsForm
        personType={person.type}
        prefill={null}
        submitLabel="Registrar persona y entrada"
        pending={pending}
        error={error}
        onSubmit={(details) => onRegister(person, details)}
        onCancel={onCancel}
      />
    </div>
  );
}
