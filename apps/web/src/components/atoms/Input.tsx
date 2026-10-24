import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  invalid?: boolean;
}

export function Input({ invalid = false, className = '', ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`block min-h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted read-only:bg-canvas read-only:text-ink-soft focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 ${invalid ? 'border-danger' : 'border-line'} ${className}`}
      {...props}
    />
  );
}
