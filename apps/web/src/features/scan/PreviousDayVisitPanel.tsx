import type { PersonSummary, VisitSummary } from '@cedi/shared';
import { useState } from 'react';
import { Alert } from '../../components/atoms/Alert';
import { Button } from '../../components/atoms/Button';
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
      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Tiene una visita abierta desde el <strong>{formatDateTime(visit.entryAt)}</strong>. Es
        probable que no se haya registrado su salida.
      </div>
      {error && <Alert>{error}</Alert>}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onCloseAndEnter(new Date(exitAt).toISOString());
        }}
      >
        <FormField label="Hora real en que salió esa vez">
          <Input
            type="datetime-local"
            value={exitAt}
            min={toDateTimeLocal(visit.entryAt)}
            onChange={(event) => setExitAt(event.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={pending || !exitAt}>
          Cerrar esa visita y registrar nueva entrada
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
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
