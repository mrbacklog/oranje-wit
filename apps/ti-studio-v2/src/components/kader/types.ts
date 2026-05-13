// apps/ti-studio-v2/src/components/kader/types.ts

export type TcKader = {
  teamMin: number;
  teamIdeaal: number;
  teamMax: number;
  damesMin: number;
  damesIdeaal: number;
  damesMax: number;
  herenMin: number;
  herenIdeaal: number;
  herenMax: number;
  gemLeeftijdMin?: number;
  gemLeeftijdMax?: number;
  bandbreedteMax?: number;
  maxLeeftijdPerSpeler?: number;
};

export type KaderMemoItem = {
  id: string;
  titel: string | null;
  beschrijving: string;
  status: string;
  prioriteit: string;
  doelgroep: string | null;
  createdAt: string;
};

export type KaderPaginaData = {
  seizoen: string;
  kadersId: string;
  teamtypeKaders: Record<string, TcKader>;
  memos: KaderMemoItem[];
};
