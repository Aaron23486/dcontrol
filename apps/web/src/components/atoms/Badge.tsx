import type { ReactNode } from 'react';

type Tone = 'success' | 'neutral';

const TONES: Record<Tone, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  neutral: 'bg-slate-100 text-slate-700',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
