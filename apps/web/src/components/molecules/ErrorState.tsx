import { Alert } from '../atoms/Alert';
import { Button } from '../atoms/Button';

interface ErrorStateProps {
  message: string;
  /** Si se indica, ofrece «Reintentar» (p. ej. tras un corte de conexión). */
  onRetry?: () => void;
}

/** Error comprensible para el personal operativo, con opción de reintentar (NFR-3). */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </Alert>
  );
}
