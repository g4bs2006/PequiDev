# Lixeira do Pequi

Um app dentro do PequiDev, em `/lixeira`: a pessoa aponta a câmera do celular
para um lixo, o app diz em qual lixeira ele vai (pela cor da coleta seletiva) e
o Pequi, de chapéu de lixeira, reage com uma frase falada. O modelo aprende
sozinho com o uso, e quem usa a lixeira desbloqueia chapéus que o Pequi passa a
usar também no blog.

O projeto é só software. A parte física do plano original (esteira, servos,
ESP32) ficou de fora para cortar custo e complexidade.

Este guia é o plano. O documento original do projeto (feito para um app
separado, em Vite) foi adaptado aqui para morar no PequiDev. O telão para TV,
com equipes e placar ao vivo, tem guia próprio: [lixeira-telao.md](lixeira-telao.md).

## Decisões tomadas

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Onde mora | Rota `/lixeira` no PequiDev, módulo `src/modules/lixeira/` | Reaproveita a hospedagem com HTTPS (exigido pela câmera), o Supabase, o painel e o Pequi. Vira também um projeto do portfólio. |
| Mascote | O próprio Pequi, com chapéu de lixeira | Já tem sprite, falas e personalidade. Dá unidade ao site e resolve o "nome do mascote em aberto" do plano original. |
| Framework | Next.js, como o resto do site (não Vite) | Um repositório só. A página da lixeira é um componente de cliente. |
| Visão | TensorFlow.js com MobileNet v2 e KNN, no navegador | Classifica na hora, sem internet, e aprender é só guardar mais um exemplo. |
| Peso | TensorFlow.js carregado só em `/lixeira`, por import dinâmico | Quem só lê o blog não baixa nada a mais. |
| Casos duvidosos | Claude Haiku numa Supabase Edge Function | A chave fica só no servidor. Uma chamada devolve classe, certeza e a fala do Pequi. |
| Identificação | Login anônimo do Supabase | Cada celular ganha um usuário sem e-mail nem senha. Seguro no PequiDev porque toda escrita do blog já exige `private.is_admin()`. |
| Banco | Tabelas novas, sem mexer nas do blog | O blog continua igual. A lixeira só acrescenta. |
| Voz | Web Speech API (ElevenLabs fica como opcional) | Grátis e já vem no navegador. |
| Chapéus no blog | Só no sprite em pixel art, carregados no navegador | O sprite tem 42 quadros com ponto da cabeça marcável. As páginas do blog ficam em cache, então o chapéu de cada um não pode vir do servidor. |

Ainda a confirmar com o Gabriel:

- Começar com as cinco categorias de material ou só com Reciclável, Rejeito e
  Vazio, separando os materiais depois.
- Tabelas num schema próprio `lixeira` ou com prefixo `lixeira_` no `public`
  (ver [Banco de dados](#banco-de-dados)).
- Quais chapéus existem e como cada um é desbloqueado.

## Categorias

| Categoria | Lixeira | Cor |
| --- | --- | --- |
| Metal | Reciclável | Amarelo |
| Plástico | Reciclável | Vermelho |
| Papel | Reciclável | Azul |
| Vidro | Reciclável | Verde |
| Rejeito | Não reciclável | Cinza |
| Vazio | Nenhuma (nada na frente da câmera) | — |

A classe Vazio existe para o app não classificar a mesa ou o fundo. As cores
seguem o padrão geral da coleta seletiva, e a tela sempre mostra o nome junto
da cor, para quem não distingue cores. As regras variam por cidade: deixar isso
claro no app.

## Etapas

Cada etapa termina com algo funcionando no celular. Primeiro o que prova a
ideia (classificar pela câmera), depois o acabamento.

| Etapa | Entrega | Pronto quando | Situação |
| --- | --- | --- | --- |
| 0. Preparação | Conta na Anthropic, Supabase CLI, rota `/lixeira` com "Olá" | A página abre no celular pelo link da Vercel | A fazer |
| 1. Câmera e classificação local | Câmera traseira, MobileNet + KNN, coleta só na memória, votação entre 5 quadros | Depois de coletar exemplos, o app acerta os objetos de teste na maioria das vezes | A fazer |
| 2. Banco | Tabelas, login anônimo, RLS, bucket `lixeira-fotos`, exemplos salvos e carregados, cache no IndexedDB | Fechar e reabrir o app mantém o que ele aprendeu | A fazer |
| 3. Claude | Edge Function `lixeira-validar`, foto de 384 px, plano B, limite de chamadas | Um objeto ambíguo é resolvido em até 3 segundos | A fazer |
| 4. Aprendizado contínuo | Regras de decisão, botões Acertou / Errou, limite por classe | Um objeto que o app errou passa a ser acertado depois de uma correção | A fazer |
| 5. Pequi e voz | Pequi de chapéu com os estados de humor, falas da lixeira, voz, mudo e legenda | Cada tipo de descarte gera reação e fala diferentes | A fazer |
| 6. Histórico, revisão e PWA | Histórico, telas de Coleta e Revisão no `/admin`, manifest e service worker de `/lixeira` | O app instala na tela inicial e abre sem internet | A fazer |
| 7. Chapéus | Ponto da cabeça em cada quadro do sprite, chapéus em pixel art, escolha na lixeira, chapéu no blog | O chapéu escolhido na lixeira aparece no Pequi do índice dos posts | A fazer |
| 8. Telão | Salas, equipes, placar ao vivo na TV | Ver [lixeira-telao.md](lixeira-telao.md) | A fazer |
| 9. Testes e apresentação | 10 objetos por categoria fora da base, ajuste dos limiares, roteiro de demonstração | A demonstração roda do início ao fim sem intervenção | A fazer |

## Como o código fica organizado

Seguindo as regras do README: a página só monta o módulo, componente nenhum
fala com o Supabase, cores e movimento são tokens.

```
src/app/lixeira/
  page.tsx               Monta a tela da câmera
  historico/page.tsx     Histórico do usuário
  layout.tsx             Liga o manifest e registra o service worker de /lixeira
src/app/admin/lixeira/
  coleta/page.tsx        Coleta da base de exemplos (só admin)
  revisao/page.tsx       Revisão de casos e exemplos (só admin)
src/modules/lixeira/
  index.ts               O que o módulo expõe
  categorias.ts          As classes, cores e nomes das lixeiras
  falas.ts               Banco de frases da lixeira
  chapeus.ts             Catálogo de chapéus e regras de desbloqueio
  visao/                 Carregar o MobileNet, KNN, votação entre quadros
  aprendizado.ts         Regras de decisão e balanceamento
  voz.ts                 Web Speech API
  queries.ts             Leituras e escritas no Supabase
  components/            Câmera, faixa da lixeira, botões Acertou / Errou, balão de fala
supabase/functions/lixeira-validar/
  index.ts               Chama o Claude e devolve classe, certeza, humor e frase
supabase/migrations/     Uma migration nova para as tabelas da lixeira
```

Antes de escrever código, ler o guia correspondente em `node_modules/next/dist/docs/`
(ver AGENTS.md): esta versão do Next.js muda APIs e convenções.

## Arquitetura e fluxo

Tudo o que é rápido roda no celular. Só os casos com confiança abaixo de 0,85
vão para a nuvem, onde a Edge Function chama o Claude.

1. A câmera traseira captura o objeto.
2. O MobileNet gera o embedding e o KNN devolve a classe e a confiança, sem
   internet.
3. Com confiança de 0,85 ou mais, o Pequi reage na hora com uma frase do banco.
4. Abaixo disso, a foto reduzida vai para a Edge Function, que chama o Claude e
   devolve classe, certeza, humor e frase. Enquanto isso o Pequi fica pensativo.
5. O descarte é registrado no Supabase. Se foi validado, vira também um exemplo
   novo.
6. Na próxima abertura, o app carrega os exemplos e o KNN já sabe o que
   aprendeu.

## Classificação no navegador

Duas etapas: o MobileNet transforma a imagem num embedding (1.280 números que
descrevem o que há na foto) e o KNN dá a classe dos exemplos guardados mais
parecidos. O MobileNet não é retreinado: aprender é só guardar mais um exemplo.

Pacotes: `@tensorflow/tfjs`, `@tensorflow-models/mobilenet` e
`@tensorflow-models/knn-classifier`.

```javascript
const net = await mobilenet.load({ version: 2, alpha: 1.0 });
const classificador = knn.create();

export async function classificar(video) {
  if (classificador.getNumClasses() === 0) return null;
  const emb = tf.tidy(() => net.infer(video, true));
  const { label, confidences } = await classificador.predictClass(emb, 10);
  return { emb, label, confianca: confidences[label] };
}
```

Pontos de atenção:

- **Memória:** tensores não se liberam sozinhos. Usar `tf.tidy()` e chamar
  `emb.dispose()`, senão o app trava depois de alguns minutos.
- **Valor de k:** começar com 10. Com poucos exemplos por classe, usar 3 a 5.
- **Confiança:** fração dos k vizinhos que concordam (0,9 com k = 10 são 9 de
  10).
- **Estabilidade:** classificar 5 quadros seguidos e aceitar só se a maioria
  concordar.
- **Quando classificar:** não em todo quadro. Começar quando a classe Vazio
  deixar de vencer, ou com um botão "Analisar".
- **Celular fraco:** MobileNet com `alpha` 0,5.

**Base inicial:** o KNN começa vazio. A tela de Coleta (no `/admin`) tira 20 a
30 fotos por classe, com objetos, ângulos e fundos variados. Esses exemplos
têm origem `base` e nunca são substituídos automaticamente.

## Aprendizado contínuo

Só se aprende com o que foi confirmado, para um erro nunca virar conhecimento.

| Situação | O que o app faz | Aprende? |
| --- | --- | --- |
| Confiança local ≥ 0,85 | Aceita na hora | Não: exemplos repetidos só desequilibram |
| Local < 0,85 e Claude ≥ 0,9 | Usa a classe do Claude | Sim, automaticamente |
| Local < 0,85 e Claude < 0,9 | Usa a classe do Claude e pede confirmação | Só se o usuário confirmar; senão vai para a revisão |
| Usuário toca em "Errou" | Mostra as categorias para escolher | Sim, com a classe do usuário |
| Sem internet | Usa a classe local e marca como pendente | Não; valida quando a conexão voltar |

Os limiares 0,85 e 0,9 são pontos de partida, ajustados depois de olhar o
histórico.

- **Acertou / Errou:** dois botões discretos depois de cada classificação.
  Nunca obrigatórios.
- **Limite por classe:** 150 exemplos aprendidos. Passando disso, o mais antigo
  aprendido é desativado. A base fica protegida.
- **Prioridade:** correções do usuário e casos que o modelo errou valem mais que
  casos fáceis.
- **Desfazer:** todo exemplo tem `ativo`. Na Revisão, desativar com um toque,
  sem apagar.
- **Carregar rápido:** cópia dos exemplos no IndexedDB, baixando só o que mudou
  desde a última abertura.
- **Foto junto:** cada exemplo guarda a foto, para revisar e para gerar os
  embeddings de novo se um dia o MobileNet mudar.

## Validação com Claude

O app nunca fala direto com a API. Ele manda a foto (no máximo 384 px no lado
maior, JPEG com qualidade 0,7) para a Edge Function `lixeira-validar`, que
guarda a chave e faz a chamada.

Resposta:

```json
{
  "classe": "plastico",
  "certeza": 0.93,
  "humor": "feliz",
  "frase": "Garrafa pet! Daqui a pouco ela vira camiseta. Chique demais, sô."
}
```

- `classe`: metal, plastico, papel, vidro, rejeito ou vazio. Fora disso, a
  resposta é inválida.
- `humor`: um dos estados do Pequi (ver abaixo).
- `frase`: no máximo 15 palavras, pronta para ser falada.

Prompt de sistema (ponto de partida, guardado no secret `PROMPT_LIXEIRA`):

```text
Você é o Pequi, um gato laranja rajado de Goiás que trabalha de fiscal da
lixeira: sarcástico, carinhoso e orgulhoso do seu trabalho.
Olhe a imagem e identifique o objeto principal que a pessoa quer descartar.
Classifique em: metal, plastico, papel, vidro, rejeito ou vazio.
Use rejeito para itens sujos, misturados ou que a coleta seletiva comum não
aceita (guardanapo engordurado, fralda, bituca).
Use vazio se não houver objeto claro.
Responda SOMENTE com um JSON válido com as chaves classe, certeza, humor e frase.
humor é um de: feliz, decepcionado, pensativo, surpreso.
A frase deve ter no máximo 15 palavras, em português do Brasil, engraçada e sem
ofender ninguém.
```

A função também precisa de: CORS só para o domínio do site, validação do JSON
antes de devolver, timeout de 8 segundos e o limite de chamadas por usuário.

**Plano B:** em timeout, erro da API, JSON inválido ou classe fora da lista, o
app usa a classe local, marca o descarte como `pendente` e o Pequi fala uma
frase genérica ("Hmm, tô sem sinal... vou no chute!").

**Abuso:** no máximo 30 chamadas por usuário por hora, controladas na tabela
`chamadas_api`, mais um limite mensal de gastos no console da Anthropic.

## O Pequi na lixeira

O Pequi usa um chapéu de lixeira (o chapéu padrão) e reage a cada descarte.
Personalidade: bem-humorado, um pouco irônico, nunca grosseiro. Expressões
goianas leves (sô, uai, trem, cê) com moderação. Fica feliz com reciclagem,
"decepcionado" com rejeito e confessa quando não sabe.

| Estado | Quando aparece | Animação do sprite |
| --- | --- | --- |
| Neutro | Esperando um objeto | `parado` |
| Pensativo | Esperando o Claude | `sentar`, com três pontinhos no balão |
| Feliz | Algo reciclável | `pulo`, brilho na cor da lixeira |
| Decepcionado | Rejeito | `sentar` com orelhas baixas (quadro a definir) |
| Surpreso | Mão na frente, objeto inesperado | `patada` |
| Aprendendo | Salvou um exemplo novo | `lamber`, com uma lâmpada no balão |
| Dormindo | Muito tempo sem uso | `dormir` |

A tabela usa as sete animações que já existem na folha. Se faltar expressão
(decepcionado e surpreso são os candidatos), entra uma animação nova seguindo
[modo-sonho.md](modo-sonho.md).

**Falas:** ficam em `src/modules/lixeira/falas.ts`, no mesmo formato de
`src/modules/pequi/falas.ts`. São usadas nos casos de confiança alta (sem
chamar a API) e como plano B. Regras: nunca repetir uma das últimas 5,
reticências de propósito (a voz pausa nelas) e frases boas do Claude podem ser
promovidas ao banco fixo pela Revisão. As frases do documento original entram
adaptadas para o Pequi ("Bom dia! Tô de barriga vazia e pronto pra trabalhar").

**Easter eggs:** reações especiais para objetos inesperados. Um pequi ("Ô trem
bom! Mas cuidado com o espinho, sô"), uma fruta, um celular ("Esse aqui eu não
aceito, não, que tá caro"), um gato ("Concorrência? Aqui não").

**Voz:** Web Speech API com voz pt-BR, `pitch` e `rate` ajustados no Android e
no iPhone. Botão "Começar" na abertura (o celular só toca som depois de um
toque), botão de mudo salvo no `localStorage`, e a frase sempre aparece no
balão para quem estiver no mudo. No Chrome, esperar o evento `voiceschanged`
antes de escolher a voz.

## Chapéus

O chapéu é o prêmio por usar a lixeira, e o que faz o Pequi da lixeira aparecer
também no blog.

**Como funciona:**

1. Todo mundo começa com o chapéu de lixeira.
2. Usar a lixeira desbloqueia outros. Exemplos: 10 latinhas dão o chapéu de
   alumínio, 7 dias seguidos dão a coroa, corrigir o Pequi 5 vezes dá o chapéu
   de formatura, e uma meta batida no telão dá um chapéu da equipe.
3. A pessoa escolhe o chapéu na lixeira.
4. Ao abrir o blog no mesmo navegador, o Pequi do índice dos posts e o do modo
   sonho aparecem com aquele chapéu. Quem nunca usou a lixeira vê o Pequi
   normal.

**O desafio é o desenho, não o banco.** O sprite tem 7 animações de 6 quadros
cada, e a cabeça muda de lugar em cada um. Para o chapéu acompanhar:

- Marcar em cada um dos 42 quadros o ponto da cabeça (x, y e inclinação) e
  guardar em `src/modules/pequi/data/sprite.json`, ao lado de cada animação.
  Dá para gerar um primeiro chute por script, a partir do contorno das orelhas,
  e corrigir à mão.
- Desenhar cada chapéu em pixel art, no mesmo estilo e paleta do sprite, em
  `public/pequi/chapeus/`.
- O player de `src/modules/pequi/sprite.ts` desenha o chapéu por cima a cada
  troca de quadro, espelhando junto quando o gato olha para a esquerda.

Os recortes de foto (o Pequi acordado, o dormindo e as poses) ficam sem chapéu
por enquanto. Talvez nunca precisem.

**No blog, o chapéu é carregado no navegador.** As páginas ficam em cache e
são iguais para todo mundo, então o chapéu de cada um não pode vir do
servidor. O componente do Pequi lê a sessão anônima depois que a página abre e
busca o chapéu escolhido. Para não fazer uma consulta a cada página, guardar o
chapéu também no `localStorage` e só conferir no banco de vez em quando.

## Banco de dados

Nada nas tabelas do blog muda. A lixeira acrescenta uma migration nova.

| Tabela | Guarda | Campos principais |
| --- | --- | --- |
| `exemplos` | O conhecimento do KNN | classe, embedding `vector(1280)`, foto_path, origem (`base`, `claude`, `usuario`), ativo |
| `descartes` | Histórico de uso | classe_local, confianca_local, classe_final, fonte, certeza_claude, frase, humor, status (`ok`, `pendente`, `revisar`), foto_path |
| `chamadas_api` | Limite de uso da API | user_id, created_at |
| `perfis` | O chapéu escolhido | user_id, chapeu, updated_at |

As colunas de sala e equipe em `descartes` e as tabelas do telão estão em
[lixeira-telao.md](lixeira-telao.md).

Precisa da extensão `vector` (pgvector) para os embeddings.

**Schema `lixeira` ou prefixo `lixeira_`:** um schema próprio separa bem do
blog, mas exige incluí-lo em "Exposed schemas" nas configurações da API do
Supabase e gerar os tipos com `--schema public,lixeira`. O prefixo no `public`
não exige nada, só deixa os nomes mais longos. Escolher antes da etapa 2.

**Regras de acesso (RLS), em todas as tabelas:**

- `exemplos`: qualquer usuário autenticado (inclusive anônimo) lê os ativos.
  Insere só com o próprio `user_id`. Desativar é só para admin
  (`private.is_admin()`).
- `descartes`: cada usuário lê e insere só as próprias linhas. Admin lê tudo,
  para a Revisão.
- `chamadas_api`: sem acesso pelo app. Só a Edge Function escreve, com a chave
  de serviço.
- `perfis`: cada usuário lê e altera só a própria linha. Ao trocar de chapéu,
  uma função confere se ele foi desbloqueado, para ninguém escolher um chapéu
  que não ganhou chamando a API direto.

**Storage:** bucket **privado** `lixeira-fotos`, separado do bucket público
`imagens` do blog. Pastas por usuário (`<user_id>/<arquivo>.jpg`). Cada um grava
e lê só a própria pasta, e o admin lê tudo. Fotos no tamanho de 384 px, as
mesmas enviadas ao Claude.

**Realtime:** ligado em `descartes`, para o histórico se atualizar sozinho.

**Login anônimo:** ativar em Authentication → Sign In / Providers. É seguro no
PequiDev porque todas as escritas do blog e do bucket `imagens` já exigem
`private.is_admin()`. Dois cuidados:

- `getAdminStatus` em `src/modules/admin/auth.ts` hoje trata qualquer usuário
  logado sem permissão como `sem-permissao`. Um visitante anônimo que abrir
  `/admin` cairia nesse estado. Tratar `is_anonymous` como `fora`.
- Se um dia quiser guardar os chapéus entre aparelhos, a conta anônima pode ser
  convertida em conta de verdade ("salvar com Google") sem perder nada.

Depois de mudar o esquema, gerar os tipos de novo (ver README).

## Telas

| Tela | Rota | Para quem | O que mostra |
| --- | --- | --- | --- |
| Câmera | `/lixeira` | Todos | Câmera em tela cheia, retângulo guia, Pequi de chapéu num canto, balão de fala, faixa colorida com a lixeira ("Amarelo — Metal"), Acertou / Errou, mudo |
| Histórico | `/lixeira/historico` | Todos | Descartes com miniatura, contagem por categoria (hoje, semana, mês), gráfico, percentual reciclável, chapéus desbloqueados |
| Coleta | `/admin/lixeira/coleta` | Admin | Escolha da classe e sequência de fotos, com contador por classe |
| Revisão | `/admin/lixeira/revisao` | Admin | Casos para revisar, discordâncias entre o modelo local e o Claude, exemplos recentes com botão de desativar, frases para promover |

**PWA só da lixeira:** manifest próprio (nome, ícones de 192 e 512 px com o
Pequi de chapéu, `display: standalone`, `start_url` e `scope` em `/lixeira`) e
um service worker com escopo `/lixeira/` guardando a página, o MobileNet e as
falas para abrir e classificar sem internet. O resto do site continua um site
normal. Conferir na documentação do Next.js desta versão como servir um
manifest por rota.

**Outros requisitos:** câmera traseira
(`getUserMedia({ video: { facingMode: "environment" } })`), tema claro e escuro
pelos tokens do site, botões grandes, legenda das falas e cor sempre com o
nome da lixeira.

## Segurança, privacidade e custos

- **Chave da Anthropic** só nos secrets do Supabase
  (`supabase secrets set ANTHROPIC_API_KEY=...`). Nunca no código, no GitHub
  ou em variável `NEXT_PUBLIC_*`.
- **Chave de serviço do Supabase** só na Edge Function. O site continua usando
  apenas a chave pública, protegida pelas regras do banco.
- **Privacidade:** o app fotografa o que está na frente da câmera. Avisar na
  primeira abertura, guardar só a foto reduzida e permitir apagar o próprio
  histórico.
- **Custos:** hospedagem, Supabase, voz e TensorFlow.js são grátis. O único
  gasto é a API do Claude, uma fração de centavo por chamada. Como o Claude só
  é chamado nos casos duvidosos, o custo cai conforme o modelo aprende.
  Acompanhar o gasto real no console nas primeiras semanas. Preços e limites
  mudam: conferir em docs.claude.com e no site do Supabase.

## Riscos e limitações

| Risco | Mitigação |
| --- | --- |
| Exemplos errados contaminam o KNN | Aprender só com o que foi confirmado, campo `ativo`, Revisão |
| Classes desequilibradas | Limite de 150 por classe, base protegida |
| Celular fraco | `alpha` 0,5, classificar só sob demanda, `dispose` dos tensores |
| Abertura lenta com muitos exemplos | IndexedDB e download só do que mudou |
| Iluminação e fundos variados | Base coletada em vários lugares, aprendizado contínuo |
| API fora do ar | Timeout de 8 s, classe local, frase genérica |
| Chave exposta | Só na Edge Function, limite por usuário e limite mensal |
| TensorFlow.js pesando no blog | Import dinâmico só em `/lixeira` |
| Chapéu desalinhado em algum quadro | Ponto da cabeça revisado quadro a quadro, prévia em `/brincar` |

Limitações conhecidas: um objeto por vez; material composto (longa vida, papel
plastificado) é difícil até para pessoas; a voz nativa muda de aparelho para
aparelho; os chapéus valem só no navegador onde foram ganhos (até existir
conta de verdade).

## Ideias para depois

- **Telão para TV**, com equipes, placar e o Pequi narrando:
  [lixeira-telao.md](lixeira-telao.md).
- **Como descartar, não só onde:** "tira a tampa", "lava antes". Itens
  especiais (pilhas, eletrônicos, óleo, remédios) com tela própria apontando
  pontos de coleta.
- **Ler o símbolo de reciclagem:** apontar para o triângulo com número no
  plástico e o Pequi explicar o tipo.
- **Modo quiz:** a pessoa tenta adivinhar a lixeira antes do Pequi revelar. No
  telão vira a "aula ao vivo".
- **Pergunta por voz:** "ei Pequi, isopor recicla?", com reconhecimento de voz
  do navegador e resposta do Claude.
- **O Pequi lembra de você:** comenta hábitos, comemora sequências de dias,
  muda de humor se a pessoa some.
- **Retrospectiva:** "Você reciclou 214 itens este ano, o Pequi te chama de
  Mestre da Latinha", em card para compartilhar.
- **Impacto em números:** energia economizada por latinha e afins, sempre com
  fonte citada, porque é fácil exagerar.
- **Contador coletivo:** "Hoje o Pequi aprendeu 12 coisas novas com a
  comunidade".
- **Pequi no WhatsApp:** foto pelo WhatsApp, resposta com classe, frase e
  áudio, reaproveitando a Edge Function. Fica para bem depois: o telão já cobre
  o "todo mundo testa no próprio celular" da demonstração.
- **Parte física:** o mesmo app comandando um ESP32 com servo por Wi-Fi.
