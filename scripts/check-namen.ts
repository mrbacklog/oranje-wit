import { prisma } from "@oranje-wit/database";
async function main() {
  const spelers = await prisma.speler.findMany({
    where: {
      OR: [{ roepnaam: { contains: "Eva" } }, { roepnaam: { contains: "Feline" } }],
    },
    select: { id: true, roepnaam: true, achternaam: true },
  });
  // tussenvoegsel zit in Lid tabel
  const leden = await prisma.lid.findMany({
    where: { relCode: { in: spelers.map((s) => s.id) } },
    select: { relCode: true, tussenvoegsel: true, voornaam: true, achternaam: true },
  });
  const lidMap = new Map(leden.map((l) => [l.relCode, l]));
  for (const s of spelers) {
    const lid = lidMap.get(s.id);
    console.log(
      `${s.roepnaam} | speler.achternaam="${s.achternaam}" | lid.tussenvoegsel="${lid?.tussenvoegsel ?? ""}" | lid.achternaam="${lid?.achternaam ?? ""}"`
    );
  }
  await prisma.$disconnect();
}
main();
