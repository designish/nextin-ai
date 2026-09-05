# NextIn AI v2

## What changed
This version uses a real backend instead of browser-only rules.

- Real AI conversation via OpenAI Responses API
- Conversation context retained in the browser session
- Structured Experience Profile
- Voice message recording with MediaRecorder
- Audio transcription via gpt-4o-mini-transcribe
- Optional spoken AI replies via gpt-4o-mini-tts
- English (India), Hindi, Marathi UI language selection
- AI can recommend only from a fixed synthetic opportunity dataset
- Inferred skills remain separate until the user confirms them
- Reset genuinely clears the session

## You need an API key
A ChatGPT subscription and OpenAI API billing are separate. Do not put your API key in frontend code.

## Run
1. Install Node.js 20+
2. In this folder run: npm install
3. Copy .env.example to .env
4. Add your OPENAI_API_KEY
5. Run: npm start
6. Open http://localhost:3000
7. Allow microphone permission

## Why localhost
Microphone APIs require a secure context. localhost qualifies, while simply opening an HTML file often does not.

## Later
For true continuous speech-to-speech, migrate the voice layer to the OpenAI Realtime API over WebRTC. Keep the structured profile and opportunity matching architecture.
