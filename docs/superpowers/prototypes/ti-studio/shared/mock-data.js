/**
 * mock-data.js — Gedeeld fictief data-universum voor alle TI Studio prototypes
 * Alle namen, rel_codes en gegevens zijn fictief.
 */

// ── Hulpfunctie: leeftijdklasse ───────────────────────────────────────────────
function leeftijdKlasse(leeftijd) {
  if (leeftijd < 6)  return 'paars';
  if (leeftijd < 8)  return 'blauw';
  if (leeftijd < 10) return 'groen';
  if (leeftijd < 13) return 'geel';
  if (leeftijd < 16) return 'oranje';
  if (leeftijd < 19) return 'rood';
  return 'senior';
}

// ── SPELERS ───────────────────────────────────────────────────────────────────
export const SPELERS = [
  {
    id: 'sp-001', rel_code: 'RC-0001', roepnaam: 'Freek', achternaam: 'Laban',
    tussenvoegsel: 'van der', geslacht: 'M', leeftijd: 17.41,
    huidigTeam: 'team-001', ingedeeldTeam: 'team-001',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    ussScore: 8.4, gezien: true, memoCount: 1,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW A1', kleur: 'rood' },
      { seizoen: '2024-25', team: 'OW A2', kleur: 'rood' },
      { seizoen: '2023-24', team: 'OW B1', kleur: 'oranje' },
    ],
  },
  {
    id: 'sp-002', rel_code: 'RC-0002', roepnaam: 'Noor', achternaam: 'Bos',
    tussenvoegsel: 'de', geslacht: 'V', leeftijd: 14.12,
    huidigTeam: 'team-002', ingedeeldTeam: null,
    status: 'TWIJFELT', fotoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    ussScore: 7.2, gezien: true, memoCount: 2,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW B1', kleur: 'oranje' },
      { seizoen: '2024-25', team: 'OW B2', kleur: 'oranje' },
    ],
  },
  {
    id: 'sp-003', rel_code: 'RC-0003', roepnaam: 'Emma', achternaam: 'Dijk',
    tussenvoegsel: 'van', geslacht: 'V', leeftijd: 16.03,
    huidigTeam: 'team-001', ingedeeldTeam: 'team-001',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
    ussScore: 7.8, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW A1', kleur: 'rood' },
      { seizoen: '2024-25', team: 'OW A1', kleur: 'rood' },
    ],
  },
  {
    id: 'sp-004', rel_code: 'RC-0004', roepnaam: 'Tim', achternaam: 'Jansen',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 10.24,
    huidigTeam: null, ingedeeldTeam: null,
    status: 'NIEUW', fotoUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    ussScore: null, gezien: false, memoCount: 0,
    spelerspad: [],
  },
  {
    id: 'sp-005', rel_code: 'RC-0005', roepnaam: 'Jens', achternaam: 'Klein',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 8.73,
    huidigTeam: 'team-003', ingedeeldTeam: 'team-003',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/72.jpg',
    ussScore: 5.9, gezien: false, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW D1', kleur: 'groen' },
    ],
  },
  {
    id: 'sp-006', rel_code: 'RC-0006', roepnaam: 'Eva', achternaam: 'Mulder',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 11.05,
    huidigTeam: 'team-004', ingedeeldTeam: 'team-004',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/33.jpg',
    ussScore: 6.5, gezien: true, memoCount: 1,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW E1', kleur: 'geel' },
      { seizoen: '2024-25', team: 'OW E2', kleur: 'geel' },
    ],
  },
  {
    id: 'sp-007', rel_code: 'RC-0007', roepnaam: 'Lisa', achternaam: 'Berg',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 18.22,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    // eerder ook in team-001 geplaatst — nu alleen in Senioren A
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    ussScore: 9.1, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2023-24', team: 'OW A1', kleur: 'rood' },
    ],
  },
  {
    id: 'sp-008', rel_code: 'RC-0008', roepnaam: 'Mark', achternaam: 'Groot',
    tussenvoegsel: 'de', geslacht: 'M', leeftijd: 19.04,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/18.jpg',
    ussScore: 8.8, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren A', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-009', rel_code: 'RC-0009', roepnaam: 'Sanne', achternaam: 'Koster',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 13.66,
    huidigTeam: 'team-002', ingedeeldTeam: 'team-002',
    status: 'GEBLESSEERD', fotoUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
    ussScore: 7.0, gezien: true, memoCount: 3,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW B1', kleur: 'oranje' },
      { seizoen: '2024-25', team: 'OW B1', kleur: 'oranje' },
    ],
  },
  {
    id: 'sp-010', rel_code: 'RC-0010', roepnaam: 'Daan', achternaam: 'Visser',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 15.88,
    huidigTeam: 'team-001', ingedeeldTeam: 'team-001',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/38.jpg',
    ussScore: 8.2, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW A1', kleur: 'rood' },
      { seizoen: '2024-25', team: 'OW A2', kleur: 'rood' },
    ],
  },
  {
    id: 'sp-011', rel_code: 'RC-0011', roepnaam: 'Lotte', achternaam: 'Hendriks',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 9.55,
    huidigTeam: 'team-003', ingedeeldTeam: 'team-003',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/28.jpg',
    ussScore: 6.1, gezien: false, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW D1', kleur: 'groen' },
    ],
  },
  {
    id: 'sp-012', rel_code: 'RC-0012', roepnaam: 'Ruben', achternaam: 'Hoekstra',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 19.71,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    status: 'GAAT_STOPPEN', fotoUrl: 'https://randomuser.me/api/portraits/men/61.jpg',
    ussScore: 7.5, gezien: true, memoCount: 1,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2023-24', team: 'Senioren A', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-013', rel_code: 'RC-0013', roepnaam: 'Fien', achternaam: 'Bogaard',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 12.33,
    huidigTeam: 'team-004', ingedeeldTeam: null,
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/67.jpg',
    ussScore: 6.8, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW E1', kleur: 'geel' },
    ],
  },
  {
    id: 'sp-014', rel_code: 'RC-0014', roepnaam: 'Sem', achternaam: 'Peters',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 11.78,
    huidigTeam: 'team-004', ingedeeldTeam: 'team-004',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/24.jpg',
    ussScore: 6.3, gezien: false, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW E1', kleur: 'geel' },
      { seizoen: '2024-25', team: 'OW F1', kleur: 'geel' },
    ],
  },
  {
    id: 'sp-015', rel_code: 'RC-0015', roepnaam: 'Anna', achternaam: 'Willems',
    tussenvoegsel: 'de', geslacht: 'V', leeftijd: 17.90,
    huidigTeam: 'team-006', ingedeeldTeam: 'team-001',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/41.jpg',
    ussScore: 8.0, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren B', kleur: 'senior' },
      { seizoen: '2024-25', team: 'OW A1', kleur: 'rood' },
    ],
  },
  {
    id: 'sp-016', rel_code: 'RC-0016', roepnaam: 'Milan', achternaam: 'Waals',
    tussenvoegsel: 'de', geslacht: 'M', leeftijd: 17.22,
    huidigTeam: 'team-006', ingedeeldTeam: 'team-006',
    status: 'TWIJFELT', fotoUrl: 'https://randomuser.me/api/portraits/men/55.jpg',
    ussScore: 7.6, gezien: true, memoCount: 1,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren B', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-017', rel_code: 'RC-0017', roepnaam: 'Bram', achternaam: 'Dijk',
    tussenvoegsel: 'van', geslacht: 'M', leeftijd: 10.61,
    huidigTeam: null, ingedeeldTeam: null,
    status: 'NIEUW', fotoUrl: 'https://randomuser.me/api/portraits/men/14.jpg',
    ussScore: null, gezien: false, memoCount: 0,
    spelerspad: [],
  },
  {
    id: 'sp-018', rel_code: 'RC-0018', roepnaam: 'Julie', achternaam: 'Meijer',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 11.42,
    huidigTeam: 'team-004', ingedeeldTeam: 'team-004',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/76.jpg',
    ussScore: 6.6, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW E1', kleur: 'geel' },
    ],
  },
  {
    id: 'sp-019', rel_code: 'RC-0019', roepnaam: 'Lars', achternaam: 'Smits',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 14.55,
    huidigTeam: 'team-002', ingedeeldTeam: 'team-002',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/men/82.jpg',
    ussScore: 7.3, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW B1', kleur: 'oranje' },
      { seizoen: '2024-25', team: 'OW B2', kleur: 'oranje' },
    ],
  },
  {
    id: 'sp-020', rel_code: 'RC-0020', roepnaam: 'Floor', achternaam: 'Maat',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 19.33,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/88.jpg',
    ussScore: 8.6, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren A', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-021', rel_code: 'RC-0021', roepnaam: 'Mila', achternaam: 'Hof',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 8.14,
    huidigTeam: 'team-007', ingedeeldTeam: 'team-007',
    status: 'BESCHIKBAAR', fotoUrl: null,
    ussScore: null, gezien: false, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW F1', kleur: 'groen' },
    ],
  },
  {
    id: 'sp-022', rel_code: 'RC-0022', roepnaam: 'Levi', achternaam: 'Stam',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 9.07,
    huidigTeam: 'team-007', ingedeeldTeam: 'team-007',
    status: 'AR', fotoUrl: 'https://randomuser.me/api/portraits/men/90.jpg',
    ussScore: null, gezien: false, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'OW F1', kleur: 'groen' },
    ],
  },
  {
    id: 'sp-023', rel_code: 'RC-0023', roepnaam: 'Rosa', achternaam: 'Laan',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 19.88,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/92.jpg',
    ussScore: 9.5, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren A', kleur: 'senior' },
      { seizoen: '2023-24', team: 'Senioren A', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-024', rel_code: 'RC-0024', roepnaam: 'Pieter', achternaam: 'Kuiper',
    tussenvoegsel: null, geslacht: 'M', leeftijd: 19.51,
    huidigTeam: 'team-006', ingedeeldTeam: null,
    status: 'GAAT_STOPPEN', fotoUrl: 'https://randomuser.me/api/portraits/men/74.jpg',
    ussScore: 7.1, gezien: true, memoCount: 2,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren B', kleur: 'senior' },
      { seizoen: '2024-25', team: 'Senioren B', kleur: 'senior' },
    ],
  },
  {
    id: 'sp-025', rel_code: 'RC-0025', roepnaam: 'Iris', achternaam: 'Post',
    tussenvoegsel: null, geslacht: 'V', leeftijd: 18.07,
    huidigTeam: 'team-005', ingedeeldTeam: 'team-005',
    status: 'BESCHIKBAAR', fotoUrl: 'https://randomuser.me/api/portraits/women/34.jpg',
    ussScore: 8.3, gezien: true, memoCount: 0,
    spelerspad: [
      { seizoen: '2025-26', team: 'Senioren A', kleur: 'senior' },
    ],
  },
];

// ── STAF ──────────────────────────────────────────────────────────────────────
export const STAF = [
  {
    id: 'st-001', naam: 'Jan Vermeer', type: 'technisch', rol: 'Hoofdtrainer',
    fotoUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
    koppelingen: [{ teamNaam: 'Senioren A', teamKleur: 'senior', rol: 'Hoofdtrainer' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'Senioren A', kleur: 'senior', rol: 'Hoofdtr.' }] },
      { seizoen: '2024-25', teams: [{ team: 'Senioren A', kleur: 'senior', rol: 'Hoofdtr.' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW 2', kleur: 'groen', rol: 'Coach' }] },
      { seizoen: '2022-23', teams: [{ team: 'OW 2', kleur: 'groen', rol: 'Ass.' }] },
      { seizoen: '2021-22', teams: [{ team: 'OW 3', kleur: 'senior', rol: 'Trainer' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
  {
    id: 'st-002', naam: 'Karin Dijkstra', type: 'technisch', rol: 'Assistent-trainer',
    fotoUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
    koppelingen: [
      { teamNaam: 'Senioren A', teamKleur: 'senior', rol: 'Ass.' },
      { teamNaam: 'OW A1', teamKleur: 'rood', rol: 'Coach' },
    ],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'Senioren A', kleur: 'senior', rol: 'Ass.' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW 2', kleur: 'groen', rol: 'Trainer' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW 3', kleur: 'senior', rol: 'Coach' }] },
      { seizoen: '2022-23', teams: [{ team: 'OW 3', kleur: 'senior', rol: 'Leider' }] },
    ],
    isSpeler: true, memoCount: 1, actief: true,
  },
  {
    id: 'st-003', naam: 'Peter Brouwer', type: 'technisch', rol: 'Trainer',
    fotoUrl: 'https://randomuser.me/api/portraits/men/67.jpg',
    koppelingen: [{ teamNaam: 'Senioren B', teamKleur: 'senior', rol: 'Trainer' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'Senioren B', kleur: 'senior', rol: 'Trainer' }] },
      { seizoen: '2024-25', teams: [{ team: 'Senioren B', kleur: 'senior', rol: 'Trainer' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW A1', kleur: 'rood', rol: 'Ass.' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
  {
    id: 'st-004', naam: 'Laura Smit', type: 'medisch', rol: 'Verzorger',
    fotoUrl: null,
    koppelingen: [{ teamNaam: 'Senioren A', teamKleur: 'senior', rol: 'Verzorger' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'Senioren A', kleur: 'senior', rol: 'Verzorger' }] },
      { seizoen: '2024-25', teams: [{ team: 'Senioren A', kleur: 'senior', rol: 'Verzorger' }] },
    ],
    isSpeler: false, memoCount: 2, actief: true,
  },
  {
    id: 'st-005', naam: 'Henk Vos', type: 'ondersteunend', rol: 'Leider',
    fotoUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
    koppelingen: [
      { teamNaam: 'OW A1', teamKleur: 'rood', rol: 'Leider' },
      { teamNaam: 'OW B1', teamKleur: 'oranje', rol: 'Leider' },
    ],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW B1', kleur: 'oranje', rol: 'Trainer' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW C1', kleur: 'rood', rol: 'Coach' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW C1', kleur: 'rood', rol: 'Leider' }] },
      { seizoen: '2022-23', teams: [{ team: 'OW A1', kleur: 'geel', rol: 'Leider' }] },
      { seizoen: '2021-22', teams: [{ team: 'OW A1', kleur: 'geel', rol: 'Begeleider' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
  {
    id: 'st-006', naam: 'Sandra Vries', type: 'ondersteunend', rol: 'Teamleider',
    fotoUrl: 'https://randomuser.me/api/portraits/women/48.jpg',
    koppelingen: [{ teamNaam: 'OW E1', teamKleur: 'geel', rol: 'Teamleider' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW E1', kleur: 'geel', rol: 'Teamleider' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW E1', kleur: 'geel', rol: 'Teamleider' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
  {
    id: 'st-007', naam: 'Mark Hoek', type: 'technisch', rol: 'Trainer',
    fotoUrl: 'https://randomuser.me/api/portraits/men/36.jpg',
    koppelingen: [{ teamNaam: 'OW E1', teamKleur: 'geel', rol: 'Trainer' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW E1', kleur: 'geel', rol: 'Trainer' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW F1', kleur: 'groen', rol: 'Trainer' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW F1', kleur: 'groen', rol: 'Trainer' }] },
    ],
    isSpeler: false, memoCount: 1, actief: true,
  },
  {
    id: 'st-008', naam: 'Birgit Lam', type: 'ondersteunend', rol: 'Leider',
    fotoUrl: 'https://randomuser.me/api/portraits/women/58.jpg',
    koppelingen: [{ teamNaam: 'OW D1', teamKleur: 'groen', rol: 'Leider' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW D1', kleur: 'groen', rol: 'Leider' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
  {
    id: 'st-009', naam: 'Rob Kuijpers', type: 'technisch', rol: 'Coach',
    fotoUrl: 'https://randomuser.me/api/portraits/men/29.jpg',
    koppelingen: [{ teamNaam: 'OW A1', teamKleur: 'rood', rol: 'Hoofdtrainer' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW A1', kleur: 'rood', rol: 'Hoofdtr.' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW A1', kleur: 'rood', rol: 'Ass.' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW B1', kleur: 'oranje', rol: 'Trainer' }] },
    ],
    isSpeler: true, memoCount: 0, actief: true,
  },
  {
    id: 'st-010', naam: 'Petra Koop', type: 'technisch', rol: 'Trainer',
    fotoUrl: 'https://randomuser.me/api/portraits/women/71.jpg',
    koppelingen: [{ teamNaam: 'OW D1', teamKleur: 'groen', rol: 'Trainer' }],
    historie: [
      { seizoen: '2025-26', teams: [{ team: 'OW D1', kleur: 'groen', rol: 'Trainer' }] },
      { seizoen: '2024-25', teams: [{ team: 'OW D1', kleur: 'groen', rol: 'Trainer' }] },
      { seizoen: '2023-24', teams: [{ team: 'OW D2', kleur: 'groen', rol: 'Trainer' }] },
    ],
    isSpeler: false, memoCount: 0, actief: true,
  },
];

// ── TEAMS ─────────────────────────────────────────────────────────────────────
export const TEAMS = [
  {
    id: 'team-001', naam: 'OW A1', sub: 'Rood · U17', type: 'achttal', kleur: 'rood',
    selectieId: 'sel-a',
    dames: ['sp-003', 'sp-015'],
    heren: ['sp-001', 'sp-010'],
    staf: ['st-009', 'st-005'],
    validatie: 'warn', valMeldingen: ['Te weinig dames (2/4)'], openMemos: 0,
    ussScore: 8.1, gemLeeftijd: 16.8,
  },
  {
    id: 'team-008', naam: 'OW A2', sub: 'Rood · U17', type: 'achttal', kleur: 'rood',
    selectieId: 'sel-a',
    dames: [],
    heren: [],
    staf: [],
    validatie: 'err', valMeldingen: ['Nog geen spelers ingedeeld'], openMemos: 0,
    ussScore: null, gemLeeftijd: 0,
  },
  {
    id: 'team-002', naam: 'OW B1', sub: 'Oranje · U15', type: 'achttal', kleur: 'oranje',
    selectieId: 'sel-b', gebundeld: true,
    dames: ['sp-002', 'sp-009'],
    heren: ['sp-019'],
    staf: ['st-003'],
    validatie: 'warn', valMeldingen: ['Te weinig dames (2/4)'], openMemos: 1,
    ussScore: 7.2, gemLeeftijd: 14.1,
  },
  {
    id: 'team-003', naam: 'OW D1', sub: 'Groen · 8–9', type: 'viertal', kleur: 'groen',
    dames: ['sp-011'],
    heren: ['sp-005'],
    staf: ['st-010', 'st-008'],
    validatie: 'warn', valMeldingen: ['Te weinig spelers (2/4)'], openMemos: 0,
    ussScore: null, gemLeeftijd: 9.1,
  },
  {
    id: 'team-004', naam: 'OW E1', sub: 'Geel · 10–12', type: 'achttal', kleur: 'geel',
    dames: ['sp-006', 'sp-013', 'sp-018'],
    heren: ['sp-014'],
    staf: ['st-007', 'st-006'],
    validatie: 'ok', valMeldingen: [], openMemos: 2,
    ussScore: 6.5, gemLeeftijd: 11.3,
  },
  {
    id: 'team-005', naam: 'Senioren A', sub: 'Senior · 19+', type: 'achttal', kleur: 'senior',
    dames: ['sp-007', 'sp-020', 'sp-023', 'sp-025'],
    heren: ['sp-008', 'sp-012'],
    staf: ['st-001', 'st-002', 'st-004'],
    validatie: 'ok', valMeldingen: [], openMemos: 0,
    ussScore: 8.7, gemLeeftijd: 18.9,
  },
  {
    id: 'team-009', naam: 'OW B2', sub: 'Oranje · U15', type: 'achttal', kleur: 'oranje',
    selectieId: 'sel-b', gebundeld: true,
    dames: [],
    heren: [],
    staf: [],
    validatie: 'ok', valMeldingen: [], openMemos: 0,
    ussScore: null, gemLeeftijd: 0,
  },
  {
    id: 'team-006', naam: 'Senioren B', sub: 'Senior · 19+', type: 'achttal', kleur: 'senior',
    dames: [],
    heren: ['sp-016', 'sp-024'],
    staf: ['st-003'],
    validatie: 'err', valMeldingen: ['Geen dames ingedeeld', 'Te weinig spelers (2/8)'], openMemos: 1,
    ussScore: 7.3, gemLeeftijd: 18.3,
  },
  {
    id: 'team-007', naam: 'OW F1', sub: 'Groen · 8–9', type: 'viertal', kleur: 'groen',
    dames: ['sp-021'],
    heren: ['sp-022'],
    staf: [],
    validatie: 'err', valMeldingen: ['Geen trainer gekoppeld', 'Te weinig spelers'], openMemos: 0,
    ussScore: null, gemLeeftijd: 8.6,
  },
];

// ── SELECTIES ─────────────────────────────────────────────────────────────────
// Een selectie groepeert meerdere teams; `gebundeld=true` betekent gecombineerde pool.
export const SELECTIES = [
  {
    id: 'sel-a', naam: 'Selectie A · U17', kleur: 'rood',
    teamIds: ['team-001', 'team-008'], gebundeld: false,
  },
  {
    id: 'sel-b', naam: 'Selectie B · U15', kleur: 'oranje',
    teamIds: ['team-002', 'team-009'], gebundeld: true,
  },
];

// ── MEMOS ─────────────────────────────────────────────────────────────────────
export const MEMOS = [
  {
    id: 'memo-001', titel: 'Noor twijfelt over doorgaan',
    beschrijving: 'Ouders hebben aangegeven dat Noor overweegt te stoppen. Gesprek gepland voor 25 april.',
    status: 'OPEN', prioriteit: 'HOOG',
    entiteitType: 'SPELER', entiteitId: 'sp-002', entiteitLabel: 'Noor de Bos',
    doelgroep: null, datum: '2026-04-10',
  },
  {
    id: 'memo-002', titel: 'Sanne geblesseerd — enkel',
    beschrijving: 'Geblesseerd tijdens training 8 april. Verwachte herstelperiode 3-4 weken. Fysiotherapeut ingeschakeld.',
    status: 'IN_BESPREKING', prioriteit: 'BLOCKER',
    entiteitType: 'SPELER', entiteitId: 'sp-009', entiteitLabel: 'Sanne Koster',
    doelgroep: null, datum: '2026-04-08',
  },
  {
    id: 'memo-003', titel: 'Koppeling OW B1 nog niet bevestigd',
    beschrijving: 'Trainer Peter heeft aangegeven beschikbaar te zijn maar heeft nog niet formeel bevestigd.',
    status: 'OPEN', prioriteit: 'MIDDEL',
    entiteitType: 'TEAM', entiteitId: 'team-002', entiteitLabel: 'OW B1',
    doelgroep: null, datum: '2026-04-12',
  },
  {
    id: 'memo-004', titel: 'Aanvulling dameshelft B1 nodig',
    beschrijving: 'B1 heeft momenteel slechts 2 dames. Actief werven of spelers verschuiven.',
    status: 'OPEN', prioriteit: 'HOOG',
    entiteitType: 'TEAM', entiteitId: 'team-002', entiteitLabel: 'OW B1',
    doelgroep: null, datum: '2026-04-15',
  },
  {
    id: 'memo-005', titel: 'Laura Smit — beschikbaarheid in geding',
    beschrijving: 'Laura heeft aangegeven minder beschikbaar te zijn komend seizoen door privésituatie.',
    status: 'RISICO', prioriteit: 'HOOG',
    entiteitType: 'STAF', entiteitId: 'st-004', entiteitLabel: 'Laura Smit',
    doelgroep: null, datum: '2026-04-05',
  },
  {
    id: 'memo-006', titel: 'Ruben stopt — opvolger zoeken',
    beschrijving: 'Ruben heeft bevestigd te stoppen na dit seizoen. Ervaren speler — mentorrol voor jongere spelers bespreken.',
    status: 'IN_BESPREKING', prioriteit: 'MIDDEL',
    entiteitType: 'SPELER', entiteitId: 'sp-012', entiteitLabel: 'Ruben Hoekstra',
    doelgroep: null, datum: '2026-04-11',
  },
  {
    id: 'memo-007', titel: 'OW E1 heeft open memos',
    beschrijving: 'Diverse kleine aandachtspunten rondom het E1-team.',
    status: 'OPEN', prioriteit: 'LAAG',
    entiteitType: 'TEAM', entiteitId: 'team-004', entiteitLabel: 'OW E1',
    doelgroep: null, datum: '2026-04-14',
  },
  {
    id: 'memo-008', titel: 'OW F1 heeft geen trainer',
    beschrijving: 'F1 is nog niet voorzien van een trainer. Urgent regelen voor seizoensstart.',
    status: 'OPEN', prioriteit: 'BLOCKER',
    entiteitType: 'TEAM', entiteitId: 'team-007', entiteitLabel: 'OW F1',
    doelgroep: null, datum: '2026-04-16',
  },
  {
    id: 'memo-009', titel: 'Korfbalplezier — instroom jeugd',
    beschrijving: 'Meerdere nieuwe leden in de E/F-leeftijd. Welk team krijgt voorrang bij plaatsing?',
    status: 'OPEN', prioriteit: 'MIDDEL',
    entiteitType: 'TC', entiteitId: null, entiteitLabel: 'TC',
    doelgroep: 'Korfbalplezier', datum: '2026-04-13',
  },
  {
    id: 'memo-010', titel: 'Pieter stopt — exit-gesprek',
    beschrijving: 'Pieter heeft besloten te stoppen. Exit-gesprek plannen voor einde seizoen.',
    status: 'OPEN', prioriteit: 'LAAG',
    entiteitType: 'SPELER', entiteitId: 'sp-024', entiteitLabel: 'Pieter Kuiper',
    doelgroep: null, datum: '2026-04-09',
  },
  {
    id: 'memo-011', titel: 'Wedstrijdsport — doorstroom A1→Senioren',
    beschrijving: 'Twee A1-spelers zijn oud genoeg voor doorstroom. Bespreek met staf seniorenteam.',
    status: 'IN_BESPREKING', prioriteit: 'MIDDEL',
    entiteitType: 'TC', entiteitId: null, entiteitLabel: 'TC',
    doelgroep: 'Wedstrijdsport', datum: '2026-04-07',
  },
  {
    id: 'memo-012', titel: 'Mark Hoek — teambegeleider E1 overbelast?',
    beschrijving: 'Mark geeft aan twee teams te veel te vinden. Evalueren of extra begeleider nodig is.',
    status: 'OPEN', prioriteit: 'MIDDEL',
    entiteitType: 'STAF', entiteitId: 'st-007', entiteitLabel: 'Mark Hoek',
    doelgroep: null, datum: '2026-04-17',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getSpeler(id)   { return SPELERS.find(s => s.id === id) ?? null; }
export function getStaf(id)     { return STAF.find(s => s.id === id) ?? null; }
export function getTeam(id)     { return TEAMS.find(t => t.id === id) ?? null; }
export function getMemo(id)     { return MEMOS.find(m => m.id === id) ?? null; }
export function getSelectie(id) { return SELECTIES.find(s => s.id === id) ?? null; }

export function getMemosVoor(entType, entId) {
  return MEMOS.filter(m => m.entiteitType === entType && m.entiteitId === entId);
}

export function openMemosVoorTeam(teamId) {
  return MEMOS.filter(m =>
    m.entiteitType === 'TEAM' && m.entiteitId === teamId && m.status === 'OPEN'
  );
}

export function spelersVanTeam(teamId) {
  const team = getTeam(teamId);
  if (!team) return [];
  return [...team.dames, ...team.heren].map(getSpeler).filter(Boolean);
}

export function stafVanTeam(teamId) {
  const team = getTeam(teamId);
  if (!team) return [];
  return team.staf.map(getStaf).filter(Boolean);
}

export function teamsVanSelectie(selectieId) {
  return TEAMS.filter(t => t.selectieId === selectieId);
}

/**
 * Teams gegroepeerd per kleur/categorie voor drawer-rendering. Selecties apart.
 */
export function teamsGegroepeerd() {
  const volgorde = ['senior', 'rood', 'oranje', 'geel', 'groen', 'blauw', 'paars'];
  const losseTeams = TEAMS.filter(t => !t.selectieId);
  const groepen = [];
  for (const kleur of volgorde) {
    const leden = losseTeams.filter(t => t.kleur === kleur);
    if (leden.length) groepen.push({ kleur, teams: leden });
  }
  return {
    selecties: SELECTIES.map(sel => ({ ...sel, teams: teamsVanSelectie(sel.id) })),
    groepen,
  };
}

/** Verwijder speler overal en plaats in nieuw team (of null = terug naar pool). */
export function verplaatsSpeler(spelerId, naarTeamId) {
  const speler = getSpeler(spelerId);
  if (!speler) return false;
  // Weghalen uit alle teams
  for (const team of TEAMS) {
    team.dames = team.dames.filter(id => id !== spelerId);
    team.heren = team.heren.filter(id => id !== spelerId);
  }
  // Ergens nieuws plaatsen
  if (naarTeamId) {
    const doel = getTeam(naarTeamId);
    if (!doel) return false;
    const lijst = speler.geslacht === 'V' ? doel.dames : doel.heren;
    if (!lijst.includes(spelerId)) lijst.push(spelerId);
  }
  speler.ingedeeldTeam = naarTeamId;
  return true;
}

export { leeftijdKlasse };
