# Modo sonho

O Pequi da home está dormindo. No modo sonho, quem visita clica nele e a página
vira o sonho do gato: um Pequi em pixel art pula da faixa do título e anda,
pula e dorme **por cima do próprio site**. A navbar, os títulos e os cards
viram plataformas, e Esc acorda o Pequi.

É uma camada a mais e só aparece se a pessoa quiser. O site continua um
portfólio normal para quem só quer ler, inclusive para buscadores e
recrutadores com pressa.

Referências de mecânica: o currículo-jogo do Robby Leonardi (andar pelo
conteúdo) e os detalhes da Lynn Fisher (o site reage ao tamanho da janela). O
visual é o do Pequi, não o dessas referências.

## Decisões tomadas

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Estilo | Pixel art 2D | A foto do Pequi não anima andando. 3D pesaria demais e exigiria um gato modelado. |
| Fase | Os elementos reais da página | Projeto novo vira plataforma sozinho, sem desenhar fase. |
| Ativação | Só quando a pessoa pede | O código do jogo só baixa ao ativar; quem não joga não paga nada. |
| Motor | Canvas e `requestAnimationFrame`, sem biblioteca | Gravidade, plataformas atravessáveis por baixo, *coyote time* e *jump buffer* cabem em pouco código. |
| Tamanho do sprite | Célula de 96×64 px, gato com cerca de 52×56 | Em 32×32 o lenço e o pingente sumiam. |
| Arte | Gerada com `gpt-image-2` e reduzida ao pixel real por script | Mantém o Pequi reconhecível (lenço verde, pingente amarelo, patas brancas). |

Ainda a confirmar com o Gabriel: o nome "modo sonho" e o texto do botão que
abre o sonho.

## Etapas

| Etapa | Entrega | Situação |
| --- | --- | --- |
| 0. Sprite | Folha de sprites e prévia em `/brincar` | **Feita**, falta o Gabriel revisar os pontos abaixo |
| 1. Motor | Em `/brincar/sonho`: o Pequi andando e pulando sobre as seções da home, pelo teclado | **Feita** (escrita pelo Sol), falta o Gabriel ajustar o controle |
| 2. Interações | Enter abre o card, patada em botões, toque no celular, aviso para leitor de tela | **Feita** (escrita pelo Sol) |
| 3. Home | Clicar no Pequi dormindo abre o sonho, que continua entre as páginas | **Feita** (escrita pelo Sol) |

### Pontos para revisar no sprite

- **Caminhada**: dois dos seis quadros (1 e 5) são quase o gato parado, então o
  passo pode parecer travado. Se incomodar, regere só a caminhada ou mude a
  ordem em `ANIMACOES`.
- **Parado**: no quadro 1 o rabo está mais esticado que nos outros.
- **Parado**: o quadro 6 tem dois risquinhos brancos acima da orelha (a
  "mexida"). É intencional da IA; dá para apagar se não agradar.

## O sprite

| Arquivo | O que é |
| --- | --- |
| `public/pequi/sprite/pequi.png` | A folha: uma animação por linha, um quadro por coluna, fundo transparente |
| `src/modules/pequi/data/sprite.json` | Tamanho da célula, linha, quadros, velocidade e repetição de cada animação, e a paleta |
| `src/modules/pequi/components/SpritePreview.tsx` | A prévia que aparece em `/brincar` |
| `referencias/sprite-ia/*.webp` | As imagens-fonte geradas pela IA, sem perda |
| `referencias/sprite-ia/prompt-*.txt` | O prompt de cada imagem-fonte |
| `scripts/gerar-sprite-ia.py` | Pede uma imagem-fonte à OpenAI |
| `scripts/pixelizar-sprite.py` | Separa as poses de uma imagem-fonte e reduz cada uma ao pixel real |
| `scripts/montar-sprite.py` | Faz tudo a partir das fontes: converte, alinha, monta a folha e grava a imagem e o JSON |

Animações na folha:

| Linha | Nome | Quadros | Quadros por segundo | No jogo |
| --- | --- | --- | --- | --- |
| 0 | `parado` | 6 | 4 | Repete |
| 1 | `caminhada` | 6 | 10 | Repete |
| 2 | `pulo` | 6 | 12 | Toca uma vez: agacha, sobe, topo, desce, aterrissa |
| 3 | `patada` | 6 | 12 | Toca uma vez |
| 4 | `dormir` | 6 | 4 | Toca uma vez até o 5; depois alterna 5 e 6 (respiração) |

Todos os quadros estão apoiados no fundo da célula, que é a linha do chão, e
alinhados ao Pequi parado. Por isso trocar de animação não faz o gato pular de
lugar. O gato olha para a direita; para a esquerda, o jogo espelha o desenho.

### Refazer a folha

Depois de mudar uma imagem-fonte ou a lista `ANIMACOES`:

```bash
python scripts/montar-sprite.py
```

Ele só precisa de Pillow e numpy, os mesmos da `.venv` dos outros scripts de
imagem.

### Gerar uma imagem-fonte nova

```powershell
$env:OPENAI_API_KEY = "..."
python scripts/gerar-sprite-ia.py caminhada
python scripts/montar-sprite.py
```

- A pose-chave (`chave`) usa as fotos do Pequi em `referencias/` como modelo.
  As animações usam a pose-chave, para o gato sair igual em todas. Se a
  pose-chave mudar, gere de novo todas as animações.
- Cada chamada sai diferente. Abra o `.webp` gerado e confira antes de montar.
  A versão anterior fica no Git.
- O prompt pede fundo magenta liso, 6 quadros em grade de 3×2 e pixels grandes
  numa grade rígida. O conversor depende disso.
- A chave da OpenAI **nunca** vai para o repositório nem para o `.env.local`
  deste projeto. Ela fica só na variável do terminal.

### Adicionar uma animação

1. Escreva `referencias/sprite-ia/prompt-<nome>.txt` copiando um dos prompts de
   animação e trocando só o parágrafo final, `Animation: ...`.
2. Rode `python scripts/gerar-sprite-ia.py <nome>` e confira a imagem.
3. Acrescente `("<nome>", fps, repete, [1, 2, 3, 4, 5, 6])` em `ANIMACOES`, no
   `montar-sprite.py`, e rode o script.
4. Dê um nome legível para ela em `LABELS`, no `SpritePreview.tsx`.

## Fora do sonho: o Pequi no índice do post

O sprite também aparece sem o modo sonho, na página de post. Ele mora numa
margem à esquerda do índice lateral, que existe só para ele, e por isso nunca
fica por cima de texto. Prévia em `/brincar/leitura`, com um post de exemplo.

| Situação | O que ele faz |
| --- | --- |
| A página carrega | Aparece parado ao lado da seção que está na tela |
| A leitura passa para outra seção | Pula até o item dela no índice (agacha, voa num arco, aterrissa) |
| A seção muda de novo no meio do pulo | Termina o pulo e emenda outro até o item novo |
| Ninguém rola a página por 30 segundos | Deita e dorme, respirando |
| Alguém rola enquanto ele dorme | Levanta e, se a seção mudou, pula até ela |
| `prefers-reduced-motion` | Fica num quadro parado e troca de lugar sem pular |

A seção atual é a do último título que passou de 25% da altura da tela; no fim
da página é sempre a última.

| Arquivo | O que é |
| --- | --- |
| `src/modules/pequi/components/TocCompanion.tsx` | O Pequi: posição, pulo, sono. Recebe só a altura do chão e um sinal de rolagem |
| `src/modules/blog/components/TableOfContents.tsx` | O índice: marca a seção atual e diz ao Pequi onde é o chão |
| `src/modules/blog/components/PostLayout.tsx` | A moldura do post: texto à esquerda, índice fixo à direita |
| `src/modules/blog/components/ReadingPreview.tsx` | O post de exemplo da prévia |

Os tempos (30 s para dormir, ritmo da respiração, altura e duração do pulo)
são constantes no topo do `TocCompanion.tsx`.

Ainda falta:

- **Celular:** abaixo de 1024 px o índice some, e o Pequi junto. A ideia é ele
  andar numa barra de progresso de leitura no rodapé.
- **Página de post de verdade:** `/blog/[slug]` precisa tirar os títulos do
  Markdown (com ids) para montar o índice. A `PostLayout` já está pronta para isso.
- **Patada no botão de copiar** dos blocos de código e o **meme no fim do post**.

## O motor (etapa 1)

Teste em `/brincar/sonho`, com as seções da home como fase. Escrito pelo Sol
(ver docs/sol.md) a partir da especificação desta etapa e revisado antes de
entrar.

| Arquivo | O que é |
| --- | --- |
| `src/modules/pequi/dream/engine.ts` | O motor, sem React: física, plataformas, câmera, desenho e teclado |
| `src/modules/pequi/components/DreamMode.tsx` | O botão "Entrar no sonho", o canvas, o painel de controles, foco e avisos |
| `src/app/brincar/sonho/page.tsx` | A página de teste |

- **Plataformas:** todo elemento com `data-plataforma` (menu do topo, títulos de
  seção, cards de projeto, linhas de post, cartão do "Sobre"). Ele só pousa
  por cima; seta para baixo atravessa. O chão é o fim da página.
- **Controle:** setas ou A/D andam, Espaço, W ou seta para cima pulam (soltar
  cedo pula mais baixo), Esc sai. Tem *coyote time* e *jump buffer* de 6
  passos.
- **Física:** passo fixo de 1/60 s. Os números (velocidade, gravidade, pulo)
  são constantes no topo do `engine.ts`, para afinar jogando.
- **Pequi:** anda, pula com os quadros do sprite, senta depois de 8 s parado e
  dorme depois de mais 10 s.
- **Câmera:** a página rola sozinha para manter o gato no meio da tela (direto,
  sem suavizar, com menos movimento pedido).
- **Leve:** o motor só é baixado ao clicar em "Entrar no sonho".

## Interações e o site inteiro (etapas 2 e 3)

O sonho não mora mais numa página: um anfitrião no layout (`DreamHost`, via
`DreamDock`) ouve o aviso `sonho-entrar` (`src/lib/eventos.ts`) e cuida do
canvas, do painel e dos controles de toque. Qualquer botão pode pedir o sonho
com o `DreamTrigger`, que manda junto o ponto onde o Pequi aparece.

| Onde se entra | Como |
| --- | --- |
| Hero da home | Clicar no Pequi dormindo (área do corpo, com o balão "entrar no sonho do Pequi"); o Pequi de pixel sai de cima dele |
| `/brincar/sonho` | Botão "Entrar no sonho" |

- **Abrir:** em cima de uma plataforma com link para outra página do site, a
  dica "Enter: abrir <nome>" aparece no painel; Enter (ou "Abrir", no toque)
  navega com a transição de avançar. Links de âncora e externos não contam.
- **O sonho continua entre as páginas:** ao trocar de página, o Pequi
  reaparece no alto e cai no menu.
- **Patada:** X ou J. Se a pata alcança um elemento com `data-pequi-patada`
  (hoje, o botão de tema), ele é clicado.
- **Plataformas:** `data-plataforma` usa a borda de cima;
  `data-plataforma="base"` usa a de baixo (o menu do topo, onde ele anda ao
  lado dos botões). Os títulos de `/blog` e `/projetos` também são
  plataformas.
- **Toque:** em telas de toque aparecem botões grandes (◀ ▶, pular, patada,
  abrir).
- **Leitor de tela:** anúncio ao ligar e desligar, e a dica de abrir num
  `aria-live`. O foco vai para "Sair do sonho" e volta para onde estava.

## Correção: a queda sem fim na página de projeto

Ao abrir um projeto pelo sonho, o Pequi às vezes passava direto pelo menu e
caía pela página inteira. Era assim que acontecia:

- **Por quê:** ao trocar de página, ele reaparecia contando a partir da
  rolagem da tela. Nesse momento a rolagem ainda podia ser a da página
  anterior, então ele nascia abaixo do menu. A página de projeto não tinha
  nenhuma plataforma, e ele caía uns 4.000 px até o rodapé.
- **Correção no motor:** ele reaparece no topo da página, não da tela, e
  sempre cai no menu. O chão agora segura o gato mesmo que ele já esteja
  abaixo dele, caso a página encolha.
- **Plataformas na página de projeto:** o título, a faixa da demo, os
  títulos das seções e a ficha lateral (`ProjectDetail.tsx`). Com S/↓ ele
  desce do menu para o título.
- **Como foi testado:** em navegador sem janela (Playwright), achando o gato
  pelos pixels do canvas. A navegação foi feita pelo `router.push` com
  `transitionTypes`, o mesmo caminho do Enter. O defeito apareceu em produção
  e não aparece mais no build local.

Na mesma rodada, o Gabriel avaliou o controle: andar, pulo e câmera estão
bons, e as constantes não mudaram. Os botões de toque do celular estão ruins
e ficam para a próxima.

## O que ainda dá para fazer

- Melhorar os botões de toque no celular (o Gabriel achou ruins; falta saber o que incomoda).
- Mais alvos de patada e mais coisas para abrir.
