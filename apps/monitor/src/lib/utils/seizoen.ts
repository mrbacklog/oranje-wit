export const HUIDIG_SEIZOEN = "2025-2026";

export const SEIZOENEN = [
  "2025-2026",
  "2024-2025",
  "2023-2024",
  "2022-2023",
  "2021-2022",
  "2020-2021",
  "2019-2020",
  "2018-2019",
  "2017-2018",
  "2016-2017",
];

export function getSeizoen(searchParams: { seizoen?: string }): string {
  return searchParams.seizoen || HUIDIG_SEIZOEN;
}
