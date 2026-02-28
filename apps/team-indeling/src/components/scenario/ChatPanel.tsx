"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bericht {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
  mutaties?: string[];
}

interface ChatPanelProps {
  scenarioId: string;
  versieId: string;
  onMutatie?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPanel({ scenarioId, versieId, onMutatie }: ChatPanelProps) {
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll bij nieuwe berichten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [berichten, activeTool]);

  // Focus input bij openen
  useEffect(() => {
    if (!collapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [collapsed]);

  const verstuur = useCallback(async () => {
    const tekst = input.trim();
    if (!tekst || isStreaming) return;

    const userBericht: Bericht = {
      id: `u-${Date.now()}`,
      role: "user",
      content: tekst,
    };

    const assistantBericht: Bericht = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      toolCalls: [],
      mutaties: [],
    };

    setBerichten((prev) => [...prev, userBericht, assistantBericht]);
    setInput("");
    setIsStreaming(true);
    setActiveTool(null);

    // Bouw berichten-array voor API (alleen role + content)
    const apiBerichten = [...berichten, userBericht].map((b) => ({
      role: b.role,
      content: b.content,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, versieId, berichten: apiBerichten }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Onbekende fout" }));
        setBerichten((prev) =>
          prev.map((b) =>
            b.id === assistantBericht.id
              ? { ...b, content: `Fout: ${err.error ?? "Kon geen verbinding maken."}` }
              : b
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === "text") {
              setBerichten((prev) =>
                prev.map((b) =>
                  b.id === assistantBericht.id ? { ...b, content: b.content + event.text } : b
                )
              );
            } else if (event.type === "tool_start") {
              setActiveTool(event.tool);
              setBerichten((prev) =>
                prev.map((b) =>
                  b.id === assistantBericht.id
                    ? { ...b, toolCalls: [...(b.toolCalls ?? []), event.tool] }
                    : b
                )
              );
            } else if (event.type === "mutatie") {
              setActiveTool(null);
              setBerichten((prev) =>
                prev.map((b) =>
                  b.id === assistantBericht.id
                    ? { ...b, mutaties: [...(b.mutaties ?? []), event.mutatie.details] }
                    : b
                )
              );
            } else if (event.type === "mutaties_klaar") {
              onMutatie?.();
            } else if (event.type === "error") {
              setBerichten((prev) =>
                prev.map((b) =>
                  b.id === assistantBericht.id
                    ? { ...b, content: b.content + `\n\nFout: ${event.error}` }
                    : b
                )
              );
            }
          } catch {
            // Ongeldige JSON — negeer
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setBerichten((prev) =>
        prev.map((b) =>
          b.id === assistantBericht.id
            ? { ...b, content: "Er ging iets mis bij het verbinden met de AI." }
            : b
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
      abortRef.current = null;
    }
  }, [input, isStreaming, berichten, scenarioId, versieId, onMutatie]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      verstuur();
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveTool(null);
  };

  // Tool naam naar Nederlands label
  const toolLabel = (tool: string): string => {
    const labels: Record<string, string> = {
      bekijk_huidige_indeling: "Indeling bekijken",
      bekijk_spelerspool: "Spelerspool bekijken",
      bekijk_speler_details: "Spelerdetails ophalen",
      bekijk_voorgaande_indeling: "Vorige indeling ophalen",
      bekijk_teamsterktes: "Competitiestanden ophalen",
      bekijk_evaluaties: "Evaluaties ophalen",
      bekijk_blauwdruk_kaders: "Blauwdruk bekijken",
      bekijk_pins: "Pins bekijken",
      bekijk_retentie_overzicht: "Retentie bekijken",
      bekijk_teamgenoten: "Teamgenoten ophalen",
      verplaats_speler: "Speler verplaatsen",
      voeg_speler_toe: "Speler toevoegen",
      verwijder_speler_uit_team: "Speler verwijderen",
      wissel_spelers: "Spelers wisselen",
      maak_team_aan: "Team aanmaken",
      valideer_teams: "Teams valideren",
    };
    return labels[tool] ?? tool;
  };

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          AI Assistent
        </button>
        {berichten.length > 0 && (
          <button
            onClick={() => {
              setBerichten([]);
              setInput("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Wis chat
          </button>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex flex-col" style={{ height: berichten.length > 0 ? "320px" : "auto" }}>
          {/* Berichten */}
          {berichten.length > 0 ? (
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
              {berichten.map((b) => (
                <div key={b.id}>
                  {b.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg bg-orange-50 px-3 py-2 text-sm text-gray-800">
                        {b.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[90%]">
                        {/* Tool indicators */}
                        {b.toolCalls && b.toolCalls.length > 0 && (
                          <div className="mb-1 flex flex-wrap gap-1">
                            {b.toolCalls.map((tool, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                              >
                                <svg
                                  className="h-2.5 w-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {toolLabel(tool)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Mutatie indicators */}
                        {b.mutaties && b.mutaties.length > 0 && (
                          <div className="mb-1 space-y-0.5">
                            {b.mutaties.map((m, i) => (
                              <div
                                key={i}
                                className="rounded bg-green-50 px-2 py-0.5 text-[10px] text-green-600"
                              >
                                ✓ {m}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tekst */}
                        {b.content && (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                            {b.content}
                          </div>
                        )}

                        {/* Streaming indicator */}
                        {isStreaming &&
                          b.id === berichten[berichten.length - 1]?.id &&
                          !b.content && (
                            <div className="flex items-center gap-2 py-1">
                              {activeTool ? (
                                <span className="animate-pulse text-xs text-gray-500">
                                  {toolLabel(activeTool)}...
                                </span>
                              ) : (
                                <span className="flex gap-1">
                                  <span
                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                                    style={{ animationDelay: "0ms" }}
                                  />
                                  <span
                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                                    style={{ animationDelay: "150ms" }}
                                  />
                                  <span
                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                                    style={{ animationDelay: "300ms" }}
                                  />
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400">
                Stel een vraag over de indeling, of geef een opdracht.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  "Toon de huidige indeling",
                  "Wie zit er in de spelerspool?",
                  "Hoe sterk zijn onze teams?",
                  "Zijn er retentierisico's?",
                ].map((suggestie) => (
                  <button
                    key={suggestie}
                    onClick={() => {
                      setInput(suggestie);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                  >
                    {suggestie}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-4 py-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Stel een vraag of geef een opdracht..."
                rows={1}
                className="flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
                style={{ maxHeight: "80px" }}
              />
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={verstuur}
                  disabled={!input.trim()}
                  className="shrink-0 rounded-md bg-orange-500 px-3 py-2 text-sm text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Verstuur
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
