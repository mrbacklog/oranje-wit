import PDFDocument from "pdfkit";
import type {
  PreseasonPdfTeam,
  PublicatieInstellingen,
  PublicatieSectie,
} from "./preseason-pdf-data";

interface PdfInput {
  instellingen: PublicatieInstellingen;
  secties: PublicatieSectie[];
}

const ORANJE = "#f97316";
const DONKER = "#1f2937";
const GRIJS = "#6b7280";
const LICHT_GRIJS = "#e5e7eb";

export async function genereerPreseasonPdf(input: PdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, right: 48, bottom: 56, left: 48 },
    bufferPages: true,
    info: {
      Title: `${input.instellingen.titel} ${input.instellingen.seizoenLabel}`,
      Author: "c.k.v. Oranje Wit",
      Subject: "Pre-season teamindeling",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  schrijfCover(doc, input.instellingen);
  const inhoudsopgaveY = doc.y;
  const inhoudsopgave: { titel: string; pagina: number }[] = [];

  schrijfToelichting(doc, input.instellingen);

  for (const sectie of input.secties) {
    doc.addPage();
    inhoudsopgave.push({ titel: sectie.titel, pagina: huidigePagina(doc) });
    schrijfSectie(doc, sectie);
  }

  doc.addPage();
  inhoudsopgave.push({ titel: "Kangoeroes", pagina: huidigePagina(doc) });
  schrijfTekstPagina(doc, "Kangoeroes", input.instellingen.kangoeroesTekst);

  doc.addPage();
  inhoudsopgave.push({ titel: "Bedankt!", pagina: huidigePagina(doc) });
  schrijfTekstPagina(doc, "Bedankt!", input.instellingen.bedankTekst);

  schrijfInhoudsopgave(doc, inhoudsopgaveY, inhoudsopgave);
  schrijfPaginanummers(doc);

  doc.end();

  return result;
}

function huidigePagina(doc: PDFKit.PDFDocument): number {
  return doc.bufferedPageRange().count;
}

function schrijfCover(doc: PDFKit.PDFDocument, instellingen: PublicatieInstellingen) {
  schrijfHeader(doc);
  doc.moveDown(4);
  doc.font("Helvetica-Bold").fontSize(26).fillColor(DONKER).text(instellingen.titel, {
    align: "left",
  });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(18).fillColor(ORANJE).text(instellingen.seizoenLabel);
  doc.moveDown(2);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(DONKER).text("Inhoud");
  doc.moveDown(0.6);
}

function schrijfInhoudsopgave(
  doc: PDFKit.PDFDocument,
  y: number,
  inhoudsopgave: { titel: string; pagina: number }[]
) {
  doc.switchToPage(0);
  doc.y = y;
  doc.font("Helvetica-Bold").fontSize(15).fillColor(DONKER).text("Inhoud");
  doc.moveDown(0.6);
  doc.font("Helvetica").fontSize(11).fillColor(DONKER);

  for (const item of inhoudsopgave) {
    const startY = doc.y;
    doc.text(item.titel, doc.page.margins.left, startY, {
      width: 360,
      continued: false,
    });
    doc
      .fillColor(GRIJS)
      .text(String(item.pagina), doc.page.width - doc.page.margins.right - 40, startY, {
        width: 40,
        align: "right",
      })
      .fillColor(DONKER);
    doc.moveDown(0.45);
  }
}

function schrijfToelichting(doc: PDFKit.PDFDocument, instellingen: PublicatieInstellingen) {
  doc.addPage();
  schrijfTekstBlok(doc, "Toelichting", instellingen.introTekst);
  schrijfTekstBlok(doc, "Waarom een Pre-Season indeling?", instellingen.waaromTekst);
  schrijfTekstBlok(doc, "Hoe ontstaat een teamsamenstelling?", instellingen.werkwijzeTekst);
  schrijfTekstBlok(doc, "Competitie", instellingen.competitieTekst);
  schrijfTekstBlok(doc, "TC, Coordinatoren, Begeleiders en trainers", instellingen.tcTekst);
  schrijfTekstBlok(doc, "Kennismakingstrainingen", instellingen.kennismakingTekst);
  schrijfTekstBlok(doc, "Contact", instellingen.contactTekst);
}

function schrijfTekstPagina(doc: PDFKit.PDFDocument, titel: string, tekst: string) {
  schrijfHeader(doc);
  doc.font("Helvetica-Bold").fontSize(18).fillColor(DONKER).text(titel);
  doc.moveDown(0.8);
  schrijfParagraaf(doc, tekst);
}

function schrijfTekstBlok(doc: PDFKit.PDFDocument, titel: string, tekst: string) {
  ensureRuimte(doc, 130);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(DONKER).text(titel);
  doc.moveDown(0.35);
  schrijfParagraaf(doc, tekst);
  doc.moveDown(0.9);
}

function schrijfSectie(doc: PDFKit.PDFDocument, sectie: PublicatieSectie) {
  schrijfHeader(doc);
  doc.font("Helvetica-Bold").fontSize(19).fillColor(DONKER).text(sectie.titel);
  doc.moveDown(0.8);
  for (const team of sectie.teams) {
    schrijfTeam(doc, team);
  }
}

function schrijfTeam(doc: PDFKit.PDFDocument, team: PreseasonPdfTeam) {
  ensureRuimte(doc, 120);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(DONKER).text(team.naam);
  doc.moveDown(0.35);

  if (team.leden.length > 0) {
    for (const lid of team.leden) {
      ensureRuimte(doc, 95);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(GRIJS).text(lid.naam);
      schrijfSpelerKolommen(doc, lid.dames, lid.heren);
    }
  } else {
    schrijfSpelerKolommen(doc, team.dames, team.heren);
  }

  if (team.staf.length > 0) {
    ensureRuimte(doc, 24 + team.staf.length * 16);
    doc.moveDown(0.25);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(DONKER).text("Staf");
    doc.font("Helvetica").fontSize(9.5).fillColor(DONKER);
    for (const staf of team.staf) {
      const rolWeergave = staf.rolLabel?.trim() || staf.rol;
      const label = rolWeergave ? `${rolWeergave} ${staf.naam}` : staf.naam;
      doc.text(label);
    }
  }

  doc.moveDown(1);
  tekenLijn(doc);
  doc.moveDown(0.8);
}

function schrijfSpelerKolommen(doc: PDFKit.PDFDocument, dames: string[], heren: string[]) {
  const startX = doc.x;
  const startY = doc.y;
  const kolomGap = 24;
  const kolomBreedte =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right - kolomGap) / 2;
  const rijen = Math.max(dames.length, heren.length, 1);
  const benodigdeHoogte = 26 + rijen * 14;

  ensureRuimte(doc, benodigdeHoogte);

  doc.font("Helvetica-Bold").fontSize(10).fillColor(DONKER).text("Dames", startX, doc.y, {
    width: kolomBreedte,
  });
  doc.text("Heren", startX + kolomBreedte + kolomGap, startY, { width: kolomBreedte });
  doc.moveDown(0.35);

  const lijstStartY = doc.y;
  doc.font("Helvetica").fontSize(9.5).fillColor(DONKER);
  schrijfLijst(doc, dames, startX, lijstStartY, kolomBreedte);
  schrijfLijst(doc, heren, startX + kolomBreedte + kolomGap, lijstStartY, kolomBreedte);

  doc.x = startX;
  doc.y = lijstStartY + rijen * 14 + 4;
}

function schrijfLijst(
  doc: PDFKit.PDFDocument,
  namen: string[],
  x: number,
  y: number,
  width: number
) {
  if (namen.length === 0) {
    doc.fillColor(GRIJS).text("-", x, y, { width }).fillColor(DONKER);
    return;
  }
  namen.forEach((naam, index) => {
    doc.text(naam, x, y + index * 14, { width, lineBreak: false });
  });
}

function schrijfParagraaf(doc: PDFKit.PDFDocument, tekst: string) {
  doc.font("Helvetica").fontSize(11).fillColor(DONKER).text(tekst, {
    lineGap: 3,
    align: "left",
  });
}

function schrijfHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, 28).fill(ORANJE);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#ffffff")
    .text("c.k.v. Oranje Wit", doc.page.margins.left, 9, { lineBreak: false });
  doc.y = doc.page.margins.top;
  doc.x = doc.page.margins.left;
}

function schrijfPaginanummers(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GRIJS)
      .text(`Pre-season Teamindeling | ${i + 1}`, doc.page.margins.left, doc.page.height - 34, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "right",
      });
  }
}

function ensureRuimte(doc: PDFKit.PDFDocument, hoogte: number) {
  const ondergrens = doc.page.height - doc.page.margins.bottom;
  if (doc.y + hoogte > ondergrens) {
    doc.addPage();
    schrijfHeader(doc);
  }
}

function tekenLijn(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(LICHT_GRIJS)
    .lineWidth(0.8)
    .stroke();
}
