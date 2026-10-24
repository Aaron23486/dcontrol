import { useEffect, useRef, useState } from 'react';
import type { ScannerSourceProps } from './scanner-source';

/** Captura por teclado: el campo queda enfocado y Enter envía la cédula (spec §25). */
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
      <label htmlFor="scan-input" className="mb-2 block text-sm font-medium text-slate-700">
        Cédula
      </label>
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
        className="block w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-4 font-mono text-2xl tracking-wide shadow-sm focus-visible:border-slate-900 focus-visible:outline-none disabled:bg-slate-100"
      />
    </form>
  );
}
