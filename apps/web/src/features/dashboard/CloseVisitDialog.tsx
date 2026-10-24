import type { InsideVisit } from '@cedi/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from '../../components/atoms/Alert';
import { Input } from '../../components/atoms/Input';
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog';
import { FormField } from '../../components/molecules/FormField';
import { formatDateTime, toDateTimeLocal } from '../../lib/format';
import { scanApi } from '../scan/scan.api';
import { useRefreshLiveData } from './use-live-data';

interface CloseVisitDialogProps {
  visit: InsideVisit | null;
  onDone: () => void;
}

/** D3: cerrar una visita olvidada indicando la hora real de salida (queda auditado). */
export function CloseVisitDialog({ visit, onDone }: CloseVisitDialogProps) {
  const refreshLive = useRefreshLiveData();
  const [exitAt, setExitAt] = useState('');
  const close = useMutation({
    mutationFn: (input: { visitId: string; exitAt: string }) =>
      scanApi.closeVisit(input.visitId, input.exitAt),
    onSuccess: () => {
      void refreshLive();
      setExitAt('');
      onDone();
    },
  });
  const value = exitAt || (visit ? toDateTimeLocal(visit.entryAt) : '');

  return (
    <ConfirmDialog
      open={visit !== null}
      title="Cerrar visita sin salida"
      confirmLabel={close.isPending ? 'Cerrando…' : 'Cerrar visita'}
      onCancel={() => {
        close.reset();
        setExitAt('');
        onDone();
      }}
      onConfirm={() =>
        visit && close.mutate({ visitId: visit.visitId, exitAt: new Date(value).toISOString() })
      }
    >
      {visit && (
        <div className="space-y-3">
          <p>
            <strong>{visit.person.fullName}</strong> entró el {formatDateTime(visit.entryAt)} y no
            tiene salida registrada. Indica a qué hora salió realmente.
          </p>
          {close.error && <Alert>{close.error.message}</Alert>}
          <FormField label="Hora real de salida">
            <Input
              type="datetime-local"
              value={value}
              min={toDateTimeLocal(visit.entryAt)}
              onChange={(event) => setExitAt(event.target.value)}
            />
          </FormField>
        </div>
      )}
    </ConfirmDialog>
  );
}
