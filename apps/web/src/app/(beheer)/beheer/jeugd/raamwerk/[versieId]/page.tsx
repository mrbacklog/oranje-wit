export const dynamic = "force-dynamic";

import { getRaamwerkDetail } from "./actions";
import { valideerRaamwerk } from "../actions";
import { BandEditor } from "./band-editor";

interface Props {
  params: Promise<{ versieId: string }>;
}

export default async function RaamwerkDetailPage({ params }: Props) {
  const { versieId } = await params;
  const versie = await getRaamwerkDetail(versieId);
  const validatie = await valideerRaamwerk(versieId);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {versie.naam}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Seizoen {versie.seizoen} &mdash; {versie.status}
        </p>
      </div>
      <BandEditor versie={versie} validatie={validatie} />
    </div>
  );
}
