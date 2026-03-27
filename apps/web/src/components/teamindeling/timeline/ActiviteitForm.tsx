"use client";

import { useState } from "react";
import {
  createWerkitem,
  createActiepunt,
} from "@/app/(teamindeling)/teamindeling/werkbord/actions";
import { logger } from "@oranje-wit/types";

interface ActiviteitFormProps {
  spelerId: string;
  blauwdrukId: string;
  users: { id: string; naam: string }[];
  onCreated: () => void;
}

type FormType = "opmerking" | "actiepunt" | null;

export default function ActiviteitForm({
  spelerId,
  blauwdrukId,
  users,
  onCreated,
}: ActiviteitFormProps) {
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
        await createWerkitem({
          blauwdrukId,
          titel: inhoud.trim(),
          beschrijving: "",
          type: "SPELER",
          prioriteit: "INFO",
          entiteit: "SPELER",
          spelerId,
        });
      } else if (formType === "actiepunt") {
        const werkitem = await createWerkitem({
          blauwdrukId,
          titel: inhoud.trim(),
          beschrijving: "",
          type: "SPELER",
          prioriteit: "MIDDEL",
          entiteit: "SPELER",
          spelerId,
        });
        await createActiepunt({
          blauwdrukId,
          beschrijving: inhoud.trim(),
          werkitemId: werkitem.id,
          toegewezenAanId: toegewezenAanId || undefined,
          deadline: deadline || undefined,
        });
      }
      reset();
      onCreated();
    } catch (error) {
      logger.warn("Fout bij aanmaken werkitem:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-4">
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

      {formType === "opmerking" && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <textarea
            value={inhoud}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInhoud(e.target.value)}
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

      {formType === "actiepunt" && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
          <input
            type="text"
            value={inhoud}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInhoud(e.target.value)}
            placeholder="Beschrijving actiepunt..."
            className="input"
          />
          <div className="flex gap-2">
            <select
              value={toegewezenAanId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setToegewezenAanId(e.target.value)
              }
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
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
