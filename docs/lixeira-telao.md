# Telão da Lixeira

> **Arquivado em 2026-11-22.** Era a etapa 8 da [Lixeira do Pequi](lixeira.md);
> no lugar dela entrou a revisão visual para o celular. O plano fica aqui para
> quando voltar.

Uma TV na sala mostra o Pequi grande, ao vivo, narrando os descartes de todo
mundo. Cada pessoa joga pelo próprio celular, na [Lixeira do Pequi](lixeira.md),
e as equipes disputam um placar que se atualiza na hora.

Serve para três situações: uma escola ou empresa fazendo um desafio de
reciclagem por dias, uma aula ao vivo sobre coleta seletiva e a demonstração do
projeto para uma plateia.

Depende da lixeira já funcionar (etapas 1 a 5 de [lixeira.md](lixeira.md)).

## Decisões tomadas

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Quem fala | A TV, não os celulares | Com 30 pessoas, 30 celulares falando juntos viraria barulho. A TV é o narrador da partida, e o celular mostra só a faixa da lixeira e os botões. |
| Como entrar | QR code na TV, sem instalar nem criar conta | Usa o login anônimo da lixeira. Quem chega atrasado escaneia o QR do canto. |
| O que roda na TV | Só recebe eventos e anima | A classificação acontece nos celulares. Funciona até em smart TV fraca. |
| Como a TV recebe | Canal de transmissão do Supabase Realtime (`sala:<codigo>`) | A TV não lê as tabelas. Recebe só apelido, equipe, categoria e frase. |
| Fotos | Nunca aparecem na TV por padrão | A TV é uma tela pública. Alguém vai fotografar algo impróprio. |
| Pontuação | Por acertar a lixeira, não por reciclar | O objetivo é ensinar. Rejeito no lugar certo também vale. |

Ainda a confirmar com o Gabriel: o nome ("Telão" é provisório) e se o
organizador precisa ser admin do PequiDev ou se qualquer pessoa pode criar uma
sala.

## Como funciona

1. **O organizador cria uma sala** (professor, gestor ou o próprio Gabriel numa
   apresentação): nome, equipes com cores, modo, duração e meta coletiva. A
   sala ganha um código curto, por exemplo `ABC123`.
2. **A TV abre `/lixeira/telao/ABC123`.** Serve o navegador da smart TV, um
   notebook no HDMI ou uma aba transmitida pelo Chromecast. A primeira tela tem
   um botão "Ligar telão".
3. **A TV mostra um QR code grande:** "Entre no time!". O QR leva a
   `/lixeira?sala=ABC123`.
4. **Cada pessoa escaneia**, escolhe a equipe e um apelido, e cai na câmera da
   lixeira, agora jogando pela sala.
5. **A cada descarte, a TV reage:** o Pequi pula e fala em voz alta ("A Ana do
   time Azul mandou uma latinha! Azul encostou no Verde!"), o placar cresce e o
   descarte entra na lista ao vivo.
6. **No fim**, a TV mostra a retrospectiva da sala, e cada pessoa recebe o card
   no celular.

## O que aparece na TV

```
┌──────────────────────────────────────────────────────────────┐
│  🏆 Desafio da Lixeira · 3º ano B          ⏱ faltam 2 dias   │
├───────────────────────────────┬──────────────────────────────┤
│                               │  PLACAR                      │
│        [ PEQUI GRANDE ]       │  🔵 Azul      ████████  142  │
│     com o chapéu do líder     │  🟢 Verde     ███████   131  │
│                               │  🟡 Amarelo   ████       78  │
│  "Terceira latinha seguida?   │                              │
│   Tá fazendo festa, Azul?"    │  AO VIVO                     │
│                               │  🟡 Ana · metal · agora      │
│                               │  🔴 Léo · plástico · 1 min   │
├───────────────────────────────┴──────────────────────────────┤
│  Meta da turma: 351 / 500 itens  ███████████░░░░░            │
│  🧠 Hoje o Pequi aprendeu 12 coisas novas com vocês   [QR]   │
└──────────────────────────────────────────────────────────────┘
```

| Área | O que mostra |
| --- | --- |
| Pequi | Grande, no centro, usando o chapéu da equipe que lidera. Reage a cada descarte e narra em voz alta, com a frase também no balão. |
| Placar | Barras na cor de cada equipe, crescendo com animação a cada ponto. Troca de liderança ganha reação especial do Pequi. |
| Ao vivo | Os últimos descartes: apelido, ícone e nome da categoria, há quanto tempo. Sem fotos. |
| Meta coletiva | Barra da turma inteira. Bater a meta desbloqueia um chapéu especial para todo mundo da sala. Equilibra competição com colaboração. |
| Aprendizado | "Hoje o Pequi aprendeu N coisas novas com vocês": quantos exemplos novos a sala ensinou ao KNN. Deixa visível a parte técnica mais impressionante. |
| QR | Sempre num canto, para quem chegar depois. |
| Relógio | Quanto falta para acabar, quando a sala tem fim. |

Falas próprias do telão, além das da lixeira: troca de liderança ("Virou! O
Verde passou o Azul!"), sequência de uma equipe ("Amarelo tá on fire, sô"),
sala parada há muito tempo ("Ninguém me alimenta mais..."), meta perto do fim
("Faltam 10 itens pra todo mundo ganhar chapéu!").

## Modos

| Modo | Duração | Como é |
| --- | --- | --- |
| Campeonato | Dias ou semanas | O telão fica ligado no corredor ou no refeitório. O placar acumula, e o Pequi faz um resumo do dia ao abrir e ao fechar. |
| Aula ao vivo | 30 a 50 min | O modo quiz coletivo: a TV mostra a foto de um objeto (da base de exemplos, aprovada pelo admin), todos votam pelo celular em qual lixeira vai, e o Pequi revela a resposta com o resultado ("70% errou: isopor vai no vermelho!"). Pontua quem acertou. |
| Apresentação | 5 a 10 min | A plateia escaneia o QR e testa com o que tiver na bolsa, enquanto a TV mostra tudo. É o roteiro de demonstração do projeto. |

**Retrospectiva:** no fim de qualquer modo, a TV mostra equipe campeã, material
mais descartado, "MVP da latinha", o item mais estranho que o Pequi viu e
quantas coisas ele aprendeu. Cada participante recebe um card no celular para
compartilhar.

## Pontuação e anti-trapaça

| Ação | Pontos |
| --- | --- |
| Descarte classificado (qualquer lixeira, inclusive rejeito) | 1 |
| Corrigir o Pequi com a classe certa ("Errou") | 2: ensina o modelo |
| Acertar a pergunta na aula ao vivo | 1 |

Sem regra, alguém fotografa a mesma latinha 200 vezes. As defesas:

- **Repetição pelo embedding:** se a foto nova for quase idêntica (similaridade
  de cosseno alta) a uma que a mesma pessoa mandou nos últimos minutos, não
  pontua, e o Pequi entrega: "Essa latinha eu já conheço, hein? Cê tá me
  testando?". Usa o embedding que o app já calcula, sem custo extra.
- **Limite por pessoa por minuto** (por exemplo, 6 descartes).
- **Correção falsa:** a correção só pontua depois de confirmada (pelo Claude ou
  na Revisão), para ninguém tocar "Errou" de propósito atrás de pontos.
- **Os pontos são contados no servidor**, não no celular. O celular só registra
  o descarte, e as regras acima rodam no banco.

## Cuidados por ser uma tela pública

- **Nada de foto na TV.** Só ícones da categoria. Se o organizador quiser
  destacar uma foto ("o item mais estranho"), ele aprova antes.
- **Apelidos com filtro** de palavrões, e o organizador pode renomear ou
  remover alguém da sala.
- **A TV não acessa as tabelas.** Escuta o canal `sala:<codigo>`, que recebe
  só o necessário: apelido, equipe, categoria, pontos e frase. Nunca
  `user_id`, foto ou dado de outra sala.
- **Escolas e menores de idade (LGPD):** só apelido e conta anônima, sem e-mail
  nem nome real. Os dados da sala podem ser apagados quando ela termina.
- **Código da sala** curto o bastante para digitar, longo o bastante para não
  ser adivinhado, e a sala pode ser fechada para novas entradas.

## Banco de dados

Continua sem mexer em nada do blog. Entra numa migration própria, depois das
tabelas de [lixeira.md](lixeira.md).

| Tabela | Guarda | Campos principais |
| --- | --- | --- |
| `salas` | Cada desafio | codigo, nome, organizador (user_id), modo (`campeonato`, `aula`, `apresentacao`), inicio, fim, meta, aberta, limite_chamadas |
| `equipes` | As equipes de uma sala | sala_id, nome, cor |
| `participantes` | Quem está em qual equipe | user_id, sala_id, equipe_id, apelido |
| `descartes` | Ganha duas colunas opcionais | sala_id, equipe_id: vazias para quem usa a lixeira fora de uma sala |
| `perguntas` | As rodadas da aula ao vivo | sala_id, exemplo_id, aberta_ate |
| `respostas` | Os votos da aula ao vivo | pergunta_id, user_id, classe |

- **Placar:** uma função que soma os pontos por equipe da sala. O telão chama
  ao abrir e ao reconectar. Durante o jogo, vai somando pelo canal.
- **O canal:** um gatilho no `insert` de `descartes` com `sala_id` publica no
  canal `sala:<codigo>` só os campos públicos, já com os pontos calculados.
- **RLS:** o organizador gerencia a própria sala. Participantes leem a sala e as
  equipes em que estão e inserem a própria linha em `participantes`. Ninguém lê
  descartes de outra pessoa.

## Parte técnica da TV

- **Botão "Ligar telão":** o navegador só toca som depois de um toque ou
  clique. O mesmo clique entra em tela cheia e pede o Wake Lock, para a TV não
  apagar a tela.
- **Feito para 1920×1080 visto a 3 metros:** letras grandes (nada abaixo de uns
  32 px), alto contraste, tema escuro, tamanhos em unidades da tela para
  escalar em qualquer TV.
- **Leve:** sem TensorFlow.js, só o sprite do Pequi, CSS e o canal do Realtime.
  Animações com os tokens de [animacoes.md](animacoes.md).
- **Reconexão:** se a internet piscar, o telão busca o placar de novo ao
  voltar e mostra um aviso discreto enquanto estiver fora.
- **Fila de falas:** se vários descartes chegarem juntos, o Pequi não fala
  todos. Narra o mais interessante (troca de liderança, sequência, item
  incomum) e resume o resto ("E mais 4 do Verde!").
- **Voz da TV:** a voz pt-BR do navegador da TV pode ser fraca ou não existir.
  Testar nas TVs reais. O plano B é o notebook no HDMI, ou o ElevenLabs com as
  falas fixas pré-geradas.

## Custos

Com uma sala cheia, as chamadas ao Claude somam rápido. Além do limite por
pessoa da lixeira, cada sala tem um **limite de validações** (por exemplo, 300
por evento). Passou disso, vale só a classificação local, e o Pequi avisa: "Hoje
eu tô no modo econômico, sô". O placar não muda nada no custo: Realtime e banco
cabem no plano gratuito para salas de turma.

## Etapas

| Etapa | Entrega | Pronto quando | Situação |
| --- | --- | --- | --- |
| 1. Telão básico | Criar sala no `/admin`, equipes, QR, entrada pelo celular, placar e lista ao vivo, Pequi narrando | Duas pessoas em equipes diferentes veem o placar mudar na TV em menos de 2 segundos | A fazer |
| 2. Regras do jogo | Pontos no servidor, anti-repetição pelo embedding, limite por minuto, filtro de apelidos | Mandar a mesma latinha várias vezes não muda o placar | A fazer |
| 3. Meta e chapéus | Meta coletiva, chapéu do líder na TV, chapéu especial ao bater a meta | Bater a meta desbloqueia o chapéu no celular de todos | A fazer |
| 4. Retrospectiva | Tela final na TV e card no celular | O card pode ser salvo e compartilhado | A fazer |
| 5. Aula ao vivo | Perguntas, votos pelo celular, revelação com porcentagens | Uma rodada de 10 perguntas roda do início ao fim | A fazer |
