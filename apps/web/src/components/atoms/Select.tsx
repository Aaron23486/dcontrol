import type { Ref, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
  invalid?: boolean;
}

export function Select({ invalid = false, className = '', ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`block min-h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 ${invalid ? 'border-danger' : 'border-line'} ${className}`}
      {...props}
    />
  );
}
