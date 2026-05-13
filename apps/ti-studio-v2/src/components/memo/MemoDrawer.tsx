"use client";

// apps/ti-studio-v2/src/components/memo/MemoDrawer.tsx

import { useEffect, useState } from "react";
import { getMemoDetail } from "@/actions/memo-actions";
import type { MemoDetailData } from "./types";
import { PRIO_KLEUR, PRIO_LABEL } from "@/lib/constants/memo-constants";
import { TijdlijnItemComponent } from "./TijdlijnItemComponent";

interface MemoDrawerProps {
  memoId: string | null;
  onSluiten: () => void;
}

function entiteitLabel(entiteit: string | null): string {
  if (!entiteit || entiteit === "BLAUWDRUK") return "TC";
  return entiteit;
}

function entiteitKlasse(entiteit: string | null): string {
  if (!entiteit || entiteit === "BLAUWDRUK") return "ENTITEIT_TC";
  return entiteit;
}

export function MemoDrawer({ memoId, onSluiten }: MemoDrawerProps) {
  const [detail, setDetail] = useState<MemoDetailData | null>(null);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    if (!memoId) {
      setDetail(null);
      return;
    }
    setLaden(true);
    setFout(null);
    getMemoDetail(memoId).then((result) => {
      setLaden(false);
      if (result.ok) {
        setDetail(result.data);
      } else {
        setFout(result.error);
      }
    });
  }, [memoId]);

  const isOpen = memoId !== null;

  return (
    <div
      className={`memo-drawer${isOpen ? "open" : ""}`}
      role="complementary"
      aria-label="Memo detail"
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <div className="drawer-header-links">
          {detail && (
            <>
              <span className={`mk-entiteit ${entiteitKlasse(detail.entiteit)}`}>
                {entiteitLabel(detail.entiteit)}
              </span>
              {detail.entiteitLabel && (
                <span className="drawer-entiteit-naam">{detail.entiteitLabel}</span>
              )}
            </>
          )}
        </div>
        <button className="drawer-sluit-btn" onClick={onSluiten} aria-label="Drawer sluiten">
          ×
        </button>
      </div>

      <div className="drawer-body ow-scroll">
        {laden && (
          <div className="drawer-laden">
            <span className="drawer-laden-tekst">Laden…</span>
          </div>
        )}
        {fout && <div className="drawer-fout">{fout}</div>}
        {detail && !laden && (
          <>
            {/* Prioriteit + status badges */}
            <div className="drawer-badges">
              <span
                className="drawer-prio-badge"
                style={{ background: PRIO_KLEUR[detail.prioriteit] }}
              >
                {PRIO_LABEL[detail.prioriteit]} {detail.prioriteit}
              </span>
              <span className="drawer-status-badge">{detail.status}</span>
            </div>

            {/* Titel */}
            <h2 className="drawer-titel">{detail.titel ?? detail.beschrijving.slice(0, 60)}</h2>

            {/* Beschrijving */}
            <div className="drawer-sectie">
              <div className="drawer-sectie-label">Beschrijving</div>
              <p className="drawer-beschrijving">{detail.beschrijving}</p>
            </div>

            {/* Resolutie-blok (alleen bij done-statussen) */}
            {(detail.status === "OPGELOST" || detail.status === "GEACCEPTEERD_RISICO") && (
              <div className="drawer-sectie drawer-sectie-resolutie">
                <div className="drawer-sectie-label">
                  {detail.status === "OPGELOST" ? "Resolutie" : "Geaccepteerd risico"}
                </div>
                <p className="drawer-beschrijving drawer-muted">Geen toelichting opgeslagen.</p>
              </div>
            )}

            {/* Tijdlijn */}
            <div className="drawer-sectie">
              <div className="drawer-sectie-label">Tijdlijn ({detail.tijdlijn.length})</div>
              {detail.tijdlijn.length === 0 ? (
                <p className="drawer-muted">Nog geen activiteit.</p>
              ) : (
                <div className="tl-lijst">
                  {detail.tijdlijn.map((item, i) => (
                    <TijdlijnItemComponent
                      key={item.id}
                      item={item}
                      isLaatste={i === detail.tijdlijn.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Toelichting input placeholder (Backlog) */}
            <div className="drawer-toelichting-stub">
              <textarea
                className="drawer-toelichting-input"
                placeholder="Toelichting toevoegen… (nog niet beschikbaar)"
                disabled
                rows={3}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
