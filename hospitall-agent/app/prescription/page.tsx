"use client";

import { useState } from "react";
import styles from "../feature.module.css";
import type { PrescriptionOutput } from "@/mastra/schemas/prescription";

const splitList = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return value
    .toString()
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function PrescriptionPage() {
  const [result, setResult] = useState<PrescriptionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      currentMeds: splitList(formData.get("currentMeds")),
      newPrescription: formData.get("newPrescription")?.toString() || undefined,
      pregnant: formData.get("pregnant") === "on",
    };

    try {
      const response = await fetch("/api/rx", {
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
      setError("Unable to reach prescription service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Prescription Safety</h1>
        <p>
          Check deterministic interaction rules based on normalized medications.
        </p>
      </header>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Current medications (comma or newline separated)
            <textarea
              className={styles.textarea}
              name="currentMeds"
              placeholder="Warfarin, Aspirin"
              required
            />
          </label>
          <label className={styles.label}>
            New prescription
            <input
              className={styles.input}
              name="newPrescription"
              placeholder="Ibuprofen"
            />
          </label>
          <label className={styles.label}>
            <input type="checkbox" name="pregnant" /> Pregnant
          </label>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Checking..." : "Run check"}
          </button>
          <span className={styles.meta}>
            Interactions are deterministic from the local stub dataset.
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
