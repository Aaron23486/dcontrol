/** Indicador de carga; se anuncia a lectores de pantalla sin interrumpir. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p aria-live="polite" className="flex items-center gap-2 py-4 text-sm text-slate-500">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
      />
      {label}
    </p>
  );
}
