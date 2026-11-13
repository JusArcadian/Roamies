# ATLAS / Nora Study Guide

Explained like you're 5, then a little deeper. One chapter per idea. New chapters get added with every change.

---

## Chapter 1: The big picture (how Roamies works)

**Like you're 5:** Nora is a robot with a **body**, **ears**, a **brain** and a **mouth**.

| Part | What it is | Where it lives |
|---|---|---|
| Body | The see-through window on your screen and the Ctrl+Alt hotkey | `showcase/tauri/src-tauri/` (Rust) |
| Ears | Turns your voice into text (NVIDIA Parakeet, runs on your PC) | `src-tauri/voice-win/` |
| Brain | Sends your words to the AI and decides what to do | `showcase/tauri/sidecar/sidekick.mjs` (Node.js) |
| Mouth | Turns her reply into sound | `fish.mjs` (paid), `voicestudio.mjs` (local), or **our `nora-voice/`** |
| Hands | Opens apps, reads files, clicks | `sidecar/tools.mjs` |
| Seatbelt | Asks "are you sure?" before risky stuff | `sidecar/safety.mjs` |

**One conversation, step by step:**
1. You hold **Ctrl+Alt** and talk. The body hears the hotkey.
2. The ears turn your voice into text.
3. The brain sends that text + Nora's personality to the AI (Claude).
4. The AI answers. Maybe it uses a tool first ("open Chrome").
5. The reply is cut into sentences (`speech.mjs`) so she starts talking before the whole reply is done.
6. Each sentence goes to the mouth and becomes sound.

---

## Chapter 2: Where a character's name comes from

**Like you're 5:** there's a list of characters. Each one has a secret code name, a name you see and a voice.

```js
const LOOKS = [
  ['classic', 'Roamie', DEFAULT_VOICE],
  ['jarvis',  'Nora',   'e13fa398...'],   // ← we changed 'JARVIS' to 'Nora'
  ...
];
```

- `'jarvis'` is the **ID**, a code name the program uses internally. We **kept** it, because the glowing-sphere art and lots of other code look for that exact word. Changing it would break things.
- `'Nora'` is the **display name**, what you and she see. Safe to change.
- The long code is a Fish Audio voice ID. Our local voice doesn't use it.

**Why we had to change 4 files:** the name is written in several places (brain, on-screen label, settings panel, setup guide). Each part of the app keeps its own copy, so each one needed changing.

**Lesson:** before renaming something, search the whole project for it. That's what `grep "JARVIS"` did.

---

## Chapter 3: How Nora knows to call you "Sir"

The brain builds a **system prompt**, the instructions the AI reads before every conversation. It starts like this:

```js
const stablePrompt = () => `You are ${lookName()}, ${LOOK_BODY[config.look]} who lives on ${userName}'s screen...`
```

- The backticks `` ` `` make a **template string**: text with blanks to fill in.
- `${lookName()}` fills in the name. Now that's **Nora**.

We added this right after "never call yourself Sidekick.":

```js
${config.look === 'jarvis' ? ' As Nora, your name stands for Neural Operations & Response Assistant. ... Always address the user as "Sir" ...' : ''}
```

- `condition ? A : B` means **"if the condition is true use A, otherwise use B."**
- So **only when the sphere/Nora look is picked**, the AI also gets the "call him Sir" rule. The other characters stay the same.

---

## Chapter 4: Nora's voice server (the "pretend to be VoiceStudio" trick)

**Like you're 5:** Roamies already knows how to phone a voice app called VoiceStudio at a certain number (`127.0.0.1:3900`). We built our own little app that answers that number and talks the same way. Roamies doesn't know the difference, so we didn't have to rewire Roamies at all.

**Words to know:**
- **127.0.0.1** means "this same computer." Nothing goes out to the internet.
- **Port 3900** is like an apartment number on that computer.
- **HTTP** works like a letter: ask once, get one answer. We use it for "are you alive?" and "what voices do you have?"
- **WebSocket** works like a phone call: it stays open and you talk back and forth. We use it for live speech.
- **PCM16** is raw sound: a long list of numbers, each describing how far the speaker should push at that instant.

**The important part of `server.mjs`:**

```js
const audio = await tts.generate(text, { voice });                       // Kokoro turns text into sound
ws.send(JSON.stringify({ type: 'start', sample_rate: audio.sampling_rate }));  // "here comes audio, 24000 numbers per second"
ws.send(toPcm16(audio.audio));                                              // the sound itself
ws.send(JSON.stringify({ type: 'done' }));                                  // "finished, send the next sentence"
```

- `await` means "wait for this to finish before going on." Kokoro needs a moment to make the sound.
- `toPcm16` converts Kokoro's decimals (-1.0 to 1.0) into whole numbers (-32767 to 32767), because that's the format Roamies expects.
- The `x-omnivoice-backend` header is like a secret handshake. Roamies checks for it to be sure it's talking to "VoiceStudio."

**Why `127.0.0.1` and not `0.0.0.0`?** `0.0.0.0` would let other devices on your Wi-Fi use your voice server. Keeping it on 127.0.0.1 is a basic security habit, which matters for your cyber side.

---

## Chapter 5: "Hey Nora" (how a wake word works)

**Like you're 5:** Nora keeps one ear open. She ignores silence. When someone talks, she writes down what they said, and if it was "Hey Nora," she taps Roamies on the shoulder.

**The 5 steps in `wake.mjs`:**
1. **Mic → slices.** `PvRecorder` gives 512 sound numbers at a time (32 milliseconds of sound).
2. **How loud?** `loudness()` uses RMS (a kind of average loudness). Quiet slices are skipped, which saves CPU.
3. **Learning the room.** `noise = noise * 0.98 + level * 0.02` slowly learns your normal background noise (fan, AC), so "loud" means *louder than your room*, not a fixed number.
4. **Speech → words.** Whisper tiny, a small speech-to-text AI, turns the phrase into text.
5. **Is it "Hey Nora"?** A **regex** (a text pattern) checks it:
   ```js
   const WAKE = /\b(hey|hi|okay|ok|yo)[\s,.!]*(nora|norah|nara|laura|...)\b/i;
   ```
   - `(hey|hi|ok)` means any one of these words
   - `[\s,.!]*` means any number of spaces or commas in between
   - `/i` means ignore upper/lowercase
   - "laura" is there because the speech AI sometimes mishears "Nora" as "Laura"

**How she wakes the app:** Roamies has a built-in command, `roamies.exe --talk`. Running it a second time doesn't open a second app; it tells the one already running to start listening. Ken added this for Linux keyboard shortcuts, and we reused it. This is reverse engineering: find a door that's already there instead of building a new one.

```js
spawn(APP, ['--talk'], { detached: true, stdio: 'ignore' }).unref();
```
- `spawn` starts another program.
- `detached` + `unref()` means "start it and don't wait for it."

**Why she can't wake herself:** when Nora says "Nora," her own speakers could trigger her ears. So `server.mjs` calls `muteFor()` for as long as each sentence lasts plus 0.8 seconds.

**Why not Porcupine?** It's the usual wake-word tool, but its free plan ended June 30, 2026. Always check if a tool is still free before building on it.

---

## Chapter 6: The boot-up briefing

**Like you're 5:** when the app wakes up, Nora checks the clock, peeks outside, reads your to-do list, then tells you about it.

```js
if (config.onboarded && config.look === 'jarvis' && !onboarding && !booted) { booted = true; setTimeout(() => bootBriefing()..., 1500); }
```
- `&&` means **and**: all of them must be true.
- `!booted` means "hasn't happened yet," and then we set `booted = true`, so it only plays **once per launch**.
- `setTimeout(..., 1500)` waits 1.5 seconds so the app finishes appearing first.

Inside `bootBriefing()`:
- **Greeting:** `h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : ...` is a chain of if/else written short.
- **Weather:** `fetch('https://wttr.in/?format=%t|%C&u')` asks a free weather site for "temperature|condition" in °F. `AbortSignal.timeout(2500)` gives up after 2.5 seconds so Nora is never slow to start. `try { } catch { }` means "if anything breaks, skip it quietly."
- **List:** `listItems()` is Roamies' own to-do reader. `.filter((i) => !i.done)` keeps only unfinished items.
- **`speakLine(...)`** is Roamies' function that shows a line in her speech bubble **and** says it out loud.

---

## Chapter 7: Making the app yours (`tauri.conf.json`)

**Like you're 5:** `tauri.conf.json` is the app's ID card: its name, its ID number, its picture and where it checks for updates.

```json
"productName": "Nora",                     // the name Windows shows
"identifier": "com.jusarcadian.nora",      // a unique ID, written as a reversed web address
"createUpdaterArtifacts": false,           // don't make signed update files (that needs a secret key)
"endpoints": ["https://github.com/JusArcadian/Roamies/releases/latest/download/latest.json"]
```
- **identifier:** Windows keeps each app's settings in a folder named after its ID. New ID = new folder, which is why setup runs again. It also means Nora and the official Roamies can't mix up each other's settings.
- **endpoints:** where the app asks "is there a new version?" Before, it asked Ken's GitHub, so an update would have replaced Nora with Roamies. Now it asks yours. Later you can publish your own updates there.
- **JSON rule:** real JSON files can't have `//` comments. They're only in this guide to explain.

**Why the built program is still `roamies.exe`:** that name comes from `Cargo.toml` (Rust's project file), not from `productName`. Changing it would also mean renaming the voice and hands helpers, so we leave it for now.

---

## Chapter 8: How Nora learns your way of talking

**Like you're 5:** after you chat, a second, quiet AI reads the conversation and writes sticky notes about you ("Terrence says 'run it back' to mean try again"). Next time, Nora reads the sticky notes first.

That quiet AI's instructions live in `brain.mjs` (`FACT_RULES`). We added one thing to its list of what to remember:
```js
"...and how they talk: slang, nicknames for things and phrases they use, with what they mean"
```
And in Nora's main instructions (`sidekick.mjs`) we told her how to use it: understand from context, ask once if it really matters, assume the speech recognition misheard if a request sounds garbled, and keep her own voice.

**Bug we hit and fixed:** the first version said `can't` and `don't` inside text wrapped in `'single quotes'`. The apostrophe in "can't" *ended* the text early, and the rest looked like broken code (`SyntaxError: Unexpected identifier 't'`). Fix: write "cannot" and "do not", or use different quotes. `node --check file.mjs` catches this before you run anything.

---

## Chapter 9: Measuring speed (before making it faster)

**Like you're 5:** before you try to run faster, you need a stopwatch. Otherwise you can't tell whether a change helped.

```js
const t0 = performance.now();                       // start the stopwatch
const audio = await tts.generate(text, { voice });  // the slow part
const ms = performance.now() - t0;                  // stop it: milliseconds taken
```
- **Real-time factor (the "x" number)** = time to make the audio ÷ length of the audio. 0.2x means 1 second of speech took 0.2 seconds to make. Above 1.0x, she can't talk as fast as she thinks, and you hear gaps.

**Where Nora's delay comes from (her "latency budget"):**
1. **Ears:** hearing "Hey Nora" (Whisper), measured in the voice window
2. **Speech-to-text:** your question → text (Parakeet, inside the app)
3. **Brain:** Claude thinks and starts answering. This is usually the biggest part, and depends on the model
4. **Mouth:** Kokoro makes the first sentence, measured in the voice window

Fix the biggest number first.

**Why Nora said she had no wake word:** she can only "see" what's in her instructions and the files she reads. Her wake word runs in a *separate* program (`nora-voice`), so we told her where it is.

---

## Chapter 10: Why the fan broke hands-free (and the noise floor fix)

**Like you're 5:** hands-free mode waits for you to be quiet before sending your question. But it thought the fan humming was *you still talking*, so it waited forever.

**How loud is "loud"?** The helper turns sound into a number from 0 to 1:
```rust
let level = ((20.0 * rms.log10() + 55.0) / 40.0).clamp(0.0, 1.0);
```
- `20 × log10(rms)` converts loudness to **decibels (dB)**, the scale your ears actually use.
- About -55 dB becomes 0 (silence), and -15 dB becomes 1 (loud speech).
- Ken's code said: **above 0.2 = voice.** A fan or AC can sit above 0.2 all the time.

**The fix: a noise floor** (the room's normal hum), learned live:
```rust
if v < self.noise_floor { self.noise_floor = v; }                 // quieter? that's the new floor, right away
else { self.noise_floor += (v - self.noise_floor) * 0.0015; }     // louder? creep up v e r y slowly
if v > (self.noise_floor + ABOVE_FLOOR).max(0.2) { self.voice_at = now; }   // voice = clearly above the hum
```
- **Drops fast, rises slow:** a steady fan becomes the floor within seconds, but your speech is too short and bumpy to raise it much.
- `ABOVE_FLOOR = 0.15` is about 6 dB, roughly "noticeably louder than the room."
- `.max(0.2)` keeps Ken's old rule as a minimum, so quiet rooms behave exactly as before.

**Rust words:** `f64` is a decimal number. `self.` means "this helper's own variable." `const` is a value that never changes.

**Why this needs a rebuild:** Rust is **compiled**, meaning turned into an `.exe` ahead of time. JavaScript (the brain) is read as it runs. `./build.sh dev` rebuilds the voice helper every time.

---

## Chapter 11: Settings files, GPU fallback and adding a tool

### Settings in a file (`settings.json`)
**Like you're 5:** instead of changing code to flip a switch, you flip it in a small note the program reads when it starts.
```json
{ "headphones": true, "gpu": true }
```
```js
export const SETTINGS = { headphones: false, gpu: true, ...saved };
```
- `...saved` ("spread") means: start with the defaults, then let whatever's in the file win.
- A typo in the file? `try/catch` ignores it and uses the defaults, so Nora still starts.

### Try the GPU, fall back to the CPU
```js
try { return await load({ device: 'dml', dtype: 'fp32' }); }   // GPU (DirectML = Windows' way to use any GPU)
catch { /* didn't work */ }
return await load({ device: 'cpu', dtype: 'q8' });              // CPU, smaller "q8" model
```
- **dtype:** how precise the model's numbers are. `fp32` is full precision (bigger). `q8` is squeezed to 8 bits (smaller and faster on a CPU, slightly lower quality).
- This **fallback pattern** is everywhere in real software: try the best option, and have a safe plan B.

### How Nora gets a new skill (a "tool")
Every tool in `tools.mjs` has 4 parts:
```js
{
  name: 'status_report',                        // what the AI calls it
  description: "Nora's systems check ...",      // tells the AI WHEN to use it (this matters most!)
  parameters: z.object({}),                     // what info the AI must give (none here)
  execute: async () => statusReport(),          // the code that actually runs
}
```
The AI reads the **description** and decides on its own when to call the tool. Good descriptions = smart tool use.

**Inside `statusReport()`:**
- **CPU %:** take two snapshots of "busy time" half a second apart. Busy ÷ total = how hard the CPU is working.
- **GPU:** runs `nvidia-smi`, NVIDIA's own command-line tool, and reads its comma-separated answer.
- **Internet:** times a tiny request to `1.1.1.1` (Cloudflare). That's the round trip in milliseconds.
- **Voice check:** asks `http://127.0.0.1:3900/health`, the same "are you alive?" door Roamies uses.

### Opening the app from the voice server (v0.4.1)
```js
if (SETTINGS.openApp && existsSync(APP)) spawn(APP, [], { detached: true, stdio: 'ignore' }).unref();
```
- `existsSync(APP)` asks "is the app actually built?" first, so it never crashes on a missing file.
- `export const APP` in `wake.mjs` **shares** the app's path with `server.mjs`, so it's written once and used in two places. If the path ever changes, you fix it in one spot.
- If Nora's already open, Roamies' "single instance" rule makes Windows bring up the open one instead of starting a second copy.

---

## Chapter 12: Debugging "Hey Nora" (reading the clues)

**Like you're 5:** when something doesn't work, don't guess. Add lights that show what each step is doing, then look at which light never turns on.

What the debug lines told us:
| Clue | What it proved |
|---|---|
| `mic level 4942` vs `talking starts at 697` | The **mic was fine**: your voice was 7× louder than needed |
| `phrase heard (1.2 s), reading it...` | The **"is someone talking?" step was fine** |
| `Could not read that phrase: token_ids must be a non-empty array` | The **speech-to-text step crashed** |
| `skipped a phrase (still busy)` | It was also **too slow**, so later tries were thrown away |

So the bug was in one step only: Whisper on the GPU. Moving it to the CPU fixed it.

**Lesson: faster hardware isn't always faster.** The GPU path (DirectML) supports some AI models better than others. Kokoro (one simple pass) runs great there. Whisper (an encoder plus a decoder that loops word by word) broke. Always **measure**; don't assume.

**Lesson: catch errors in background work.**
```js
check(frames).catch((e) => console.error('...', e.message)).finally(() => { thinking = false; });
```
Without `.catch`, one bad phrase could crash her whole ears. With it, she logs the problem and keeps listening.

---

## Chapter 13: One-breath commands (and a secret key)

**Like you're 5:** before, "Hey Nora" only rang her doorbell, and then she opened the door to listen. But you'd already said your question while she was walking to the door. Now her ears **write your question on a note and slide it under the door**.

**Step 1: split the sentence** (`wake.mjs`):
```js
const m = WAKE.exec(text);                                  // find "Hey Nora" inside "Hey Nora, systems check."
const command = text.slice(m.index + m[0].length)           // keep everything AFTER it → ", systems check."
                    .replace(/^[\s,.!?]+/, '').trim();       // drop the leading comma and space → "systems check."
```
- `exec` returns *where* the match is (`m.index`) and *what* matched (`m[0]`).
- `slice(start)` means "from here to the end."
- If there's no real command left (fewer than 3 letters), it opens the mic like before.

**Step 2: send it to her brain** with a web request to a door only on this PC:
```js
fetch('http://127.0.0.1:3901/say', { method: 'POST', headers: { 'x-nora-key': key }, body: JSON.stringify({ text }) })
```
**Step 3: the brain receives it** (`sidekick.mjs`) and treats it exactly like something you said out loud: `onSpoken(text)`.

### Why the secret key? (cyber lesson)
Any program on your PC can talk to `127.0.0.1`. Without a key, malware could tell Nora "open this site" or "run this command." So:
1. Every time the app starts, it makes a random key: `randomBytes(24).toString('hex')` (48 random characters).
2. It saves the key in a file only your user account can read: `~/.nora/ears-key`.
3. The door rejects any request without that exact key (`403 Forbidden`).

This is called **authentication**: proving who's knocking. Real home-automation and API tokens work the same way.

### Falling back *while running* (v0.5.1)
Loading on the GPU worked, but one of Kokoro's steps (`ConvTranspose`, which stretches sound data out) crashed for some sentences. Checking at startup isn't enough, so now each sentence has its own plan B:
```js
try { return await tts.generate(text, { voice }); }        // try (GPU)
catch (err) {
  if (onCpu) throw err;                                     // already on the CPU? then it's a real error
  tts = await KokoroTTS.from_pretrained(..., { device: 'cpu', dtype: 'q8' });   // swap to the CPU
  onCpu = true;
  return tts.generate(text, { voice });                     // say it again
}
```
**Lesson:** "it loaded" doesn't mean "it works for every input." Plan B has to cover runtime too.

---

## Glossary

| Word | Simple meaning |
|---|---|
| Fork | Your own copy of someone's GitHub project |
| Sidecar | A helper program running next to the main app (Nora's brain) |
| Node.js | Lets JavaScript run outside a browser |
| Tauri | Builds desktop apps from Rust + web pages |
| Template string | Text with `${blanks}` that get filled in |
| Port | A numbered "door" on a computer that programs listen at |
| WebSocket | A connection that stays open for live back-and-forth |
| TTS | Text-to-speech |
| Wake word | A phrase that makes an assistant start listening |
| RMS | A way to measure how loud a slice of sound is |
| Regex | A pattern for matching text |
| Identifier | An app's unique ID; Windows stores its settings by it |
| Noise floor | The normal background loudness of a room |
| Decibel (dB) | The loudness scale ears use; +6 dB sounds about twice as loud |
| Compiled | Turned into an .exe before running (Rust); JavaScript isn't |
| DirectML | Windows' way to run AI on any GPU |
| Fallback | A plan B used when plan A fails |
| Tool (AI) | A function the AI can decide to call, like status_report |
| Authentication | Proving who's making a request (like a secret key) |
| 403 Forbidden | A server's way of saying \"you're not allowed\" |
| Latency | The delay between asking and getting an answer |
| Endpoint | A web address a program calls for something (like updates) |
| SyntaxError | Code typed in a way the computer can't read |
| Speech-to-text | AI that writes down what you said (Whisper) |
