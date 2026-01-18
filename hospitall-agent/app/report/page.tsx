"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../feature.module.css";
import type { ReportOutput, ReportValue } from "@/mastra/schemas/report";

type EditableValue = {
  name: string;
  value: string;
  unit: string;
  low: string;
  high: string;
};

const parseReportPayload = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { values: parsed };
      }
      if (parsed && typeof parsed === "object" && "values" in parsed) {
        return parsed;
      }
    } catch {
      // fall through
    }
  }

  return { rawText: trimmed };
};

const toEditable = (value: ReportValue): EditableValue => ({
  name: value.name ?? "",
  value: value.value?.toString() ?? "",
  unit: value.unit ?? "",
  low: value.referenceRange?.low?.toString() ?? "",
  high: value.referenceRange?.high?.toString() ?? "",
});

const toReportValue = (value: EditableValue): ReportValue | null => {
  const numeric = Number(value.value);
  if (!value.name.trim() || Number.isNaN(numeric)) return null;

  const low = value.low.trim() ? Number(value.low) : undefined;
  const high = value.high.trim() ? Number(value.high) : undefined;

  return {
    name: value.name.trim(),
    value: numeric,
    unit: value.unit.trim() || undefined,
    referenceRange:
      low !== undefined || high !== undefined
        ? {
            low: Number.isNaN(low ?? NaN) ? undefined : low,
            high: Number.isNaN(high ?? NaN) ? undefined : high,
          }
        : undefined,
  };
};

const emptyRow = (): EditableValue => ({
  name: "",
  value: "",
  unit: "",
  low: "",
  high: "",
});

export default function ReportPage() {
  const [result, setResult] = useState<ReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [editableValues, setEditableValues] = useState<EditableValue[]>([]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const hasExtractedValues = editableValues.length > 0;

  const canAnalyze = useMemo(() => {
    return editableValues.some((value) => value.name.trim() && value.value.trim());
  }, [editableValues]);

  const handleExtract = async () => {
    if (!file) {
      setUploadError("Choose a PDF or image to extract.");
      return;
    }
    setExtracting(true);
    setUploadError(null);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/report/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      const values = (data.parsedValues ?? []).map(toEditable);
      setEditableValues(values.length > 0 ? values : [emptyRow()]);
      setRawText(data.rawText ?? "");
      setWarnings(data.warnings ?? []);
    } catch (err) {
      setUploadError("Unable to process the upload.");
    } finally {
      setExtracting(false);
    }
  };

  const updateRow = (
    index: number,
    field: keyof EditableValue,
    value: string,
  ) => {
    setEditableValues((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addRow = () => {
    setEditableValues((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setEditableValues((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAnalyzeValues = async () => {
    setLoading(true);
    setError(null);

    const values = editableValues
      .map(toReportValue)
      .filter((value): value is ReportValue => value !== null);

    if (values.length === 0) {
      setError("Add at least one valid value before analysis.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Request failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Unable to reach report service.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const raw = formData.get("report")?.toString() ?? "";
    const payload = parseReportPayload(raw);

    if (!payload) {
      setError("Provide JSON values or raw text.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/report", {
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
      setError("Unable to reach report service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Report Interpretation</h1>
        <p>
          Upload a lab report to extract values, verify them, and then run the
          analysis. You can also paste raw text or JSON.
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Upload & extract</h2>
        <div className={styles.uploadRow}>
          <input
            className={styles.input}
            type="file"
            accept="application/pdf,image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <button
            className={styles.button}
            type="button"
            onClick={handleExtract}
            disabled={!file || extracting}
          >
            {extracting ? "Extracting..." : "Extract values"}
          </button>
        </div>
        <span className={styles.meta}>
          OCR runs locally on the server. You must verify extracted values
          before analysis.
        </span>
        {uploadError && <div className={styles.banner}>{uploadError}</div>}
        {warnings.length > 0 && (
          <div className={styles.notice}>
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
        {previewUrl && (
          <div className={styles.preview}>
            {file?.type?.startsWith("image/") ? (
              <img src={previewUrl} alt="Uploaded report" />
            ) : (
              <iframe title="Uploaded report" src={previewUrl} />
            )}
          </div>
        )}
        {rawText && (
          <details className={styles.details}>
            <summary>Extracted text (for reference)</summary>
            <pre className={styles.result}>{rawText}</pre>
          </details>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Verify extracted values</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Value</span>
            <span>Unit</span>
            <span>Ref low</span>
            <span>Ref high</span>
            <span />
          </div>
          {hasExtractedValues ? (
            editableValues.map((row, index) => (
              <div className={styles.tableRow} key={`row-${index}`}>
                <input
                  className={styles.input}
                  value={row.name}
                  onChange={(event) =>
                    updateRow(index, "name", event.target.value)
                  }
                  placeholder="Hemoglobin"
                />
                <input
                  className={styles.input}
                  value={row.value}
                  onChange={(event) =>
                    updateRow(index, "value", event.target.value)
                  }
                  placeholder="12.1"
                />
                <input
                  className={styles.input}
                  value={row.unit}
                  onChange={(event) =>
                    updateRow(index, "unit", event.target.value)
                  }
                  placeholder="g/dL"
                />
                <input
                  className={styles.input}
                  value={row.low}
                  onChange={(event) =>
                    updateRow(index, "low", event.target.value)
                  }
                  placeholder="12"
                />
                <input
                  className={styles.input}
                  value={row.high}
                  onChange={(event) =>
                    updateRow(index, "high", event.target.value)
                  }
                  placeholder="16"
                />
                <button
                  className={styles.buttonGhost}
                  type="button"
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className={styles.meta}>
              Upload a report to populate values or add them manually below.
            </div>
          )}
        </div>
        <div className={styles.actionRow}>
          <button className={styles.buttonSecondary} type="button" onClick={addRow}>
            Add row
          </button>
          <button
            className={styles.button}
            type="button"
            onClick={handleAnalyzeValues}
            disabled={loading || !canAnalyze}
          >
            {loading ? "Analyzing..." : "Verify & analyze"}
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Paste values or raw text</h2>
        <form className={styles.form} onSubmit={handleManualSubmit}>
          <label className={styles.label}>
            Lab values JSON or raw text
            <textarea
              className={styles.textarea}
              name="report"
              placeholder='[{ "name": "Hemoglobin", "value": 12.1, "unit": "g/dL", "referenceRange": { "low": 12, "high": 16 } }]'
              required
            />
          </label>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze report"}
          </button>
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
