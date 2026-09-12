# QuickVoiceClip TTS

A small text-to-speech web application using Cloudflare Pages and the Workers AI MeloTTS model. It includes an English text editor, server-side input validation, browser audio playback, and a download link whose extension matches the returned audio bytes.

The hosted implementation is available at [QuickVoiceClip](https://quickvoiceclip.com/).

## Data flow

Browser text -> same-origin `/api/tts` -> Cloudflare Workers AI -> audio response -> browser playback and download.

Your text is sent to Cloudflare Workers AI to generate speech. Audio playback takes place in your browser. This project does not promise provider-side deletion, absence of logs, or a retention period.

## What is reusable

- `public/_worker.js`: validates input, invokes MeloTTS through an AI binding, and checks the response signature before labeling WAV or MP3 audio.
- `public/app.js`: shared generation, loading, error, playback, and download UI.
- `public/style.css`: responsive editor and audio-result styling.
- `test/worker.test.mjs`: isolated tests for invalid input, cross-origin requests, WAV/MP3 headers, and upstream failure handling. These tests do not contact Cloudflare or generate real speech.
- `docs/voiceover-checklist.md`: a review checklist for preparing and checking a short voiceover.

## Run and deploy

Use a current Node.js release supported by Wrangler and your own Cloudflare account with Workers AI access.

```sh
npm install
npm test
npx wrangler login
npx wrangler pages project create quickvoiceclip-tts --production-branch main
npm run deploy
```

Choose another project name if that name is unavailable, and update `name` in `wrangler.jsonc` accordingly. The `AI` binding in that file connects the Pages Worker to Workers AI. Upload only `public/`; never place credentials inside that directory.

Opening the HTML alone does not provide speech generation: `/api/tts` needs the Cloudflare Worker and its AI binding. Inference uses your Cloudflare quota. Review [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) and your account plan before invoking the model; this project is not a spending cap for paid accounts.

## API

Send `POST /api/tts` with `Content-Type: application/json`:

```json
{"text":"A short script for a new video."}
```

The application limit is 1,000 Unicode code points after trimming server-side. This is a product design limit, not a claimed model limit. English is selected through `lang: "en"`.

A successful response contains WAV or MP3 bytes with a matching MIME type and download filename. Invalid input produces a JSON error. The model documentation describes MP3, but the hosted implementation has also received RIFF/WAVE audio; the code checks the bytes rather than assuming the extension.

## Limits

No voice cloning, selectable character library, uploaded-file conversion, batch generation, or offline synthesis is implemented. These are not official TikTok voices. Origin checks are not a complete anti-abuse mechanism: public deployments may need additional rate limiting, depending on their usage and account plan.

## License

Project code is MIT licensed. Bundled Lucide icons retain their ISC and Feather notices in `THIRD_PARTY_LICENSES.txt`. MeloTTS is invoked as a Cloudflare service; no model weights are distributed here. Provider terms and model licensing are separate from this application's license.
