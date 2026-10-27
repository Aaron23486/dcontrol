import { useEffect, useRef, useState } from 'react';
import type { ScanFeedback } from './use-scan-flow';

/** Un tono: frecuencia (Hz) y duración (ms). */
export interface Tone {
  frequency: number;
  durationMs: number;
}

/**
 * Sonidos distinguibles sin mirar la pantalla (NFR-2): entrada sube, salida baja,
 * error es grave. La forma de onda es suave para no resultar molesta en la caseta.
 */
export const SCAN_TONES: Record<ScanFeedback['kind'], Tone[]> = {
  entry: [
    { frequency: 660, durationMs: 90 },
    { frequency: 880, durationMs: 120 },
  ],
  exit: [
    { frequency: 880, durationMs: 90 },
    { frequency: 520, durationMs: 140 },
  ],
  error: [{ frequency: 220, durationMs: 320 }],
};

const STORAGE_KEY = 'cedi.scanSound';

/** Preferencia de este navegador; activado por defecto. Si el almacenamiento falla, sigue activado. */
export function readSoundPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function saveSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Sin almacenamiento (modo privado): la preferencia dura solo esta sesión.
  }
}

let audio: AudioContext | undefined;

/** Reproduce los tonos uno tras otro. Exportado para probarlo con un AudioContext simulado. */
export function playTones(tones: Tone[]): void {
  try {
    audio ??= new AudioContext();
    let start = audio.currentTime;
    for (const { frequency, durationMs } of tones) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const end = start + durationMs / 1000;
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(end);
      start = end + 0.03;
    }
  } catch {
    // Sin audio disponible: el aviso visual sigue siendo suficiente.
  }
}

/** Reproduce el tono de cada aviso nuevo si el sonido está activado. */
export function useScanSound(feedback: ScanFeedback | null) {
  const [enabled, setEnabled] = useState(readSoundPreference);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  // Solo suena al llegar un aviso nuevo; activar el sonido no repite el último.
  useEffect(() => {
    if (enabledRef.current && feedback) playTones(SCAN_TONES[feedback.kind]);
  }, [feedback]);
  return {
    enabled,
    toggle: () =>
      setEnabled((current) => {
        saveSoundPreference(!current);
        return !current;
      }),
  };
}
