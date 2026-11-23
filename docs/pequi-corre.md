# Pequi Corre

Um jogo de corredor (pular e abaixar) onde uma população de Pequis controlados
por redes neurais aprende a jogar sozinha. O jogo é só o meio: o objetivo é
aprender a treinar redes neurais, de verdade, usando a placa de vídeo do
Gabriel.

Este guia é o plano, conversado em 2026-11-23. **Nada foi implementado ainda.**
"Pequi Corre" é nome provisório (ver [Decisões em aberto](#decisoes-em-aberto)).

## A ideia

Inspirado num vídeo do YouTube (<https://youtu.be/OQoBGuoQdhY>) em que uma
população de agentes aprende o jogo do dinossauro do Chrome (o que aparece sem
internet), e os obstáculos vão sendo acrescentados aos poucos:

1. Primeiro os agentes aprendem a pular os cactos.
2. Depois entra o pássaro, e eles aprendem a abaixar.
3. Depois mais um obstáculo, e assim por diante, sempre acrescentando.

No fim, **a mesma rede neural tem que saber fazer tudo**, e a gente quer o
melhor resultado possível.

O vídeo não pôde ser aberto pelo Claude (o YouTube é bloqueado na rede do
ambiente dele); a descrição acima é a do Gabriel.

### Não copiar o jogo do Chrome

A mecânica (corredor que pula e abaixa) é livre, mas o desenho e o visual do
dinossauro do Chrome não. **O corredor é o Pequi**, que já tem sprite
(`docs/pequi.md`), com obstáculos nossos. Assim também vira um projeto com a
cara do PequiDev.

## O salto em relação à Lixeira

A Lixeira não treina rede nenhuma: usa o MobileNet já treinado pelo Google,
congelado, e um KNN que só guarda exemplos e compara a foto nova com eles
(`docs/lixeira.md`).

Aqui é outro tipo de problema, **aprendizado por reforço**: ninguém dá a
resposta certa; o agente tenta, recebe pontos ou punição e os pesos da rede
mudam. O método escolhido é **neuroevolução com aprendizado por currículo**.

## Como funciona

### 1. O jogo separado da tela

A lógica do jogo é um "ambiente": `passo(ações) → (o que cada agente vê,
recompensa, morreu?)`, com passo de tempo fixo, sem desenhar nada. Assim roda
milhares de vezes mais rápido que o jogo na tela. Só o melhor agente é
desenhado, em velocidade normal.

### 2. A população (neuroevolução)

- Milhares de Pequis correm ao mesmo tempo, cada um com a sua rede.
- **Nota (fitness):** distância percorrida mais obstáculos passados.
- Fim da geração:
  - os melhores passam intactos (elitismo);
  - os outros nascem do cruzamento dos bons, com mutação nos pesos;
  - a próxima geração corre.

### 3. A rede cabe em todas as fases desde o primeiro dia

A decisão mais importante. Se a rede só enxergar "distância até o cacto",
precisa de outra rede quando o pássaro chegar. Por isso:

- **Entradas genéricas**, que servem para qualquer obstáculo: distância até o
  próximo obstáculo, altura dele em relação ao chão, largura, altura, distância
  até o seguinte, velocidade do jogo, altura e velocidade vertical do Pequi.
- **Saídas fixas desde a fase 1**: pular, abaixar, nada. Na fase dos cactos o
  "abaixar" existe e não serve para nada; quando o pássaro chega, o neurônio já
  está lá.
- Rede inicial: totalmente conectada, umas 8 a 10 entradas, uma camada oculta
  de uns 8 a 12 neurônios, 3 saídas (vence a maior).

### 4. O currículo

Cada fase acrescenta um obstáculo:

| Fase | Obstáculo novo | O que ele aprende |
| --- | --- | --- |
| 1 | Cacto baixo, velocidade constante | Pular na hora certa |
| 2 | Pássaro alto | Abaixar (e não pular) |
| 3 | Pássaro baixo e médio | Diferenciar pular de abaixar pela altura |
| 4 | Cactos em grupo e largos | Pular mais cedo |
| 5 | Velocidade aumentando | Antecipar |
| 6+ | A inventar: buraco, pássaro que desce, sequências | ... |

A fase só avança quando a população domina a atual. Exemplo de regra: o melhor
agente passa 50 obstáculos seguidos em 3 sementes diferentes.

### 5. Não esquecer o que aprendeu

Problema clássico: o **esquecimento catastrófico**. Se a fase 2 tiver só
pássaros, a população desaprende os cactos. Solução: **sempre misturar os
obstáculos das fases anteriores** na pista, para a nota medir tudo.

### 6. Justiça na nota

- Na mesma geração, todos correm a mesma pista (mesma semente).
- Cada geração ganha uma pista nova.
- O campeão é testado em várias pistas.

Senão a evolução premia sorte.

### 7. Buscar o melhor resultado

- **Painel ao vivo:** a rede do melhor agente com os neurônios acendendo, nota
  por geração, marcas nas trocas de fase, quantos Pequis ainda vivos.
- **Ajustes para comparar:** tamanho da população, taxa de mutação, neurônios
  na camada oculta. Medir qual chega mais longe e em menos gerações.
- **Salvar o campeão:** os pesos são poucos números (JSON), para carregar ou
  continuar o treino depois.
- **Depois:** NEAT (a evolução cria neurônios e ligações novas conforme o jogo
  fica difícil), comparado com a rede fixa. Mais para frente, PPO.

## Treino na placa de vídeo

O Gabriel quer treinar no hardware dele: **AMD Radeon RX 7600 XT**. Ele falou em
6 GB de VRAM, mas a 7600 XT tem 16 GB (a RX 7600 comum tem 8 GB): conferir no
Gerenciador de Tarefas (Desempenho → GPU). Qualquer um dos dois sobra para este
projeto.

### Quando a GPU ajuda (e quando não)

Uma rede minúscula (10 → 8 → 3) roda mais rápido no processador que na placa, e
o gargalo é a simulação do jogo. Para a placa trabalhar de verdade:

1. **Simulação em lote na GPU.** O jogo escrito em PyTorch com tensores em vez
   de objetos: posição, velocidade e obstáculos de todos os Pequis são
   matrizes, e um passo anda com todos de uma vez. As redes viram uma
   multiplicação de matrizes em lote (`torch.bmm`, pesos com forma
   `[população, entradas, ocultos]`). População de **10 mil a 50 mil Pequis**
   por geração, cada geração em segundos. População grande acha soluções
   melhores e se recupera mais rápido a cada fase nova do currículo.
2. **Nível 2: o Pequi enxergando pixels.** Em vez dos números, ele vê a tela, e
   a rede vira convolucional. Aqui a GPU é obrigatória. Fica para depois que o
   currículo funcionar com os números.

### Onde roda cada coisa

- **Treino:** no PC do Gabriel. O ambiente do Claude na nuvem não tem GPU.
  Opção: ligar o PC à sessão pelo Remote Control do app do Claude, para o
  Claude rodar os comandos lá (instalar, treinar, ler resultados).
- **Site:** carrega o JSON do campeão e mostra o Pequi jogando, com a rede e os
  gráficos do treino. A rede é tão pequena que roda em TypeScript puro, sem
  TensorFlow.

### Arquitetura proposta

```
treino/                   Python (PyTorch), roda no PC com a placa
  jogo.py                 O jogo vetorizado: todos os Pequis por tensor
  rede.py                 Redes em lote (pesos [população, ...])
  evolucao.py             Seleção, elitismo, cruzamento, mutação
  curriculo.py            Fases, regra de avanço, mistura das fases antigas
  treinar.py              Laço principal, logs, exporta o campeão em JSON
src/modules/pequi-corre/  O jogo no site (TypeScript), mesmas regras do jogo.py
```

As regras do jogo existem duas vezes (Python e TypeScript). **Um teste com a
mesma semente** garante que as duas dão o mesmo resultado; senão o campeão
treinado não joga igual no site.

### Instalar o PyTorch com a placa AMD

Pesquisado em 2026-11-23:

- **Linux é o caminho mais tranquilo:** o ROCm completo roda lá. O **RX 7600**
  entrou na lista oficial de GPUs suportadas no **ROCm 7.12** (prévia, março de
  2026), com PyTorch 2.10 em Linux e Windows.
- A **7600 XT** usa o mesmo chip (gfx1102), então deve estar coberta, mas
  nenhuma fonte a citou pelo nome: é dedução. Se não for reconhecida no Linux,
  o truque conhecido é `HSA_OVERRIDE_GFX_VERSION=11.0.0`.
- **Windows:** a AMD tem PyTorch nativo (só o PyTorch, não o ROCm inteiro), mas
  a lista de janeiro de 2026 não traz a 7600 nem a 7600 XT. Pode funcionar ou
  não: testar. A documentação da AMD diz que só Python 3.12 é suportado.
- **Teste depois de instalar** (no ROCm o PyTorch continua usando o nome
  `cuda`):

  ```bash
  python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
  ```

  `True` e o nome da placa: está pronto.

Fontes:

- [ROCm Core SDK 7.12.0 release notes](https://rocm.docs.amd.com/en/7.12.0-preview/about/release-notes.html)
- [AMD ROCm 7.12 Tech Preview (Phoronix)](https://phoronix.com/news/amd-rocm-7.12-tech-preview)
- [AMD Windows PyTorch release notes](https://www.amd.com/en/resources/support-articles/release-notes/RN-AMDGPU-WINDOWS-PYTORCH-7-2.html)
- [Radeon Limitations and recommended settings](https://rocm.docs.amd.com/projects/radeon-ryzen/en/docs-7.1.1/docs/limitations/limitationsrad.html)
- [The Road to ROCm on Radeon for Windows and Linux](https://www.amd.com/en/blogs/2025/the-road-to-rocm-on-radeon-for-windows-and-linux.html)

## Etapas

Cada etapa termina com algo funcionando. As etapas 1 a 3 podem nascer no
navegador (TypeScript, sem GPU) para provar a ideia rápido; com a decisão de
treinar na placa, o treino de verdade passa para o `treino/` em Python.

| Etapa | Entrega | Situação |
| --- | --- | --- |
| 0. Preparação | PyTorch instalado no PC e o teste da GPU dando `True` | A fazer (Gabriel) |
| 1. O jogo | Jogo com o Pequi, só cactos, jogável no teclado ou no toque, regras separadas da tela | A fazer |
| 2. Rede e evolução | População aprende a fase 1, com painel ao vivo | A fazer |
| 3. Currículo | Pássaros, troca de fase automática, mistura das fases antigas | A fazer |
| 4. GPU | `treino/` em PyTorch vetorizado, população de milhares, teste de paridade com o jogo do site | A fazer |
| 5. Campeão no site | Exportar e carregar o campeão, gráficos do treino, modo "você contra a IA" | A fazer |
| 6. NEAT | Comparar com a rede fixa | A fazer |
| 7. Pixels | O Pequi vendo a tela, rede convolucional na GPU | A fazer |

## Decisões em aberto

- **Sistema do PC:** Windows ou Linux? Define a instalação do PyTorch.
- **VRAM:** confirmar o modelo da placa e a memória (6, 8 ou 16 GB).
- **Onde mora o treino:** pasta `treino/` dentro do PequiDev (sugerido: site e
  treino dividem as regras do jogo) ou repositório separado.
- **Nome e rota:** sugerido `/pequi-corre`.
- **Obstáculos próprios:** quais são, e como ficam em pixel art.
