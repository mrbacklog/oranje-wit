"use client";
import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import "./tokens.css";

interface DaisyPanelProps {
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}

function heeftToolCall(bericht: UIMessage): boolean {
  return bericht.parts?.some((p) => p.type === "tool-invocation") ?? false;
}

export function DaisyPanel({ versieId, werkindelingId, werkindelingNaam }: DaisyPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useRef(
    new TextStreamChatTransport({
      api: "/api/ai/chat",
      body: { versieId, werkindelingId, werkindelingNaam },
    })
  );

  const { messages, sendMessage, status, error } = useChat({ transport: transport.current });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOngedaan = () => {
    sendMessage({ text: "Maak de laatste actie ongedaan." });
  };

  const lastMessageIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  const lastToolCallId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && heeftToolCall(m)) return m.id;
    }
    return null;
  })();

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 4px 16px rgba(255,107,0,.45)",
            zIndex: 30,
            fontFamily: "inherit",
          }}
          aria-label="Daisy openen"
        >
          ✦
        </button>
      )}

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: "var(--daisy-w)",
          height: 420,
          background: "var(--bg-1)",
          border: "1px solid var(--border-1)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.15)",
          zIndex: 30,
          overflow: "hidden",
          transform: open ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          visibility: open ? "visible" : "hidden",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "bottom right",
        }}
        role="dialog"
        aria-label="Daisy chat"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-0)",
            flexShrink: 0,
            background: "linear-gradient(90deg, rgba(255,107,0,.08) 0%, transparent 60%)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #FF8533)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(255,107,0,.3)",
              position: "relative",
            }}
          >
            ✦
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ok)",
                position: "absolute",
                bottom: 0,
                right: 0,
                border: "2px solid var(--bg-1)",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Daisy</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>
              {isLoading ? "denkt na..." : `AI-assistent · ${werkindelingNaam}`}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-3)",
              fontSize: 14,
              fontFamily: "inherit",
            }}
            aria-label="Daisy sluiten"
          >
            ✕
          </button>
        </div>

        {/* Berichten */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 8,
                color: "var(--text-3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28 }}>✦</div>
              <p style={{ fontSize: 12, margin: 0 }}>Hoi! Ik ben Daisy.</p>
              <p style={{ fontSize: 11, margin: 0 }}>Vraag me iets over de teams of spelers.</p>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        borderBottomLeftRadius: m.role === "assistant" ? 4 : 12,
                        borderBottomRightRadius: m.role === "user" ? 4 : 12,
                        background: m.role === "user" ? "var(--accent)" : "var(--bg-2)",
                        color: m.role === "user" ? "#fff" : "var(--text-1)",
                        border: m.role === "user" ? "none" : "1px solid var(--border-1)",
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.parts
                        ?.filter((p) => p.type === "text")
                        .map((p, i) => (
                          <span key={i}>{(p as { type: "text"; text: string }).text}</span>
                        ))}
                    </div>
                  </div>
                  {/* Undo-knop na laatste assistent-bericht met tool-call */}
                  {m.id === lastToolCallId && (
                    <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                      <button
                        onClick={handleOngedaan}
                        disabled={isLoading}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: isLoading ? "not-allowed" : "pointer",
                          background: "var(--bg-0)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border-1)",
                          fontFamily: "inherit",
                          opacity: isLoading ? 0.5 : 1,
                        }}
                      >
                        ↩ Ongedaan maken
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {/* Loading indicator */}
              {isLoading && lastMessageIsUser && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 12,
                      borderBottomLeftRadius: 4,
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-1)",
                      fontSize: 12,
                      color: "var(--text-3)",
                    }}
                  >
                    …
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              margin: "0 12px 8px",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 11,
              background: "rgba(239,68,68,0.1)",
              color: "var(--err)",
              border: "1px solid rgba(239,68,68,0.2)",
              flexShrink: 0,
            }}
          >
            {error.message || "Er ging iets mis. Probeer het opnieuw."}
          </div>
        )}

        {/* Input */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid var(--border-0)",
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vraag Daisy iets... (Enter = verstuur)"
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              borderRadius: 10,
              color: "var(--text-1)",
              fontSize: 12,
              fontFamily: "inherit",
              padding: "8px 12px",
              outline: "none",
              resize: "none",
              minHeight: 36,
              maxHeight: 80,
              lineHeight: 1.4,
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: input.trim() && !isLoading ? "var(--accent)" : "var(--bg-2)",
              color: input.trim() && !isLoading ? "#fff" : "var(--text-3)",
              border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              flexShrink: 0,
              fontFamily: "inherit",
            }}
            aria-label="Verstuur"
          >
            →
          </button>
        </div>
      </div>
    </>
  );
}
