import { type ReactNode, useEffect, useRef } from 'react';
import { Button } from '../atoms/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo modal nativo: bloquea el fondo y se cierra con Escape. El foco inicial queda en
 * «Cancelar», así un Enter accidental (p. ej. de un lector) no confirma nada.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-full max-w-md rounded-lg p-6 shadow-xl backdrop:bg-slate-900/40"
    >
      <h2 id="confirm-dialog-title" className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
