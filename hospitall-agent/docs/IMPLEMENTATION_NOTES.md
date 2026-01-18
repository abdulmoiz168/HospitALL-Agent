# HospitALL PRD -> Local Sandbox Mapping

## Safety Sandwich (implemented)

- **PHI Guard:** `mastra/guards/phi-guard.ts` redacts direct identifiers and derives structured features.
- **Deterministic engines:**
  - Triage: `mastra/engines/triage-engine.ts`
  - Red flags: `mastra/engines/red-flag-engine.ts`
  - Rx safety: `mastra/engines/drug-engine.ts`
  - Report analysis: `mastra/engines/report-engine.ts`
- **OCR upload (local):** `app/api/report/upload/route.ts` for PDF/text extraction and image OCR.
- **LLM narrator (optional):** `mastra/agents/*-narrator.ts` (disabled by default unless `HOSPITALL_USE_LLM=1`).
- **Router agent:** `mastra/agents/hospitall-router.ts` orchestrates workflows through tools for chat.
- **Memory:** `@mastra/memory` keeps multi-turn context via `sessionId`-scoped threads.

## Workflows

- **Triage:** `mastra/workflows/triage-workflow.ts`
  - Guard -> red flags -> deterministic decision -> citations -> safe output
  - Emergency circuit breaker outputs `system_action = emergency_circuit_breaker`

- **Prescription safety:** `mastra/workflows/rx-workflow.ts`
  - Normalization + interaction checks -> deterministic issue list

- **Report interpretation:** `mastra/workflows/report-workflow.ts`
  - Parse verified values -> compare to reference ranges -> safe summary

## Local UI

- `/` and `/chat` -> unified chat experience (router agent)
- `/triage`, `/prescription`, `/report` -> legacy single-flow pages

## Chat Streaming

`/api/chat` returns NDJSON stream (`type: chunk` / `type: done`) consumed by the chat UI.

## Production Hardening TODO (per PRD)

- Replace regex PHI guard with robust ML + policy proxy; add tokenization and TTL token maps.
- Wire RxNorm/RxCUI normalization to RxNav (or licensed normalization API) and interactions to a vetted dataset.
- Implement OCR with mandatory human verification UI before analysis.
- Add tenant-scoped RAG with versioned, approved clinical KB and citation verification.
- Implement audit logging (ops + legal log separation) and deletion workflows.
- Add threat-model mitigations: injection-safe tool outputs, allowlists, schema validation.
- Create golden + adversarial datasets and evals pipeline before production.
