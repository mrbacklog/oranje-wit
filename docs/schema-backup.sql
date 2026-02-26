-- Schema: c.k.v. Oranje Wit — Verenigingsdata
-- Versie: 1.0
-- Database: PostgreSQL 16 op Railway

-- Permanente ledenrecords (1 rij per lid, ooit ingeschreven)
CREATE TABLE leden (
  rel_code      TEXT PRIMARY KEY,
  roepnaam      TEXT NOT NULL,
  achternaam    TEXT NOT NULL,
  tussenvoegsel TEXT,
  geslacht      TEXT NOT NULL CHECK (geslacht IN ('M', 'V')),
  geboortejaar  INTEGER NOT NULL,
  lid_sinds     DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Seizoenen
CREATE TABLE seizoenen (
  seizoen     TEXT PRIMARY KEY,
  start_jaar  INTEGER NOT NULL,
  eind_jaar   INTEGER NOT NULL
);

-- Snapshot metadata
CREATE TABLE snapshots (
  id              SERIAL PRIMARY KEY,
  snapshot_datum  DATE NOT NULL UNIQUE,
  seizoen         TEXT NOT NULL REFERENCES seizoenen(seizoen),
  totaal_leden    INTEGER,
  totaal_spelers  INTEGER,
  bronnen         TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Lid-status per snapshot (point-in-time)
CREATE TABLE leden_snapshot (
  id                  SERIAL PRIMARY KEY,
  snapshot_id         INTEGER NOT NULL REFERENCES snapshots(id),
  rel_code            TEXT NOT NULL REFERENCES leden(rel_code),
  lidsoort            TEXT,
  spelactiviteit      TEXT,
  status              TEXT,
  team                TEXT,
  ow_code             TEXT,
  teamrol             TEXT,
  categorie           TEXT CHECK (categorie IS NULL OR categorie IN ('a', 'b')),
  kleur               TEXT,
  a_categorie         TEXT,
  a_jaars             TEXT,
  leeftijd_peildatum  INTEGER,
  pool_veld           TEXT,
  pool_zaal           TEXT,
  UNIQUE(snapshot_id, rel_code)
);

-- Teams per seizoen (stabiel via ow_code)
CREATE TABLE teams (
  id              SERIAL PRIMARY KEY,
  seizoen         TEXT NOT NULL REFERENCES seizoenen(seizoen),
  ow_code         TEXT NOT NULL,
  categorie       TEXT NOT NULL CHECK (categorie IN ('a', 'b')),
  kleur           TEXT,
  leeftijdsgroep  TEXT,
  spelvorm        TEXT,
  UNIQUE(seizoen, ow_code)
);

-- Team-periodedata (J-nummer, pool, sterkte per competitiefase)
CREATE TABLE team_periodes (
  id              SERIAL PRIMARY KEY,
  team_id         INTEGER NOT NULL REFERENCES teams(id),
  periode         TEXT NOT NULL CHECK (periode IN ('veld_najaar','zaal_deel1','zaal_deel2','veld_voorjaar')),
  j_nummer        TEXT,
  pool            TEXT,
  sterkte         INTEGER,
  gem_leeftijd    NUMERIC(5,2),
  aantal_spelers  INTEGER,
  UNIQUE(team_id, periode)
);

-- Spelerspaden (longitudinaal: speler × seizoen)
CREATE TABLE spelerspaden (
  id          SERIAL PRIMARY KEY,
  speler_id   TEXT NOT NULL,
  seizoen     TEXT NOT NULL REFERENCES seizoenen(seizoen),
  team        TEXT,
  ow_code     TEXT,
  categorie   TEXT,
  rol         TEXT DEFAULT 'speler',
  UNIQUE(speler_id, seizoen)
);

-- Ledenverloop (individueel per seizoenspaar)
CREATE TABLE ledenverloop (
  id              SERIAL PRIMARY KEY,
  seizoen         TEXT NOT NULL REFERENCES seizoenen(seizoen),
  rel_code        TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('behouden','nieuw','herinschrijver','uitgestroomd','niet_spelend_geworden')),
  geboortejaar    INTEGER,
  geslacht        TEXT,
  leeftijd_vorig  INTEGER,
  leeftijd_nieuw  INTEGER,
  team_vorig      TEXT,
  team_nieuw      TEXT,
  UNIQUE(seizoen, rel_code)
);

-- Cohorten (geboortejaar × geslacht × seizoen)
CREATE TABLE cohort_seizoenen (
  id              SERIAL PRIMARY KEY,
  geboortejaar    INTEGER NOT NULL,
  geslacht        TEXT NOT NULL CHECK (geslacht IN ('M', 'V')),
  seizoen         TEXT NOT NULL REFERENCES seizoenen(seizoen),
  leeftijd        INTEGER,
  band            TEXT,
  actief          INTEGER DEFAULT 0,
  behouden        INTEGER DEFAULT 0,
  nieuw           INTEGER DEFAULT 0,
  herinschrijver  INTEGER DEFAULT 0,
  uitgestroomd    INTEGER DEFAULT 0,
  retentie_pct    NUMERIC(5,2),
  UNIQUE(geboortejaar, geslacht, seizoen)
);

-- Signalering (alerts per seizoen)
CREATE TABLE signalering (
  id              SERIAL PRIMARY KEY,
  seizoen         TEXT NOT NULL REFERENCES seizoenen(seizoen),
  type            TEXT NOT NULL,
  ernst           TEXT NOT NULL CHECK (ernst IN ('kritiek', 'aandacht', 'op_koers')),
  leeftijdsgroep  TEXT,
  geslacht        TEXT,
  waarde          NUMERIC,
  drempel         NUMERIC,
  streef          NUMERIC,
  beschrijving    TEXT
);

-- Streefmodel (projecties per leeftijd × doelseizoen)
CREATE TABLE streefmodel (
  id              SERIAL PRIMARY KEY,
  versie          TEXT NOT NULL,
  seizoen_basis   TEXT NOT NULL,
  seizoen_doel    TEXT NOT NULL,
  leeftijd        INTEGER NOT NULL,
  band            TEXT NOT NULL,
  totaal          INTEGER,
  m               INTEGER,
  v               INTEGER,
  UNIQUE(versie, seizoen_doel, leeftijd)
);

-- Indexen
CREATE INDEX idx_leden_snapshot_snapshot ON leden_snapshot(snapshot_id);
CREATE INDEX idx_leden_snapshot_relcode ON leden_snapshot(rel_code);
CREATE INDEX idx_leden_snapshot_owcode ON leden_snapshot(ow_code);
CREATE INDEX idx_spelerspaden_speler ON spelerspaden(speler_id);
CREATE INDEX idx_spelerspaden_seizoen ON spelerspaden(seizoen);
CREATE INDEX idx_ledenverloop_seizoen ON ledenverloop(seizoen);
CREATE INDEX idx_cohort_seizoen ON cohort_seizoenen(seizoen);
CREATE INDEX idx_teams_seizoen ON teams(seizoen);
CREATE INDEX idx_team_periodes_team ON team_periodes(team_id);
CREATE INDEX idx_signalering_seizoen ON signalering(seizoen);
