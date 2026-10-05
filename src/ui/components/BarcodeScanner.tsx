import { useEffect, useRef, useState } from 'react';
import { Modal } from './common';

/** Camera barcode scan (SPEC 15.10). The library is loaded only when the scanner opens. */
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  useEffect(() => {
    let stop: (() => void) | null = null;
    let done = false;
    void (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current!, (res) => {
          if (res && !done) {
            done = true;
            controls.stop();
            onCode(res.getText());
          }
        });
        stop = () => controls.stop();
        if (done) controls.stop();
      } catch {
        setErr('אין גישה למצלמה. אפשר להקליד את המספר שמתחת לברקוד.');
      }
    })();
    return () => {
      done = true;
      stop?.();
    };
  }, [onCode]);
  return (
    <Modal open onClose={onClose} title="סריקת ברקוד">
      {!err && <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000', aspectRatio: '4/3', objectFit: 'cover' }} />}
      {err && <div className="warnbox">{err}</div>}
      <p className="xs muted">הערכים מגיעים מ-Open Food Facts (צריך אינטרנט). רק מספר הברקוד נשלח. סוג הכשרות קובעים ידנית.</p>
      <div className="row">
        <input className="input ltr grow" inputMode="numeric" placeholder="מספר ברקוד" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))} />
        <button type="button" className="btn" disabled={manual.length < 8} onClick={() => onCode(manual)}>
          חפש
        </button>
      </div>
    </Modal>
  );
}
