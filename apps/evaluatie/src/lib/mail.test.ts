import { describe, it, expect } from "vitest";
import { renderTemplate } from "./mail";

describe("renderTemplate", () => {
  it("vervangt enkele placeholder", () => {
    const result = renderTemplate("<p>Hoi {{naam}}</p>", { naam: "Jan" });
    expect(result).toBe("<p>Hoi Jan</p>");
  });

  it("vervangt meerdere placeholders", () => {
    const html = "<p>{{naam}} speelt in {{team}}</p>";
    const result = renderTemplate(html, { naam: "Jan", team: "J1" });
    expect(result).toBe("<p>Jan speelt in J1</p>");
  });

  it("laat onbekende placeholders staan", () => {
    const result = renderTemplate("{{naam}} {{onbekend}}", { naam: "Jan" });
    expect(result).toBe("Jan {{onbekend}}");
  });

  it("vervangt dezelfde placeholder meerdere keren", () => {
    const result = renderTemplate("{{naam}} en {{naam}}", { naam: "Jan" });
    expect(result).toBe("Jan en Jan");
  });

  it("werkt met lege variabelen", () => {
    const result = renderTemplate("Geen variabelen hier", {});
    expect(result).toBe("Geen variabelen hier");
  });
});
