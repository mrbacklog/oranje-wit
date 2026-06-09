import { describe, it, expect } from "vitest";
import { effectieveSpelerStatus, isAfmeldStatus } from "./speler-status";

describe("effectieveSpelerStatus", () => {
  it("gebruikt de basisstatus als er geen override is", () => {
    expect(effectieveSpelerStatus("BESCHIKBAAR", null)).toBe("BESCHIKBAAR");
    expect(effectieveSpelerStatus("TWIJFELT", undefined)).toBe("TWIJFELT");
  });

  it("laat een override winnen van een gewone basisstatus", () => {
    expect(effectieveSpelerStatus("BESCHIKBAAR", "ALGEMEEN_RESERVE")).toBe("ALGEMEEN_RESERVE");
    expect(effectieveSpelerStatus("TWIJFELT", "BESCHIKBAAR")).toBe("BESCHIKBAAR");
  });

  it("vergrendelt echte bondsafmeldingen — override wordt genegeerd", () => {
    expect(effectieveSpelerStatus("GAAT_STOPPEN", "BESCHIKBAAR")).toBe("GAAT_STOPPEN");
    expect(effectieveSpelerStatus("GESTOPT", "BESCHIKBAAR")).toBe("GESTOPT");
  });

  it("laat een override WEL winnen van NIET_SPELEND (geen afmelding)", () => {
    // Regressie: actief lid zonder Veld/Zaal-activiteit mag door de TC
    // beschikbaar gemaakt worden.
    expect(effectieveSpelerStatus("NIET_SPELEND", "BESCHIKBAAR")).toBe("BESCHIKBAAR");
  });

  it("valt terug op BESCHIKBAAR als alles leeg is", () => {
    expect(effectieveSpelerStatus(null, null)).toBe("BESCHIKBAAR");
  });
});

describe("isAfmeldStatus", () => {
  it("herkent alleen echte afmeldingen", () => {
    expect(isAfmeldStatus("GAAT_STOPPEN")).toBe(true);
    expect(isAfmeldStatus("GESTOPT")).toBe(true);
    expect(isAfmeldStatus("NIET_SPELEND")).toBe(false);
    expect(isAfmeldStatus("BESCHIKBAAR")).toBe(false);
    expect(isAfmeldStatus(null)).toBe(false);
  });
});
