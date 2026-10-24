import type { Ref, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
  invalid?: boolean;
}

export function Select({ invalid = false, className = '', ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`block min-h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${invalid ? 'border-red-500' : 'border-slate-300'} ${className}`}
      {...props}
    />
  );
}
