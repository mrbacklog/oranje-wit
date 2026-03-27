import { Card, CardHeader, CardBody } from "@oranje-wit/ui";
import { getLedenTrend, getInstroomUitstroom } from "@/lib/queries/dashboard";
import { LedenTrend } from "@/components/charts/leden-trend";
import { InstroomUitstroom } from "@/components/charts/instroom-uitstroom";

export async function DashboardCharts() {
  const [ledenTrend, instroomUitstroom] = await Promise.all([
    getLedenTrend(),
    getInstroomUitstroom(),
  ]);

  const ledenTrendData = ledenTrend.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    totaal: s.totaal,
  }));

  const instroomUitstroomData = instroomUitstroom.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    isLopend: s.isLopend,
    instroom: s.instroom,
    uitstroom: s.uitstroom,
  }));

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h3
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Spelende leden per seizoen
          </h3>
        </CardHeader>
        <CardBody>
          <LedenTrend data={ledenTrendData} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Instroom vs. Uitstroom
          </h3>
        </CardHeader>
        <CardBody>
          <InstroomUitstroom data={instroomUitstroomData} />
        </CardBody>
      </Card>
    </div>
  );
}
