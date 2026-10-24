import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger-strong"
    >
      {children}
    </div>
  );
}
