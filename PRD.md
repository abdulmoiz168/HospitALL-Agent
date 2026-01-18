Here’s the **PRD v1.1 patch**: same spirit/voice, but tightened where it needed legal/clinical/security precision, plus added the missing operational controls and safer fallbacks.

---

# Product Requirement Document: HospitALL AI Clinical Guidance Agent (v1.1)

**Date:** January 11, 2026
**Status:** Approved for Engineering (Patched for Safety/Compliance Precision)
**Product Owner:** Moiz (Genaima)
**Tech Stack Focus:** TypeScript (Next.js), Mastra (Orchestration), PostgreSQL (Data), Dedicated Safety Services

---

## 0. Change Log (v1.0 → v1.1)

**Patched:**

1. Clarified what “Zero-Trust PHI” means (tokenization ≠ de-identification; defined “direct identifiers” vs “clinical free-text”).
2. Emergency UX: replaced hard “disable chat” with a safer **Emergency Circuit Breaker** that still allows correction/exit.
3. Drug layer: clarified **RxNorm is normalization, not interactions**; defined interaction data requirement.
4. Added explicit **Security Controls** (HIPAA technical safeguards-aligned) and audit requirements.
5. Added **Threat Model + Tool Safety Posture** (prompt injection / indirect injection / web).
6. RAG policy clarified: **default no patient-embeddings**; patient docs are session-scoped.
7. Attribution verification: added **fallback UX** and reduced brittleness (claim→evidence mapping + degrade safely).
8. Expanded evaluation plan: golden dataset + adversarial set + target metrics.

---

## 1. Executive Summary

HospitALL is a **privacy-first clinical guidance assistant** designed to triage patient symptoms, interpret medical reports, and validate prescription safety.

HospitALL operates on a **“Safety Sandwich” architecture**:

1. **Strict Deterministic Logic** for safety checks (drug interactions, red flags, calculators).
2. **Generative AI (Mastra)** for guided questioning and natural language explanation.
3. **PHI-Guard Middleware** that enforces privacy policy *before* data can touch any external model/tools.

**Key principle:** the LLM is a **narrator and orchestrator**, not the source of truth for safety-critical decisions.

---

## 2. Strategic Goals & Non-Goals

### 2.1 Core Goals

* **Safe Triage:** Accurately bin users into *Self-Care*, *Primary Care*, *Urgent Care*, or *Emergency*.
* **Zero-Trust PHI (Precisely Defined):**

  * **No direct identifiers** (HIPAA identifiers like name, MRN, phone, address, etc.) are ever sent to external LLM providers or external tools.
  * **Clinical free-text is minimized**; wherever possible, it is transformed into **structured, non-identifying features** (age band, symptom codes, duration, severity scale) prior to model calls.
  * Any remaining text is treated as **potentially identifying** and is blocked from external routes unless explicitly allowed by policy (see PHI policy matrix).
* **Deterministic Safety:** Medication checks must rely on **ground-truth interaction datasets** + deterministic rules, never LLM guessing.
* **Explainable RAG:** Every clinical guidance claim must be attributable to an approved Clinical KB chunk (retrievable and versioned).

### 2.2 Non-Goals

* **Diagnosis:** HospitALL identifies urgency and explains patterns; it does not diagnose.
* **Unsupervised Automation:** No pharmacy actions; no clinician actions are triggered automatically.
* **Emergency Replacement:** Not a 911/112 replacement. It escalates and guides.

### 2.3 Regulatory/Claims Guardrail (Scope Safety)

HospitALL’s product language, UI, and outputs must avoid regulated “diagnosis/treatment” claims. All outputs must be framed as **guidance**, with escalation to clinician care when appropriate.

---

## 3. User Personas

1. **Patient (The Anxious User):** Needs clarity, triage direction, and simple explanation.
2. **Clinician Reviewer:** Needs structured summaries, red flags, and medication risk diffs.
3. **Clinic Admin:** Needs audit logs, policy management, tenant controls, and KPIs.

---

## 4. Enhanced User Journeys

### A) Symptom Triage (Emergency Circuit Breaker)

1. **Intake:** User inputs symptoms (free text allowed but will be structured).
2. **Safety Intercept:** System immediately scans for emergency red flags.
3. **Emergency Circuit Breaker UI:**

   * Shows full-screen **Emergency Action Modal** with:

     * “Call emergency services now” (location-aware if available; otherwise generic instructions)
     * “Go to nearest emergency department”
     * **“I’m safe / this is not happening”** (continue triage but keep emergency banner pinned)
     * **“Continue anyway”** (still pinned emergency banner; logs override)
   * **Chat input is not hard-disabled**; it is **restricted** (only correction/override responses allowed until user chooses a path).
4. **Reasoning:** If not emergency, Mastra asks 2–3 clarifying questions based on protocol.
5. **Output:** Urgency level + explanation + next steps + referrals.

**Acceptance criteria:**

* Emergency flow must be reachable with high recall (favor false positives over false negatives).
* The user must always have an escape/correction path.
* No PHI is ever included in any external tool call triggered during emergency flows.

---

### B) Report Interpretation (Human-in-the-Loop OCR)

1. **Upload:** User uploads a lab report PDF/image.
2. **Extraction:** OCR + parsing creates structured values.
3. **Verification UI (Required):** Side-by-side original + extracted fields.

   * User must click **Verify** (or correct fields) before analysis.
4. **Analysis:** Verified values compared against reference ranges (if present); explanation + “what to ask your doctor.”

**Acceptance criteria:**

* If reference ranges are missing/unclear, system must state uncertainty and avoid definitive interpretation.
* The model may not claim specific diagnoses from lab values.

---

### C) Prescription Safety (Deterministic Core)

1. **Input:** User enters meds + new prescription (or upload).
2. **Normalization:** Drug names mapped to normalized identifiers (RxNorm / RxCUI).
3. **Engine Check:** Deterministic service queries an interaction dataset and contraindication rules.
4. **Synthesis:** LLM receives **structured results only** and generates patient-friendly explanation, never computing risk itself.

**Acceptance criteria:**

* No interaction severity is ever invented by the LLM.
* If drug cannot be normalized, system must ask clarifying questions (brand vs generic, strength, route).

---

## 5. Technical Requirements & Architecture

### 5.1 “Safety Sandwich” Data Flow (Strict)

1. **Client (Next.js):** Encrypted transport (TLS), minimal collection, consent surfaces.
2. **PHI Guard (Bi-directional Policy Proxy):**

   * **Ingress:** detects direct identifiers (regex + ML classifier), redacts them; transforms to structured schema where possible.
   * **Tokenization is allowed but treated as sensitive**; token maps must be protected (see 5.2).
   * **Egress:** Re-hydrates tokens only for the authorized session, never for logs/tools.
3. **Orchestration Layer (Mastra):**

   * Routes workflow, maintains state, calls tools deterministically, retrieves RAG.
   * **Requirement:** pinned Mastra version (vendorized fork or locked commit) + internal review gate for upgrades.
4. **Deterministic Services (Non-AI):**

   * Drug Engine
   * Clinical calculators (BMI, renal dosing calculators, etc.)
   * Red-flag rules engine
5. **Model Provider (External or Internal):**

   * Receives **no direct identifiers**
   * Receives **structured features** by default
   * Free text is minimized and policy-controlled

---

### 5.2 PHI Policy Matrix (New, Required)

Define strict routing policies:

| Data Type                    | Example                                 | Allowed to External LLM? | Allowed to Web Search? | Storage                |
| ---------------------------- | --------------------------------------- | -----------------------: | ---------------------: | ---------------------- |
| Direct identifiers           | name, MRN, phone, address               |                   **No** |                 **No** | Encrypted (restricted) |
| Quasi-identifiers            | exact dates, rare conditions + location |           Default **No** |                 **No** | Policy-based           |
| Structured clinical features | age band, symptom codes, severity       |                  **Yes** |    **Yes (sanitized)** | Encrypted              |
| Patient documents (raw)      | lab PDF/image                           |         **No** (default) |                 **No** | Encrypted object store |
| Curated Clinical KB          | guidelines/protocols                    |                      Yes |        Yes (if public) | Versioned              |

**Token map requirements (New):**

* Token map must be:

  * stored **encrypted**
  * **session-scoped** with TTL
  * never written to Ops logs
  * deleted on session end (or retention policy)
* If token map persistence is required (rare), it must be in the **Legal Log** only, with explicit access controls.

---

### 5.3 RAG & Knowledge Base

**Two distinct knowledge domains:**

1. **Clinical Knowledge Base (Curated, Approved):** guidelines, protocols, referral rules, clinic SOPs
2. **Tenant Knowledge (Clinic-specific):** availability, referral directory, policies

**RAG requirements:**

* **Tenant Isolation:** separate indices by `tenant_id`
* **Versioning:** every KB chunk stores: source, version, uploaded_by, approval_status, effective_date
* **Retrieval sanitization:** retrieved text is treated as **data**, not instructions

**Patient data in RAG policy (Patched):**

* **Default v1.1 policy:** Patient documents are **not embedded** into shared vector stores.
* Patient docs remain in encrypted object storage and can be referenced **session-scoped** only (retrieved by permissioned lookup, not global semantic search).
* If patient embeddings are introduced later, that is a **v2 gated feature** requiring explicit consent + per-patient index boundaries + deletion guarantees.

---

### 5.4 Web Search / MCP / Tooling (Hardened)

Web search must go through a **Safe Search Proxy**:

* Domain allowlist (medical authorities / journals / approved sources)
* Query builder that only emits **generic medical questions**
* Automatic PHI scrubber (blocks if any direct identifiers present)
* Output sanitization (strip instructions, scripts, malicious prompt content)

**Tool safety requirements:**

* Strict tool allowlist per workflow
* Validate tool outputs against schema before use
* Never execute tool outputs as instructions without mediation

---

### 5.5 Attribution Verification (Patched to be safe + usable)

**Requirement:** All medical guidance claims must be supported by citations.

**Implementation behavior (New):**

1. Agent outputs **claim→evidence mapping**:

   * each claim references one or more chunk IDs
2. Post-generation verifier checks:

   * “Does claim meaning align with cited chunks?”
3. If verifier fails:

   * **Degrade safely** instead of silently blocking:

     * Provide only non-clinical safe guidance (seek clinician, emergency escalation if needed)
     * Explain that it cannot answer from verified sources
     * Log verifier failure event (Ops log redacted; Legal log full if permitted)

---

## 6. Audit, Security, Compliance Controls (Explicit Requirements)

### 6.1 Security Controls (HIPAA Technical Safeguards–Aligned)

Minimum required controls:

* Access control (RBAC; least privilege)
* Unique user identification (patients/clinicians/admins)
* Authentication hardening (MFA for clinicians/admins)
* Audit controls (who accessed what PHI, when, from where)
* Integrity controls (detect tampering where relevant)
* Transmission security (TLS; secure headers)

> Note: Exact compliance obligations depend on jurisdiction and contractual role (e.g., covered entity/BA). This PRD mandates security + privacy controls suitable for regulated healthcare handling.

### 6.2 The “Shadow Log” (Patched)

* **Ops Log (Safe):**

  * redacted prompts/responses
  * tool calls metadata (no PHI)
  * verifier outcomes, escalation triggers
* **Legal Log (Restricted):**

  * full encrypted conversation and uploads
  * access is strictly controlled (break-glass access policy)
  * explicit retention policy per tenant

### 6.3 Right to be Forgotten (Deletion Contract)

Deletion must wipe:

1. Postgres: profile, sessions, audit references where legally allowed
2. Vector store: any embeddings tied to `user_id` (if any exist)
3. Object storage: raw uploads
4. Token maps / cached artifacts / derived files
5. Any search proxy caches (if used)

**Acceptance criteria:**

* Deletion job is auditable, returns a deletion receipt, and is idempotent.

---

## 7. Threat Model & Risk Posture (New, Required)

HospitALL must defend against:

1. **Direct prompt injection** (user tries to override system/tool policy)
2. **Indirect prompt injection** (malicious content inside uploaded documents)
3. **Web injection** (malicious web pages, hidden instructions)
4. **Cross-tenant leakage** (retrieval returning data from another tenant)
5. **Logging leakage** (PHI written into debug logs/traces)

**Required mitigations:**

* Treat retrieved text as untrusted data
* Tool allowlists + schema validation
* PHI scrubber + policy proxy
* Tenant-separated indices + authorization checks
* Logging redaction + token-map isolation

---

## 8. Detailed Schema Definitions (Patched)

### 8.1 Triage Output Schema (JSON)

*(Renamed “reasoning_summary” → “risk_rationale” to avoid diagnosis tone)*

```json
{
  "urgency_level": "emergency | urgent_care | primary_care | self_care",
  "red_flags_detected": ["chest_pain", "shortness_of_breath"],
  "risk_rationale": "Symptoms include prolonged chest discomfort and shortness of breath; these can be warning signs requiring urgent evaluation.",
  "recommended_action": {
    "primary": "Seek emergency care immediately.",
    "secondary": "If alone, contact someone nearby and keep your phone accessible."
  },
  "clinical_citations": [
    {"source_id": "guideline_acc_2024", "chunk_id": "acc_2024_12", "support": "Emergency evaluation recommended for concerning chest pain symptoms."}
  ],
  "system_action": "emergency_circuit_breaker"
}
```

### 8.2 Prescription Check Schema

```json
{
  "issues": [
    {
      "type": "interaction | contraindication | duplication | dose_error | missing_info",
      "severity": "info | caution | serious | critical",
      "normalized_drugs": [{"name": "Warfarin", "rxcui": "11289"}, {"name": "Aspirin", "rxcui": "1191"}],
      "mechanism": "DeterministicEngine: interaction_code_123",
      "management": "Consult prescriber immediately.",
      "evidence_source": "DrugEngine:v1"
    }
  ]
}
```

---

## 9. Deterministic Drug Layer (Patched)

The drug pipeline must separate:

1. **Normalization layer**

* RxNorm/RxCUI (RxNav) for mapping user-entered meds to standardized identifiers

2. **Interaction/contraindication layer**

* An interaction dataset/API (licensed or vetted source) that returns:

  * severity, mechanism, management guidance, evidence id
* Contraindications rules where feasible (allergy, pregnancy, renal/hepatic risk) via deterministic logic

3. **LLM explanation layer**

* Converts deterministic results into patient-friendly language
* Must not invent severities, mechanisms, or guidance beyond what is provided

---

## 10. Implementation Plan (Mastra Focus)

### Phase 1: The “Safe Core” (Weeks 1–3)

* Next.js repo + Mastra integration
* PHI Guard proxy (regex + classifier initial)
* Symptom triage with hard-coded red flags + emergency circuit breaker UI
* Initial audit logging + ops/legal separation
* Deliverable: Internal alpha + jailbreak attempts + injection tests

### Phase 2: Knowledge & RAG (Weeks 4–6)

* Curated clinical KB ingestion + versioning/approval
* Report analyzer with OCR + verification UI
* RAG citations enforced + claim→evidence output format
* Deliverable: Closed beta for single clinic tenant

### Phase 3: Drug Safety & Evals (Weeks 7–9)

* Drug normalization + interaction engine integration
* Golden dataset + adversarial suite + metrics reporting
* Deliverable: Production candidate

---

## 11. Evaluation Plan (Patched: Golden + Adversarial + Targets)

### 11.1 Datasets

* **Golden Dataset (Minimum)**

  * 20 triage cases (include at least 8 emergency-like)
  * 20 medication cases (include critical interactions + duplicates + contraindications)
  * 10 report interpretation cases (units, decimals, missing reference ranges)
* **Adversarial Dataset**

  * 10 prompt injection attempts (direct)
  * 10 indirect injection docs (embedded instructions)
  * 10 web-tool injection scenarios (if web enabled)

### 11.2 Metrics (Targets)

* **Emergency recall (sensitivity):** maximize; tolerate over-triage
* **Critical drug interaction recall:** very high
* **Citation coverage:** % of clinical claims with valid chunk IDs
* **Verifier failure rate:** track; ensure safe fallback triggers correctly
* **Cross-tenant leakage:** must be zero (security invariant)
* **PHI leakage to external routes:** must be zero (security invariant)

### 11.3 Acceptance

A build cannot ship if:

* any cross-tenant retrieval is observed
* any direct identifier is found in external model/tool requests
* emergency false negatives occur in golden set (unless explicitly justified and fixed)

---

## 12. Risks & Mitigations (Updated)

| Risk                                  | Probability | Severity | Mitigation Strategy                                                              |
| ------------------------------------- | ----------: | -------: | -------------------------------------------------------------------------------- |
| Hallucination / uncited medical claim |      Medium |     High | Claim→evidence mapping + verifier + safe fallback                                |
| Prompt injection (direct/indirect)    |        High |   Medium | Tool allowlists, retrieved text treated as data, sanitization, schema validation |
| Framework instability                 |      Medium |     High | Mastra pinned fork + internal upgrade gate                                       |
| Missed emergency                      |         Low | Critical | High-recall red-flag gate + over-escalation + reviewer queue                     |
| OCR numeric errors                    |      Medium |     High | Mandatory human verification UI                                                  |

---

## 13. Next Step for Engineering

**Action:** Create the **Golden Dataset + Adversarial Dataset**.

Before writing production code, define:

* **20 triage cases** (with ideal JSON outputs + citations)
* **20 drug cases** (normalized drugs + expected issues)
* **10 report cases** (extracted values + expected interpretation)
* **Injection suite** (direct + indirect + tool/web)

These become the TDD foundation for Mastra workflows + deterministic services.

---

If you want, I can also produce (in the same v1.1 style) a **“Build Spec Companion”** right now:

* API endpoints + request/response contracts
* DB schema (tenants, sessions, logs, consent, deletion jobs)
* Mastra workflow map (routers, tools, guards)
* Security invariants and automated tests (PHI leakage tests, cross-tenant tests, verifier tests)

codex mcp add mastra-docs -- npx -y @mastra/mcp-docs-server
https://mastra.ai/docs/getting-started/mcp-docs-server
