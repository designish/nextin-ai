# NextIn

NextIn is a conversational, voice-assisted AI opportunity agent for experienced professionals who are retiring, recently retired, or deciding how they want to contribute next.

## What the MVP does
- Speak or type naturally
- AI remembers context and avoids repeating questions
- Builds a structured Experience Profile
- Separates stated facts from inferred strengths
- Recommends only opportunities from a fixed structured dataset
- Explains why an opportunity fits
- Supports English (India), Hindi and Marathi
- Voice messages are transcribed before sending so the user can correct them
- Optional spoken AI replies
- Generates a professional introduction when the user is interested
- Simulates a safe send-interest / connection state

## Architecture
Frontend: static HTML/JS in `public/index.html`

Serverless API routes:
- `api/chat.js` — conversational AI + profile extraction + recommendations
- `api/transcribe.js` — voice transcription
- `api/speak.js` — spoken AI replies
- `api/health.js` — backend/API-key health check

Hosting: Vercel

AI: OpenAI API

## Environment variables
Add these in Vercel Project Settings → Environment Variables:

`OPENAI_API_KEY=...`

Optional:

`OPENAI_MODEL=gpt-4.1-mini`

Never commit a real API key to GitHub.

## Product principle
Low friction to discover, higher trust as commitment increases. AI-generated profiles are representations, not proof. Inferred skills require user confirmation.
