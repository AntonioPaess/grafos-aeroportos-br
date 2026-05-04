# Rede de Aeroportos do Brasil + Comparacao de Algoritmos

Projeto final de **Teoria dos Grafos** e **Analise e Visualizacao de Dados (AVD)** — Cesar School 2025.1

## Equipe

| Nome | GitHub |
|---|---|
| Antonio Paes | [@AntonioPaess](https://github.com/AntonioPaess) |
| Galileu Moares | [@GalileuCMMoares](https://github.com/GalileuCMMoares) |
| Marco Maciel | [@oMarcoMaciel](https://github.com/oMarcoMaciel) |
| Jose Henrique | [@jhrvo0](https://github.com/jhrvo0) |

## Descricao

Implementacao de um grafo de 20 aeroportos brasileiros com algoritmos classicos (BFS, DFS, Dijkstra, Bellman-Ford) — todos com implementacao propria, sem uso de libs como NetworkX ou igraph.

**Parte 1**: Modelagem da rede de aeroportos, metricas, caminhos minimos e visualizacoes.
**Parte 2**: Analise do dataset Facebook Ego (SNAP) com 4.039 nos e 88.234 arestas, comparacao de desempenho dos algoritmos.

## Estrutura do Projeto

```
projeto-grafos/
├─ README.md
├─ requirements.txt
├─ data/
│   ├─ aeroportos_data.csv              # 20 aeroportos brasileiros
│   ├─ adjacencias_aeroportos.csv       # 41 arestas construidas pelo grupo
│   ├─ rotas.csv                        # 7 pares origem-destino
│   └─ dataset_parte2/
│       └─ facebook_combined.txt        # Facebook Ego (SNAP)
├─ out/                                 # saidas geradas
│   ├─ global.json                      # metricas globais
│   ├─ regioes.json                     # metricas por regiao
│   ├─ ego_aeroportos.csv               # ego-network por aeroporto
│   ├─ graus.csv                        # ranking de graus
│   ├─ distancias_rotas.csv             # caminhos minimos (Dijkstra)
│   ├─ grafo_interativo.html            # grafo interativo (pyvis)
│   ├─ arvore_percurso.html             # arvore REC→POA e MAO→GRU
│   ├─ viz_distribuicao_graus.png       # histograma de graus
│   ├─ viz_ranking_conectados.png       # ranking por grau
│   ├─ viz_comparacao_regioes.png       # densidade e tamanho por regiao
│   ├─ viz_hubs_subgrafo.html           # subgrafo dos hubs
│   ├─ viz_bfs_camadas.png              # BFS em camadas a partir de REC
│   ├─ parte2_report.json               # relatorio Parte 2
│   ├─ parte2_viz_graus_facebook.png    # distribuicao de graus Facebook
│   └─ parte2_viz_comparacao_algos.png  # comparacao de algoritmos
├─ src/
│   ├─ cli.py                           # entry point (argparse)
│   ├─ app.py                           # app Streamlit (bonus UX)
│   ├─ solve.py                         # metricas e rankings (Parte 1)
│   ├─ solve_parte2.py                  # analise completa (Parte 2)
│   ├─ viz.py                           # visualizacoes
│   └─ graphs/
│       ├─ graph.py                     # classe Graph (lista de adjacencia)
│       ├─ io.py                        # carregar/salvar CSV/JSON
│       └─ algorithms.py               # BFS, DFS, Dijkstra, Bellman-Ford
└─ tests/
    ├─ test_bfs.py
    ├─ test_dfs.py
    ├─ test_dijkstra.py
    └─ test_bellman_ford.py
```

## Como Executar

### Pre-requisitos

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Parte 1 — Gerar todas as saidas

```bash
python -m src.cli --dataset ./data/aeroportos_data.csv --all --out ./out/
```

### Parte 1 — Algoritmo especifico

```bash
# BFS a partir de Recife
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/

# DFS a partir de Recife
python -m src.cli --dataset ./data/aeroportos_data.csv --alg DFS --source REC --out ./out/

# Dijkstra: Recife → Porto Alegre
python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/

# Bellman-Ford a partir de Recife
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BELLMAN_FORD --source REC --out ./out/
```

### Parte 2 — Dataset maior

```bash
python -m src.cli --dataset ./data/dataset_parte2/ --parte2 --out ./out/
```

### Testes

```bash
pytest tests/ -v
```

### App Streamlit (Bonus)

```bash
streamlit run src/app.py
```

Permite selecionar dataset (Parte 1 ou 2), algoritmo, origem e destino de forma interativa.

## Modelagem do Grafo (Parte 1)

### Aeroportos (20 nos)

| Regiao | Aeroportos | Qtd |
|---|---|---|
| Nordeste | REC, SSA, FOR, NAT, JPA, THE | 6 |
| Sudeste | GRU, CGH, GIG, CNF, VIX | 5 |
| Centro-Oeste | BSB, GYN | 2 |
| Sul | CWB, FLN, POA | 3 |
| Norte | MAO, BEL, PVH, RBR | 4 |

### Arestas (41 conexoes)

| Tipo | Quantidade | Descricao |
|---|---|---|
| Regional | 22 | Aeroportos da mesma regiao |
| Hub | 17 | GRU ou BSB conectando a outras regioes |
| Inter-regional | 3 | Conexoes diretas entre regioes sem hub |

### Formula de Pesos

```
peso = 1.0
     + 1.0  (se regioes diferentes)
     + 0.5  (se nenhum dos dois eh hub: GRU ou BSB)
```

| Tipo de conexao | Peso |
|---|---|
| Regional (mesma regiao) | 1.0 |
| Hub (GRU/BSB ↔ outra regiao) | 2.0 |
| Inter-regional (sem hub) | 2.5 |

### Metricas Globais

| Metrica | Valor |
|---|---|
| Ordem (\|V\|) | 20 |
| Tamanho (\|E\|) | 41 |
| Densidade | 0.2158 |

### Aeroportos Mais Conectados

| Aeroporto | Grau |
|---|---|
| GRU (Sao Paulo) | 12 |
| BSB (Brasilia) | 11 |
| SSA (Salvador) | 6 |
| REC (Recife) | 5 |
| FOR (Fortaleza) | 5 |

### Rotas Obrigatorias (Dijkstra)

| Origem | Destino | Custo | Caminho |
|---|---|---|---|
| REC | POA | 4.0 | REC→GRU→POA |
| MAO | GRU | 2.0 | MAO→GRU |

## Dataset Maior (Parte 2)

### Facebook Ego (SNAP)

| Metrica | Valor |
|---|---|
| Nos | 4.039 |
| Arestas | 88.234 |
| Tipo | Nao-direcionado, nao-ponderado |
| Descricao | Rede social — circulos de amizade |

### Resultados de Desempenho

| Algoritmo | Tempo Medio | Observacao |
|---|---|---|
| BFS | ~24ms | 5-6 niveis, todos os nos alcancados |
| DFS | ~179ms | Ciclos detectados em todas as fontes |
| Dijkstra | ~79ms | Custos entre 1.0 e 6.0 |
| Bellman-Ford | <1ms | Testado com pesos negativos (subgrafo) |

### Discussao Critica

- **BFS** eh ideal para encontrar caminhos mais curtos em grafos nao-ponderados e explorar vizinhancas. O mais rapido dos quatro (~24ms).
- **DFS** eh util para detectar ciclos e classificar arestas, mas mais lento que BFS neste grafo denso (~179ms) devido a exploracao profunda.
- **Dijkstra** encontra caminhos minimos com pesos, mas precisa explorar todo o grafo mesmo quando os pesos sao uniformes. Custo computacional intermediario (~79ms).
- **Bellman-Ford** eh o unico que suporta pesos negativos e detecta ciclos negativos, mas tem complexidade O(V*E) que o torna impraticavel para grafos grandes.

## Algoritmos Implementados

| Algoritmo | Complexidade | Pesos Negativos | Detecta Ciclo |
|---|---|---|---|
| BFS | O(V + E) | Nao | Nao |
| DFS | O(V + E) | Nao | Sim |
| Dijkstra | O((V + E) log V) | Nao (ValueError) | Nao |
| Bellman-Ford | O(V * E) | Sim | Sim (negativos) |

## Tecnologias

- **Python 3.11+**
- **matplotlib** — graficos estaticos
- **pyvis** — grafos interativos HTML
- **pytest** — testes unitarios
- **Sem NetworkX/igraph** — todos os algoritmos sao implementacao propria
