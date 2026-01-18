"use client";

import { useState } from "react";
import styles from "../feature.module.css";
import type { TriageOutput } from "@/mastra/schemas/triage";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function TriagePage() {
  const [result, setResult] = useState<TriageOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      text: formData.get("text")?.toString() ?? "",
      ageYears: parseNumber(formData.get("ageYears")),
      severity: parseNumber(formData.get("severity")),
      durationHours: parseNumber(formData.get("durationHours")),
      sexAtBirth: formData.get("sexAtBirth")?.toString() || undefined,
      pregnant: formData.get("pregnant") === "on",
    };

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Request failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Unable to reach triage service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Symptom Triage</h1>
        <p>
          Enter symptoms. Direct identifiers are redacted before any optional
          model call.
        </p>
      </header>

      {result?.system_action === "emergency_circuit_breaker" && (
        <div className={styles.banner}>
          Emergency circuit breaker triggered. Call emergency services or go to
          the nearest emergency department.
        </div>
      )}

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Symptoms
            <textarea
              className={styles.textarea}
              name="text"
              placeholder="Describe symptoms..."
              required
            />
          </label>
          <div className={styles.grid}>
            <label className={styles.label}>
              Age (years)
              <input className={styles.input} name="ageYears" type="number" />
            </label>
            <label className={styles.label}>
              Severity (1-10)
              <input
                className={styles.input}
                name="severity"
                type="number"
                min={1}
                max={10}
              />
            </label>
            <label className={styles.label}>
              Duration (hours)
              <input
                className={styles.input}
                name="durationHours"
                type="number"
                min={0}
              />
            </label>
            <label className={styles.label}>
              Sex at birth
              <select className={styles.select} name="sexAtBirth">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
          </div>
          <label className={styles.label}>
            <input type="checkbox" name="pregnant" /> Pregnant
          </label>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Running..." : "Run triage"}
          </button>
          <span className={styles.meta}>
            Output is deterministic unless HOSPITALL_USE_LLM=1.
          </span>
        </form>
      </section>

      {error && <div className={styles.banner}>{error}</div>}

      {result && (
        <section className={styles.panel}>
          <h2>Result</h2>
          <pre className={styles.result}>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      <footer className={styles.footer}>
        <span>Powered by Genaima AI</span>
        <span>HospitALL Clinical Guidance · MVP Preview</span>
      </footer>
    </div>
  );
}
