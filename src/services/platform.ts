/** Browser/platform helpers (SPEC 5.9, 3.11). */

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Saves text as a file. On iPhone the share sheet ("Save to Files") is the reliable way. */
export async function saveFile(fileName: string, text: string, mime = 'application/json'): Promise<void> {
  const file = new File([text], fileName, { type: mime });
  if (isIos() && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Keeps the screen on during a workout (R-WRK). Returns a release function. */
export async function keepAwake(): Promise<() => void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock) return () => {};
    const lock = await nav.wakeLock.request('screen');
    return () => void lock.release().catch(() => {});
  } catch {
    return () => {};
  }
}

// ---------- sound (R-WRK-3) ----------
// iOS only plays WebAudio that was started by a tap, and suspends the context in the background.
// One context for the whole app, unlocked on the first tap, resumed when the app comes back.
let audio: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (audio) return audio;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = new Ctx();
  } catch {
    audio = null;
  }
  return audio;
}

/** Call from a tap handler: resumes the context and plays a silent buffer, which unlocks sound on iOS. */
export function unlockAudio(): void {
  const c = ctx();
  if (!c) return;
  void c.resume().catch(() => {});
  try {
    const b = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = b;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/** Unlock on the first touch anywhere, and resume when the app becomes visible again. Returns a cleanup. */
export function installAudioUnlock(): () => void {
  const onTap = () => unlockAudio();
  const onVis = () => {
    if (document.visibilityState === 'visible' && audio?.state !== 'running') void audio?.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', onTap, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.removeEventListener('pointerdown', onTap);
    document.removeEventListener('visibilitychange', onVis);
  };
}

/**
 * Schedules `times` short beeps at `atMs` (epoch ms) on the audio clock, so they are on time even when the
 * page's timers are slowed down. Returns a cancel function.
 */
export function scheduleBeep(atMs: number, times = 1): () => void {
  const c = ctx();
  const nodes: OscillatorNode[] = [];
  let vib: ReturnType<typeof setTimeout> | null = null;
  const delay = Math.max(0, (atMs - Date.now()) / 1000);
  if (c) {
    if (c.state !== 'running') void c.resume().catch(() => {});
    try {
      for (let i = 0; i < times; i++) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = 880;
        o.connect(g);
        g.connect(c.destination);
        const t = c.currentTime + delay + i * 0.25;
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.start(t);
        o.stop(t + 0.2);
        nodes.push(o);
      }
    } catch {
      /* no audio */
    }
  }
  if (navigator.vibrate) vib = setTimeout(() => navigator.vibrate?.(times * 120), delay * 1000);
  return () => {
    for (const o of nodes) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    if (vib) clearTimeout(vib);
  };
}

/** Short beep now. */
export function beep(times = 1): void {
  scheduleBeep(Date.now(), times);
}

/** Opens a video link in the browser (E6). */
export function openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
