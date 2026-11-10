# Animações e transições

O padrão de movimento do PequiDev. Todo componente novo segue este guia: escolhe
um dos padrões abaixo em vez de inventar duração, curva ou distância.

## A ideia

O site se mexe como o Pequi: **calmo, com intenção, sem exagero.** Um gato não
corre à toa; quando se mexe, é por um motivo, e pousa macio.

1. **Movimento explica alguma coisa.** Ou responde a um gesto (hover, clique),
   ou mostra de onde algo veio e para onde foi (troca de página, morph). Se não
   explica nada, não anima.
2. **Sai rápido, chega com calma.** O que vai embora some depressa para não
   disputar atenção; o que chega entra mais devagar, para dar tempo de ver.
3. **Pouca coisa se mexe, e se mexe pouco.** Distâncias de 1 a 4 px na
   interface, 16 px para algo que aparece, 40 px numa troca de página.
4. **Texto de leitura não se mexe.** Parágrafo, título de post e código ficam
   parados. Quem anima são blocos inteiros (cards, figuras), nunca a frase
   que alguém está lendo.
5. **Só `translate`, `opacity` e, de leve, `filter`.** Nada de animar largura,
   altura, margem ou posição: isso trava a página.
6. **Menos movimento pedido é respeitado.** Com `prefers-reduced-motion`,
   nada desliza: hover fica só na cor, conteúdo já aparece pronto e as páginas
   trocam na hora.
7. **Loop infinito é só do Pequi.** Ele respira, mexe o rabo e dorme. A
   interface não fica pulsando nem girando sozinha. A única exceção é a
   setinha que chama para rolar, no hero.

## Os tokens

Ficam no `:root` do `src/app/globals.css`. Componente nenhum escreve `200ms`
ou `ease-in-out` solto, do mesmo jeito que não escreve cor solta.

### Durações

| Token | Valor | Para quê |
| --- | --- | --- |
| `--dur-toque` | 100ms | Resposta ao clique (o botão afundando) |
| `--dur-rapida` | 150ms | Mudança de cor; conteúdo que sai |
| `--dur-base` | 220ms | Hover que mexe; conteúdo que entra |
| `--dur-movimento` | 400ms | Troca de página, morph, revelação do tema |

O tempo do Pequi é outro: respiração e rabo em ciclos de 4 a 6 segundos, e o
sprite no ritmo dos quadros dele. Esses valores ficam no próprio módulo
`pequi`, porque são do personagem, não da interface.

### Curvas

| Token | Curva | Para quê | Utilitário |
| --- | --- | --- | --- |
| `--curva-pouso` | `cubic-bezier(0.22, 1, 0.36, 1)` | Desacelera no fim. Entradas e hover. É a padrão. | `ease-pouso` |
| `--curva-saida` | `cubic-bezier(0.55, 0, 1, 0.45)` | Acelera. O que vai embora. | `ease-saida` |
| `--curva-travessia` | `cubic-bezier(0.65, 0, 0.35, 1)` | Algo que vai de um lugar a outro na tela | `ease-travessia` |
| `--curva-bote` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Passa um tico do ponto e volta. Botões. | `ease-bote` |

Qualquer `transition-*` do Tailwind já sai com `--dur-base` e `--curva-pouso`,
então `transition-colors` sozinho já está no ritmo do site.

### Distâncias

| Token | Valor | Para quê |
| --- | --- | --- |
| `--sobe-botao` | -2px | Botão sob o mouse |
| `--sobe-card` | -4px | Card sob o mouse |
| `--surge-dist` | 16px | De onde um bloco sobe ao aparecer |
| `--desliza-pagina` | 40px | Troca de página com direção |

## Os padrões

### Na interface (classes do Tailwind)

| Classe | O que faz | Use em |
| --- | --- | --- |
| `aperta` | Sobe 2 px com bote sob o mouse e afunda 1 px no clique | Botões: `ButtonLink`, `ThemeToggle` |
| `sobe` | Sobe 4 px sob o mouse | Card ou imagem que leva a outra página: `ProjectCard`, telas da galeria |
| `tinge` | Só a cor muda, rápido | Links do menu, itens de índice e de barra lateral |
| `surge` | O bloco aparece subindo ao entrar na tela, preso à rolagem | Itens de lista e grade: cards de projeto, linhas de post, telas, o cartão do "Sobre" |

Regras de uso:

- **Hover só existe onde há mouse.** `sobe` e `aperta` já vêm dentro de
  `@media (hover: hover)`; no celular o toque não deixa o card "subido".
- **`surge` vai no item da lista** (o `li`), não no card. Assim ele não briga
  com o `sobe` do card, que também mexe em `translate`.
- **`surge` não vai em texto corrido nem no que está no topo da página.** O que
  já aparece na primeira tela não deve "chegar".
- **`surge` é melhoria, não dependência.** Ele usa animação por rolagem
  (`animation-timeline: view()`); onde o navegador não tem, o bloco já está lá,
  parado.

### Entre páginas (View Transitions)

As trocas de página usam o `<ViewTransition>` do React 19.3, que o Next 16 já
dispara em toda navegação. As peças ficam em `src/components/motion/`:

| Peça | O que é |
| --- | --- |
| `PageTransition` | Envolve o conteúdo de **cada `page.tsx`**. Nunca o layout: ele continua na tela, então não entra nem sai. |
| `navegacao` | Os tipos de navegação para o `transitionTypes` do `Link` (e do `ButtonLink`) |
| `Morph` e `morphName` | Marcam o mesmo elemento em duas páginas para ele viajar de uma para a outra |

Três tipos de troca:

| Troca | Quando | Como |
| --- | --- | --- |
| `avanca` | Entra num nível mais fundo: card de projeto, "Ver todos os projetos" | A página velha sai para a esquerda e a nova entra pela direita |
| `volta` | Sobe um nível: a guia no topo do projeto, "Todos os projetos" da barra lateral | O contrário |
| `troca` (sem tipo) | Menu, itens irmãos da barra lateral, botão voltar do navegador | A velha some, a nova aparece subindo 16 px. Sem direção. |

```tsx
import { navegacao } from "@/components/motion/navegacao";

<Link href={`/projetos/${slug}`} transitionTypes={navegacao.avanca}>…</Link>
```

**Morph:** a capa do projeto no card e a mídia na página do projeto têm o
mesmo nome (`morphName.capaDoProjeto(slug)`), então a imagem viaja do card até
o topo da página. Regras:

- O nome tem que ser **único na página** e igual nas duas pontas. Monte sempre
  pelo `morphName`, nunca à mão.
- Só morfa o que é **a mesma coisa** nas duas páginas (a mesma imagem). Título
  com tamanho de letra diferente não morfa bem: deixe-o entrar com a página.
- O morph só acontece quando a página de destino já está carregada (o que o
  prefetch garante em produção). Sem isso, ela entra com a troca normal.

**Troca de tema:** o tema novo se abre num círculo a partir do botão
(`toggleTheme` em `src/lib/theme.ts`, regra `vt-tema` no CSS). Sem suporte a
View Transitions ou com menos movimento pedido, o tema troca na hora.

As animações de todas as trocas estão no `globals.css`, depois dos utilitários.
Com menos movimento pedido, todas viram troca instantânea.

### Do Pequi

O Pequi tem as animações dele e não segue a escala da interface:

| Onde | Como é feito |
| --- | --- |
| Dormindo no hero | CSS puro (`SleepingPequi.module.css`): respiração, rabo, pata, ronco |
| No índice do post | `TocCompanion`: sprite, pulo com a Web Animations API, sono por tempo |
| Prévia do sprite | `SpritePreview.module.css` |

Mesmo assim ele segue as regras gerais: só `transform` e `opacity`, nunca por
cima do texto, e parado (ou num quadro fixo) com menos movimento pedido.

### Abertura do hero

O cartão de código que se digita sozinho e a setinha que chama para rolar são
uma coreografia de entrada, feita uma vez em CSS no módulo `hero`. Não são um
padrão para repetir em outras páginas.

## Onde mora cada coisa

| O quê | Onde |
| --- | --- |
| Tokens (durações, curvas, distâncias) | `:root` em `src/app/globals.css` |
| Curvas como utilitário e padrão de `transition-*` | `@theme inline` no mesmo arquivo |
| Padrões de interface (`aperta`, `sobe`, `tinge`, `surge`) | `@utility` no mesmo arquivo |
| Animações das trocas de página e do tema | `::view-transition-*` no mesmo arquivo |
| Peças de transição em React | `src/components/motion/` |
| Animação própria de um módulo | CSS Module do componente, usando os tokens |
| Animação que depende de lógica (o Pequi do índice) | No componente, com a Web Animations API; nada de biblioteca de animação até precisar de verdade |

## Checklist para um componente novo

- [ ] Ele precisa mesmo se mexer? Qual é o motivo (resposta, continuidade, chegada)?
- [ ] Usa um padrão da tabela (`aperta`, `sobe`, `tinge`, `surge`) ou os tokens, sem número solto?
- [ ] Mexe só em `translate`, `opacity` ou `filter`?
- [ ] O texto que alguém lê fica parado?
- [ ] Com `prefers-reduced-motion`, nada desliza?
- [ ] Se é link para outra página: é `avanca`, `volta` ou troca sem tipo?
- [ ] Se a página nova é um `page.tsx`, o conteúdo está dentro do `PageTransition`?
