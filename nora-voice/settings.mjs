// Nora's voice/ears settings, from settings.json next to this file (edit it, then restart the voice window).
//   headphones: true  -> her ears stay ON while she talks, so you can interrupt her by voice ("Hey Nora...").
//                        Only safe with headphones: through speakers she'd hear herself.
//   gpu: true         -> try your NVIDIA GPU first (DirectML), and fall back to the CPU if it doesn't work.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'settings.json');
let saved = {};
try { saved = JSON.parse(readFileSync(FILE, 'utf8')); } catch { /* no file or a typo: use the defaults */ }
//   openApp: true     -> open Nora's app as soon as her voice is ready (one double-click starts everything).
//   earsGpu: false    -> her ears (Whisper) stay on the CPU: on the GPU (DirectML) Whisper crashed and lagged.
export const SETTINGS = { headphones: false, gpu: true, earsGpu: false, openApp: true, ...saved };

/** Load an AI model on the GPU if allowed, else (or if that fails) on the CPU. Logs which one it got. */
export async function loadFast(name, load, { gpu = SETTINGS.gpu } = {}) {
  if (gpu) {
    try {
      const m = await load({ device: 'dml', dtype: 'fp32' });
      console.log(`[${name}] running on the GPU (DirectML)`);
      return m;
    } catch (e) { console.log(`[${name}] GPU didn't work (${String(e.message).slice(0, 80)}), using the CPU`); }
  }
  const m = await load({ device: 'cpu', dtype: 'q8' });
  console.log(`[${name}] running on the CPU`);
  return m;
}
