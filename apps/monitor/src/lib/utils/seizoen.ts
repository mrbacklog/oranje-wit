export const HUIDIG_SEIZOEN = "2025-2026";

export function getSeizoen(searchParams: { seizoen?: string }): string {
  return searchParams.seizoen || HUIDIG_SEIZOEN;
}
