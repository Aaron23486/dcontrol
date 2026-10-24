import type { ReactNode } from 'react';

/** Mensaje cuando no hay datos que mostrar, con una acción opcional. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
