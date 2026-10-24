import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/**
 * Tabla del sistema de diseño (ADR 0011): marco, encabezado y separadores iguales en toda la app.
 * Cada pantalla decide sus columnas; si no caben, la tabla se desplaza a lo ancho por dentro.
 */
export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    // relative: contiene los textos solo para lectores de pantalla (evita desbordes de la página).
    <div className="relative overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="min-w-full divide-y divide-line text-[13px] text-ink">
        <thead className="bg-canvas text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={`px-3 py-2.5 ${className}`} {...props} />;
}

export function Td({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 py-3 ${className}`} {...props} />;
}
