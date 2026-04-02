-- AlterEnum
ALTER TYPE "SeizoenStatus" ADD VALUE IF NOT EXISTS 'GEPLAND';

-- Zet historische seizoenen op AFGEROND (t/m 2024-2025, eind_jaar <= 2025)
UPDATE seizoenen SET status = 'AFGEROND' WHERE eind_jaar <= 2025;

-- Zet 2025-2026 op ACTIEF
UPDATE seizoenen SET status = 'ACTIEF' WHERE seizoen = '2025-2026';

-- 2026-2027 blijft VOORBEREIDING (default al goed)

-- Zet toekomstige seizoenen (2027+) op GEPLAND
UPDATE seizoenen SET status = 'GEPLAND' WHERE start_jaar >= 2027;
