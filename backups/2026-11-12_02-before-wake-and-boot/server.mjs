// NORA VOICE SERVER
// A tiny local program that turns text into Nora's voice with Kokoro (af_heart), 100% on this PC.
//
// Roamies already knows how to talk to a local voice app called "VoiceStudio" at http://127.0.0.1:3900.
// This server pretends to be VoiceStudio: it answers the same addresses in the same way, so Roamies
// uses it without any changes to Roamies' voice code.
//
// What Roamies asks for, and what we answer:
//   GET  /health           -> "are you alive?"            { status: 'ok' }  (or 503 'starting' while Kokoro loads)
//   GET  /engines/tts      -> "which voice engine?"       Kokoro
//   GET  /v1/audio/voices  -> "which voices do you have?" af_heart (Nora) + a few others
//   WS   /ws/tts           -> per sentence: gets { text, voice } and sends back
//                             { type:'start', sample_rate } -> raw audio bytes -> { type:'done' }
//
// Run it with:  npm start   (or double-click start-nora-voice.bat)

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { KokoroTTS } from 'kokoro-js';

const PORT = 3900;                 // the port Roamies looks for
const HOST = '127.0.0.1';          // only this PC can connect (safer than 0.0.0.0)
const DEFAULT_VOICE = 'af_heart';  // Nora's voice
const VOICES = [
  ['af_heart', 'Nora (af_heart)'],
  ['af_bella', 'Bella (af_bella)'],
  ['af_nicole', 'Nicole (af_nicole)'],
  ['bf_emma', 'Emma, British (bf_emma)'],
  ['bm_george', 'George, British (bm_george)'],
  ['am_michael', 'Michael (am_michael)'],
];

// ---------- 1. Load Kokoro (downloads the model the first time, about 90 MB) ----------
let tts = null;
console.log('[nora-voice] Loading Kokoro... (first run downloads the model, give it a minute)');
KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' })
  .then((model) => { tts = model; console.log(`[nora-voice] Ready. Nora is listening on http://${HOST}:${PORT}`); })
  .catch((err) => { console.error('[nora-voice] Could not load Kokoro:', err); process.exit(1); });

// Kokoro gives audio as decimals between -1 and 1 (Float32). Roamies wants 16-bit whole numbers (PCM16).
function toPcm16(floats) {
  const out = Buffer.alloc(floats.length * 2);
  for (let i = 0; i < floats.length; i++) {
    const s = Math.max(-1, Math.min(1, floats[i]));       // clamp so loud parts don't crackle
    out.writeInt16LE(Math.round(s * 32767), i * 2);       // scale to -32767..32767, 2 bytes each
  }
  return out;
}

// ---------- 2. The normal web addresses ----------
const json = (res, status, body) => {
  // Roamies checks for this header to be sure it's talking to "VoiceStudio" and not some other app.
  res.writeHead(status, { 'content-type': 'application/json', 'x-omnivoice-backend': 'nora-kokoro' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') return tts ? json(res, 200, { status: 'ok', version: 'nora-1.0' }) : json(res, 503, { status: 'starting' });
  if (url === '/engines/tts') {
    return json(res, 200, { active: 'kokoro', backends: [{ id: 'kokoro', display_name: 'Kokoro', available: !!tts }] });
  }
  if (url === '/v1/audio/voices') {
    return json(res, 200, { voices: VOICES.map(([id, name]) => ({ type: 'profile', voice_id: id, name })) });
  }
  json(res, 404, { error: 'not found' });
});

// ---------- 3. The live voice socket ----------
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  if (req.url.split('?')[0] !== '/ws/tts') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    if (!tts) return ws.close(1008, 'starting'); // 1008 = "still starting", Roamies will wait and retry
    wss.emit('connection', ws);
  });
});

wss.on('connection', (ws) => {
  // Roamies sends one sentence at a time and waits for 'done' before the next, so a simple chain keeps order.
  let chain = Promise.resolve();
  ws.on('message', (data) => {
    chain = chain.then(async () => {
      let msg;
      try { msg = JSON.parse(String(data)); } catch { return; }
      const text = String(msg.text ?? '').trim();
      const voice = VOICES.some(([id]) => id === msg.voice) ? msg.voice : DEFAULT_VOICE;
      try {
        const audio = await tts.generate(text || '...', { voice });
        if (ws.readyState !== ws.OPEN) return;
        ws.send(JSON.stringify({ type: 'start', sample_rate: audio.sampling_rate }));
        ws.send(toPcm16(audio.audio));
        ws.send(JSON.stringify({ type: 'done' }));
      } catch (err) {
        console.error('[nora-voice] Failed to speak:', err.message);
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'error', detail: String(err.message) }));
      }
    });
  });
});

server.listen(PORT, HOST);
