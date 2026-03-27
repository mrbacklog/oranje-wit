"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import { LeeftijdsgroepBadge } from "./leeftijdsgroep-badge";

/** Zoekresultaat type vanuit de API */
export interface SpelerZoekResultaat {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht: string;
  geboortejaar: number;
  leeftijd: number;
  kleur: string;
  team: string | null;
  heeftFoto: boolean;
}

interface SpelerZoekProps {
  onSelect: (speler: SpelerZoekResultaat) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Debounce hook */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function SpelerZoek({
  onSelect,
  placeholder = "Zoek op naam...",
  autoFocus = false,
}: SpelerZoekProps) {
  const [query, setQuery] = useState("");
  const [resultaten, setResultaten] = useState<SpelerZoekResultaat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [heeftGezocht, setHeeftGezocht] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const zoek = useCallback(async (zoekterm: string) => {
    if (zoekterm.length < 1) {
      setResultaten([]);
      setHeeftGezocht(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/scouting/spelers/zoek?q=${encodeURIComponent(zoekterm)}`);
      const data = await res.json();

      if (data.ok && data.data) {
        setResultaten(data.data);
      } else {
        setResultaten([]);
        logger.warn("[zoek] API fout:", data.error);
      }
    } catch (error) {
      logger.warn("[zoek] Fetch fout:", error);
      setResultaten([]);
    } finally {
      setIsLoading(false);
      setHeeftGezocht(true);
    }
  }, []);

  useEffect(() => {
    zoek(debouncedQuery);
  }, [debouncedQuery, zoek]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="flex flex-col gap-3">
      {/* Zoekbalk */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon />
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="touch-target bg-surface-elevated text-text-primary placeholder:text-text-muted focus:ring-ow-oranje/50 w-full rounded-xl py-3 pr-4 pl-10 focus:ring-2 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="border-ow-oranje h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Resultaten */}
      {isLoading && !resultaten.length && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      )}

      {!isLoading && heeftGezocht && resultaten.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-text-muted text-sm">Geen spelers gevonden</p>
          <p className="text-text-muted mt-1 text-xs">Probeer een andere zoekterm</p>
        </div>
      )}

      {resultaten.length > 0 && (
        <ul className="flex flex-col gap-1">
          {resultaten.map((speler) => (
            <li key={speler.relCode}>
              <button
                type="button"
                onClick={() => onSelect(speler)}
                className="touch-target active:bg-surface-elevated flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
              >
                {/* Foto circle */}
                <SpelerAvatar
                  relCode={speler.relCode}
                  roepnaam={speler.roepnaam}
                  achternaam={speler.achternaam}
                  heeftFoto={speler.heeftFoto}
                  size={40}
                />

                {/* Naam + info */}
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate font-medium">
                    {speler.roepnaam} {speler.achternaam}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {speler.team && (
                      <span className="text-text-secondary truncate text-xs">{speler.team}</span>
                    )}
                  </div>
                </div>

                {/* Leeftijdsgroep badge */}
                <LeeftijdsgroepBadge kleur={speler.kleur} leeftijd={speler.leeftijd} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Speler avatar met foto of initialen */
export function SpelerAvatar({
  relCode,
  roepnaam,
  achternaam,
  heeftFoto,
  size = 40,
}: {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  heeftFoto: boolean;
  size?: number;
}) {
  const initialen = `${roepnaam.charAt(0)}${achternaam.charAt(0)}`.toUpperCase();

  if (heeftFoto) {
    return (
      <img
        src={`/api/scouting/spelers/${relCode}/foto`}
        alt={`${roepnaam} ${achternaam}`}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="bg-surface-elevated text-text-secondary flex items-center justify-center rounded-full text-sm font-semibold"
      style={{ width: size, height: size }}
    >
      {initialen}
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="bg-surface-elevated h-10 w-10 animate-pulse rounded-full" />
      <div className="flex-1">
        <div className="bg-surface-elevated h-4 w-32 animate-pulse rounded" />
        <div className="bg-surface-elevated mt-1 h-3 w-20 animate-pulse rounded" />
      </div>
      <div className="bg-surface-elevated h-5 w-16 animate-pulse rounded-full" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="text-text-muted h-5 w-5" strokeWidth={1.5}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
