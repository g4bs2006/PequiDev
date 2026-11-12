# Poses do Pequi

Catálogo das reações do Pequi em formato de meme. Cada pose saiu de um meme de
gato que o Gabriel escolheu como inspiração, mas o meme é sempre **recriado com
o próprio Pequi**: a foto original não entra no site nem no repositório. Aqui
ela aparece só descrita em palavras.

As cinco poses existem em foto realista (`public/pequi/poses/`). A 404 usa o
`bravo`, e cada post pode terminar com uma delas, escolhida no painel.

## Regras

- **Só o Pequi.** Nenhuma foto de outro gato, nem recortada, nem de fundo.
- **Legenda fora da imagem.** O texto do meme é HTML por cima da imagem, na
  fonte Anton (`font-meme`), em pt-BR. Assim ele é lido por leitor de tela, dá
  para trocar sem gerar a imagem de novo e não sai com as letras tortas que a IA
  costuma desenhar.
- **Emoji também fora da imagem.** Os memes originais têm mãos de emoji
  coladas por cima. Aqui elas são texto (🤙, ☝️), desenhadas pela fonte de
  emoji do aparelho, e não um desenho copiado.
- **Nada de símbolo de guerra.** Capacete, farda ou veículo sem insígnia,
  bandeira ou modelo histórico reconhecível.
- **Nunca cobre o texto.** Como o resto do Pequi, as reações ficam nas margens,
  nos cantos ou em páginas que são dele (como a 404).
- **Cada imagem tem texto alternativo**, descrevendo a pose, e a legenda vai
  junto no HTML.

## Quem é o Pequi

Toda geração repete a identidade dele:

- gato laranja rajado, listras laranja-escuras;
- peito, focinho e patas brancos, ponta do rabo branca;
- nariz rosa, olhos âmbar;
- lenço verde-sálvia amarrado no pescoço, com um pingente amarelo em forma de
  gota.

As fotos de referência ficam em `referencias/` (`pequi-acordado.png`,
`pequi-folha-referencia.png`).

## As poses

| Pose | Inspiração | Legenda sugerida | Onde entra |
| --- | --- | --- | --- |
| `bravo` | Close de gatinho bravo, "eu irei falar palavras feias" | "eu irei" / "falar palavras feias" | Página 404 |
| `hang-loose` | Gato de olhos arregalados e língua de fora, com 🤙 | "valeu por ler" 🤙 | Fim do post |
| `soldado` | Gatinho de capacete, olhar perdido, cenário de batalha | "sobrevivi a mais um deploy" | Posts de bug difícil ou de deploy |
| `pensativo` | Gato de perfil com a pata no queixo, pôr do sol no campo | "e se o problema for o cache?" | "O humano por trás" ou posts de reflexão |
| `na-verdade` | Gato de óculos com dentinhos de fora e ☝️ | "na verdade..." ☝️ | Blocos de dica e curiosidade dos posts |

### `bravo`

- **Corpo e expressão:** close do rosto, bem perto da câmera, um pouco tremido.
  Olhos semicerrados e sobrancelhas franzidas, bochechas cheias, cara de quem
  vai xingar.
- **Cena:** fundo claro e desfocado, nada de cenário.
- **Legenda:** a de cima é "eu irei"; a de baixo, "falar palavras feias". Na
  404, uma terceira linha pequena embaixo explica o erro de verdade.
- **Texto alternativo:** "O Pequi em close, de cara fechada, prestes a
  reclamar."

### `hang-loose`

- **Corpo e expressão:** de frente, cabeça levemente inclinada, olhos enormes e
  brilhando, boca aberta com a pontinha da língua para fora. Feliz e meio bobo.
- **Cena:** canto de casa, parede clara, luz de dentro.
- **Legenda:** "valeu por ler", com o 🤙 no canto de baixo, como no original.
- **Texto alternativo:** "O Pequi de olhos arregalados e língua de fora,
  fazendo cara de feliz."

### `soldado`

- **Corpo e expressão:** de frente, só a cabeça e o pescoço, olhar parado e
  cansado, direto na câmera, de quem viu coisas.
- **Adereço:** capacete cinza genérico, simples, **sem insígnia e sem o formato
  de modelo histórico**. Uma panela de cozinha no lugar do capacete também
  funciona e fica mais com a cara do site.
- **Cena:** campo enevoado e acinzentado. No lugar do tanque, um vulto
  desfocado de servidor ou de pilha de caixas, para puxar para o mundo dev.
- **Legenda:** "sobrevivi a mais um deploy" ou "dia 3 caçando o bug".
- **Texto alternativo:** "O Pequi de capacete, com olhar cansado, num campo
  enevoado."

### `pensativo`

- **Corpo e expressão:** de perfil, olhando para longe, uma pata branca dobrada
  apoiada no queixo. Calmo, filosófico.
- **Cena:** campo verde no fim da tarde, sol baixo no horizonte e nuvens.
- **Legenda:** "e se o problema for o cache?". Na seção "O humano por trás",
  talvez sem legenda nenhuma.
- **Texto alternativo:** "O Pequi de perfil, com a pata no queixo, olhando o
  pôr do sol."

### `na-verdade`

- **Corpo e expressão:** de frente, bem centralizado, olhar sério de quem vai
  corrigir alguém. Dois dentinhos da frente aparecendo.
- **Adereço:** óculos de armação preta grossa.
- **Cena:** fundo escuro e desfocado, como um quarto à noite.
- **Legenda:** "na verdade...", com o ☝️ no canto de baixo.
- **Texto alternativo:** "O Pequi de óculos e dentinhos de fora, com cara de
  quem vai explicar uma coisa."

## Dois estilos

**Foto realista** (o estilo do Pequi dormindo na home). É o formato dos memes:
imagem quadrada, 1024×1024, convertida para WebP. Serve para a 404, o fim do
post e "O humano por trás".

**Pixel art** (o estilo do sprite). Os memes são de frente e em close, e o
sprite é de lado, então não dá para reaproveitar a folha atual. Seriam
"retratos" de frente, 64×64, num balão que aparece acima do Pequi do índice:
por exemplo, o `na-verdade` quando a leitura passa por um bloco de dica.

Dá para começar por um estilo e fazer o outro depois.

## Como gerar

| Arquivo | O que é |
| --- | --- |
| `referencias/poses/base.txt` | A identidade do Pequi e as regras comuns (foto de celular, quadrada, sem texto, sem emoji) |
| `referencias/poses/prompt-<pose>.txt` | A pose: corpo, expressão, adereço e cena |
| `referencias/poses/<pose>.webp` | A imagem gerada, sem perda |
| `public/pequi/poses/<pose>.webp` | A versão para o site, 1024×1024 |
| `scripts/gerar-pose-ia.py` | Junta a base e a pose, manda as fotos de `referencias/` como modelo para o `gpt-image-2` e grava as duas imagens |

```powershell
$env:OPENAI_API_KEY = "..."
python scripts/gerar-pose-ia.py bravo
```

- A chave da OpenAI fica só na variável do terminal, nunca no repositório.
- Cada chamada sai diferente e gasta crédito da chave. Para refazer uma pose,
  ajuste o prompt dela e gere só ela; a versão anterior fica no Git.
- Pose nova: escreva o `prompt-<pose>.txt`, gere, e acrescente a pose nas
  tabelas deste documento.

## Situação

| Pose | Foto realista | Pixel art |
| --- | --- | --- |
| `bravo` | No site (404) | A fazer |
| `hang-loose` | Disponível para os posts | A fazer |
| `soldado` | Disponível para os posts (panela no lugar do capacete; ao fundo, prédios na neblina) | A fazer |
| `pensativo` | Disponível para os posts | A fazer |
| `na-verdade` | Disponível para os posts | A fazer |

## No site

| Onde | Pose | Como |
| --- | --- | --- |
| Página 404 | `bravo` | Ao lado do aviso, com "eu irei / falar palavras feias" |
| Fim de cada post | A escolhida no painel (ou nenhuma) | Em "O Pequi leu", antes das tags, com a legenda da pose ou uma própria |

- As imagens, a descrição, o nome no painel e as legendas de cada pose ficam em
  `src/modules/pequi/memes.ts`. A foto com legenda é o `MemeCard`, do mesmo
  módulo; ele marca o lugar como casa do Pequi, então o do canto sai de cena.
- A pose de cada post fica na coluna `pequi_reacao` e a legenda própria em
  `pequi_legenda` (migração `reacao_do_pequi_nos_posts`). O banco só aceita as
  cinco poses do catálogo: pose nova precisa de migração.
- A legenda é texto na fonte Anton, clara com contorno escuro; o emoji também
  é texto. Com legenda própria, o emoji da pose não aparece.

Uma tentativa de pôr os memes entre as guias de `/projetos` não agradou e
ficou de fora (branch `pequi-memes`).
