export const dynamic = "force-dynamic";
import { PageContainer } from "@oranje-wit/ui";
import { getSpelersOverzicht } from "@/lib/monitor/queries/spelers";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import { SpelersZoeken } from "@/components/monitor/spelers/SpelersZoeken";

export default async function SpelersPage() {
  const spelers = await getSpelersOverzicht(HUIDIG_SEIZOEN);

  return (
    <PageContainer animated>
      <h1 className="text-text-primary mb-6 text-2xl font-bold">Spelers</h1>
      <SpelersZoeken spelers={spelers} />
    </PageContainer>
  );
}
