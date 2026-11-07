# GD room UI

Implemented locally on 27 October 2026 at `/gd/dev` (and the compatible `/gd` entry route).

## Experience

- Dark meeting room with Spectakles branding, responsive participant tiles and actual played-audio speaking indicators.
- Preparation has a separate notes space and synchronized countdown. The ordinary ready action follows the selected template's preparation-skip policy. Start discussion is the single preparation action on all screen sizes.
- The meeting toolbar has audio settings, optional captions, private notes, participant list, full screen and End discussion.
- Speech remains hands-free. There is no push-to-talk or mute control.
- Microphone selection is available before a round; changes are locked during capture. Enable microphone requests permission and discovers devices without recording.
- End/Leave opens a native dialog. Cancel keeps the session running. End & leave waits for the session's terminal state before navigation.
- Finish and error screens offer a fresh round and the existing protected discussion-record download.
- Developer clocks, developer preparation bypasses, standalone test diagnostics and raw recording lists are absent from this screen. No developer control is sent by this UI.
- Existing discussion transport, VAD, per-utterance recordings, provider scheduling and timing rules are retained. Participant tiles use initials; video is still a future capability.
- Notes stay in page memory, are never included in discussion messages, and clear for a fresh round or when leaving.

## Checks completed

- `npm run typecheck`: passed.
- Focused ESLint for GD.tsx and src/gd-room/: passed without warnings.
- `npm run test:gd-audio`: all 71 tests passed.
- `npm run test:gd-room`: all 6 tests passed. Covers absence of developer controls, preparation policy, speaker indicators tied to played audio, optional and safely rendered captions, panel sizes and finished/error states.
- Production build: passed. Existing bundle-size and Browserslist notices remain.
- Actual GD hooks in the existing synthetic-microphone browser fixture against an isolated controlled-provider backend: preparation -> ready -> live speech -> interruption -> captions -> notes retained -> cancel End -> End -> new round -> End & leave. No Gemini calls or hardware microphone capture in QA.
- Saved controlled sessions ended with status complete; the speech clip is mono PCM16, 16 kHz, 109,568 samples. Preparation-only round had no transcript turns.
- Visual fixtures: idle, preparation, active, closing, finished and error; 2, 3 and 5 AI panelists. Responsive checks at 1280x720, 1024x768 and 390x844. Full screen entry/exit and notes focus/Escape return verified in the browser.

This UI pass does not establish a new real-provider audio-quality result or physical-headset result. The earlier known interrupted-caption prefix limitation is unchanged.

## Try it

With your existing Auth/Firestore emulator, Python backend and Vite server running:

1. Open http://127.0.0.1:5173/gd/dev and sign in if asked.
2. Under Audio, use Find microphones if needed and choose the intended input. Select Prepare.
3. Write a few private notes; select Start discussion. The selected template can require waiting for the timer instead.
4. Speak and interrupt naturally. Toggle captions and reopen Notes to check your preparation notes.
5. Use End discussion, cancel once, then confirm. Start a new round to verify notes clear.

`tests/gd-room-browser.html` is an explicit visual fixture; `tests/gd-discussion-browser.html` is the existing controlled microphone fixture. Neither is a product route or a fake-provider switch in the product. The production build includes the application entry only.

## Copy and legibility update — 27 October 2026

Preparation now uses one notes column and one Start discussion button. Removed
the large slogan, duplicate start/end actions during preparation, and repeated
instructions. Notes and instructional copy use 16px text; room metadata has a
12px minimum. Website body copy and forms use the same reading scale, including
Home, About, FAQ, workspace and the waitlist form. Graphic illustration internals
retain their own scale. The FAQ now has twelve focused questions.

Verification: 71 audio tests, 6 room tests and the workspace permission regression
passed (78 total). The room regression checks that preparation renders exactly one
Start discussion action and that required preparation cannot be skipped. TypeScript,
focused lint and the production build passed. Browser checks confirmed the single
action, preserved notes, actual computed font sizes, FAQ interaction, waitlist form
and phone navigation. No real model calls or hardware microphone capture were used.
