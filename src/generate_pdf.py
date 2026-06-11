"""Gera o PDF do projeto usando matplotlib."""
from __future__ import annotations

import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.image as mpimg
import numpy as np

OUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "out")
PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "Projeto_Grafos_Aeroportos_BR.pdf")

# ── Paleta ────────────────────────────────────────────────────
C_TITLE   = "#0d1b2a"
C_HEAD    = "#1e3a5f"
C_ACCENT  = "#2563eb"
C_MUTED   = "#64748b"
C_CODE_BG = "#f1f5f9"
C_CODE_FG = "#1e293b"
C_BORDER  = "#cbd5e1"

REGION_COLORS = {
    "Nordeste":     "#3b82f6",
    "Sudeste":      "#ef4444",
    "Centro-Oeste": "#f59e0b",
    "Sul":          "#10b981",
    "Norte":        "#8b5cf6",
}
ALGO_COLORS = {
    "BFS":          "#38bdf8",
    "DFS":          "#a78bfa",
    "Dijkstra":     "#34d399",
    "Bellman-Ford": "#f97316",
}

PAGE_W, PAGE_H = 8.27, 11.69
_page_counter = [0]


# ── Utilitários de página ─────────────────────────────────────

def _new_fig() -> tuple[plt.Figure, plt.Axes]:
    fig, ax = plt.subplots(figsize=(PAGE_W, PAGE_H))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return fig, ax


def _save(pdf: PdfPages, fig: plt.Figure) -> None:
    _page_counter[0] += 1
    fig.text(0.5, 0.018, str(_page_counter[0]),
             ha="center", fontsize=8, color=C_MUTED)
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _header(ax: plt.Axes, title: str, subtitle: str = "") -> float:
    """Desenha barra de cabeçalho e retorna y inicial para conteúdo."""
    ax.add_patch(mpatches.FancyBboxPatch(
        (0, 0.945), 1, 0.04,
        boxstyle="square,pad=0", linewidth=0,
        facecolor=C_HEAD, transform=ax.transAxes, clip_on=False,
    ))
    ax.text(0.03, 0.965, title,
            fontsize=14, fontweight="bold", va="center",
            color="white", transform=ax.transAxes)
    if subtitle:
        ax.text(0.97, 0.965, subtitle,
                fontsize=8, va="center", ha="right",
                color="#94a3b8", transform=ax.transAxes)
    return 0.92


def _text_block(ax: plt.Axes, y: float, lines: list[str],
                fontsize: float = 9.5) -> float:
    """Renderiza linhas de texto com suporte a estilos. Retorna y final."""
    import textwrap
    for line in lines:
        if y < 0.06:
            break
        if line.startswith("## "):
            y -= 0.008
            ax.add_patch(mpatches.FancyBboxPatch(
                (0, y - 0.003), 1, 0.022,
                boxstyle="square,pad=0", linewidth=0,
                facecolor="#e8f0fe", transform=ax.transAxes, clip_on=False,
            ))
            ax.text(0.03, y + 0.008, line[3:],
                    fontsize=11, fontweight="bold", va="center",
                    color=C_HEAD, transform=ax.transAxes)
            y -= 0.028
        elif line.startswith("### "):
            y -= 0.005
            ax.text(0.03, y, line[4:],
                    fontsize=10, fontweight="bold", va="top",
                    color=C_HEAD, transform=ax.transAxes)
            y -= 0.024
        elif line.startswith("```") or line.startswith("    "):
            code = line.replace("```", "").strip() or line.strip()
            if code:
                ax.add_patch(mpatches.FancyBboxPatch(
                    (0.02, y - 0.004), 0.96, 0.02,
                    boxstyle="round,pad=0.002", linewidth=0.5,
                    facecolor=C_CODE_BG, edgecolor=C_BORDER,
                    transform=ax.transAxes, clip_on=False,
                ))
                ax.text(0.04, y + 0.006, code,
                        fontsize=8, fontfamily="monospace", va="center",
                        color=C_CODE_FG, transform=ax.transAxes)
                y -= 0.025
        elif line.startswith("| "):
            ax.text(0.03, y, line,
                    fontsize=7.5, fontfamily="monospace", va="top",
                    color=C_CODE_FG, transform=ax.transAxes)
            y -= 0.018
        elif line == "---":
            ax.axhline(y=y, xmin=0.03, xmax=0.97,
                       color=C_BORDER, linewidth=0.8,
                       transform=ax.transAxes)
            y -= 0.015
        elif line == "":
            y -= 0.010
        else:
            wrapped = textwrap.wrap(line, width=100)
            for wl in wrapped:
                if y < 0.06:
                    break
                ax.text(0.03, y, wl,
                        fontsize=fontsize, va="top",
                        color=C_TITLE, transform=ax.transAxes)
                y -= 0.019
    return y


def _text_page(pdf: PdfPages, title: str, subtitle: str,
               lines: list[str]) -> None:
    fig, ax = _new_fig()
    y = _header(ax, title, subtitle)
    y -= 0.015
    _text_block(ax, y, lines)
    _save(pdf, fig)


# ── Página de imagem + notas analíticas ───────────────────────

def _image_and_notes(pdf: PdfPages, img_path: str,
                     title: str, notes: list[str]) -> None:
    if not os.path.exists(img_path):
        return
    fig = plt.figure(figsize=(PAGE_W, PAGE_H))
    gs = gridspec.GridSpec(2, 1, height_ratios=[2.2, 1],
                           hspace=0.05, figure=fig,
                           top=0.94, bottom=0.07, left=0.06, right=0.94)

    # Cabeçalho
    ax_head = fig.add_axes([0, 0.945, 1, 0.04])
    ax_head.set_xlim(0, 1); ax_head.set_ylim(0, 1); ax_head.axis("off")
    ax_head.add_patch(mpatches.FancyBboxPatch(
        (0, 0), 1, 1, boxstyle="square,pad=0", linewidth=0,
        facecolor=C_HEAD, clip_on=False,
    ))
    ax_head.text(0.03, 0.5, title,
                 fontsize=13, fontweight="bold", va="center",
                 color="white")

    # Imagem
    ax_img = fig.add_subplot(gs[0])
    ax_img.axis("off")
    img = mpimg.imread(img_path)
    h, w = img.shape[:2]
    ax_img.imshow(img, aspect="equal")
    ax_img.set_aspect("equal")

    # Notas
    ax_notes = fig.add_subplot(gs[1])
    ax_notes.set_xlim(0, 1); ax_notes.set_ylim(0, 1); ax_notes.axis("off")
    ax_notes.add_patch(mpatches.FancyBboxPatch(
        (0, 0), 1, 1, boxstyle="square,pad=0", linewidth=0.8,
        facecolor="#f8fafc", edgecolor=C_BORDER, clip_on=False,
    ))
    ax_notes.text(0.03, 0.92, "Análise",
                  fontsize=9, fontweight="bold", va="top", color=C_HEAD)
    y = 0.80
    for note in notes:
        import textwrap
        for wl in textwrap.wrap(note, width=105):
            ax_notes.text(0.03, y, f"• {wl}" if note == wl else f"  {wl}",
                          fontsize=8.5, va="top", color=C_TITLE)
            y -= 0.16
            if y < 0.05:
                break

    _page_counter[0] += 1
    fig.text(0.5, 0.018, str(_page_counter[0]),
             ha="center", fontsize=8, color=C_MUTED)
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


# ── Gráficos inline ───────────────────────────────────────────

def _chart_grau_aeroportos(pdf: PdfPages) -> None:
    aeroportos = [
        ("GRU", 12, "Sudeste"), ("BSB", 11, "Centro-Oeste"),
        ("SSA", 6,  "Nordeste"), ("REC", 5,  "Nordeste"),
        ("FOR", 5,  "Nordeste"), ("MAO", 4,  "Norte"),
        ("BEL", 4,  "Norte"),   ("GIG", 4,  "Sudeste"),
        ("CGH", 3,  "Sudeste"), ("CWB", 3,  "Sul"),
        ("FLN", 3,  "Sul"),     ("NAT", 3,  "Nordeste"),
        ("PVH", 3,  "Norte"),   ("VIX", 3,  "Sudeste"),
        ("CNF", 2,  "Sudeste"), ("GYN", 2,  "Centro-Oeste"),
        ("JPA", 2,  "Nordeste"),("POA", 2,  "Sul"),
        ("RBR", 2,  "Norte"),   ("THE", 2,  "Nordeste"),
    ]
    labels = [a[0] for a in aeroportos]
    valores = [a[1] for a in aeroportos]
    cores = [REGION_COLORS[a[2]] for a in aeroportos]

    fig = plt.figure(figsize=(PAGE_W, PAGE_H))
    gs = gridspec.GridSpec(2, 1, height_ratios=[3, 0.8],
                           hspace=0.08, figure=fig,
                           top=0.93, bottom=0.07, left=0.1, right=0.95)
    ax_head = fig.add_axes([0, 0.945, 1, 0.04])
    ax_head.axis("off")
    ax_head.add_patch(mpatches.FancyBboxPatch(
        (0, 0), 1, 1, boxstyle="square,pad=0",
        facecolor=C_HEAD, linewidth=0, clip_on=False))
    ax_head.text(0.03, 0.5, "Ranking de Conectividade por Aeroporto",
                 fontsize=13, fontweight="bold", va="center", color="white")

    ax = fig.add_subplot(gs[0])
    bars = ax.bar(labels, valores, color=cores, width=0.7,
                  edgecolor="white", linewidth=0.5)
    for bar, v in zip(bars, valores):
        ax.text(bar.get_x() + bar.get_width() / 2, v + 0.1, str(v),
                ha="center", va="bottom", fontsize=8, color=C_TITLE,
                fontweight="bold")
    ax.set_ylabel("Grau (número de conexões)", fontsize=9, color=C_MUTED)
    ax.set_ylim(0, 14)
    ax.tick_params(axis="x", labelsize=8, rotation=30, colors=C_TITLE)
    ax.tick_params(axis="y", labelsize=8, colors=C_MUTED)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(C_BORDER)
    ax.set_facecolor("#f8fafc")
    ax.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax.set_axisbelow(True)
    # Linha de média
    media = sum(valores) / len(valores)
    ax.axhline(media, color=C_MUTED, linestyle="--", linewidth=1,
               label=f"Média: {media:.1f}")
    ax.legend(fontsize=8, framealpha=0.8)

    # Legenda de regiões
    ax_leg = fig.add_subplot(gs[1])
    ax_leg.axis("off")
    handles = [mpatches.Patch(color=c, label=r)
               for r, c in REGION_COLORS.items()]
    ax_leg.legend(handles=handles, loc="center", ncol=5,
                  fontsize=8.5, frameon=False,
                  title="Regiões", title_fontsize=9)

    ax.set_title(
        "GRU (12) e BSB (11) concentram mais de 50% das conexões — padrão hub-and-spoke",
        fontsize=8.5, color=C_MUTED, pad=8,
    )
    _save(pdf, fig)


def _chart_regioes(pdf: PdfPages) -> None:
    regioes  = ["Nordeste", "Sudeste", "Sul",  "Norte", "Centro-Oeste"]
    ordens   = [6,          5,         3,       4,       2]
    arestas  = [8,          6,         3,       4,       1]
    dens     = [0.5333,     0.6000,    1.0000,  0.6667,  1.0000]
    cores    = [REGION_COLORS[r] for r in regioes]

    fig = plt.figure(figsize=(PAGE_W, PAGE_H * 0.65))
    fig.patch.set_facecolor("white")
    gs = gridspec.GridSpec(1, 2, wspace=0.35, figure=fig,
                           top=0.85, bottom=0.12, left=0.08, right=0.96)

    # Gráfico 1 — Ordem e Tamanho
    ax1 = fig.add_subplot(gs[0])
    x = np.arange(len(regioes))
    w = 0.35
    b1 = ax1.bar(x - w/2, ordens,  w, label="Aeroportos (|V|)", color=cores, alpha=0.9,
                 edgecolor="white", linewidth=0.5)
    b2 = ax1.bar(x + w/2, arestas, w, label="Arestas internas (|E|)",
                 color=cores, alpha=0.55, edgecolor="white", linewidth=0.5, hatch="///")
    ax1.set_xticks(x)
    ax1.set_xticklabels(regioes, rotation=25, ha="right", fontsize=8)
    ax1.set_ylabel("Quantidade", fontsize=8.5, color=C_MUTED)
    ax1.set_title("Aeroportos e Arestas por Região", fontsize=9.5,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax1.spines[["top", "right"]].set_visible(False)
    ax1.spines[["left", "bottom"]].set_color(C_BORDER)
    ax1.set_facecolor("#f8fafc")
    ax1.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax1.set_axisbelow(True)
    ax1.legend(fontsize=7.5, framealpha=0.8)
    for b, v in zip(b1, ordens):
        ax1.text(b.get_x() + b.get_width()/2, v + 0.05, str(v),
                 ha="center", va="bottom", fontsize=7.5, fontweight="bold")
    for b, v in zip(b2, arestas):
        ax1.text(b.get_x() + b.get_width()/2, v + 0.05, str(v),
                 ha="center", va="bottom", fontsize=7.5)

    # Gráfico 2 — Densidade
    ax2 = fig.add_subplot(gs[1])
    bars = ax2.barh(regioes, dens, color=cores, alpha=0.9,
                    edgecolor="white", linewidth=0.5)
    ax2.set_xlim(0, 1.15)
    ax2.set_xlabel("Densidade", fontsize=8.5, color=C_MUTED)
    ax2.set_title("Densidade Intra-Regional", fontsize=9.5,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax2.spines[["top", "right"]].set_visible(False)
    ax2.spines[["left", "bottom"]].set_color(C_BORDER)
    ax2.set_facecolor("#f8fafc")
    ax2.xaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax2.set_axisbelow(True)
    ax2.tick_params(axis="y", labelsize=8.5)
    for b, v in zip(bars, dens):
        ax2.text(v + 0.02, b.get_y() + b.get_height()/2,
                 f"{v:.4f}", va="center", fontsize=8, fontweight="bold",
                 color=C_TITLE)

    fig.suptitle("Métricas por Região", fontsize=13, fontweight="bold",
                 color=C_HEAD, y=0.96)
    _save(pdf, fig)


def _chart_rotas(pdf: PdfPages) -> None:
    rotas = [
        ("REC→POA", 4.0, "REC → GRU → POA", 2),
        ("MAO→GRU", 2.0, "MAO → GRU",        1),
        ("FOR→FLN", 5.0, "FOR → BSB → CWB → FLN", 3),
        ("BEL→CNF", 3.0, "BEL → GRU → CNF",  2),
        ("NAT→CWB", 5.0, "NAT → FOR → BSB → CWB", 3),
        ("RBR→GIG", 5.0, "RBR → PVH → BEL → GRU → GIG", 4),
        ("THE→POA", 5.0, "THE → FOR → GRU → POA", 3),
    ]
    labels  = [r[0] for r in rotas]
    custos  = [r[1] for r in rotas]
    caminhos = [r[2] for r in rotas]
    saltos  = [r[3] for r in rotas]

    fig, axes = plt.subplots(1, 2, figsize=(PAGE_W * 0.9, 4.2),
                             facecolor="white")
    fig.subplots_adjust(wspace=0.4, left=0.08, right=0.97,
                        top=0.85, bottom=0.18)

    # Custo
    ax1 = axes[0]
    colors = ["#2563eb" if c == min(custos) else
              "#ef4444" if c == max(custos) else "#64748b"
              for c in custos]
    bars = ax1.bar(labels, custos, color=colors, width=0.6,
                   edgecolor="white", linewidth=0.5)
    for b, v in zip(bars, custos):
        ax1.text(b.get_x() + b.get_width()/2, v + 0.05, str(v),
                 ha="center", va="bottom", fontsize=8.5, fontweight="bold")
    ax1.set_ylabel("Custo total", fontsize=9, color=C_MUTED)
    ax1.set_ylim(0, 6.5)
    ax1.set_title("Custo Dijkstra por Rota", fontsize=10,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax1.tick_params(axis="x", labelsize=8, rotation=25)
    ax1.spines[["top", "right"]].set_visible(False)
    ax1.set_facecolor("#f8fafc")
    ax1.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax1.set_axisbelow(True)

    # Saltos
    ax2 = axes[1]
    scatter_colors = [REGION_COLORS["Nordeste"], REGION_COLORS["Norte"],
                      REGION_COLORS["Nordeste"], REGION_COLORS["Norte"],
                      REGION_COLORS["Nordeste"], REGION_COLORS["Norte"],
                      REGION_COLORS["Nordeste"]]
    bars2 = ax2.bar(labels, saltos, color=scatter_colors, width=0.6,
                    edgecolor="white", linewidth=0.5, alpha=0.85)
    for b, v in zip(bars2, saltos):
        ax2.text(b.get_x() + b.get_width()/2, v + 0.05, str(v),
                 ha="center", va="bottom", fontsize=8.5, fontweight="bold")
    ax2.set_ylabel("Número de escalas", fontsize=9, color=C_MUTED)
    ax2.set_ylim(0, 5.5)
    ax2.set_title("Escalas por Rota", fontsize=10,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax2.tick_params(axis="x", labelsize=8, rotation=25)
    ax2.spines[["top", "right"]].set_visible(False)
    ax2.set_facecolor("#f8fafc")
    ax2.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax2.set_axisbelow(True)

    fig.suptitle("Rotas Obrigatórias — Dijkstra (Parte 1)",
                 fontsize=12, fontweight="bold", color=C_HEAD)

    _save(pdf, fig)


def _chart_algoritmos(pdf: PdfPages) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(PAGE_W * 0.88, 4.0),
                             facecolor="white")
    fig.subplots_adjust(wspace=0.38, left=0.09, right=0.97,
                        top=0.85, bottom=0.14)

    # Tempo médio
    ax1 = axes[0]
    algos  = ["BFS", "DFS", "Dijkstra"]
    tempos = [24.5,  178.8, 79.0]
    cores  = [ALGO_COLORS[a] for a in algos]
    bars = ax1.bar(algos, tempos, color=cores, width=0.55,
                   edgecolor="white", linewidth=0.5)
    for b, v in zip(bars, tempos):
        ax1.text(b.get_x() + b.get_width()/2, v + 1.5, f"{v:.1f}ms",
                 ha="center", va="bottom", fontsize=9, fontweight="bold",
                 color=C_TITLE)
    ax1.set_ylabel("Tempo médio (ms)", fontsize=9, color=C_MUTED)
    ax1.set_ylim(0, 210)
    ax1.set_title("Tempo Médio por Algoritmo\n(Facebook Ego — 4.039 nós)", fontsize=9.5,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax1.spines[["top", "right"]].set_visible(False)
    ax1.set_facecolor("#f8fafc")
    ax1.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax1.set_axisbelow(True)

    # Capacidades — radar
    ax2 = axes[1]
    ax2.axis("off")
    capacidades = [
        ("BFS",          [100, 0,   70, 0,   100], ALGO_COLORS["BFS"]),
        ("DFS",          [70,  100, 30, 0,   80],  ALGO_COLORS["DFS"]),
        ("Dijkstra",     [80,  0,   100, 0,  60],  ALGO_COLORS["Dijkstra"]),
        ("Bellman-Ford", [20,  100, 100, 100, 20],  ALGO_COLORS["Bellman-Ford"]),
    ]
    metricas = ["Velocidade", "Det. Ciclo", "Ótimo", "Peso Neg.", "Escalab."]
    N = len(metricas)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]

    ax_r = fig.add_axes([0.55, 0.12, 0.42, 0.72], polar=True)
    ax_r.set_facecolor("#f8fafc")
    ax_r.set_ylim(0, 100)
    ax_r.set_xticks(angles[:-1])
    ax_r.set_xticklabels(metricas, fontsize=7.5, color=C_TITLE)
    ax_r.set_yticks([25, 50, 75, 100])
    ax_r.set_yticklabels(["25", "50", "75", "100"], fontsize=6, color=C_MUTED)
    ax_r.grid(color=C_BORDER, linewidth=0.5)
    ax_r.spines["polar"].set_color(C_BORDER)

    for nome, vals, cor in capacidades:
        vals_closed = vals + vals[:1]
        ax_r.plot(angles, vals_closed, color=cor, linewidth=1.5, label=nome)
        ax_r.fill(angles, vals_closed, color=cor, alpha=0.10)

    ax_r.legend(loc="upper right", bbox_to_anchor=(1.35, 1.15),
                fontsize=7.5, framealpha=0.8)
    ax_r.set_title("Comparativo de Capacidades", fontsize=9.5,
                   fontweight="bold", color=C_HEAD, pad=18)

    fig.suptitle("Comparação entre Algoritmos — Parte 2",
                 fontsize=12, fontweight="bold", color=C_HEAD)
    _save(pdf, fig)


def _chart_bfs_facebook(pdf: PdfPages) -> None:
    fontes  = ["Nó 0", "Nó 107", "Nó 1684"]
    niveis  = [6,      5,        5]
    visitas = [4039,   4039,     4039]

    fig, axes = plt.subplots(1, 2, figsize=(PAGE_W * 0.88, 3.8),
                             facecolor="white")
    fig.subplots_adjust(wspace=0.35, left=0.09, right=0.97,
                        top=0.82, bottom=0.14)

    ax1 = axes[0]
    bars = ax1.bar(fontes, niveis, color=ALGO_COLORS["BFS"],
                   width=0.5, edgecolor="white", linewidth=0.5)
    for b, v in zip(bars, niveis):
        ax1.text(b.get_x() + b.get_width()/2, v + 0.05, str(v),
                 ha="center", va="bottom", fontsize=10, fontweight="bold")
    ax1.set_ylim(0, 8)
    ax1.set_ylabel("Níveis BFS", fontsize=9, color=C_MUTED)
    ax1.set_title("Profundidade BFS por Fonte", fontsize=9.5,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax1.spines[["top", "right"]].set_visible(False)
    ax1.set_facecolor("#f8fafc")
    ax1.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax1.set_axisbelow(True)
    ax1.axhline(6, color="#ef4444", linestyle="--", linewidth=1,
                label="6 graus de separação")
    ax1.legend(fontsize=8)

    ax2 = axes[1]
    tempos_algo = {
        "BFS":          [22.1, 32.3, 19.1],
        "DFS":          [160.3, 200.3, 175.7],
        "Dijkstra":     [80.7, 77.9, 79.0],
    }
    x = np.arange(len(fontes))
    w = 0.25
    offsets = [-w, 0, w]
    for (algo, ts), off in zip(tempos_algo.items(), offsets):
        ax2.bar(x + off, ts, w, label=algo,
                color=ALGO_COLORS[algo], edgecolor="white",
                linewidth=0.5, alpha=0.9)
    ax2.set_xticks(x)
    ax2.set_xticklabels(fontes, fontsize=9)
    ax2.set_ylabel("Tempo (ms)", fontsize=9, color=C_MUTED)
    ax2.set_title("Tempo de Execução por Fonte", fontsize=9.5,
                  fontweight="bold", color=C_HEAD, pad=8)
    ax2.spines[["top", "right"]].set_visible(False)
    ax2.set_facecolor("#f8fafc")
    ax2.yaxis.grid(True, color=C_BORDER, linewidth=0.5, zorder=0)
    ax2.set_axisbelow(True)
    ax2.legend(fontsize=8, framealpha=0.8)

    fig.suptitle("BFS no Facebook Ego — Fenômeno do Mundo Pequeno",
                 fontsize=12, fontweight="bold", color=C_HEAD)
    _save(pdf, fig)


# ── Geração do PDF ────────────────────────────────────────────

def generate_pdf() -> None:
    os.makedirs(os.path.dirname(PDF_PATH), exist_ok=True)
    _page_counter[0] = 0

    with PdfPages(PDF_PATH, metadata={
        "Title":    "Rede de Aeroportos do Brasil — Comparação de Algoritmos em Grafos",
        "Author":   "Antonio Paes, Galileu Moares, Marco Maciel, Jose Henrique",
        "Subject":  "Projeto Final — Teoria dos Grafos + AVD — Cesar School 2025.1",
        "Keywords": "grafos, BFS, DFS, Dijkstra, Bellman-Ford, aeroportos",
    }) as pdf:

        # ── CAPA ──────────────────────────────────────────────
        fig, ax = _new_fig()

        ax.add_patch(mpatches.FancyBboxPatch(
            (0, 0), 1, 1, boxstyle="square,pad=0",
            facecolor="#0d1b2a", linewidth=0,
            transform=ax.transAxes, clip_on=False,
        ))
        # Faixa superior
        ax.add_patch(mpatches.FancyBboxPatch(
            (0, 0.82), 1, 0.18, boxstyle="square,pad=0",
            facecolor=C_ACCENT, linewidth=0,
            transform=ax.transAxes, clip_on=False,
        ))
        # Ícone ✈
        ax.text(0.5, 0.90, "✈", fontsize=52, ha="center", va="center",
                color="white", transform=ax.transAxes)

        ax.text(0.5, 0.74, "Rede de Aeroportos do Brasil",
                fontsize=24, fontweight="bold", ha="center", va="center",
                color="white", transform=ax.transAxes)
        ax.text(0.5, 0.67, "Comparação de Algoritmos em Grafos",
                fontsize=15, ha="center", va="center",
                color="#94a3b8", transform=ax.transAxes)

        # Linha divisória
        ax.plot([0.15, 0.85], [0.60, 0.60],
                color=C_ACCENT, linewidth=1.5,
                transform=ax.transAxes)

        ax.text(0.5, 0.54, "Projeto Final — Teoria dos Grafos · AVD",
                fontsize=12, ha="center", va="center",
                color="#cbd5e1", transform=ax.transAxes)
        ax.text(0.5, 0.49, "Cesar School  —  2025.1",
                fontsize=11, ha="center", va="center",
                color="#64748b", transform=ax.transAxes)

        ax.text(0.5, 0.38, "Equipe",
                fontsize=11, fontweight="bold", ha="center", va="center",
                color="#94a3b8", transform=ax.transAxes)
        integrantes = [
            "Antonio Paes", "Galileu Moares",
            "Marco Maciel", "Jose Henrique",
        ]
        for i, nome in enumerate(integrantes):
            col = i % 2
            row = i // 2
            ax.text(0.30 + col * 0.40, 0.31 - row * 0.07,
                    nome, fontsize=11, ha="center", va="center",
                    color="white", transform=ax.transAxes)

        # Rodapé
        ax.add_patch(mpatches.FancyBboxPatch(
            (0, 0), 1, 0.06, boxstyle="square,pad=0",
            facecolor="#050d1a", linewidth=0,
            transform=ax.transAxes, clip_on=False,
        ))
        ax.text(0.5, 0.03, "BFS  ·  DFS  ·  Dijkstra  ·  Bellman-Ford",
                fontsize=9, ha="center", va="center",
                color="#475569", transform=ax.transAxes)

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # ── 1. MANUAL DE USO ──────────────────────────────────
        _text_page(pdf, "1. Manual de Uso", "Instalação e execução", [
            "## Pré-requisitos",
            "",
            "    python3 -m venv venv",
            "    source venv/bin/activate",
            "    pip install -r requirements.txt",
            "",
            "## Parte 1 — Gerar todas as saídas",
            "",
            "    python -m src.cli --dataset ./data/aeroportos_data.csv --all --out ./out/",
            "",
            "## Parte 1 — Algoritmo específico",
            "",
            "    # BFS a partir de Recife",
            "    python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/",
            "",
            "    # Dijkstra: Recife → Porto Alegre",
            "    python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/",
            "",
            "    # Bellman-Ford a partir de Recife",
            "    python -m src.cli --dataset ./data/aeroportos_data.csv --alg BELLMAN_FORD --source REC --out ./out/",
            "",
            "## Parte 2 — Dataset maior (Facebook Ego)",
            "",
            "    python -m src.cli --dataset ./data/dataset_parte2/ --parte2 --out ./out/",
            "",
            "## Testes unitários",
            "",
            "    pytest tests/ -v",
            "    # 14 testes passando — BFS, DFS, Dijkstra, Bellman-Ford",
            "",
            "## Frontend interativo (Next.js)",
            "",
            "    cd web",
            "    npm install",
            "    npm run dev",
            "    # Acessar em http://localhost:3000",
            "",
            "Nota: web/.npmrc já aponta para registry.npmjs.org — npm install funciona em qualquer PC.",
        ])

        # ── 2. DOCUMENTAÇÃO TÉCNICA ───────────────────────────
        _text_page(pdf, "2. Documentação Técnica", "Estrutura e modelagem", [
            "## 2.1 Estrutura do Grafo",
            "",
            "O grafo utiliza lista de adjacência implementada como dict[str, list[tuple[str, float]]].",
            "Cada nó (aeroporto) mapeia para uma lista de tuplas (vizinho, peso).",
            "O grafo é não-direcionado: ao adicionar a aresta (u, v), a aresta (v, u) é criada automaticamente.",
            "",
            "## 2.2 Construção das Arestas (41 arestas)",
            "",
            "1. Conexões regionais (22 arestas) — aeroportos da mesma região conectados por proximidade.",
            "2. Conexões via hubs (17 arestas) — GRU e BSB conectados a pelo menos um aeroporto de cada região.",
            "3. Conexões inter-regionais diretas (3 arestas) — THE-BEL, CGH-CWB, VIX-SSA.",
            "",
            "## 2.3 Fórmula de Pesos",
            "",
            "    peso = 1.0 + penalidade_regiao + penalidade_hub",
            "",
            "    penalidade_regiao = 1.0  (regiões diferentes)  | 0.0 (mesma região)",
            "    penalidade_hub   = 0.5  (nenhum é GRU/BSB)    | 0.0 (pelo menos um é hub)",
            "",
            "| Tipo de conexão         | Peso |",
            "| Regional (mesma região) | 1.0  |",
            "| Hub (GRU ou BSB)        | 2.0  |",
            "| Inter-regional sem hub  | 2.5  |",
            "",
            "Justificativa: a fórmula reflete o custo de voos — conexões regionais são",
            "mais baratas e frequentes; voos via hub têm custo moderado; inter-regionais",
            "sem hub são os mais caros, pois exigem maior deslocamento sem escala estruturada.",
        ])

        _text_page(pdf, "2. Documentação Técnica", "Algoritmos implementados", [
            "## 2.4 Algoritmos — Detalhamento",
            "",
            "### BFS (Busca em Largura)",
            "Usa collections.deque como fila FIFO. Explora nós camada por camada.",
            "Garante o menor número de arestas no caminho — ideal para grafos não ponderados.",
            "Complexidade: O(V + E).",
            "",
            "### DFS (Busca em Profundidade)",
            "Implementação iterativa com pilha explícita. Registra tempos de descoberta e",
            "finalização, classifica arestas em tree, back, forward e cross. Detecta ciclos",
            "ao identificar back edges. Complexidade: O(V + E).",
            "",
            "### Dijkstra",
            "Usa heapq como fila de prioridade (min-heap). Encontra caminhos mínimos para",
            "pesos não-negativos. Rejeita pesos negativos com ValueError.",
            "Complexidade: O((V + E) log V).",
            "",
            "### Bellman-Ford",
            "Executa V-1 iterações de relaxação seguidas de verificação de ciclo negativo.",
            "Único algoritmo capaz de detectar ciclos negativos e operar com pesos negativos.",
            "Complexidade: O(V × E) — impraticável para grafos muito grandes.",
            "",
            "## 2.5 Tabela Comparativa",
            "",
            "| Algoritmo    | Complexidade   | Pesos Neg. | Detecta Ciclo |",
            "| BFS          | O(V + E)       | Não        | Não           |",
            "| DFS          | O(V + E)       | Não        | Sim           |",
            "| Dijkstra     | O((V+E) log V) | Não        | Não           |",
            "| Bellman-Ford | O(V × E)       | Sim        | Sim (neg.)    |",
        ])

        # ── 3. MÉTRICAS ───────────────────────────────────────
        _text_page(pdf, "3. Métricas do Grafo", "Parte 1 — Aeroportos BR", [
            "## 3.1 Métricas Globais",
            "",
            "| Métrica          | Valor  |",
            "| Ordem (|V|)      | 20     |",
            "| Tamanho (|E|)    | 41     |",
            "| Densidade        | 0,2158 |",
            "",
            "## 3.2 Métricas por Região",
            "",
            "| Região        | Aeroportos | Arestas | Densidade |",
            "| Centro-Oeste  | 2          | 1       | 1,0000    |",
            "| Nordeste      | 6          | 8       | 0,5333    |",
            "| Norte         | 4          | 4       | 0,6667    |",
            "| Sudeste       | 5          | 6       | 0,6000    |",
            "| Sul           | 3          | 3       | 1,0000    |",
            "",
            "## 3.3 Aeroportos Mais Conectados",
            "",
            "| Aeroporto      | Grau | Região        |",
            "| GRU (São Paulo)| 12   | Sudeste       |",
            "| BSB (Brasília) | 11   | Centro-Oeste  |",
            "| SSA (Salvador) | 6    | Nordeste      |",
            "| REC (Recife)   | 5    | Nordeste      |",
            "| FOR (Fortaleza)| 5    | Nordeste      |",
            "",
            "## 3.4 Rotas Obrigatórias (Dijkstra)",
            "",
            "| Origem | Destino | Custo | Caminho                          |",
            "| REC    | POA     | 4,0   | REC → GRU → POA                  |",
            "| MAO    | GRU     | 2,0   | MAO → GRU                        |",
            "| FOR    | FLN     | 5,0   | FOR → BSB → CWB → FLN            |",
            "| BEL    | CNF     | 3,0   | BEL → GRU → CNF                  |",
            "| NAT    | CWB     | 5,0   | NAT → FOR → BSB → CWB            |",
            "| RBR    | GIG     | 5,0   | RBR → PVH → BEL → GRU → GIG     |",
            "| THE    | POA     | 5,0   | THE → FOR → GRU → POA            |",
        ])

        # ── GRÁFICOS INLINE ───────────────────────────────────
        _chart_grau_aeroportos(pdf)
        _chart_regioes(pdf)
        _chart_rotas(pdf)

        # ── VISUALIZAÇÕES PNG ─────────────────────────────────
        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "viz_distribuicao_graus.png"),
            "Distribuição de Graus — Histograma",
            [
                "Distribuição assimétrica à direita: maioria dos aeroportos tem grau entre 2 e 5, "
                "enquanto GRU (12) e BSB (11) são outliers claros.",
                "O padrão hub-and-spoke é típico de redes aeroportuárias — poucos nós concentram "
                "a maior parte das conexões.",
                "Tipo escolhido: histograma — formato padrão para distribuições de frequência, "
                "permite identificar rapidamente a assimetria.",
            ],
        )

        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "viz_ranking_conectados.png"),
            "Ranking por Grau de Conectividade",
            [
                "GRU lidera com grau 12 — conecta-se a 60% dos aeroportos do grafo. "
                "BSB aparece em segundo com grau 11.",
                "Queda abrupta após os dois hubs: SSA (3°) tem grau 6 — metade do grau de GRU. "
                "Evidência da estrutura centralizada.",
                "Tipo escolhido: barras ordenadas — ideal para ranking e comparação direta entre categorias.",
            ],
        )

        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "viz_comparacao_regioes.png"),
            "Comparação entre Regiões",
            [
                "Sul e Centro-Oeste possuem densidade 1,0 (grafo completo interno), mas têm poucos nós.",
                "Nordeste tem o maior número de arestas internas (8), mas menor densidade (0,53) "
                "por ter 6 aeroportos.",
                "Tipo escolhido: barras agrupadas — permite comparação simultânea de duas métricas "
                "(volume vs. proporção) por região.",
            ],
        )

        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "viz_bfs_camadas.png"),
            "BFS em Camadas a partir de REC",
            [
                "Todos os 20 aeroportos são alcançáveis a partir de Recife em no máximo 3 níveis.",
                "Nível 1: vizinhos diretos de REC (SSA, NAT, JPA, GRU, BSB). "
                "Nível 2: quase toda a rede via os hubs. Nível 3: extremidades.",
                "Tipo escolhido: layout hierárquico por camadas — representa diretamente a estrutura "
                "de níveis da BFS e facilita visualizar a profundidade da busca.",
            ],
        )

        # ── 4. PARTE 2 ────────────────────────────────────────
        _text_page(pdf, "4. Parte 2 — Facebook Ego", "Dataset SNAP", [
            "## 4.1 Descrição do Dataset",
            "",
            "| Métrica   | Valor                             |",
            "| Nome      | Facebook Ego (SNAP)               |",
            "| Nós       | 4.039                             |",
            "| Arestas   | 88.234                            |",
            "| Tipo      | Não-direcionado, não-ponderado    |",
            "| Descrição | Rede social — círculos de amizade |",
            "",
            "## 4.2 Resultados — BFS (3 fontes)",
            "",
            "| Fonte | Nós Visitados | Níveis | Tempo   |",
            "| 0     | 4.039         | 6      | 22,1ms  |",
            "| 107   | 4.039         | 5      | 32,3ms  |",
            "| 1684  | 4.039         | 5      | 19,1ms  |",
            "",
            "Todos os nós foram alcançados — grafo totalmente conectado. Máximo de 6 níveis,",
            "consistente com o fenômeno dos '6 graus de separação' em redes sociais.",
            "",
            "## 4.3 Resultados — DFS (3 fontes)",
            "",
            "| Fonte | Ciclo | Tempo    |",
            "| 0     | Sim   | 160,3ms  |",
            "| 107   | Sim   | 200,3ms  |",
            "| 1684  | Sim   | 175,7ms  |",
            "",
            "Ciclos detectados em todas as fontes — esperado em rede social densa.",
            "DFS é ~7× mais lento que BFS neste grafo devido à exploração profunda recursiva.",
            "",
            "## 4.4 Resultados — Dijkstra (5 pares)",
            "",
            "| Origem | Destino | Custo | Saltos | Tempo   |",
            "| 0      | 100     | 1,0   | 2      | 80,7ms  |",
            "| 0      | 3000    | 3,0   | 4      | 77,8ms  |",
            "| 107    | 1684    | 1,0   | 2      | 77,9ms  |",
            "| 200    | 4000    | 6,0   | 7      | 79,0ms  |",
            "| 500    | 3500    | 4,0   | 5      | 79,6ms  |",
            "",
            "Como os pesos são uniformes (1,0), Dijkstra e BFS retornam os mesmos caminhos.",
            "A diferença está apenas no desempenho — Dijkstra carrega overhead da fila de prioridade.",
            "",
            "## 4.5 Resultados — Bellman-Ford",
            "",
            "Caso 1: Subgrafo com 50 nós e pesos negativos (sem ciclo negativo).",
            "    Resultado: ciclo_negativo = False.  Tempo: 0,07ms.",
            "",
            "Caso 2: Grafo construído com ciclo negativo (X→Y→Z→X, soma = −1).",
            "    Resultado: ciclo_negativo = True.   Tempo: 0,01ms.",
        ])

        _chart_bfs_facebook(pdf)
        _chart_algoritmos(pdf)

        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "parte2_viz_graus_facebook.png"),
            "Distribuição de Graus — Facebook Ego",
            [
                "Segue aproximadamente uma power law (lei de potência): poucos nós têm grau muito alto "
                "(hubs sociais) enquanto a maioria tem poucos amigos.",
                "O gráfico log-log confirma a relação linear entre log(grau) e log(frequência), "
                "característica de redes livres de escala (scale-free networks).",
                "Tipo escolhido: histograma + scatter log-log — o histograma mostra a forma geral da "
                "distribuição; o log-log confirma a natureza de lei de potência.",
            ],
        )

        _image_and_notes(pdf,
            os.path.join(OUT_DIR, "parte2_viz_comparacao_algos.png"),
            "Comparação de Algoritmos — Tempo de Execução",
            [
                "BFS é ~7× mais rápido que DFS (24ms vs 179ms) neste grafo denso. "
                "Dijkstra (~79ms) fica entre os dois pelo overhead da fila de prioridade.",
                "Bellman-Ford foi testado em subgrafos pequenos devido à complexidade O(V×E), "
                "que o torna impraticável para 4.039 nós.",
                "Tipo escolhido: barras — formato intuitivo para comparação quantitativa "
                "entre categorias discretas.",
            ],
        )

        # ── 5. DISCUSSÃO CRÍTICA ──────────────────────────────
        _text_page(pdf, "5. Discussão Crítica", "Análise e conclusões", [
            "## Quando usar cada algoritmo",
            "",
            "| Cenário                             | Recomendado  | Justificativa                      |",
            "| Menor número de saltos              | BFS          | O(V+E), caminho com menos arestas  |",
            "| Detectar ciclos                     | DFS          | Classifica arestas, back edges     |",
            "| Caminho mais barato (pesos ≥ 0)     | Dijkstra     | O((V+E)logV), ótimo para positivos |",
            "| Pesos negativos possíveis           | Bellman-Ford | O(V×E), único com pesos negativos  |",
            "| Grafo muito grande (>100k nós)      | BFS/Dijkstra | DFS lento; B-F impraticável        |",
            "",
            "## Limitações do design de pesos",
            "",
            "Na Parte 1, os pesos são discretos (1,0 / 2,0 / 2,5), limitando a granularidade.",
            "Em cenários reais, distâncias em km ou preços de passagem produziriam resultados mais ricos.",
            "",
            "Na Parte 2, o dataset Facebook usa pesos uniformes (1,0), fazendo BFS e Dijkstra",
            "retornarem os mesmos caminhos — a diferença é apenas de desempenho.",
            "",
            "Bellman-Ford foi testado em subgrafos construídos por limitação do dataset original.",
            "",
            "## Análise Exploratória vs. Explanatória (AVD)",
            "",
            "### Visualizações Exploratórias",
            "1. Distribuição de graus: padrão hub-and-spoke emergiu da exploração inicial.",
            "2. BFS em camadas: acessibilidade total em 3 níveis — encontrado ao explorar estrutura.",
            "",
            "### Visualizações Explanatórias",
            "1. Ranking de aeroportos: comunica claramente a dominância de GRU e BSB.",
            "2. Comparação entre regiões: contrasta conectividade relativa vs. absoluta.",
            "",
            "### Padrões Identificados",
            "- Hub-and-spoke: GRU e BSB concentram mais de 50% das conexões do grafo.",
            "- Assimetria regional: Nordeste tem mais aeroportos, mas menor densidade interna.",
            "- Mundo pequeno (Parte 1): qualquer aeroporto alcançável em no máximo 3 saltos.",
            "- Mundo pequeno (Parte 2): rede de 4.039 nós percorrida em 5–6 níveis de BFS.",
            "- Power law (Parte 2): distribuição de graus confirma rede livre de escala.",
        ])

    print(f"PDF gerado em: {PDF_PATH}")


if __name__ == "__main__":
    generate_pdf()
