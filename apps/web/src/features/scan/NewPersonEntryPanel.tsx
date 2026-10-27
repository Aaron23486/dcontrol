import type { PersonData, VisitDetails } from '@cedi/shared';
import { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { Icon } from '../../components/atoms/Icon';
import { PersonForm } from '../persons/PersonForm';
import { VisitDetailsForm } from './VisitDetailsForm';

interface NewPersonEntryPanelProps {
  identification: string;
  pending: boolean;
  error?: string;
  onRegister: (person: PersonData, details: VisitDetails) => void;
  onCancel: () => void;
}

/** Paso del registro en curso: 1 datos de la persona, 2 datos de la visita. */
function StepTitle({ step, title, text }: { step: 1 | 2; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name="userPlus" className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
          Paso {step} de 2
        </p>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{text}</p>
      </div>
    </div>
  );
}

/**
 * Persona no registrada (FR-5): primero sus datos, después los de la visita según su tipo.
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
      <div className="space-y-5">
        <StepTitle
          step={1}
          title="Cédula no registrada"
          text="Registra a la persona; después se pedirán los datos de esta visita."
        />
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
    <div className="space-y-5">
      <StepTitle
        step={2}
        title={person.fullName}
        text={`Cédula ${person.identification}. Completa los datos de esta visita.`}
      />
      <button
        type="button"
        className="-mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline"
        onClick={() => setPerson(null)}
      >
        <Icon name="edit" className="h-4 w-4" />
        Corregir datos de la persona
      </button>
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
