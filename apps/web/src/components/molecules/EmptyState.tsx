import type { ReactNode } from 'react';

/** Mensaje cuando no hay datos que mostrar, con una acción opcional. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-muted">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
