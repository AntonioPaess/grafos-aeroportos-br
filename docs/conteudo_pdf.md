# Conteudo para o PDF — Documentacao Tecnica e Notas Analiticas

> Este arquivo serve como base para montar o PDF final do projeto.
> Copie as secoes relevantes para o documento de entrega.

---

## 1. Manual de Uso

### Instalacao
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Execucao Parte 1
```bash
# Gerar todas as saidas
python -m src.cli --dataset ./data/aeroportos_data.csv --all --out ./out/

# Algoritmo especifico
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/
python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
```

### Execucao Parte 2
```bash
python -m src.cli --dataset ./data/dataset_parte2/ --parte2 --out ./out/
```

### Testes
```bash
pytest tests/ -v
```

---

## 2. Documentacao Tecnica

### 2.1 Estrutura do Grafo
O grafo utiliza **lista de adjacencia** implementada como `dict[str, list[tuple[str, float]]]`. Cada no (aeroporto) mapeia para uma lista de tuplas `(vizinho, peso)`. O grafo eh nao-direcionado: ao adicionar uma aresta `(u, v)`, a aresta `(v, u)` eh automaticamente criada.

### 2.2 Construcao das Arestas
As 41 arestas foram construidas seguindo tres criterios:

1. **Conexoes regionais (22 arestas)**: aeroportos da mesma regiao sao conectados com base em proximidade geografica. Nem todos os pares intra-regionais sao conectados para evitar um grafo trivial.

2. **Conexoes via hubs (17 arestas)**: GRU e BSB, os dois maiores hubs aeroportuarios do Brasil, sao conectados a pelo menos um aeroporto de cada regiao, garantindo conectividade inter-regional.

3. **Conexoes inter-regionais diretas (3 arestas)**: THE-BEL (Nordeste-Norte), CGH-CWB (Sudeste-Sul), VIX-SSA (Sudeste-Nordeste) representam rotas diretas entre regioes sem passar por hubs.

### 2.3 Formula de Pesos
```
peso = 1.0 + penalidade_regiao + penalidade_hub
```

- `penalidade_regiao = 1.0` se origem e destino estao em regioes diferentes; 0.0 caso contrario
- `penalidade_hub = 0.5` se nenhum dos dois aeroportos eh hub (GRU ou BSB); 0.0 caso contrario

**Justificativa**: a formula reflete o custo real de voos — conexoes regionais sao mais baratas e frequentes (peso 1.0), voos via hub nacional tem custo moderado (peso 2.0), e conexoes inter-regionais sem hub sao as mais caras (peso 2.5).

### 2.4 Algoritmos Implementados

**BFS (Busca em Largura)**: utiliza `collections.deque` como fila FIFO. Explora nos camada por camada, garantindo que o nivel de cada no representa a menor distancia em numero de arestas.

**DFS (Busca em Profundidade)**: implementacao iterativa com stack explicito para evitar estouro de pilha em grafos grandes. Registra tempos de descoberta e finalizacao, classifica arestas em tree, back, forward e cross. Detecta ciclos pela presenca de back edges.

**Dijkstra**: utiliza `heapq` como fila de prioridade. Encontra caminhos minimos considerando pesos. Rejeita pesos negativos com `ValueError` — para pesos negativos, usar Bellman-Ford.

**Bellman-Ford**: executa V-1 iteracoes de relaxacao sobre todas as arestas. Apos as iteracoes, verifica ciclos negativos com uma iteracao adicional. Suporta pesos negativos.

---

## 3. Notas Analiticas das Visualizacoes

### 3.1 Grafo Interativo (`grafo_interativo.html`)
- **O que mostra**: grafo completo dos 20 aeroportos com cores por regiao, tooltips (grau, regiao, densidade ego), caixa de busca e destaque dos caminhos obrigatorios (REC→POA e MAO→GRU) em vermelho.
- **Insight**: GRU e BSB se destacam visualmente pelo tamanho dos nos (proporcional ao grau), confirmando seu papel de hubs. As regioes formam clusters visiveis, conectados principalmente pelos hubs.
- **Tipo de grafico**: rede interativa (pyvis). Escolhido por permitir exploracao livre, zoom, drag e tooltips — ideal para grafos com multiplas dimensoes de informacao.

### 3.2 Arvore de Percurso (`arvore_percurso.html`)
- **O que mostra**: subgrafo contendo apenas as arestas dos caminhos minimos REC→POA (vermelho) e MAO→GRU (azul).
- **Insight**: ambos os caminhos obrigatorios passam por GRU, confirmando sua centralidade na rede. REC→POA faz 2 saltos (via GRU), enquanto MAO→GRU eh direto (1 salto).
- **Tipo de grafico**: rede interativa com cores distintas por caminho. Escolhido para contrastar os dois percursos simultaneamente.

### 3.3 Distribuicao de Graus (`viz_distribuicao_graus.png`)
- **O que mostra**: histograma da frequencia de graus dos 20 aeroportos.
- **Insight**: a distribuicao eh assimetrica a direita — a maioria dos aeroportos tem grau baixo (1-5), enquanto GRU (12) e BSB (11) sao outliers claros. Isso reflete uma rede hub-and-spoke tipica de aviacao.
- **Tipo de grafico**: histograma. Escolhido por ser o padrao para visualizar distribuicoes de frequencia de uma variavel discreta.

### 3.4 Ranking de Aeroportos Mais Conectados (`viz_ranking_conectados.png`)
- **O que mostra**: barras ordenadas por grau decrescente, com o aeroporto mais conectado destacado em vermelho.
- **Insight**: GRU lidera com grau 12 (conectado a 60% dos aeroportos), seguido de BSB com 11. Depois ha uma queda acentuada — o terceiro (SSA, 6) tem metade do grau de GRU. Aeroportos como GYN e RBR tem grau 1, sendo extremidades da rede.
- **Tipo de grafico**: barras ordenadas. Escolhido por facilitar comparacao quantitativa e ranking entre categorias.

### 3.5 Comparacao entre Regioes (`viz_comparacao_regioes.png`)
- **O que mostra**: dois graficos lado a lado — numero de arestas intra-regionais e densidade por regiao.
- **Insight**: Sul e Centro-Oeste tem densidade 1.0 (todos os aeroportos da regiao conectados entre si), mas poucos aeroportos. Nordeste tem mais arestas absolutas (8) mas densidade menor (0.53) por ter 6 aeroportos. Norte tem boa densidade (0.67) com 4 aeroportos.
- **Tipo de grafico**: barras agrupadas com cores por regiao. Escolhido para permitir comparacao direta entre regioes em duas metricas simultaneamente.

### 3.6 Subgrafo dos Hubs (`viz_hubs_subgrafo.html`)
- **O que mostra**: subgrafo contendo os 6 aeroportos com maior grau e seus vizinhos diretos.
- **Insight**: visualiza a "espinha dorsal" da rede — GRU e BSB formam o nucleo central, com SSA, REC, FOR, CWB e BEL como nos secundarios de alta conectividade. A maioria dos caminhos inter-regionais passa por este subgrafo.
- **Tipo de grafico**: rede interativa. Escolhido por revelar a topologia local dos nos mais influentes.

### 3.7 BFS em Camadas (`viz_bfs_camadas.png`)
- **O que mostra**: arvore BFS a partir de REC, com nos organizados por nivel (camada).
- **Insight**: a partir de REC, todos os aeroportos sao alcancaveis em no maximo 3 niveis. O nivel 1 inclui vizinhos diretos (SSA, NAT, JPA, GRU, BSB), e a partir do nivel 2 ja se alcanca a maioria da rede via hubs. Isso mostra a eficiencia da estrutura hub-and-spoke.
- **Tipo de grafico**: layout hierarquico em camadas. Escolhido por representar diretamente a estrutura de niveis da BFS.

### 3.8 Comparacao de Algoritmos — Parte 2 (`parte2_viz_comparacao_algos.png`)
- **O que mostra**: tempo medio de execucao de BFS, DFS e Dijkstra no dataset Facebook Ego (4039 nos, 88234 arestas), e tempo de Dijkstra detalhado por par.
- **Insight**: BFS eh ~8x mais rapido que DFS (24ms vs 179ms) neste grafo denso, pois a exploracao em largura evita o overhead de backtracking profundo. Dijkstra (~79ms) fica entre os dois, com custo adicional da fila de prioridade.
- **Tipo de grafico**: barras para comparacao de algoritmos + barras horizontais para detalhamento. Escolhido por ser o formato mais intuitivo para comparar quantidades entre categorias.

### 3.9 Distribuicao de Graus — Facebook Ego (`parte2_viz_graus_facebook.png`)
- **O que mostra**: histograma e grafico log-log da distribuicao de graus do dataset Facebook.
- **Insight**: a distribuicao segue aproximadamente uma power law — poucos nos tem grau muito alto (hubs sociais) enquanto a maioria tem poucos amigos. O grafico log-log mostra a relacao linear esperada, caracteristica de redes livres de escala (scale-free networks).
- **Tipo de grafico**: histograma + scatter log-log. O histograma mostra a forma da distribuicao; o log-log confirma o padrao power law.

---

## 4. Discussao Critica — Parte 2

### Quando usar cada algoritmo

| Cenario | Algoritmo Recomendado | Justificativa |
|---|---|---|
| Menor numero de saltos | BFS | O(V+E), encontra caminho com menos arestas |
| Detectar ciclos | DFS | Classifica arestas, identifica back edges |
| Caminho mais barato (pesos >= 0) | Dijkstra | O((V+E)logV), otimo para pesos positivos |
| Pesos negativos possiveis | Bellman-Ford | O(V*E), unico que suporta pesos negativos |
| Grafo muito grande (>100k nos) | BFS ou Dijkstra | DFS pode ser lento; BF impraticavel |

### Limitacoes do design de pesos
- Na Parte 1, os pesos sao discretos (1.0, 2.0, 2.5), o que limita a granularidade dos caminhos — em cenarios reais, distancias em km ou precos de passagem dariam resultados mais ricos.
- Na Parte 2, o dataset Facebook usa pesos uniformes (1.0), fazendo BFS e Dijkstra retornarem os mesmos caminhos — a diferenca eh apenas de desempenho.
- Bellman-Ford foi testado em subgrafos construidos (50 nos com pesos negativos e 4 nos com ciclo negativo) por limitacao do dataset original (sem pesos negativos naturais).

---

## 5. Analise Exploratoria e Explanatoria (AVD)

### Visualizacoes Exploratorias
1. **Distribuicao de graus** (`viz_distribuicao_graus.png`): exploracao inicial para entender a forma da rede — revela padrao hub-and-spoke.
2. **BFS em camadas** (`viz_bfs_camadas.png`): exploracao da acessibilidade a partir de REC — todos os nos alcancaveis em 3 niveis.

### Visualizacoes Explanatorias
1. **Ranking de aeroportos** (`viz_ranking_conectados.png`): comunica claramente quais sao os hubs dominantes — GRU e BSB destacados com gap significativo.
2. **Comparacao entre regioes** (`viz_comparacao_regioes.png`): comunica a diferenca de conectividade entre regioes — Sul e Centro-Oeste totalmente conectados internamente apesar de menores.

### Padroes Identificados
- **Hub-and-spoke**: GRU e BSB concentram >50% das conexoes, replicando o modelo real de aviacao brasileira.
- **Assimetria regional**: Nordeste tem mais aeroportos mas menor densidade que Sul e Centro-Oeste.
- **Mundo pequeno**: a partir de qualquer aeroporto, todos os outros sao alcancaveis em no maximo 3 saltos.
