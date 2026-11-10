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
| 1. Motor | Em `/brincar`: o Pequi andando e pulando sobre as seções da home, pelo teclado | A fazer |
| 2. Interações | Abrir card com Enter, dormir quando ninguém mexe, patada no botão de tema, botões de toque no celular, aviso para leitor de tela | A fazer. Depende de `/projetos/[slug]` e `/blog/[slug]` existirem. |
| 3. Home | Clicar no Pequi dormindo abre o sonho, com transição de entrada e saída | A fazer |

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

## Próximo passo: o motor (etapa 1)

O que a etapa 1 precisa entregar, em `/brincar`:

- As seções da home renderizadas na página, com `data-plataforma` nos cards,
  títulos e navbar.
- Um canvas fixo por cima da página, com `pointer-events: none`, desenhando o
  sprite com `imageSmoothingEnabled = false`.
- Um laço com passo fixo de 60 por segundo:
  - gravidade e pulo de altura variável (soltar o botão corta o pulo);
  - plataformas em que ele só pousa por cima;
  - margem de alguns quadros para pular logo depois de sair da borda e para
    guardar o pulo apertado pouco antes de tocar o chão.
- As posições das plataformas lidas com `getBoundingClientRect` e relidas ao
  rolar ou redimensionar a janela.
- A página rolando sozinha para acompanhar o Pequi.
- Controles: setas ou WASD, espaço para pular e Esc para sair. O jogo pausa
  quando a aba fica escondida.
- **Pronto quando** o controle estiver gostoso no teclado.
