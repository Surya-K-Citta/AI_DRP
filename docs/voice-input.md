# Voice input (microphone on every form box)

Open-source only by default: English is typed out **on the person's device** by Whisper (Apache-2.0), and Telugu goes to **a speech server you host** running the IIT Madras Telugu Whisper models (Apache-2.0). No paid speech service is needed.

## What people see
Every text box on the **Create DPR** forms (individual and cluster) has a small microphone at its right edge; long-answer boxes have it next to the enlarge icon, and the enlarged editor has one in its header. Dates, dropdowns, file pickers and read-only boxes have none.

Tap the microphone, say the answer, pause. It stops by itself after about 1.8 s of silence (or 28 s), turns red while listening, and the words appear in the box. Tap again to finish early; **Esc** cancels. Only one microphone listens at a time.

| Box | What lands in it |
|---|---|
| One-line text | The spoken words, replacing what was there (say it again to redo). A full stop added to a short answer is dropped. |
| Long answer | Added after what is already written. |
| Number | Digits only. "twelve lakh fifty thousand", "₹ 12,50,000", "12.5 lakh", Telugu numerals and number words all work. In a box whose label says *lakh*, "twelve lakh fifty thousand" becomes 12.5. |
| PAN, GSTIN, Udyam, IFSC, PIN, mobile, e-mail | No spaces, capitals, spoken digits as digits, "double four" = 44; e-mail understands "at" and "dot". The box's own checks then run as if it had been typed. |

## Which engine runs
| Screen language | Engine | Where the audio goes |
|---|---|---|
| English | **On the device**: `onnx-community/whisper-base.en` through Transformers.js (ONNX Runtime Web, WebAssembly) | Nowhere. Not uploaded. The model (about 77 MB) downloads on first use, is cached by the browser, then works offline. |
| English, if the device cannot run it | Our server (below) | Only with **AI assist** on in Privacy settings |
| Telugu | Our server: self-hosted speech server first, then Sarvam if configured, the Hugging Face Telugu Whisper, OpenAI Whisper | Only with **AI assist** on |

First use shows a short notice (what is downloaded, or that the voice is sent for typing). A recording with no speech is dropped before anything is done with it. The server records an audit event per call (provider and model, never the audio or text). `AI_ALLOW_AUDIO=false` switches server transcription off.

### Measured here (headless Chrome, WebAssembly, no GPU)
A spoken English sentence with two Telugu place names:
| Model (q8) | Download | Time to type 7 s of speech | Result |
|---|---|---|---|
| `whisper-base.en` (default) | 77 MB | 2.4 s | "We make mango pickles intennally and sell them across Gunter District" |
| `whisper-small.en` | 249 MB | 8.3 s | "…pickles internally and sell them across Gunter district" |

Both get ordinary English right and **stumble on Telugu place and person names** ("Tenali" → "intennally", "Guntur" → "Gunter"). The bigger model did not fix that and is 3× the download and 3.5× slower, so the default stays at `base.en`. People can correct a word by typing. Later options: a vocabulary hint, or an Indian-English model. Other model options: `whisper-tiny.en` (41 MB, fastest, least accurate), `distil-small.en` (172 MB).

Build-time settings (client): `VITE_VOICE_LOCAL=false` (always use the server), `VITE_VOICE_EN_MODEL=<onnx repo>`, `VITE_VOICE_MODEL_HOST=<your host>` to serve model files yourself instead of huggingface.co. By default the browser also loads the ONNX Runtime WebAssembly file from cdn.jsdelivr.net; for an offline or locked-down site, host those files and the model on your own domain.

## Telugu: what exists, open source
| Model | Licence | Notes |
|---|---|---|
| `vasista22/whisper-telugu-{tiny,base,small,medium,large-v2}` (IIT Madras) | Apache-2.0 | Whisper fine-tunes on Indian speech corpora. `small` self-reports 11.6 % WER on FLEURS Telugu, `tiny` 17.2 % (self-reported). `large-v2` is called open state of the art on an entity-dense Telugu test in a May 2026 paper. **Recommended.** |
| `ai4bharat/indic-conformer-600m-multilingual` | MIT | 600 M parameters, Telugu supported, CTC and RNNT decoding. Gated download (accept terms on Hugging Face). No Telugu WER published on the card. Needs PyTorch. |
| Vosk `vosk-model-small-te-0.42` | Apache-2.0 | 58 MB, but 87.9 % WER on FLEURS. Not usable for this. |

No ready-made in-browser (ONNX) Telugu Whisper exists, so Telugu is served from a server. Converting `vasista22/whisper-telugu-base` to ONNX for the browser is possible (`optimum-cli export onnx`, then quantise), but I have not done or tested it.

### Hosting the Telugu model (not tested end to end here)
Run any server with the OpenAI `/v1/audio/transcriptions` API. One option is [speaches](https://github.com/speaches-ai/speaches) (MIT, faster-whisper based, CPU or GPU). It needs the model in CTranslate2 format. Convert the official model once:

```
pip install ctranslate2 transformers
ct2-transformers-converter --model vasista22/whisper-telugu-small --output_dir whisper-telugu-small-ct2 \
  --copy_files tokenizer.json preprocessor_config.json --quantization int8
```
Host the folder where your speech server loads models from (see its documentation for the exact layout), then set on the API server:
```
STT_SERVICE_URL=http://stt:8000
STT_MODEL_TE=<the model name your speech server exposes for it>
```
Community CTranslate2 conversions exist on Hugging Face (for example `kavithajohn/whisper-telugu-medium-ct2`), but converting the official model yourself is safer. Check that the Telugu output is in Telugu script. A `small` model on CPU should transcribe a 10 s answer in a few seconds; confirm on your hardware.

I tested the API server's client side against a mock of this endpoint, not against a live speech server or the real Telugu model.

## Optional paid fallback
Sarvam AI (`SARVAM_API_KEY`) is still supported and used after the self-hosted server when set, but is off unless configured. It is not needed for the open-source setup.

## Where it lives
Client: `components/ui/MicButton.tsx` (button and flow), `VoiceContext.tsx` (turns it on for a form), `Input.tsx` and `ExpandableField.tsx` (place it), `lib/voice/localWhisper.ts` (on-device model), `recorder.ts`, `spokenValue.ts` (cleaning, unit tested). Server: `services/open-stt.service.ts`, `sarvam-stt.service.ts`, `OpenAIService.transcribeAudio`.
