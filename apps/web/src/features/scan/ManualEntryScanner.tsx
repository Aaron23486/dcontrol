import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/atoms/Icon';
import type { ScannerSourceProps } from './scanner-source';

/** Captura por teclado: el campo queda enfocado y Enter envía la cédula (NFR-2). */
export function ManualEntryScanner({ onScan, disabled = false }: ScannerSourceProps) {
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);

  // Al terminar cada operación, el cursor vuelve solo al campo de cédula.
  useEffect(() => {
    if (!disabled) input.current?.focus();
  }, [disabled]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!code.trim() || disabled) return;
        onScan(code);
        setCode('');
      }}
    >
      <label htmlFor="scan-input" className="mb-2 block text-sm font-semibold text-ink">
        Cédula
      </label>
      <div className="relative">
        <Icon
          name="idCard"
          className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-ink-muted"
        />
        <input
          id="scan-input"
          ref={input}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={disabled}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe la cédula y pulsa Enter"
          className="block h-13 w-full rounded-lg border-[1.5px] border-line bg-surface pl-14 pr-4 font-mono text-base tracking-wide sm:text-xl text-ink placeholder:text-ink-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:bg-canvas"
        />
      </div>
    </form>
  );
}
