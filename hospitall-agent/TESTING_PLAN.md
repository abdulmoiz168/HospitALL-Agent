# HospitALL Medical AI Platform - Comprehensive Testing Plan

## Executive Summary

This plan outlines a systematic approach to thoroughly test the HospitALL medical AI platform across all promised features: AI symptom assessment, prescription safety checks, report interpretation, PHI guards, knowledge base influence, and system prompt effectiveness.

**Testing Scope:**
- 4 Deterministic Engines (Triage, Drug, Red Flag, Report)
- PHI Guard with 12+ detection patterns
- 6 Agent Tools
- 3 Workflow Pipelines
- Knowledge Base with 8 clinical guidelines

---

## Phase 1: Test Infrastructure Setup

### 1.1 Create Test Directory Structure
```
hospitall-agent/
├── __tests__/
│   ├── setup.ts
│   ├── fixtures/
│   │   ├── triage-scenarios.ts
│   │   ├── drug-interactions.ts
│   │   ├── phi-patterns.ts
│   │   └── patient-demographics.ts
│   ├── unit/
│   │   ├── engines/
│   │   │   ├── triage-engine.test.ts
│   │   │   ├── drug-engine.test.ts
│   │   │   ├── red-flag-engine.test.ts
│   │   │   └── report-engine.test.ts
│   │   └── guards/
│   │       └── phi-guard.test.ts
│   ├── integration/
│   │   ├── triage-workflow.test.ts
│   │   ├── rx-workflow.test.ts
│   │   └── chat-api.test.ts
│   ├── safety/
│   │   ├── emergency-detection.test.ts
│   │   ├── drug-safety.test.ts
│   │   └── phi-protection.test.ts
│   ├── adversarial/
│   │   └── phi-bypass.test.ts
│   └── benchmarks/
│       ├── datasets/
│       │   ├── golden-triage-set.json
│       │   ├── golden-drug-set.json
│       │   └── golden-redflags-set.json
│       ├── benchmark-runner.ts
│       └── metrics-calculator.ts
```

### 1.2 Install Test Dependencies
- vitest (test runner)
- @vitest/coverage-v8 (coverage)
- fast-check (property-based testing)

---

## Phase 2: Unit Testing - Deterministic Engines

### 2.1 Triage Engine Tests (`triage-engine.ts`)
**Target: 95% coverage**

| Test Category | Test Count | Priority |
|---------------|------------|----------|
| Emergency circuit breaker (red flags → emergency) | 10 | P0 |
| Severity threshold (≥8 → urgent_care) | 5 | P0 |
| Duration threshold (≥72h → primary_care) | 5 | P0 |
| Default self_care path | 5 | P1 |
| Possible cause mapping | 10 | P1 |
| Recommended action generation | 4 | P1 |

### 2.2 Drug Engine Tests (`drug-engine.ts`)
**Target: 100% coverage - SAFETY CRITICAL**

| Test Category | Test Count | Priority |
|---------------|------------|----------|
| All 25+ critical interactions | 25 | P0 |
| Category X pregnancy contraindications | 10 | P0 |
| Category D pregnancy warnings | 8 | P0 |
| Drug normalization (60+ drugs) | 60 | P0 |
| Category-based interactions (NSAIDs, serotonergic, QT) | 15 | P0 |
| Unknown drug handling | 5 | P1 |
| Duplication detection | 5 | P1 |

### 2.3 Red Flag Engine Tests (`red-flag-engine.ts`)
**Target: 100% coverage - SAFETY CRITICAL**

| Test Category | Test Count | Priority |
|---------------|------------|----------|
| Cardiac red flags (chest pain, palpitations, etc.) | 15 | P0 |
| Respiratory red flags (SOB, cyanosis, etc.) | 12 | P0 |
| Neurological red flags (stroke, seizure, etc.) | 18 | P0 |
| Anaphylaxis keywords | 12 | P0 |
| Combination patterns (10 patterns) | 10 | P0 |
| Bleeding/trauma red flags | 10 | P0 |
| Pregnancy emergencies | 5 | P0 |
| Pediatric emergencies | 8 | P0 |

### 2.4 Report Engine Tests (`report-engine.ts`)
**Target: 90% coverage**

| Test Category | Test Count | Priority |
|---------------|------------|----------|
| Lab value parsing from raw text | 10 | P1 |
| Reference range extraction | 8 | P1 |
| Abnormal value detection | 10 | P1 |
| Missing reference range handling | 5 | P1 |

---

## Phase 3: PHI Guard Security Testing

### 3.1 Pattern Coverage Tests
**Target: 100% detection for documented patterns**

| PHI Type | Test Cases | Examples |
|----------|------------|----------|
| Email | 10 | `john@example.com`, `patient+med@hospital.org` |
| US/Canada Phone | 12 | `555-123-4567`, `(555) 123-4567`, `+1-555-123-4567` |
| Pakistani Phone | 8 | `0321-4567890`, `+92-321-4567890` |
| SSN | 5 | `123-45-6789` |
| MRN | 5 | `MRN: 12345678`, `MRN:ABC-12345` |
| US Address | 8 | `123 Main Street`, `456 Oak Avenue` |
| Pakistani Address | 8 | `House 45, Block D, Johar Town` |
| DOB | 8 | `DOB: 01/15/1990`, `born on January 15, 1990` |
| Name Introduction | 8 | `My name is John Smith`, `I'm Sarah` |
| CNIC | 5 | `35202-1234567-1` |

### 3.2 Adversarial Bypass Tests
**Document known limitations**

| Attack Vector | Test Cases | Expected Behavior |
|---------------|------------|-------------------|
| Unicode homoglyphs | 5 | Document if detected/missed |
| Whitespace injection | 5 | Document behavior |
| Zero-width characters | 3 | Document behavior |
| Leetspeak substitution | 5 | Document behavior |
| Split PHI across messages | 3 | Document limitation |

### 3.3 Integration Tests
| Test | Verification |
|------|--------------|
| PHI detected → `blockedExternal: true` | LLM not called |
| No PHI → `blockedExternal: false` | LLM allowed (if configured) |
| Redaction format correct | `[REDACTED:TYPE]` |
| Patient context excludes PHI | No names/DOB/contact info |

---

## Phase 4: Medical Accuracy Benchmarking

### 4.1 Golden Test Datasets

#### Triage Golden Set (50 cases)
| Category | Cases | Pass Criteria |
|----------|-------|---------------|
| Emergency scenarios | 15 | 100% correctly identified |
| Urgent care scenarios | 10 | ≥95% correct |
| Primary care scenarios | 15 | ≥90% correct |
| Self care scenarios | 10 | ≥85% correct |

#### Drug Interaction Golden Set (50 cases)
| Category | Cases | Pass Criteria |
|----------|-------|---------------|
| Critical interactions | 15 | 100% detected |
| Serious interactions | 20 | ≥98% detected |
| Pregnancy contraindications | 10 | 100% detected |
| Edge cases | 5 | Graceful handling |

#### Red Flag Golden Set (30 cases)
| Category | Cases | Pass Criteria |
|----------|-------|---------------|
| Direct keywords | 20 | ≥99% detected |
| Combination patterns | 10 | ≥95% detected |

### 4.2 Benchmark Metrics & Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Emergency Sensitivity** | ≥99% | ≥95% |
| **Emergency Specificity** | ≥80% | ≥70% |
| **Critical Drug Interaction Recall** | 100% | 100% |
| **Pregnancy Contraindication Recall** | 100% | 100% |
| **PHI Detection Rate** | ≥99% | ≥95% |
| **Under-triage Rate** | <2% | <5% |
| **False Negative Rate (Emergency)** | 0% | 0% |

### 4.3 Demographic Coverage Tests
Ensure consistent performance across:
- Age groups: Pediatric (<18), Adult (18-64), Geriatric (≥65)
- Pregnancy status: Pregnant, Not pregnant
- Sex at birth: Female, Male

---

## Phase 5: Integration & E2E Testing

### 5.1 Workflow Pipeline Tests
| Workflow | Test Focus |
|----------|------------|
| Triage Workflow | PHI guard → Red flags → Decision → Finalize |
| Rx Workflow | Normalize → Interactions → Finalize |
| Report Workflow | Parse → Analyze → Finalize |

### 5.2 Chat API E2E Tests
| Scenario | Expected Behavior |
|----------|-------------------|
| Symptom message → Triage tool called | Correct intent routing |
| Medication question → Rx tool called | Correct intent routing |
| Lab results → Report tool called | Correct intent routing |
| PHI in message → LLM blocked, deterministic response | Privacy protection |
| Emergency keywords → Emergency urgency returned | Safety escalation |

### 5.3 Agent Behavior Tests
| Test | Verification |
|------|--------------|
| System prompt compliance | Disclaimer included, no diagnosis claims |
| Knowledge base retrieval | Relevant guidelines returned |
| Tool proactive usage | Triage tool called for symptoms |
| Pakistan-specific guidance | Rescue 1122/Edhi 115 in emergencies |

---

## Phase 6: Benchmark Report Generation

### 6.1 Metrics Dashboard
Generate report with:
- Confusion matrices for each triage level
- Drug interaction detection rates
- PHI detection coverage
- Demographic equity analysis
- Comparison vs state-of-the-art targets

### 6.2 Pass/Fail Summary
| Category | Status | Notes |
|----------|--------|-------|
| Emergency Detection | PASS/FAIL | Must be 100% |
| Drug Safety | PASS/FAIL | Critical must be 100% |
| PHI Protection | PASS/FAIL | 0 leakage tolerance |
| Overall Accuracy | PASS/FAIL | Meet all thresholds |

---

## Implementation Order

1. **Setup** - Test infrastructure, dependencies, fixtures
2. **PHI Guard Tests** - Security first (safety critical)
3. **Red Flag Engine Tests** - Emergency detection (safety critical)
4. **Drug Engine Tests** - Interaction detection (safety critical)
5. **Triage Engine Tests** - Urgency classification
6. **Report Engine Tests** - Lab interpretation
7. **Integration Tests** - Workflow pipelines
8. **E2E Tests** - Chat API, agent behavior
9. **Benchmark Execution** - Golden datasets
10. **Report Generation** - Metrics dashboard

---

## Critical Files to Modify/Create

| File | Action |
|------|--------|
| `hospitall-agent/package.json` | Add test scripts and dependencies |
| `hospitall-agent/vitest.config.ts` | Test configuration |
| `hospitall-agent/__tests__/setup.ts` | Global test setup |
| `hospitall-agent/__tests__/fixtures/*.ts` | Test data |
| `hospitall-agent/__tests__/unit/engines/*.test.ts` | Engine unit tests |
| `hospitall-agent/__tests__/unit/guards/phi-guard.test.ts` | PHI security tests |
| `hospitall-agent/__tests__/safety/*.test.ts` | Safety-critical tests |
| `hospitall-agent/__tests__/benchmarks/*.ts` | Benchmark runner and datasets |

---

## Verification Plan

After all tests pass:
1. Run full test suite: `npm test`
2. Check coverage: `npm run test:coverage` (targets: 90%+ overall, 100% safety-critical)
3. Run benchmark: `npm run benchmark`
4. Generate report: `npm run benchmark:report`
5. Review metrics against state-of-the-art targets

---

## Success Criteria

The HospitALL Agent qualifies as "state-of-the-art" when:
- [ ] 0% false negatives for emergency detection
- [ ] 100% critical drug interaction detection
- [ ] 0% PHI leakage to external services
- [ ] ≥99% emergency sensitivity
- [ ] ≥98% serious drug interaction recall
- [ ] ≥99% PHI pattern detection
- [ ] Consistent performance across demographics (max 5% variance)
- [ ] All golden dataset cases pass

---

## Appendix A: Sample Test Scenarios

### Emergency Triage Scenarios

| ID | Input | Expected Urgency | Red Flags |
|----|-------|------------------|-----------|
| E001 | "Crushing chest pain radiating to left arm, sweating" | emergency | chest pain, sweating |
| E002 | "Face drooping, can't lift arm, slurred speech" | emergency | stroke symptoms |
| E003 | "Throat closing, hives everywhere, can't breathe" | emergency | anaphylaxis |
| E004 | "Worst headache of my life, came on suddenly" | emergency | thunderclap headache |
| E005 | "Baby turning blue, not responding" | emergency | pediatric emergency |

### Critical Drug Interactions

| ID | Drugs | Severity | Mechanism |
|----|-------|----------|-----------|
| D001 | Warfarin + Aspirin | Critical | Bleeding risk |
| D002 | Alprazolam + Tramadol | Critical | CNS depression |
| D003 | Simvastatin + Gemfibrozil | Critical | Rhabdomyolysis |
| D004 | Amiodarone + Azithromycin | Critical | QT prolongation |
| D005 | Methotrexate + Cotrimoxazole | Critical | Bone marrow suppression |

### PHI Detection Patterns

| ID | Input | Expected Detection |
|----|-------|-------------------|
| P001 | `john@example.com` | email |
| P002 | `555-123-4567` | phone |
| P003 | `123-45-6789` | ssn |
| P004 | `35202-1234567-1` | cnic |
| P005 | `My name is John Smith` | name_intro |
