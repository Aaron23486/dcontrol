import { Button } from '../components/atoms/Button';

/** Error inesperado al mostrar una pantalla: mensaje claro, sin detalles técnicos (spec §26). */
export function RouteErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center"
      >
        <h1 className="text-lg font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-slate-600">
          No pudimos mostrar esta pantalla. Vuelve a intentarlo; si continúa, avisa al
          administrador.
        </p>
        <Button className="mt-4" onClick={() => window.location.assign('/')}>
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}
