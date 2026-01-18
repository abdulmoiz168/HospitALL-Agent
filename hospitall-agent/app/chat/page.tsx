"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../chat.module.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: Record<string, unknown>;
};

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const getStoredSessionId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("hospitall-session");
};

const setStoredSessionId = (sessionId: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("hospitall-session", sessionId);
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "assistant",
      content:
        "Hi, I'm HospitALL. Share what you're experiencing and I’ll guide the next best step.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = getStoredSessionId();
    if (existing) {
      setSessionId(existing);
    } else {
      const next = makeId();
      setSessionId(next);
      setStoredSessionId(next);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading && sessionId.length > 0,
    [input, loading, sessionId],
  );

  const appendAssistantChunk = (id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? { ...message, content: message.content + chunk }
          : message,
      ),
    );
  };

  const attachMeta = (id: string, meta?: Record<string, unknown>) => {
    if (!meta) return;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, meta } : message,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: input.trim(),
    };
    const assistantMessage: ChatMessage = {
      id: makeId(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Unable to reach agent.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            content?: string;
            meta?: Record<string, unknown>;
          };

          if (event.type === "chunk" && event.content) {
            appendAssistantChunk(assistantMessage.id, event.content);
          }

          if (event.type === "done") {
            attachMeta(assistantMessage.id, event.meta);
          }
        }
      }
    } catch (error) {
      appendAssistantChunk(
        assistantMessage.id,
        "Sorry, I couldn't process that. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <span className={styles.badge}>HospitALL Triage Console</span>
          <h1>Smart clinical guidance with a single, focused conversation.</h1>
          <p>
            Talk naturally. The agent routes triage, medication safety, and lab
            interpretation behind the scenes, then delivers a clear next step.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/triage">
              Start structured triage
            </Link>
            <Link className={styles.secondaryAction} href="/report">
              Upload lab report
            </Link>
            <Link className={styles.secondaryAction} href="/prescription">
              Medication check
            </Link>
          </div>
        </div>
        <div className={styles.heroPanel}>
          <h2>Live session</h2>
          <div className={styles.heroStat}>
            <span>Session ID</span>
            <strong>{sessionId ? sessionId.slice(0, 8) : "—"}</strong>
          </div>
          <div className={styles.heroStat}>
            <span>Status</span>
            <strong>{loading ? "In progress" : "Ready"}</strong>
          </div>
          <div className={styles.heroStat}>
            <span>Mode</span>
            <strong>Unified agent</strong>
          </div>
          <p className={styles.heroNote}>
            Use the chat for rapid triage, then jump into structured flows when
            you need precision.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.chatPanel}>
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.messageUser
                    : styles.messageAssistant
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.roleBadge}>
                    {message.role === "user" ? "Patient" : "HospitALL"}
                  </span>
                  {message.meta?.intent != null && (
                    <span className={styles.intentTag}>
                      Intent: {String(message.meta.intent)}
                    </span>
                  )}
                </div>
                <div className={styles.messageBody}>{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe symptoms, meds, or lab results..."
              aria-label="Chat input"
              rows={2}
            />
            <button className={styles.button} type="submit" disabled={!canSend}>
              {loading ? "Sending" : "Send"}
            </button>
          </form>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.card}>
            <h2>Care snapshot</h2>
            <div className={styles.summaryItem}>
              <span>Urgency</span>
              <strong>Pending triage</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Workflows</span>
              <strong>Triage · Rx · Labs</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Next action</span>
              <strong>Clarify symptoms</strong>
            </div>
          </div>
          <div className={styles.cardAlt}>
            <h2>Fast actions</h2>
            <p>Switch to structured modes for higher precision inputs.</p>
            <div className={styles.quickLinks}>
              <Link href="/triage">Structured triage</Link>
              <Link href="/report">Lab report upload</Link>
              <Link href="/prescription">Prescription safety</Link>
            </div>
          </div>
          <div className={styles.alertCard}>
            If you believe this is an emergency, contact local emergency
            services immediately.
          </div>
        </aside>
      </div>

      <footer className={styles.footer}>
        <span>Powered by Genaima AI</span>
        <span>HospitALL Clinical Guidance · MVP Preview</span>
      </footer>
    </div>
  );
}
