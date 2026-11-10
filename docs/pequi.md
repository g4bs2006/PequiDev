# O Pequi, personagem do site

O Pequi é o personagem principal do PequiDev, não um enfeite. Ele está sempre
por perto, reage ao que a pessoa faz no site e tem vontade própria: senta, se
lambe, dorme quando ninguém mexe. Este guia diz quem ele é, como se comporta e
como fazer uma parte nova do site conversar com ele.

## Quem ele é

Gato laranja rajado, de peito, focinho e patas brancos, lenço verde-sálvia com
pingente amarelo. Calmo, curioso, meio preguiçoso e com um senso de humor de
gato: derruba coisas e finge que foi sem querer.

Ele tem duas formas, cada uma para um uso:

| Forma | Onde | Por quê |
| --- | --- | --- |
| **Pixel art** (o sprite) | O Pequi que acompanha a visita: no canto da tela e no índice dos posts | É a forma que anda, pula e reage. A foto não anima andando. |
| **Foto realista** | Momentos grandes e parados: dormindo no hero, e os memes (404, fim de post) | É o Pequi "de verdade", para quando ele é a cena. |

## Regras

- **Nunca cobre o texto.** Ele vive nas margens e nos cantos.
- **Um Pequi por vez.** Onde a página já tem um Pequi à vista (o hero, o índice
  do post, a prévia do sprite), o do canto sai de cena e volta quando aquele
  some. Esses lugares são marcados com `data-pequi-casa`.
- **Dá para esconder.** O botão "esconder o Pequi" aparece ao passar o mouse
  sobre ele ou depois de um toque. A escolha fica guardada (`localStorage`,
  chave `pequidev-pequi`) e o botão "chamar o Pequi" traz ele de volta.
- **Menos movimento pedido, menos Pequi.** Com `prefers-reduced-motion` ele não
  anda nem anima: aparece e some no lugar, em quadros parados. As falas
  continuam.
- **Não pesa.** O código dele só é baixado depois que a página abre
  (`PequiDock`, com `next/dynamic` e `ssr: false`).
- **É enfeite para o leitor de tela,** exceto os botões: "Fazer carinho no
  Pequi", "esconder o Pequi" e "chamar o Pequi" são botões de verdade.

## O Pequi do canto

`src/modules/pequi/components/PequiCompanion.tsx`, montado no layout pelo
`PequiDock`, então ele continua com a pessoa de uma página para outra.

### Rotina

```
fora ──(nenhuma casa à vista)──> andando ──> em pé ──(4 s)──> sentado
  ^                                                              │
  └──(casa à vista ou escondido)── andando <─────────────────────┤
                                                                 ├─(12 a 22 s)─> se lambe ─> sentado
                                                                 └─(35 s sem ninguém mexer)─> dormindo
dormindo ──(rolagem, mouse, teclado)──> acorda ──> sentado
```

- Ele entra andando pela direita, para no canto e olha para a página.
- Se a pessoa muda de ideia no meio (rola para o hero e volta), ele vira ali
  mesmo.
- Quando abre uma página, ele espera um pouco antes de entrar, para não roubar
  a cena de quem acabou de chegar.

### Reações

| Quando | O que ele faz | Fala |
| --- | --- | --- |
| Chega ao canto | Fica em pé, olhando a página | `chegou` |
| Alguém clica nele, sentado | Se lambe | `carinho` |
| Alguém clica nele, em pé | Dá uma patada | `carinho` |
| Alguém clica nele, dormindo | Acorda e senta | `acordou` |
| O tema troca | Patada (ele leva o crédito) | `tema` |
| Alguém copia código de um post | Patada | `copiou` |
| Um card passa sob o mouse | Se estiver sentado, levanta para olhar | `card`, às vezes |
| A página troca | Pulinho no lugar | — |
| Rolagem rápida | Corre no lugar enquanto ela dura | `correndo`, às vezes |
| O rodapé aparece (fim da página) | Senta | `fim`, uma vez por página |
| A página tem um post com índice | Pula para cima e some; o do índice chega caindo do alto | — |
| Dormindo | Ronca de vez em quando | `dormindo` |

"Às vezes" quer dizer com sorteio e com pelo menos 10 segundos desde a última
fala espontânea, para ele não tagarelar.

### O Pequi do índice

Nos posts (no computador), quem acompanha a leitura é o Pequi do índice
(`TocCompanion`). Ele chega caindo do alto no item ativo, pula de seção em
seção, dorme depois de 30 segundos sem rolagem e dá uma patada quando alguém
copia código.

As falas ficam em `src/modules/pequi/falas.ts`, por situação. A cada vez ele
sorteia uma. São curtas, em minúscula, num balão na fonte Anton.

### Tempos

Constantes no topo do `PequiCompanion.tsx`: espera para entrar (1,2 s), em pé
até sentar (4 s), intervalo das lambidas (12 a 22 s), tempo até dormir (35 s),
duração do balão (2,6 s), ritmo da caminhada (10 ms por pixel), intervalo entre
falas espontâneas (10 s) e a velocidade de rolagem que faz ele correr
(2500 px por segundo).

## Como uma parte do site conversa com ele

Componente nenhum fala direto com o Pequi. Quem faz alguma coisa **avisa** o
que aconteceu, e o Pequi decide como reagir. Os avisos ficam em
`src/lib/eventos.ts`, porque `components/` e `lib/` não podem importar módulos.

```ts
import { avisar } from "@/lib/eventos";

avisar("tema", { tema: "dark" });
```

Para uma reação nova:

1. Acrescente o tipo do aviso e os dados dele em `AvisoDoSite`, no
   `src/lib/eventos.ts`.
2. Chame `avisar` no lugar onde a coisa acontece.
3. No `PequiCompanion.tsx`, trate o aviso no `ouvir(...)` e crie a reação no
   comportamento (`createCompanion`). Se precisar, crie a situação nova no
   `falas.ts`.
4. Acrescente a linha na tabela de reações deste guia.

O componente que avisa não muda mais quando a reação mudar.

Dois atalhos por atributo, para componentes de servidor que não rodam código
no navegador:

- `data-pequi="card"`: o bloco chama a atenção dele sob o mouse (cards de
  projeto e linhas de post já têm).
- `data-pequi-casa="<nome>"`: o bloco já tem o seu próprio Pequi à vista e o
  do canto cede o lugar. Hoje: `hero`, `indice` (ele sai pulando, para o
  índice) e `previa`.

## O sprite

| Animação | Quadros | Uso |
| --- | --- | --- |
| `parado` | 6, em loop | Em pé, respirando |
| `caminhada` | 6, em loop | Entrando e saindo de cena |
| `pulo` | 6 | Pulos do Pequi do índice, pulinho na troca de página, saída para o índice |
| `patada` | 6 | Carinho em pé, troca de tema, código copiado |
| `dormir` | 6 | Deitar (1 a 5) e respirar dormindo (5 e 6); de trás para frente, acordar |
| `sentar` | 6 | Sentar; o quadro 6 é o "sentado" parado |
| `lamber` | 6 | Se lamber, sentado |

A folha fica em `public/pequi/sprite/pequi.png` e os dados em
`src/modules/pequi/data/sprite.json`. Para tocar animações, use
`createSpritePlayer` (`src/modules/pequi/sprite.ts`), que já sabe o tamanho da
célula, o ritmo e a repetição de cada animação. Como gerar e montar animações
novas está em [docs/modo-sonho.md](modo-sonho.md#adicionar-uma-animação).

## Momentos em foto

O Pequi realista aparece parado, quando ele é a cena:

| Onde | O quê |
| --- | --- |
| Hero da home | Dormindo, com a pata pendurada na faixa (`SleepingPequi`) |
| Página 404 | Bravo, em foto com legenda de meme (`MemeCard`) |
| Fim de cada post | A reação escolhida no painel (`MemeCard`) |
| `/blog` sem nenhum post | Dormindo deitado em cima do aviso (`PequiNap`) |

As poses e as regras dos memes estão em [docs/poses-do-pequi.md](poses-do-pequi.md).

## O que vem depois

- O modo sonho, mais para frente.
