/* Helper functies voor de login pagina */

import { logger } from "@oranje-wit/types";

// ── E-mail domein naar deep-link mapping ──────────────────────────

export function getEmailDeepLinks(email: string): Array<{ label: string; url: string }> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return [];

  const links: Array<{ label: string; url: string }> = [];

  if (domain === "gmail.com" || domain.endsWith(".gmail.com")) {
    links.push({ label: "Open Gmail", url: "https://mail.google.com" });
  }
  if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.nl" ||
    domain === "live.com" ||
    domain === "msn.com"
  ) {
    links.push({ label: "Open Outlook", url: "https://outlook.live.com" });
  }
  if (domain === "icloud.com" || domain === "me.com" || domain === "mac.com") {
    links.push({ label: "Open iCloud Mail", url: "https://www.icloud.com/mail" });
  }

  return links;
}

// ── Passkey Detectie ──────────────────────────────────────────────

export async function isPasskeyBeschikbaar(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (!window.PublicKeyCredential) return false;
    if (!window.PublicKeyCredential.isConditionalMediationAvailable) return false;
    return await window.PublicKeyCredential.isConditionalMediationAvailable();
  } catch (error) {
    logger.warn("Passkey beschikbaarheid check mislukt:", error);
    return false;
  }
}

// ── Haptic feedback ────────────────────────────────────────────────

export function haptic(pattern: number | number[]): void {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    logger.warn("Haptic feedback niet ondersteund:", error);
  }
}

// ── Reduced motion check ──────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Stagger delays ───────────────────────────────────────────────

export function staggerDelay(index: number): string {
  if (prefersReducedMotion()) return "0ms";
  return `${index * 100}ms`;
}

// ── CSS Animaties ────────────────────────────────────────────────

export const loginAnimations = `
  @keyframes cardAppear {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideLeft {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes shakeError {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-8px); }
    30% { transform: translateX(8px); }
    45% { transform: translateX(-4px); }
    60% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
    90% { transform: translateX(2px); }
  }
  @keyframes passkeyPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.15); }
    50% { transform: scale(1.08); box-shadow: 0 0 24px 4px rgba(255, 107, 0, 0.12); }
  }
  @keyframes envelopeFly {
    0% { opacity: 0; transform: translateX(-20px) scale(0.8); }
    60% { opacity: 1; transform: translateX(4px) scale(1.05); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
  }
`;
