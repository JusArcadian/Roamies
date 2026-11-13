# Nora Cheat Sheet

Everything you can do with Nora, with the exact keys and phrases. (Nora can read this file too: ask her "read your cheat sheet.")

---

## Talking to her

| What | How |
|---|---|
| **Push-to-talk** | **Hold Ctrl+Alt**, talk, **let go** → she answers. The most reliable way. |
| **Hands-free (keyboard)** | **Tap Ctrl+Alt** once quickly → talk → she sends when you pause. Tap again to send right away. |
| **Wake word** | Say **"Hey Nora"** → *pause* → wait for the bubble → talk. (The voice window must be open.) |
| **Type instead** | **Tap Ctrl+Shift** → a text box opens by your cursor → type → **Enter**. |
| **Interrupt her** | Start talking with **Ctrl+Alt** while she speaks → she stops and listens. |
| **Stop everything** | **Esc**, or say/type "stop". |
| **Circle something** | While holding Ctrl+Alt, **circle a spot on screen with your mouse** → she sees what you mean ("what's this?"). |
| **Keep the conversation going** | Turn on **Auto-listen** (Voice page in the panel): after each answer she listens once more, so you can reply without pressing anything. |

---

## Things to ask her

**Reminders & to-dos**
- "Remind me to call the bank at 3."
- "Every weekday at 9, remind me to check job posts."
- "Every 2 hours remind me to stand up."
- "Show my list." / "Mark the bank call done."
- "I'll finish the Speed Force mod by Friday." (she keeps track of what you said you'd do and nudges you)

**Your screen**
- "How do I export this as an MP4?" → she **rings the exact button** to click, step by step, waiting for each click.
- "Explain this." (about what you're reading) → she **draws answer cards** next to it: diagrams, charts, timelines, 3D models, quizzes.
- "Clear the drawings."

**Apps, files & web**
- "Open Chrome." / "Open my Downloads folder." / "Open youtube.com."
- "Find the file with my resume." / "What's in this folder?"
- "Read [a web page] and summarize it."
- "Type this into Notepad…" (app control: turn it on first in the panel)

**About her**
- "Who are you?" · "Check your wake word code." · "Read your patch notes." · "What do you remember about me?" · "Forget that."

**Teach her your words**
- Say it once: *"When I say 'run it back' I mean try again."* She saves it.
- *"Remember: when I say 'open the Ring display', open account.ring.com in the browser."* This works today for viewing your Ring camera on your PC.

---

## The panel (click Nora's tray icon, bottom-right by the clock)

| Page | What's there |
|---|---|
| **Appearance** | Character (Nora = the sphere), size: Default / Small / Cursor |
| **Voice** | Voice on/off, VoiceStudio → **Nora (af_heart)**, **Auto-listen**, mute other audio while you talk |
| **Model** | Which AI brain (Claude, ChatGPT, Gemini, Ollama for free/offline). Pick a faster model for quicker answers. |
| **Memory** | What she remembers about you; delete anything |
| **Actions / safety** | Turn on file edits, commands, app control (off by default; risky steps always ask) |

---

## Your files (C:\Users\terre\ATLAS)

| File | What it is |
|---|---|
| `nora-voice\start-nora-voice.bat` | **Start this first:** her voice + "Hey Nora" ears |
| `nora-voice\start-nora-voice-debug.bat` | Same, but shows everything her ears hear (for fixing the wake word) |
| `showcase\tauri\src-tauri\target\debug\roamies.exe` | Nora's app |
| `PATCH_NOTES.md` | Every change, by version |
| `STUDY_GUIDE.md` | How everything works, explained simply |
| `backups\` | The files from before each change |

**Rebuild after code changes** (Git Bash): `cd ~/ATLAS/showcase/tauri && ./build.sh dev`
