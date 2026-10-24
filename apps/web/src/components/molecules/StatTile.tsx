interface StatTileProps {
  label: string;
  value: number;
  /** El número principal de la vista: más grande (uno solo por pantalla). */
  hero?: boolean;
  /** Estado que requiere atención: ámbar, siempre con ícono y texto, nunca solo color. */
  attention?: string;
}

export function StatTile({ label, value, hero = false, attention }: StatTileProps) {
  const needsAttention = Boolean(attention) && value > 0;
  return (
    <div
      className={`rounded-xl border p-4 ${
        needsAttention ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 font-semibold text-slate-900 ${hero ? 'text-5xl' : 'text-3xl'}`}>
        {value.toLocaleString('es')}
      </p>
      {needsAttention && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-900">
          <span aria-hidden="true">⚠</span>
          {attention}
        </p>
      )}
    </div>
  );
}
