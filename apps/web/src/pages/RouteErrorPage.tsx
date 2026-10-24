import { Button } from '../components/atoms/Button';
import { Icon } from '../components/atoms/Icon';

/** Error inesperado al mostrar una pantalla: mensaje claro, sin detalles técnicos (spec §26). */
export function RouteErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div
        role="alert"
        className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="alert" className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-lg font-bold text-ink">Algo salió mal</h1>
        <p className="mt-2 text-sm text-ink-muted">
          No pudimos mostrar esta pantalla. Vuelve a intentarlo; si continúa, avisa al
          administrador.
        </p>
        <Button className="mt-5" onClick={() => window.location.assign('/')}>
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}
