"use client";

import { useState } from "react";
import { createActiviteit } from "@/app/activiteiten/actions";
import { logger } from "@oranje-wit/types";

interface ActiviteitFormProps {
  spelerId: string;
  users: { id: string; naam: string }[];
  onCreated: () => void;
}

type FormType = "opmerking" | "actiepunt" | null;

export default function ActiviteitForm({ spelerId, users, onCreated }: ActiviteitFormProps) {
  const [formType, setFormType] = useState<FormType>(null);
  const [inhoud, setInhoud] = useState("");
  const [toegewezenAanId, setToegewezenAanId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setInhoud("");
    setToegewezenAanId("");
    setDeadline("");
    setFormType(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inhoud.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (formType === "opmerking") {
        await createActiviteit({
          type: "OPMERKING",
          inhoud: inhoud.trim(),
          spelerId,
        });
      } else if (formType === "actiepunt") {
        await createActiviteit({
          type: "ACTIEPUNT",
          inhoud: inhoud.trim(),
          spelerId,
          toegewezenAanId: toegewezenAanId || undefined,
          deadline: deadline || undefined,
        });
      }
      reset();
      onCreated();
    } catch (error) {
      logger.warn("Fout bij aanmaken activiteit:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-4">
      {/* Type-knoppen */}
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn-sm rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
            formType === "opmerking"
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setFormType(formType === "opmerking" ? null : "opmerking")}
        >
          Opmerking
        </button>
        <button
          type="button"
          className={`btn-sm rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
            formType === "actiepunt"
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setFormType(formType === "actiepunt" ? null : "actiepunt")}
        >
          Actiepunt
        </button>
      </div>

      {/* Opmerking formulier */}
      {formType === "opmerking" && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <textarea
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            placeholder="Opmerking toevoegen..."
            rows={2}
            className="input resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={reset}>
              Annuleer
            </button>
            <button
              type="submit"
              disabled={!inhoud.trim() || submitting}
              className="btn-primary btn-sm"
            >
              {submitting ? "Bezig..." : "Toevoegen"}
            </button>
          </div>
        </form>
      )}

      {/* Actiepunt formulier */}
      {formType === "actiepunt" && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <input
            type="text"
            value={inhoud}
            onChange={(e) => setInhoud(e.target.value)}
            placeholder="Beschrijving actiepunt..."
            className="input"
          />
          <div className="flex gap-2">
            <select
              value={toegewezenAanId}
              onChange={(e) => setToegewezenAanId(e.target.value)}
              className="input flex-1"
            >
              <option value="">Toewijzen aan...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.naam}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input w-40"
              placeholder="Deadline"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={reset}>
              Annuleer
            </button>
            <button
              type="submit"
              disabled={!inhoud.trim() || submitting}
              className="btn-primary btn-sm"
            >
              {submitting ? "Bezig..." : "Toevoegen"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
