// NORA'S EARS: listens for "Hey Nora" and wakes her up, 100% on this PC, free.
//
// How it works (like you're 5):
//   1. The microphone sends tiny slices of sound, 32 ms each.
//   2. We measure how LOUD each slice is. Quiet = nobody's talking, so we do nothing (saves your CPU).
//   3. When it gets loud, we save the sound until it's quiet again. That's one "phrase."
//   4. A tiny speech-to-text AI (Whisper tiny) turns that phrase into words.
//   5. If the words contain "hey nora", we run `roamies.exe --talk`, and Roamies starts listening to you.
//
// Nora must not wake herself up when she says her own name, so server.mjs calls muteFor() while she speaks.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PvRecorder } from '@picovoice/pvrecorder-node';
import { pipeline } from '@huggingface/transformers';
import { loadFast, SETTINGS } from './settings.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Where your built Nora app is. NORA_APP overrides it (for example after you build the installer).
export const APP = process.env.NORA_APP ?? path.join(HERE, '..', 'showcase', 'tauri', 'src-tauri', 'target', 'debug', 'roamies.exe');

// "Hey Nora" plus near misses the speech AI tends to write instead of "Nora".
const WAKE = /\b(hey|hi|hay|okay|ok|yo)[\s,.!]*(nora|norah|nara|noura|nura|laura|norra)\b/i;

const RATE = 16000;        // the mic gives 16,000 sound numbers per second
const FRAME = 512;         // numbers per slice: 512 / 16000 = 32 ms
const PRE_ROLL = 10;       // keep about 0.3 s from before the loud part, so "Hey" isn't cut off
const END_SILENCE = 14;    // about 0.45 s of quiet ends a phrase
const MAX_FRAMES = 160;    // never hold more than about 5 s
const MIN_FRAMES = 8;      // shorter than about 0.25 s is a click or a cough, not words

let mutedUntil = 0;
/** server.mjs calls this while Nora talks, so her own voice can't wake her. */
export function muteFor(ms) { mutedUntil = Math.max(mutedUntil, Date.now()) + ms; }

const loudness = (f) => { let s = 0; for (let i = 0; i < f.length; i++) s += f[i] * f[i]; return Math.sqrt(s / f.length); };

/** Hand a command straight to Nora's brain (sidekick.mjs listens on 127.0.0.1:3901). False if she can't take it. */
async function sendToNora(text) {
  try {
    const key = readFileSync(path.join(os.homedir(), '.nora', 'ears-key'), 'utf8').trim();
    const r = await fetch('http://127.0.0.1:3901/say', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-nora-key': key },
      body: JSON.stringify({ text }), signal: AbortSignal.timeout(2000),
    });
    return r.ok;
  } catch { return false; } // app closed, or an older build without this: fall back to opening the mic
}

export async function startWake() {
  if (!existsSync(APP)) { console.error(`[nora-ears] Can't find the app at ${APP}. Build it first (./build.sh dev).`); return; }
  console.log('[nora-ears] Loading the speech model (first run downloads about 40 MB)...');
  const hear = await loadFast('nora-ears', (opts) => pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', opts), { gpu: SETTINGS.earsGpu });

  const mic = new PvRecorder(FRAME, -1); // -1 = your default microphone
  mic.start();
  console.log(`[nora-ears] Listening for "Hey Nora" on: ${mic.getSelectedDevice()}`);

  let noise = 200;        // the room's normal background loudness; it adjusts by itself
  let phrase = null;      // frames of the phrase being heard, or null
  let quiet = 0;
  const recent = [];      // the last few frames, for pre-roll
  let thinking = false;   // already turning a phrase into words
  const DEBUG = !!process.env.NORA_DEBUG;
  let meterAt = 0;        // debug: last time we printed the level meter

  for (;;) {
    const frame = await mic.read(); // an Int16Array of 512 numbers
    const level = loudness(frame);
    recent.push(frame); if (recent.length > PRE_ROLL) recent.shift();
    // Debug level meter, every 2 s: how loud the mic is vs. how loud it must get to count as talking.
    if (DEBUG && Date.now() - meterAt > 2000) {
      meterAt = Date.now();
      console.log(`[nora-ears] mic level ${level.toFixed(0)} | room hum ${noise.toFixed(0)} | talking starts at ${Math.max(noise * 3, 350).toFixed(0)}${phrase ? ' | (hearing a phrase)' : ''}`);
    }

    if (!phrase) {
      noise = noise * 0.98 + level * 0.02; // slowly learn the room's background noise
      if (level > Math.max(noise * 3, 350)) { phrase = [...recent]; quiet = 0; }
      continue;
    }
    phrase.push(frame);
    quiet = level > Math.max(noise * 2, 250) ? 0 : quiet + 1;
    if (quiet < END_SILENCE && phrase.length < MAX_FRAMES) continue;

    // The phrase is over: check it (unless she's talking, or we're still busy with the last one).
    const frames = phrase; phrase = null;
    if (frames.length < MIN_FRAMES || thinking || Date.now() < mutedUntil) {
      if (DEBUG) console.log(`[nora-ears] skipped a phrase (${frames.length < MIN_FRAMES ? 'too short' : thinking ? 'still busy' : 'muted while Nora talks'})`);
      continue;
    }
    if (DEBUG) console.log(`[nora-ears] phrase heard (${(frames.length * FRAME / RATE).toFixed(1)} s), reading it...`);
    thinking = true;
    check(frames).catch((e) => console.error('[nora-ears] Could not read that phrase:', e.message)).finally(() => { thinking = false; });
  }

  async function check(frames) {
    // Join the slices and turn 16-bit numbers (-32768..32767) into decimals (-1..1), which the AI wants.
    const audio = new Float32Array(frames.length * FRAME);
    frames.forEach((f, i) => { for (let j = 0; j < FRAME; j++) audio[i * FRAME + j] = f[j] / 32768; });
    const t0 = performance.now();
    const { text } = await hear(audio);
    const ms = (performance.now() - t0).toFixed(0);
    if (!WAKE.test(text)) { if (process.env.NORA_DEBUG) console.log(`[nora-ears] (${ms} ms) not a wake: "${text.trim()}"`); return; }
    // Anything said after "Hey Nora" in the same breath is the command ("Hey Nora, systems check").
    const m = WAKE.exec(text);
    const command = text.slice(m.index + m[0].length).replace(/^[\s,.!?]+/, '').trim();
    if (command.replace(/[^a-z]/gi, '').length >= 3 && await sendToNora(command)) {
      console.log(`[nora-ears] Heard: "${text.trim()}" in ${ms} ms -> sent "${command}" straight to Nora`);
      return;
    }
    console.log(`[nora-ears] Heard: "${text.trim()}" in ${ms} ms -> waking Nora`);
    muteFor(4_000); // ignore the next few seconds (your question), so it doesn't re-trigger
    spawn(APP, ['--talk'], { detached: true, stdio: 'ignore' }).unref();
  }
}
