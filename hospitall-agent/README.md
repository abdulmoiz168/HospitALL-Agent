# HospitALL Local Sandbox

This is a local, safety-first scaffold for the HospitALL clinical guidance agent described in `../PRD.md`. It uses Next.js for the UI and Mastra for orchestration, with deterministic engines handling triage, medication checks, and report interpretation.

## What this build includes

- **Single chat UI** that routes all workflows through one backend agent
- **PHI guard** (local regex-based redaction + structured feature extraction)
- **Deterministic engines** for triage, prescription safety, and report interpretation
- **Mastra workflows** that chain guard -> engine -> (optional) LLM narration

## Run locally

1. Install dependencies (already installed in this workspace):

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

- Set `OPENAI_API_KEY` or `GEMINI_API_KEY` if you want the optional narration.
- Set `HOSPITALL_USE_LLM=1` to enable natural routing in chat.
- For Gemini 3 preview, set `HOSPITALL_LLM_MODEL=models/gemini-3-pro-preview`
  (the app will normalize it to the Google provider).

3. Start the app:

```bash
npm run dev
```

Open http://localhost:3000 to use the chat UI.

The chat stores a local `sessionId` in browser storage to preserve memory between turns.

### Optional: Mastra Studio

To inspect workflows in Studio:

```bash
npm run mastra:dev
```

Studio runs at http://localhost:4111 and exposes REST endpoints for agents and workflows.

## API Endpoints

- `POST /api/chat` (streaming NDJSON)
- `POST /api/triage` (legacy deterministic endpoint)
- `POST /api/rx` (legacy deterministic endpoint)
- `POST /api/report` (legacy deterministic endpoint)
- `POST /api/report/upload` (multipart upload for OCR + parsing)

Example chat payload:

```json
{
  "message": "Severe chest pain and shortness of breath",
  "sessionId": "local-session-id"
}
```

## Notes

- This sandbox is **guidance only** and does not diagnose or treat.
- The deterministic engines are placeholders; swap in real clinical datasets and rules before production.
- OCR runs locally on the server and returns extracted text for verification before analysis.
- Patient documents are not embedded or sent to external services in this build.
