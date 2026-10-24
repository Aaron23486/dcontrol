import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCAN_TONES, readSoundPreference } from './scan-sound';

describe('SCAN_TONES', () => {
  it('entrada sube, salida baja y el error es grave', () => {
    const [entryA, entryB] = SCAN_TONES.entry;
    const [exitA, exitB] = SCAN_TONES.exit;
    expect(entryB!.frequency).toBeGreaterThan(entryA!.frequency);
    expect(exitB!.frequency).toBeLessThan(exitA!.frequency);
    expect(SCAN_TONES.error[0]!.frequency).toBeLessThan(
      Math.min(...[...SCAN_TONES.entry, ...SCAN_TONES.exit].map((tone) => tone.frequency)),
    );
  });
});

describe('readSoundPreference', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('está activado salvo que se haya desactivado', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    expect(readSoundPreference()).toBe(true);
    store.set('cedi.scanSound', 'off');
    expect(readSoundPreference()).toBe(false);
  });

  it('si el almacenamiento falla, queda activado', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(readSoundPreference()).toBe(true);
  });
});

describe('playTones', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('programa un oscilador por tono, uno después de otro', async () => {
    const started: { frequency: number; at: number }[] = [];
    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      createOscillator() {
        const oscillator = {
          type: '',
          frequency: { value: 0 },
          connect: (node: unknown) => node,
          start: (at: number) => started.push({ frequency: oscillator.frequency.value, at }),
          stop: () => undefined,
        };
        return oscillator;
      }
      createGain() {
        return {
          gain: { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined },
          connect: (node: unknown) => node,
        };
      }
    }
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const { playTones } = await import('./scan-sound');
    playTones(SCAN_TONES.entry);
    expect(started.map((tone) => tone.frequency)).toEqual([660, 880]);
    expect(started[1]!.at).toBeGreaterThan(started[0]!.at);
  });

  it('sin audio disponible no falla (el aviso visual basta)', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('sin audio');
        }
      },
    );
    vi.resetModules();
    const { playTones } = await import('./scan-sound');
    expect(() => playTones(SCAN_TONES.error)).not.toThrow();
  });
});
