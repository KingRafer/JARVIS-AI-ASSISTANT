# JARVIS AI Assistant

A calm, futuristic personal AI workspace built with Next.js. Includes text chat, browser speech recognition (where supported), and optional spoken responses.

## Stack
- Next.js 15 + React 19 + TypeScript
- Gemini 2.5 Flash API (server-side; optional until configured)
- Browser Speech Recognition and Speech Synthesis

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Gemini API key.
4. Run `npm run dev` and open http://localhost:3000.

## Environment variables
- `GEMINI_API_KEY`: Gemini API key. Keep it private. Never add it to browser code or commit it to Git.

On Vercel, add this variable under Project Settings → Environment Variables, select Production and Preview, then redeploy.

## Important limitations
This is a web assistant, not a Windows remote-control agent. A browser website cannot freely open local applications, inspect files, or execute system commands. Those capabilities require a separate, permission-based Windows companion app. Speech recognition support and permission prompts depend on the browser and device.
