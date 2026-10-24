import { useMutation } from '@tanstack/react-query';
import {
  ScanResultCode,
  type EntryPrefill,
  type PersonSummary,
  type RegisterEntryInput,
  type ScanResult,
  type VisitSummary,
  type VisitToolSummary,
} from '@cedi/shared';
import { useState } from 'react';
import { useRefreshLiveData } from '../dashboard/use-live-data';
import { scanApi } from './scan.api';

/** Paso en el que está el guarda después de ingresar una cédula. */
export type ScanStep =
  | { kind: 'idle' }
  | { kind: 'newPerson'; identification: string }
  | { kind: 'entry'; person: PersonSummary; prefill: EntryPrefill | null }
  | {
      kind: 'confirm';
      person: PersonSummary;
      pendingAction: 'ENTRY' | 'EXIT';
      lastOperationAt: string;
    }
  | { kind: 'previousDay'; person: PersonSummary; visit: VisitSummary };

/** Aviso grande que confirma la operación registrada (spec §25). */
export type ScanFeedback =
  | { kind: 'entry'; personName: string; at: string }
  | {
      kind: 'exit';
      personName: string;
      at: string;
      /** Herramientas con que entró: el guarda verifica que salgan con él (Fase 7). */
      tools: VisitToolSummary[];
    }
  | { kind: 'error'; message: string };

/** Traduce el resultado de la API al siguiente paso o al aviso final. */
export function stepOf(result: ScanResult): { step: ScanStep; feedback: ScanFeedback | null } {
  switch (result.result) {
    case ScanResultCode.PERSON_NOT_FOUND:
      return { step: { kind: 'newPerson', identification: result.identification }, feedback: null };
    case ScanResultCode.ENTRY_PENDING:
      return {
        step: { kind: 'entry', person: result.person, prefill: result.prefill },
        feedback: null,
      };
    case ScanResultCode.CONFIRMATION_REQUIRED:
      return {
        step: {
          kind: 'confirm',
          person: result.person,
          pendingAction: result.pendingAction,
          lastOperationAt: result.lastOperationAt,
        },
        feedback: null,
      };
    case ScanResultCode.PREVIOUS_DAY_VISIT_OPEN:
      return {
        step: { kind: 'previousDay', person: result.person, visit: result.visit },
        feedback: null,
      };
    case ScanResultCode.EXIT_REGISTERED:
      return {
        step: { kind: 'idle' },
        feedback: {
          kind: 'exit',
          personName: result.person.fullName,
          at: result.visit.exitAt ?? result.visit.entryAt,
          tools: result.visit.tools,
        },
      };
  }
}

/** Estado y acciones del flujo de ingreso y salida; los componentes solo lo muestran. */
export function useScanFlow() {
  const refreshLive = useRefreshLiveData();
  const [step, setStep] = useState<ScanStep>({ kind: 'idle' });
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const fail = (error: Error) => setFeedback({ kind: 'error', message: error.message });

  const scan = useMutation({
    mutationFn: ({ code, confirmed }: { code: string; confirmed: boolean }) =>
      scanApi.scan(code, confirmed),
    onMutate: () => setFeedback(null),
    onSuccess: (result) => {
      const next = stepOf(result);
      setStep(next.step);
      setFeedback(next.feedback);
      if (result.result === ScanResultCode.EXIT_REGISTERED) void refreshLive();
    },
    onError: (error) => {
      setStep({ kind: 'idle' });
      fail(error);
    },
  });

  const entry = useMutation({
    mutationFn: scanApi.registerEntry,
    onSuccess: ({ person, visit }) => {
      setStep({ kind: 'idle' });
      setFeedback({ kind: 'entry', personName: person.fullName, at: visit.entryAt });
      void refreshLive();
    },
  });

  const closeForgotten = useMutation({
    mutationFn: ({
      visitId,
      exitAt,
    }: {
      visitId: string;
      exitAt: string;
      identification: string;
    }) => scanApi.closeVisit(visitId, exitAt),
    // Cerrada la visita olvidada, se vuelve a procesar la cédula para registrar la nueva entrada.
    onSuccess: (_visit, { identification }) => {
      void refreshLive();
      scan.mutate({ code: identification, confirmed: false });
    },
  });

  return {
    step,
    feedback,
    busy: scan.isPending || entry.isPending || closeForgotten.isPending,
    submitCode: (code: string, confirmed = false) => scan.mutate({ code, confirmed }),
    registerEntry: (input: RegisterEntryInput) => entry.mutate(input),
    entryError: entry.error?.message,
    closeForgottenVisit: (visitId: string, exitAt: string, identification: string) =>
      closeForgotten.mutate({ visitId, exitAt, identification }),
    closeError: closeForgotten.error?.message,
    cancel: () => {
      entry.reset();
      closeForgotten.reset();
      setStep({ kind: 'idle' });
    },
  };
}
