# Mastra “Supercharge” Notes for HospitALL

Saved for later: high‑impact Mastra features that can materially improve a medical triage agent beyond the current build. This is based on the Mastra docs (MCP) and mapped to our product needs.

Date: 2026-01-12

## Highest‑impact gaps (recommended priority)

1) Guardrails via processors  
   - Why: Central, consistent PHI/PII filtering + safety validation across every agent/tool call.  
   - What: Input/output processors such as `PIIDetector`, moderation, response validators.  
   - Docs: `agents/guardrails.mdx`, `reference/processors/pii-detector.mdx`

2) Memory with clinical context  
   - Why: Make the agent feel clinically aware (age band, conditions, meds) without re‑asking.  
   - What: Working memory (resource‑scoped), conversation history, semantic recall.  
   - Docs: `memory/overview.mdx`, `memory/working-memory.mdx`, `memory/conversation-history.mdx`, `memory/semantic-recall.mdx`

3) Human‑in‑the‑loop workflows  
   - Why: Required for safe triage review, OCR verification, and emergency overrides.  
   - What: Suspend/resume workflows for explicit user confirmation.  
   - Docs: `workflows/suspend-and-resume.mdx`

4) Evals + Scorers  
   - Why: Best‑in‑class triage requires measurable recall/precision + safety tests.  
   - What: Scorers for emergency recall, hallucination checks; eval suites for regression testing.  
   - Docs: `scorers/overview.mdx`, `reference/scorers/create-scorer.mdx`, `reference/evals/overview.mdx`

5) Observability + AI tracing  
   - Why: Clinical systems need auditability, failure analysis, and drift monitoring.  
   - What: AI tracing, logging, and run‑level metadata.  
   - Docs: `observability/overview.mdx`, `observability/logging.mdx`

## Additional high‑leverage capabilities

6) Agent networks + tool routing  
   - Why: Isolate triage/rx/report logic into specialized sub‑agents for accuracy and control.  
   - Docs: `agents/networks.mdx`

7) RuntimeContext for policy / tenant control  
   - Why: Per‑tenant safety rules, locale‑specific escalation, clinician on‑call logic.  
   - Docs: `server-db/runtime-context.mdx`

8) AI SDK integration for streaming UX  
   - Why: Faster, richer UI streaming + tool transparency with UI parts.  
   - Docs: `frameworks/agentic-uis/ai-sdk.mdx`

9) Semantic recall embeddings (Google/OpenAI/local)  
   - Why: Stable long‑term context without overlong chats.  
   - Docs: `memory/semantic-recall.mdx`

## Suggested implementation sequence

Phase A (Safety core): Guardrails processors + structured working memory + eval harness  
Phase B (Clinical continuity): Semantic recall + runtime context policies  
Phase C (UX/Scale): AI SDK streaming, agent networks, observability dashboards

