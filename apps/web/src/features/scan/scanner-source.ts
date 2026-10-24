/**
 * Contrato de cualquier medio para capturar la cédula (ADR 0006).
 * Hoy: teclado (`ManualEntryScanner`), que también sirve para un lector que actúa como teclado.
 * Mañana: cámara u otro lector, sin cambiar el resto del flujo.
 */
export interface ScannerSourceProps {
  /** Se llama con el texto capturado al confirmar (Enter). */
  onScan: (code: string) => void;
  /** Mientras se procesa una operación no se aceptan capturas nuevas. */
  disabled?: boolean;
}
