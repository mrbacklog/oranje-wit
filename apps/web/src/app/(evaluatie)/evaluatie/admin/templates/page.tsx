"use client";

import { useEffect, useState } from "react";

interface Template {
  id: string;
  sleutel: string;
  onderwerp: string;
  inhoudHtml: string;
}

const VARIABELEN: Record<string, string[]> = {
  trainer_uitnodiging: ["trainer_naam", "team_naam", "deadline", "ronde_naam", "link"],
  trainer_herinnering: ["trainer_naam", "team_naam", "deadline", "link"],
  trainer_bevestiging: ["trainer_naam", "team_naam"],
  coordinator_notificatie: ["coordinator_naam", "trainer_naam", "team_naam", "link"],
  coordinator_uitnodiging: ["coordinator_naam", "ronde_naam", "team_namen", "link"],
  speler_uitnodiging: ["speler_naam", "deadline", "ronde_naam", "link"],
  speler_herinnering: ["speler_naam", "deadline", "link"],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editOnderwerp, setEditOnderwerp] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/evaluatie/templates")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTemplates(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function startEdit(t: Template) {
    setEditing(t.id);
    setEditOnderwerp(t.onderwerp);
    setEditHtml(t.inhoudHtml);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/evaluatie/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onderwerp: editOnderwerp, inhoudHtml: editHtml }),
    });
    const data = await res.json();
    if (data.ok) {
      setTemplates((prev) => prev.map((t) => (t.id === id ? data.data : t)));
      setEditing(null);
    }
    setSaving(false);
  }

  if (loading) return <p className="text-text-muted">Laden...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">E-mail templates</h1>
      <p className="text-text-muted text-sm">
        Gebruik {"{{variabele}}"} voor dynamische waarden. Beschikbare variabelen staan per template
        vermeld.
      </p>

      <div className="space-y-4">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t.sleutel}</h3>
                {VARIABELEN[t.sleutel] && (
                  <p className="text-text-muted mt-1 text-xs">
                    Variabelen: {VARIABELEN[t.sleutel].map((v) => `{{${v}}}`).join(", ")}
                  </p>
                )}
              </div>
              {editing !== t.id && (
                <button
                  onClick={() => startEdit(t)}
                  className="text-ow-oranje hover:text-ow-oranje-light text-sm"
                >
                  Bewerken
                </button>
              )}
            </div>

            {editing === t.id ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-text-secondary block text-xs font-medium">Onderwerp</label>
                  <input
                    value={editOnderwerp}
                    onChange={(e) => setEditOnderwerp(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    style={{
                      backgroundColor: "var(--surface-card)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-text-secondary block text-xs font-medium">
                    HTML-inhoud
                  </label>
                  <textarea
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    rows={8}
                    className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
                    style={{
                      backgroundColor: "var(--surface-card)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(t.id)}
                    disabled={saving}
                    className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {saving ? "Opslaan..." : "Opslaan"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="hover:bg-surface-raised rounded-md px-3 py-1.5 text-sm"
                    style={{ backgroundColor: "var(--surface-sunken)" }}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm">
                  <span className="text-text-muted">Onderwerp:</span> {t.onderwerp}
                </p>
                <div
                  className="text-text-secondary mt-1 max-h-24 overflow-hidden rounded p-2 text-xs"
                  style={{ backgroundColor: "var(--surface-sunken)" }}
                >
                  <div dangerouslySetInnerHTML={{ __html: t.inhoudHtml }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
