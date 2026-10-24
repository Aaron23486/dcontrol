import type { InputHTMLAttributes } from 'react';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';

/** Campo de búsqueda con lupa (ADR 0011). */
export function SearchInput({
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className={`relative ${className}`}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      />
      <Input type="search" className="pl-9!" {...props} />
    </div>
  );
}
