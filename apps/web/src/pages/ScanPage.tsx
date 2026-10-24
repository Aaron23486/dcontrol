import { PersonType } from '@cedi/shared';
import { Button } from '../components/atoms/Button';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { DashboardPanels } from '../features/dashboard/DashboardPanels';
import { ManualEntryScanner } from '../features/scan/ManualEntryScanner';
import { NewPersonEntryPanel } from '../features/scan/NewPersonEntryPanel';
import { PersonCard } from '../features/scan/PersonCard';
import { PreviousDayVisitPanel } from '../features/scan/PreviousDayVisitPanel';
import { ScanFeedbackBanner } from '../features/scan/ScanFeedbackBanner';
import { VisitDetailsForm } from '../features/scan/VisitDetailsForm';
import { useScanSound } from '../features/scan/scan-sound';
import { useScanFlow } from '../features/scan/use-scan-flow';
import { formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/use-document-title';

/**
 * Pantalla principal de la caseta: ingresar la cédula es la acción central (spec §14, §25)
 * y debajo el resumen del día, quién está dentro y la actividad reciente.
 */
export function ScanPage() {
  useDocumentTitle('Ingreso y salida');
  const flow = useScanFlow();
  const sound = useScanSound(flow.feedback);
  const { step } = flow;
  const panelOpen = step.kind !== 'idle' && step.kind !== 'confirm';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Ingreso y salida</h1>
            <Button variant="secondary" aria-pressed={sound.enabled} onClick={sound.toggle}>
              <span aria-hidden="true">{sound.enabled ? '🔊' : '🔇'}</span>
              <span className="ml-1">Sonido {sound.enabled ? 'activado' : 'desactivado'}</span>
            </Button>
          </div>
          <ManualEntryScanner
            onScan={(code) => flow.submitCode(code)}
            disabled={flow.busy || panelOpen || step.kind === 'confirm'}
          />
        </div>

        {flow.feedback && <ScanFeedbackBanner feedback={flow.feedback} />}

        {panelOpen && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {step.kind === 'entry' && (
              <div className="space-y-4">
                <PersonCard person={step.person} />
                <VisitDetailsForm
                  key={step.person.id}
                  personType={step.person.type}
                  prefill={step.prefill}
                  submitLabel={
                    step.person.type === PersonType.EXTERNAL_WORKER
                      ? 'Registrar entrada (Enter)'
                      : 'Registrar entrada'
                  }
                  pending={flow.busy}
                  error={flow.entryError}
                  onSubmit={(details) => flow.registerEntry({ personId: step.person.id, details })}
                  onCancel={flow.cancel}
                />
              </div>
            )}
            {step.kind === 'newPerson' && (
              <NewPersonEntryPanel
                key={step.identification}
                identification={step.identification}
                pending={flow.busy}
                error={flow.entryError}
                onRegister={(newPerson, details) => flow.registerEntry({ newPerson, details })}
                onCancel={flow.cancel}
              />
            )}
            {step.kind === 'previousDay' && (
              <PreviousDayVisitPanel
                person={step.person}
                visit={step.visit}
                pending={flow.busy}
                error={flow.closeError}
                onExitNow={() => flow.submitCode(step.person.identification, true)}
                onCloseAndEnter={(exitAt) =>
                  flow.closeForgottenVisit(step.visit.id, exitAt, step.person.identification)
                }
                onCancel={flow.cancel}
              />
            )}
          </div>
        )}

        <ConfirmDialog
          open={step.kind === 'confirm'}
          title={
            step.kind === 'confirm' && step.pendingAction === 'EXIT'
              ? '¿Registrar la SALIDA?'
              : '¿Registrar una nueva ENTRADA?'
          }
          confirmLabel={
            step.kind === 'confirm' && step.pendingAction === 'EXIT' ? 'Sí, salida' : 'Sí, entrada'
          }
          onCancel={flow.cancel}
          onConfirm={() =>
            step.kind === 'confirm' && flow.submitCode(step.person.identification, true)
          }
        >
          {step.kind === 'confirm' && (
            <>
              <strong>{step.person.fullName}</strong> registró su{' '}
              {step.pendingAction === 'EXIT' ? 'entrada' : 'salida'} hace menos de un minuto (
              {formatDateTime(step.lastOperationAt)}). ¿Fue un escaneo repetido por error?
            </>
          )}
        </ConfirmDialog>
      </section>

      <DashboardPanels />
    </div>
  );
}
