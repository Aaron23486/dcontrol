import { PersonType } from '@cedi/shared';
import { Button } from '../components/atoms/Button';
import { Icon } from '../components/atoms/Icon';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { DashboardPanels } from '../features/dashboard/DashboardPanels';
import { ManualEntryScanner } from '../features/scan/ManualEntryScanner';
import { NewPersonEntryPanel } from '../features/scan/NewPersonEntryPanel';
import { PersonCard } from '../features/scan/PersonCard';
import { PreviousDayVisitPanel } from '../features/scan/PreviousDayVisitPanel';
import { ScanFeedbackBanner } from '../features/scan/ScanFeedbackBanner';
import { ScanIllustration } from '../features/scan/ScanIllustration';
import { VisitDetailsForm } from '../features/scan/VisitDetailsForm';
import { useScanSound } from '../features/scan/scan-sound';
import { useScanFlow } from '../features/scan/use-scan-flow';
import { formatDateTime } from '../lib/format';
import { useDocumentTitle } from '../lib/use-document-title';

/**
 * Pantalla principal de la caseta: ingresar la cédula es la acción central (FR-8, NFR-2)
 * y debajo el resumen del día, quién está dentro y la actividad reciente. En escritorio ocupa
 * justo la ventana; si se abre un formulario del flujo, la página puede desplazarse (ADR 0011).
 */
export function ScanPage() {
  useDocumentTitle('Ingreso y salida');
  const flow = useScanFlow();
  const sound = useScanSound(flow.feedback);
  const { step } = flow;
  const panelOpen = step.kind !== 'idle' && step.kind !== 'confirm';

  return (
    <div className="flex flex-col gap-4 lg:min-h-main">
      <section
        aria-labelledby="scan-title"
        className="relative shrink-0 overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <ScanIllustration className="absolute inset-y-0 right-0 hidden h-full w-[28%] lg:block" />
        <div className="relative p-5 lg:w-[72%] lg:px-10">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h1 id="scan-title" className="text-2xl font-bold tracking-tight text-ink">
              Ingreso y salida
            </h1>
            <Button variant="soft" aria-pressed={sound.enabled} onClick={sound.toggle}>
              <Icon name={sound.enabled ? 'volume' : 'volumeOff'} className="h-4 w-4" />
              Sonido {sound.enabled ? 'activado' : 'desactivado'}
            </Button>
          </div>
          <ManualEntryScanner
            onScan={(code) => flow.submitCode(code)}
            disabled={flow.busy || panelOpen || step.kind === 'confirm'}
          />
        </div>
      </section>

      {flow.feedback && <ScanFeedbackBanner feedback={flow.feedback} />}

      {panelOpen && (
        <div className="shrink-0 rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="max-w-3xl">
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

      <DashboardPanels />
    </div>
  );
}
