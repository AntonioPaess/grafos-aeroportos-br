"use client";

import { Regiao, Companhia } from "../lib/types";
import { REGION_COLORS, AIRLINE_COLORS } from "../lib/data";

export interface Filters {
  regioes: Set<Regiao>;
  companhias: Set<Companhia>;
  tipos: Set<"regional" | "hub" | "inter-regional">;
}

export function defaultFilters(): Filters {
  return {
    regioes:   new Set(["Nordeste", "Sudeste", "Centro-Oeste", "Sul", "Norte"] as Regiao[]),
    companhias: new Set(["LATAM", "GOL", "Azul", "Passaredo"] as Companhia[]),
    tipos:      new Set(["regional", "hub", "inter-regional"] as const),
  };
}

const ALL_REGIOES: Regiao[] = ["Nordeste", "Sudeste", "Centro-Oeste", "Sul", "Norte"];
const ALL_COMPANHIAS: Companhia[] = ["LATAM", "GOL", "Azul", "Passaredo"];
const ALL_TIPOS = ["regional", "hub", "inter-regional"] as const;

const TIPO_LABELS = { regional: "Regional", hub: "Hub", "inter-regional": "Inter-regional" };
const TIPO_COLORS = { regional: "#22c55e", hub: "#3b82f6", "inter-regional": "#f59e0b" };

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

function toggle<T>(set: Set<T>, val: T): Set<T> {
  const next = new Set(set);
  if (next.has(val)) next.delete(val); else next.add(val);
  return next;
}

export default function GraphFilters({ filters, onChange }: Props) {
  const activeCount =
    (filters.regioes.size < ALL_REGIOES.length ? 1 : 0) +
    (filters.companhias.size < ALL_COMPANHIAS.length ? 1 : 0) +
    (filters.tipos.size < ALL_TIPOS.length ? 1 : 0);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Filtros
        </h2>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(defaultFilters())}
            className="text-xs px-2 py-0.5 rounded-full transition-colors"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Regiões */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-dim)" }}>
          Região
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_REGIOES.map((r) => {
            const active = filters.regioes.has(r);
            return (
              <button
                key={r}
                onClick={() => onChange({ ...filters, regioes: toggle(filters.regioes, r) })}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? REGION_COLORS[r] + "22" : "var(--bg-muted)",
                  border: `1px solid ${active ? REGION_COLORS[r] : "var(--border)"}`,
                  color: active ? REGION_COLORS[r] : "var(--fg-muted)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: REGION_COLORS[r], opacity: active ? 1 : 0.35 }}
                />
                {r}
              </button>
            );
          })}
        </div>
      </section>

      {/* Companhias */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-dim)" }}>
          Companhia Aérea
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_COMPANHIAS.map((c) => {
            const active = filters.companhias.has(c);
            const color = AIRLINE_COLORS[c];
            return (
              <button
                key={c}
                onClick={() => onChange({ ...filters, companhias: toggle(filters.companhias, c) })}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? color + "22" : "var(--bg-muted)",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                  color: active ? color : "var(--fg-muted)",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tipo de rota */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-dim)" }}>
          Tipo de Rota
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TIPOS.map((t) => {
            const active = filters.tipos.has(t);
            const color = TIPO_COLORS[t];
            return (
              <button
                key={t}
                onClick={() => onChange({ ...filters, tipos: toggle(filters.tipos, t) })}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? color + "22" : "var(--bg-muted)",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                  color: active ? color : "var(--fg-muted)",
                }}
              >
                {TIPO_LABELS[t]}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
