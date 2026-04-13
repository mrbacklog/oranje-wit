-- TC-status override op KadersSpeler
-- Overschrijft de Sportlink-status voor de werkindeling, wordt niet gereset bij import.
ALTER TABLE "KadersSpeler" ADD COLUMN "statusOverride" "SpelerStatus";
