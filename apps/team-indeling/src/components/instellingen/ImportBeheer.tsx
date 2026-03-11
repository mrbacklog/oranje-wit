import { Card, CardBody, CardHeader } from "@oranje-wit/ui";
import type { Import } from "@oranje-wit/database";

interface Props {
  imports: Import[];
}

export function ImportBeheer({ imports }: Props) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Importhistorie</h2>
      </CardHeader>
      <CardBody>
        {imports.length === 0 ? (
          <p className="text-sm text-gray-500">Geen imports gevonden.</p>
        ) : (
          <div className="space-y-2">
            {imports.map((imp) => (
              <div
                key={imp.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-900">
                  {new Date(imp.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs text-gray-500">
                  {imp.spelersNieuw} nieuw, {imp.spelersBijgewerkt} bijgewerkt, {imp.teamsGeladen}{" "}
                  teams
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
