export interface Airport {
  iata: string;
  cidade: string;
  estado: string;
  regiao: Regiao;
  lat: number;
  lon: number;
}

export type Regiao = "Nordeste" | "Sudeste" | "Centro-Oeste" | "Sul" | "Norte";

export type Companhia = "LATAM" | "GOL" | "Azul" | "Passaredo";

export interface Adjacencia {
  origem: string;
  destino: string;
  tipo: "regional" | "hub" | "inter-regional";
  peso: number;
  companhias: Companhia[];
  distancia_km: number;
}

export interface Rota {
  origem: string;
  destino: string;
}

export interface PathResult {
  path: string[];
  cost: number;
  algorithm: string;
}

export interface BFSResult {
  [node: string]: { level: number; parent: string | null };
}

export interface DFSResult {
  nodes: { [node: string]: { discovery: number; finish: number; parent: string | null } };
  hasCycle: boolean;
  edgeTypes: [string, string, string][];
}

export type Algorithm = "BFS" | "DFS" | "Dijkstra" | "Bellman-Ford";

export interface GlobalMetrics {
  ordem: number;
  tamanho: number;
  densidade: number;
}

export interface RegionMetrics {
  regiao: string;
  ordem: number;
  tamanho: number;
  densidade: number;
}

export interface EgoNetwork {
  aeroporto: string;
  grau: number;
  ordemEgo: number;
  tamanhoEgo: number;
  densidadeEgo: number;
}
