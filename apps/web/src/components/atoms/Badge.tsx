import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** success: dentro; warning: requiere atención (lleva ícono); neutral: el resto. */
type Tone = 'success' | 'warning' | 'neutral';

const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  neutral: 'bg-line-soft text-ink-soft',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {tone === 'success' && (
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
      )}
      {tone === 'warning' && <Icon name="alert" className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
