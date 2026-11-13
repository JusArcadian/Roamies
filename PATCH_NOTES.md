# ATLAS (Nora) Patch Notes

Your fork of Roamies, turned into Nora. Newest changes at the top.
Backups of the files before each change are in `backups/`.

---

## v0.5.1 "Never silent" (2026-11-13)

### Bugs
- **Fixed: her voice could fail on some sentences on the GPU** (`Failed to speak: ... ConvTranspose ... DmlExecutionProvider ... The parameter is incorrect`). Now, the first time the GPU fails, her voice switches to the CPU for the rest of the session and repeats that sentence, so she never goes silent.

### Files changed
- `nora-voice/server.mjs`

### Backup
- `backups/2026-11-13_11-voice-gpu-fallback/`

---

## v0.5 "One breath" (2026-11-13)

### Features
- **One-breath commands:** "Hey Nora, systems check" / "Hey Nora, what time is it?" now works in a single sentence. Her ears send whatever comes after "Hey Nora" **straight to her brain**: no second listening step, faster answers, and it interrupts her if she's talking.
- "Hey Nora" on its own still opens the mic like before.

### Security
- Her ears talk to the app through a tiny local door (`127.0.0.1:3901`) that only accepts a **secret key** made fresh every time the app starts (saved in `~/.nora/ears-key`). Other programs can't send Nora commands.

### Confirmed working (from your test)
- Wake word: `Heard: "Hey, Nora." in 370 ms` (ears on the CPU).

### Files changed
- `showcase/tauri/sidecar/sidekick.mjs` (local door + key), `nora-voice/wake.mjs` (splits off the command, sends it)

### Backup
- `backups/2026-11-13_10-one-breath-commands/`

---

## v0.4.2 "Ears fixed" (2026-11-13)

### Bugs
- **Fixed: "Hey Nora" never worked.** Her ears' speech model (Whisper) crashed on the GPU (`token_ids must be a non-empty array`) and was so slow it skipped your next tries (`still busy`). Her ears now run on the **CPU** (`"earsGpu": false`); her voice (Kokoro) stays on the GPU, where it works.
- **Fixed:** an error while reading a phrase could silently kill her ears. Now it's logged and she keeps listening.

### Features
- **Debug mic meter:** `start-nora-voice-debug.bat` prints `mic level | room hum | talking starts at` every 2 s, plus each phrase heard or skipped and why.

### Files changed
- `nora-voice/wake.mjs`, `nora-voice/settings.mjs`, `nora-voice/settings.json`

### Backup
- `backups/2026-11-13_08-ears-debug/`, `backups/2026-11-13_09-ears-on-cpu/`

---

## v0.4.1 "One click" (2026-11-13)

### Features
- **One-click start:** double-click `start-nora-voice.bat` and, once her voice is ready, **Nora's app opens by itself**. Turn it off with `"openApp": false` in `nora-voice/settings.json`.

### Notes from the first v0.4 run
- Voice and ears both run on the **GPU (DirectML)**; mic: Yeti Classic.
- `[W:onnxruntime ...] Some nodes were not assigned...` is harmless: small steps run on the CPU on purpose.

### Files changed
- `nora-voice/server.mjs`, `nora-voice/wake.mjs`, `nora-voice/settings.mjs`, `nora-voice/settings.json`

### Backup
- `backups/2026-11-13_07-one-click-start/`

---

## v0.4 "Systems check" (2026-11-13)

### Features
- **"Nora, status report."** New `status_report` tool: CPU %, memory, NVIDIA GPU (temperature, load, video memory), free space, internet speed check, whether her voice/ears are running, and PC uptime. Read-only: it only looks.
- **Interrupt her by voice (headphones mode).** New `nora-voice/settings.json`: `"headphones": true` keeps her ears on while she talks, so "Hey Nora…" cuts in and she stops to listen.
- **GPU mode.** `"gpu": true` runs her voice (Kokoro) and ears (Whisper) on your NVIDIA GPU through DirectML, and falls back to the CPU on its own if that fails. The voice window says which one it's using.
- **Shorter spoken answers** (1–3 sentences unless you ask for detail). Less to say = she finishes faster. ("Balanced" speed.)
- **New `HOME_AUTOMATION_PLAN.md`:** Pi + Home Assistant shopping list, steps and security rules.

### Buffs / Nerfs
- **Buff:** after "Hey Nora", her ears ignore you for 4 s instead of 10 s, so the wake word is ready again sooner.
- **Nerf (first run):** GPU mode downloads the full-size models once (Kokoro ~300 MB).

### Files changed
- `nora-voice/server.mjs`, `nora-voice/wake.mjs`; **new:** `nora-voice/settings.json`, `nora-voice/settings.mjs`
- `showcase/tauri/sidecar/tools.mjs` (status_report), `showcase/tauri/sidecar/sidekick.mjs` (short answers, status hint)
- **New:** `HOME_AUTOMATION_PLAN.md`

### Backup
- `backups/2026-11-13_06-headphones-gpu-status/`

---

## v0.3.2 "Fan-proof ears" (2026-11-12)

### Bugs
- **Fixed: hands-free listening never ended with fans or AC running** (after "Hey Nora" or a quick Ctrl+Alt tap). The voice helper counted *anything* above a fixed loudness as "you're still talking", and fan/AC hum was above that line. It now learns your room's background hum and only counts sound clearly louder than it (about 6 dB) as your voice. Stop talking for 1.5 s and she sends it.

### Files changed
- `showcase/tauri/src-tauri/voice-win/src/main.rs` (Rust: the Windows voice helper)

### Backup
- `backups/2026-11-12_05-noise-proof-pause/voice-win-main.rs`

---

## v0.3.1 "Know thyself" (2026-11-12)

### Features
- **Nora knows where her own code is.** Her instructions now say her code is in `~/ATLAS`, and that her voice and wake word live in `~/ATLAS/nora-voice`. Before, she only saw the app, so she said she had no wake word.
- **Speed meter (voice):** every sentence logs how long Kokoro took, e.g. `420 ms to make 2.1 s of speech (0.20x)`. Under 1.0x means faster than real time.
- **Speed meter (ears):** the wake log now shows how long Whisper took: `Heard: "Hey Nora" in 380 ms`.
- **New `start-nora-voice-debug.bat`:** the same as the normal one, but it also prints *everything* the ears hear, so you can see whether "Hey Nora" is being misheard.

### Files changed
- `showcase/tauri/sidecar/sidekick.mjs`, `nora-voice/server.mjs`, `nora-voice/wake.mjs`
- **New:** `nora-voice/start-nora-voice-debug.bat`

### Backup
- `backups/2026-11-12_04-self-knowledge-and-timing/`

---

## v0.3 "She's mine now" (2026-11-12)

### Features
- **The app is now called Nora** (`productName`), with its own ID (`com.jusarcadian.nora`). It no longer clashes with the official Roamies if both are installed.
- **New Nora icon** (`nora-icon.png`): a glowing cyan HUD core with rings and tick marks. Turn it into app icons with `cargo tauri icon` (see the steps).
- **No more surprise "updates" from Ken.** The update check now looks at *your* GitHub (JusArcadian/Roamies), which has no releases yet, so nothing installs over Nora.
- **Nora learns how you talk.** Her memory now saves your slang, nicknames for things and phrases along with what they mean. She uses them to understand you, asks once if something's unclear, and assumes speech-recognition slip-ups when a request sounds garbled. She keeps her own voice and won't copy your slang.
- She now knows she lives in "Nora, Sir's personal desktop AI, built on Roamies by Ken Kai" (credit kept, as the AGPL license requires).

### Files changed
- `showcase/tauri/src-tauri/tauri.conf.json`: name, ID, updater
- `showcase/tauri/sidecar/sidekick.mjs`: who she is, how to handle your slang
- `showcase/tauri/sidecar/brain.mjs`: memory also learns how you talk
- **New:** `nora-icon.png`

### Bugs
- None known yet.

### Buffs / Nerfs
- **Nerf (one time):** because the app's ID changed, Nora starts fresh: the setup guide runs again and old settings and chat history stay with the old ID. Your Claude sign-in carries over (it lives in `~/.gg`).
- Menus and the settings panel still say "Roamies" in places. That gets fixed in v0.4 with the customization window.

### Backup
- `backups/2026-11-12_03-nora-brand-and-speech/` (+ the old icons: `git checkout -- showcase/tauri/src-tauri/icons` restores Ken's)

---

## v0.2 "Hey Nora" (2026-11-12)

### Features
- **Wake word: "Hey Nora."** Say it, wait for the listening bubble, then talk. No more holding Ctrl+Alt. Runs free and offline (Whisper tiny speech AI + your mic) inside the Nora voice window.
- **Boot-up briefing.** Each time the app starts as Nora: *"Good morning, Sir. All systems online. It's 11:05 AM, 72 degrees and sunny outside. You have 2 items on today's list."* The greeting changes with the time of day (morning, afternoon, evening, late night).
- `start-nora-voice.bat` now checks and installs new packages every time it starts.

### Files changed
- **New:** `nora-voice/wake.mjs` (Nora's ears)
- `nora-voice/server.mjs`: starts the ears; mutes them while Nora talks
- `nora-voice/package.json`: + `@huggingface/transformers`, `@picovoice/pvrecorder-node`
- `nora-voice/start-nora-voice.bat`: always checks packages
- `showcase/tauri/sidecar/sidekick.mjs`: boot-up briefing

### Bugs
- None known yet (first real test is on your PC).

### Buffs / Nerfs
- **Buff:** hands-free talking.
- **Nerf:** say "Hey Nora", *pause*, then your question. Words said in the same breath as "Hey Nora" are missed.
- Weather uses wttr.in, which guesses your city from your internet address. If it's slow or offline, the weather part is skipped.

### Backup
- `backups/2026-11-12_02-before-wake-and-boot/`

---

## v0.1 "Hello, Sir" (2026-11-12)

### Features
- **Nora is born.** The JARVIS character (glowing sphere) is now called **Nora** (Neural Operations & Response Assistant) everywhere: the on-screen name, the setup guide, the settings panel and her own idea of who she is.
- **She calls you "Sir."** Her personality line says she's calm, sharp and quietly witty, and never uses nicknames like Boss, Champ or Cadet.
- **New greeting:** "At your service, Sir."
- **Nora's own voice, free and offline:** new `nora-voice/` folder. It's a small local server that speaks with **Kokoro (af_heart)** on your PC. Roamies talks to it through its existing "VoiceStudio" voice option, so Roamies' voice code didn't need to change.

### Files changed
- `showcase/tauri/sidecar/sidekick.mjs`: name, greeting, personality ("Sir")
- `showcase/roamies/host.js`: on-screen name
- `showcase/panel/panel.js`: settings panel name + greeting
- `showcase/onboarding/onboarding.js`: setup guide name + greeting
- **New:** `nora-voice/server.mjs`, `nora-voice/package.json`, `nora-voice/start-nora-voice.bat`

### Bugs
- None known yet.

### Buffs / Nerfs
- **Buff:** voice costs $0 (Kokoro runs on your PC instead of paid Fish Audio).
- **Nerf:** Kokoro can't act out emotion cues like `[laughing]` the way Fish Audio can, so they're removed before speaking.

### Backup
- `backups/2026-11-12_01-before-nora/` has the 4 original files.
