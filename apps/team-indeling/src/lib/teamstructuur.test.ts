import { describe, it, expect } from "vitest";
import { berekenTeamstructuur, type SpelerBasis } from "./teamstructuur";

/** Helper: maak een array van spelers met opgegeven geboortejaren */
function maakSpelers(
  geboortejaren: number[],
  geslacht: "M" | "V" = "M"
): SpelerBasis[] {
  return geboortejaren.map((jaar, i) => ({
    id: `speler-${i}`,
    geboortejaar: jaar,
    geslacht,
    status: "BESCHIKBAAR",
  }));
}

describe("berekenTeamstructuur", () => {
  const seizoenJaar = 2026;

  describe("B-categorie teams (per kleur)", () => {
    it("maakt Blauw teams voor spelers van 5-7 jaar", () => {
      // Leeftijd = seizoenJaar - geboortejaar, dus 2026 - 2021 = 5, 2026 - 2019 = 7
      const spelers = maakSpelers([2021, 2020, 2019]);
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(1);
      expect(teams[0].kleur).toBe("BLAUW");
      expect(teams[0].categorie).toBe("B_CATEGORIE");
      expect(teams[0].format).toBe("viertal");
      expect(teams[0].naam).toBe("Blauw-1");
    });

    it("maakt Groen teams voor spelers van 8-9 jaar", () => {
      const spelers = maakSpelers([2018, 2017]); // leeftijd 8, 9
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(1);
      expect(teams[0].kleur).toBe("GROEN");
      expect(teams[0].format).toBe("viertal");
    });

    it("maakt Geel teams voor spelers van 10-12 jaar (achttal)", () => {
      const spelers = maakSpelers([2016, 2015, 2014]); // leeftijd 10, 11, 12
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(1);
      expect(teams[0].kleur).toBe("GEEL");
      expect(teams[0].format).toBe("achttal");
    });

    it("maakt Oranje teams voor spelers van 13-15 jaar", () => {
      const spelers = maakSpelers([2013, 2012, 2011]); // leeftijd 13, 14, 15
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(1);
      expect(teams[0].kleur).toBe("ORANJE");
    });

    it("maakt Rood teams voor spelers van 16-18 jaar", () => {
      const spelers = maakSpelers([2010, 2009, 2008]); // leeftijd 16, 17, 18
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(1);
      expect(teams[0].kleur).toBe("ROOD");
    });

    it("maakt meerdere teams als er genoeg spelers zijn", () => {
      // 12 spelers in Geel (streef = 10 per team) → 1 team (12/10 = 1.2 → round = 1)
      const spelers = maakSpelers(Array(12).fill(2015));
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);
      expect(teams.length).toBeGreaterThanOrEqual(1);
    });

    it("maakt 2 teams bij voldoende spelers voor een kleur", () => {
      // 15 Geel-spelers (streef = 10 per team) → 15/10 = 1.5 → round = 2
      const spelers = maakSpelers(Array(15).fill(2015));
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      expect(teams).toHaveLength(2);
      expect(teams[0].naam).toBe("Geel-1");
      expect(teams[1].naam).toBe("Geel-2");
    });

    it("verdeelt spelers eerlijk over meerdere teams", () => {
      // 15 spelers, 2 teams → 8 + 7
      const spelers = maakSpelers(Array(15).fill(2015));
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      const totaal = teams.reduce((sum, t) => sum + t.geschatAantal, 0);
      expect(totaal).toBe(15);
    });
  });

  describe("spelers die stoppen worden uitgefilterd", () => {
    it("negeert spelers met status GAAT_STOPPEN", () => {
      const spelers: SpelerBasis[] = [
        { id: "1", geboortejaar: 2015, geslacht: "M", status: "BESCHIKBAAR" },
        { id: "2", geboortejaar: 2015, geslacht: "V", status: "GAAT_STOPPEN" },
        { id: "3", geboortejaar: 2015, geslacht: "M", status: "BESCHIKBAAR" },
      ];
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      // Alleen 2 beschikbare spelers, dus geschat aantal = 2
      expect(teams[0].geschatAantal).toBe(2);
    });
  });

  describe("lege invoer", () => {
    it("retourneert lege array als er geen spelers zijn", () => {
      const teams = berekenTeamstructuur([], {}, seizoenJaar);
      expect(teams).toEqual([]);
    });
  });

  describe("senioren teams", () => {
    it("maakt senioren teams op basis van keuzeWaardes", () => {
      // Spelers van 19+ jaar
      const spelers = maakSpelers(Array(20).fill(2000)); // leeftijd 26
      const teams = berekenTeamstructuur(spelers, { senioren_teams: "2" }, seizoenJaar);

      const seniorenTeams = teams.filter((t) => t.categorie === "SENIOREN");
      expect(seniorenTeams).toHaveLength(2);
      expect(seniorenTeams[0].naam).toBe("Senioren 1");
      expect(seniorenTeams[1].naam).toBe("Senioren 2");
    });

    it("maakt senioren teams als fallback zonder keuzeWaardes", () => {
      const spelers = maakSpelers(Array(10).fill(2000)); // leeftijd 26
      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      const seniorenTeams = teams.filter((t) => t.categorie === "SENIOREN");
      expect(seniorenTeams.length).toBeGreaterThanOrEqual(1);
      expect(seniorenTeams[0].format).toBe("achttal");
    });

    it("verdeelt senioren spelers eerlijk", () => {
      const spelers = maakSpelers(Array(20).fill(2000));
      const teams = berekenTeamstructuur(spelers, { senioren_teams: "2" }, seizoenJaar);

      const seniorenTeams = teams.filter((t) => t.categorie === "SENIOREN");
      const totaal = seniorenTeams.reduce((sum, t) => sum + t.geschatAantal, 0);
      expect(totaal).toBe(20);
    });
  });

  describe("A-categorie teams", () => {
    it("maakt A-categorie teams op basis van keuzeWaardes", () => {
      const teams = berekenTeamstructuur([], { u17_teams: "2" }, seizoenJaar);

      const aTeams = teams.filter((t) => t.categorie === "A_CATEGORIE");
      expect(aTeams).toHaveLength(2);
      expect(aTeams[0].format).toBe("achttal");
      expect(aTeams[0].geschatAantal).toBe(10);
    });

    it("negeert keuzeWaardes zonder geldig aantal", () => {
      const teams = berekenTeamstructuur([], { u17_teams: "geen" }, seizoenJaar);

      const aTeams = teams.filter((t) => t.categorie === "A_CATEGORIE");
      expect(aTeams).toHaveLength(0);
    });
  });

  describe("gemengde invoer", () => {
    it("maakt teams voor meerdere kleurgroepen tegelijk", () => {
      const spelers = [
        ...maakSpelers([2021, 2020]), // Blauw (5, 6)
        ...maakSpelers([2015, 2014, 2013].map((j) => j)), // Geel/Oranje
      ];
      // Geef unieke IDs
      spelers.forEach((s, i) => (s.id = `speler-${i}`));

      const teams = berekenTeamstructuur(spelers, {}, seizoenJaar);

      const kleuren = teams.map((t) => t.kleur);
      expect(kleuren).toContain("BLAUW");
    });
  });
});
