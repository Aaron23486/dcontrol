import type { PersonSummary, VisitSummary } from '@cedi/shared';
import { useState } from 'react';
import { Alert } from '../../components/atoms/Alert';
import { Button } from '../../components/atoms/Button';
import { Icon } from '../../components/atoms/Icon';
import { Input } from '../../components/atoms/Input';
import { FormField } from '../../components/molecules/FormField';
import { formatDateTime, toDateTimeLocal } from '../../lib/format';
import { PersonCard } from './PersonCard';

interface PreviousDayVisitPanelProps {
  person: PersonSummary;
  visit: VisitSummary;
  pending: boolean;
  error?: string;
  onExitNow: () => void;
  onCloseAndEnter: (exitAt: string) => void;
  onCancel: () => void;
}

/** D3: la persona sigue «dentro» desde un día anterior; probablemente olvidó registrar su salida. */
export function PreviousDayVisitPanel({
  person,
  visit,
  pending,
  error,
  onExitNow,
  onCloseAndEnter,
  onCancel,
}: PreviousDayVisitPanelProps) {
  const [exitAt, setExitAt] = useState(toDateTimeLocal(visit.entryAt));

  return (
    <div className="space-y-4">
      <PersonCard person={person} />
      <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning-strong">
        <Icon name="alert" className="mt-0.5 h-4 w-4" />
        <p>
          Tiene una visita abierta desde el <strong>{formatDateTime(visit.entryAt)}</strong>. Es
          probable que no se haya registrado su salida.
        </p>
      </div>
      {error && <Alert>{error}</Alert>}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onCloseAndEnter(new Date(exitAt).toISOString());
        }}
      >
        <div className="w-full sm:w-64">
          <FormField label="Hora real en que salió esa vez">
            <Input
              type="datetime-local"
              value={exitAt}
              min={toDateTimeLocal(visit.entryAt)}
              onChange={(event) => setExitAt(event.target.value)}
              required
            />
          </FormField>
        </div>
        <Button type="submit" disabled={pending || !exitAt}>
          Cerrar esa visita y registrar nueva entrada
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="secondary" disabled={pending} onClick={onExitNow}>
          No, está saliendo ahora: registrar salida
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
