import { type ReactElement, cloneElement, useId } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  /** Control del campo; recibe `id`, `aria-describedby` e `invalid`. */
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; invalid?: boolean }>;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': error ? errorId : undefined,
        invalid: Boolean(error),
      })}
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
