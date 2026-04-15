-- Verwijder pin-functionaliteit volledig uit de applicatie.
-- Pin-systeem (SPELER_POSITIE, SPELER_STATUS, STAF_POSITIE, SPELER_GEPIND) is
-- uit de app verwijderd; deze migratie ruimt schema + data op.

DROP TABLE IF EXISTS "Pin";
DROP TYPE IF EXISTS "PinType";
