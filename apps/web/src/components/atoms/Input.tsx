import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  invalid?: boolean;
}

export function Input({ invalid = false, className = '', ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`block min-h-10 w-full rounded-md border bg-white px-3 py-2 read-only:bg-slate-50 read-only:text-slate-600 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${invalid ? 'border-red-500' : 'border-slate-300'} ${className}`}
      {...props}
    />
  );
}
