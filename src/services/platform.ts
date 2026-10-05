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

/** Short beep for timers (WebAudio, no file). */
export function beep(times = 1): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.25;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t);
      o.stop(t + 0.2);
    }
    if (navigator.vibrate) navigator.vibrate(times * 120);
  } catch {
    /* no audio */
  }
}

/** Opens a video link in the browser (E6). */
export function openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
