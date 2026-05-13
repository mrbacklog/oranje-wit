import { getKaderPaginaData } from "@/lib/kader-queries";
import { KaderPagina } from "@/components/kader/KaderPagina";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export default async function KaderPage() {
  const data = await getKaderPaginaData(HUIDIG_SEIZOEN);
  return <KaderPagina data={data} />;
}
