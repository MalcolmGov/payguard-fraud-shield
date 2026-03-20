/* ═══════════════════════════════════════════════════════════════════════════
 * PayGuard SDK — Browser Signal Collection
 * Collects device fingerprint, behavioural signals, and environment anomalies
 * © 2026 Swifter Technologies (Pty) Ltd
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { DeviceFingerprint, SignalOptions } from './types';

// ── Hashing utility ──────────────────────────────────────────────────────────

async function hash(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h + data.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

// ── Canvas fingerprint ───────────────────────────────────────────────────────

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';
    canvas.width = 200; canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('PayGuard', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('PayGuard', 4, 17);
    return canvas.toDataURL().slice(-50);
  } catch { return 'error'; }
}

// ── WebGL fingerprint ────────────────────────────────────────────────────────

function getWebGLInfo(): { renderer: string; hash: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return { renderer: 'unsupported', hash: 'unsupported' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
    const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : 'unknown';
    return { renderer: `${vendor} | ${renderer}`, hash: `${renderer}`.slice(0, 40) };
  } catch { return { renderer: 'error', hash: 'error' }; }
}

// ── Audio fingerprint ────────────────────────────────────────────────────────

async function getAudioHash(): Promise<string> {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return 'unsupported';
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    const processor = ctx.createScriptProcessor(4096, 1, 1);

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    gain.gain.value = 0;

    oscillator.connect(analyser);
    analyser.connect(processor);
    processor.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(0);

    return new Promise((resolve) => {
      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        oscillator.stop();
        processor.disconnect();
        ctx.close();
        resolve(sum.toString(36).slice(0, 16));
      };
      setTimeout(() => { try { oscillator.stop(); ctx.close(); } catch {} resolve('timeout'); }, 1000);
    });
  } catch { return 'unsupported'; }
}

// ── Anomaly Detection ────────────────────────────────────────────────────────

function detectAnomalies(): string[] {
  const anomalies: string[] = [];
  const nav = navigator as any;
  const win = window as any;

  if (nav.webdriver) anomalies.push('WEBDRIVER_DETECTED');
  if (!win.chrome && /Chrome/.test(navigator.userAgent)) anomalies.push('CHROME_HEADLESS_SUSPECT');
  if (win.__selenium_unwrapped || win.__webdriver_evaluate) anomalies.push('SELENIUM_DETECTED');
  if (win.__nightmare) anomalies.push('NIGHTMARE_DETECTED');
  if (win.callPhantom || win._phantom) anomalies.push('PHANTOM_DETECTED');
  if (nav.languages?.length === 0) anomalies.push('NO_LANGUAGES');
  if (window.self !== window.top) anomalies.push('RUNNING_IN_IFRAME');

  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  if (widthDiff > 200 || heightDiff > 200) anomalies.push('DEVTOOLS_LIKELY_OPEN');

  const start = performance.now();
  for (let i = 0; i < 1000000; i++) { /* noop */ }
  const elapsed = performance.now() - start;
  if (elapsed > 100) anomalies.push('SLOW_EXECUTION_SUSPECT');

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillText('test', 0, 0);
      if (canvas.toDataURL() === 'data:,') anomalies.push('CANVAS_BLOCKED_TOR_SUSPECT');
    }
  } catch { anomalies.push('CANVAS_BLOCKED'); }

  if (navigator.plugins?.length === 0 && !/Mobile|Android/i.test(navigator.userAgent)) {
    anomalies.push('NO_PLUGINS');
  }

  return anomalies;
}

// ── Collect Full Fingerprint ─────────────────────────────────────────────────

export async function collectDeviceFingerprint(options: SignalOptions = {}): Promise<DeviceFingerprint> {
  const webgl = getWebGLInfo();
  const canvasHash = options.deviceFingerprint !== false ? getCanvasHash() : 'disabled';
  const audioHash = options.deviceFingerprint !== false ? await getAudioHash() : 'disabled';
  const anomalies = detectAnomalies();

  const rawFingerprint = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency?.toString() || '0',
    webgl.hash,
    canvasHash,
    audioHash,
  ].join('|');

  const deviceId = await hash(rawFingerprint);

  return {
    deviceId,
    platform: navigator.userAgent.slice(0, 120),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    cores: navigator.hardwareConcurrency || 0,
    memory: (navigator as any).deviceMemory || 0,
    gpu: webgl.renderer,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webglHash: webgl.hash,
    canvasHash,
    audioHash,
    anomalies,
  };
}

// ── Behavioural Signal Monitors ──────────────────────────────────────────────

export interface BehaviouralSignals {
  pasteEvents: number;
  keystrokeTimings: number[];
  averageKeystrokeMs: number;
  rapidFormCompletion: boolean;
  formStartTime: number;
  formEndTime: number;
}

const behaviouralState: BehaviouralSignals = {
  pasteEvents: 0,
  keystrokeTimings: [],
  averageKeystrokeMs: 0,
  rapidFormCompletion: false,
  formStartTime: 0,
  formEndTime: 0,
};

let lastKeystrokeTime = 0;

export function attachBehaviouralMonitor(element: HTMLInputElement | HTMLTextAreaElement): () => void {
  if (!behaviouralState.formStartTime) {
    behaviouralState.formStartTime = Date.now();
  }

  const onPaste = () => { behaviouralState.pasteEvents++; };

  const onKeyDown = () => {
    const now = Date.now();
    if (lastKeystrokeTime) {
      const delta = now - lastKeystrokeTime;
      behaviouralState.keystrokeTimings.push(delta);
      if (behaviouralState.keystrokeTimings.length > 50) behaviouralState.keystrokeTimings.shift();
      const sum = behaviouralState.keystrokeTimings.reduce((a, b) => a + b, 0);
      behaviouralState.averageKeystrokeMs = Math.round(sum / behaviouralState.keystrokeTimings.length);
    }
    lastKeystrokeTime = now;
    behaviouralState.formEndTime = now;
  };

  element.addEventListener('paste', onPaste);
  element.addEventListener('keydown', onKeyDown);
  return () => {
    element.removeEventListener('paste', onPaste);
    element.removeEventListener('keydown', onKeyDown);
  };
}

export function getBehaviouralSignals(): BehaviouralSignals {
  const elapsed = behaviouralState.formEndTime - behaviouralState.formStartTime;
  behaviouralState.rapidFormCompletion = elapsed > 0 && elapsed < 3000;
  return { ...behaviouralState };
}

export function resetBehaviouralSignals(): void {
  behaviouralState.pasteEvents = 0;
  behaviouralState.keystrokeTimings = [];
  behaviouralState.averageKeystrokeMs = 0;
  behaviouralState.rapidFormCompletion = false;
  behaviouralState.formStartTime = 0;
  behaviouralState.formEndTime = 0;
  lastKeystrokeTime = 0;
}
