# Lixeira do Pequi

Um app dentro do PequiDev, em `/lixeira`: a pessoa aponta a câmera do celular
para um lixo, o app diz em qual lixeira ele vai (pela cor da coleta seletiva) e
o Pequi, de chapéu de lixeira, reage com uma frase falada. O modelo aprende
sozinho com o uso, e quem usa a lixeira desbloqueia chapéus que o Pequi passa a
usar também no blog.

O projeto é só software. A parte física do plano original (esteira, servos,
ESP32) ficou de fora para cortar custo e complexidade.

Este guia é o plano. O [documento original do projeto](lixeira-documento-original.md)
(feito para um app separado, em Vite) foi adaptado aqui para morar no PequiDev. O telão para TV,
com equipes e placar ao vivo, tem guia próprio: [lixeira-telao.md](lixeira-telao.md).

## Decisões tomadas

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Onde mora | Rota `/lixeira` no PequiDev, módulo `src/modules/lixeira/` | Reaproveita a hospedagem com HTTPS (exigido pela câmera), o Supabase, o painel e o Pequi. Vira também um projeto do portfólio. |
| Categorias | As cinco de material (metal, plástico, papel, vidro, rejeito) mais Vazio | Decidido pelo Gabriel em 2026-11-16, antes da etapa 1. |
| Tabelas | Prefixo `lixeira_` no schema `public` | Decidido pelo Gabriel em 2026-11-16: não exige expor schema novo na API. |
| Mascote | O próprio Pequi, com chapéu de lixeira | Já tem sprite, falas e personalidade. Dá unidade ao site e resolve o "nome do mascote em aberto" do plano original. |
| Framework | Next.js, como o resto do site (não Vite) | Um repositório só. A página da lixeira é um componente de cliente. |
| Visão | TensorFlow.js com MobileNet v2 e KNN, no navegador | Classifica na hora, sem internet, e aprender é só guardar mais um exemplo. |
| Peso | TensorFlow.js carregado só em `/lixeira`, por import dinâmico | Quem só lê o blog não baixa nada a mais. |
| Casos duvidosos | GPT da OpenAI (`gpt-5.4-mini`) numa Supabase Edge Function | Decidido pelo Gabriel em 2026-11-16, no lugar do Claude Haiku do plano original. A chave fica só no servidor. Uma chamada devolve classe, certeza e a fala do Pequi. |
| Identificação | Login anônimo do Supabase | Cada celular ganha um usuário sem e-mail nem senha. Seguro no PequiDev porque toda escrita do blog já exige `private.is_admin()`. |
| Banco | Tabelas novas, sem mexer nas do blog | O blog continua igual. A lixeira só acrescenta. |
| Voz | Web Speech API (ElevenLabs fica como opcional) | Grátis e já vem no navegador. |
| Chapéus no blog | Só no sprite em pixel art, carregados no navegador | O sprite tem 42 quadros com ponto da cabeça marcável. As páginas do blog ficam em cache, então o chapéu de cada um não pode vir do servidor. |

Ainda a confirmar com o Gabriel:

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
| 0. Preparação | Conta na Anthropic, Supabase CLI, rota `/lixeira` com "Olá" | A página abre no celular pelo link da Vercel | **Rota feita**; conta na Anthropic e Supabase CLI ficam para a etapa 3 |
| 1. Câmera e classificação local | Câmera traseira, MobileNet + KNN, coleta só na memória, votação entre 5 quadros | Depois de coletar exemplos, o app acerta os objetos de teste na maioria das vezes | **Feita** (rascunho do Sol); falta testar com objetos de verdade no celular |
| 2. Banco | Tabelas, login anônimo, RLS, bucket `lixeira-fotos`, exemplos salvos e carregados, cache no IndexedDB | Fechar e reabrir o app mantém o que ele aprendeu | **Feita** (rascunho do Sol) |
| 3. GPT | Edge Function `lixeira-validar`, foto de 384 px, plano B, limite de chamadas | Um objeto ambíguo é resolvido em até 3 segundos | **Feita** (app pelo Sol); falta o secret `OPENAI_API_KEY` no Supabase para a nuvem responder |
| 4. Aprendizado contínuo | Regras de decisão, cartão de arrastar (Acertou / Errou), limite por classe | Um objeto que o app errou passa a ser acertado depois de uma correção | **Feita** (app pelo Sol); o aprender sozinho com o GPT espera a chave |
| 5. Pequi e voz | Pequi de chapéu com os estados de humor, falas da lixeira, voz, mudo e legenda | Cada tipo de descarte gera reação e fala diferentes | A fazer |
| 6. Histórico, revisão e PWA | Histórico, telas de Coleta e Revisão no `/admin`, manifest e service worker de `/lixeira` | O app instala na tela inicial e abre sem internet | A fazer |
| 7. Chapéus | Ponto da cabeça em cada quadro do sprite, chapéus em pixel art, escolha na lixeira, chapéu no blog | O chapéu escolhido na lixeira aparece no Pequi do índice dos posts | A fazer |
| 8. Telão | Salas, equipes, placar ao vivo na TV | Ver [lixeira-telao.md](lixeira-telao.md) | A fazer |
| 9. Testes e apresentação | 10 objetos por categoria fora da base, ajuste dos limiares, roteiro de demonstração | A demonstração roda do início ao fim sem intervenção | A fazer |

### Etapa 0: o que já existe

- `/lixeira` abre com o Pequi de capacete (a pose `soldado`) se apresentando
  como fiscal e as cinco lixeiras, cada uma com o nome da cor escrito. Fica
  fora da busca (`noindex`) enquanto está em construção.
- As classes ficam em `src/modules/lixeira/categorias.ts`, e as cores são os
  tokens `--lixeira-amarelo`, `-vermelho`, `-azul`, `-verde` e `-cinza` (com
  `--on-lixeira-*` para o texto) em `globals.css`, iguais nos dois temas. O
  vermelho e o verde foram escurecidos para o texto branco passar de 4,5:1.

### Etapa 1: o que já existe

- **O toque acorda tudo.** O botão "Abrir a câmera" pede a câmera traseira e,
  ao mesmo tempo, faz o `import()` de `visao/modelo.ts`. Antes disso a página
  não baixa nada do TensorFlow: ele vai num pedaço separado de uns 880 KB.
  O MobileNet (uns 14 MB) vem do tfhub.dev, que hoje redireciona para o Kaggle.
- **Pacotes:** só as partes do TensorFlow.js que a lixeira usa
  (`tfjs-core`, `tfjs-converter`, `tfjs-backend-webgl`, `tfjs-backend-cpu`,
  4.22.0) mais `@tensorflow-models/mobilenet` 2.1.1 e `knn-classifier` 1.2.6.
  O backend é WebGL, com CPU de reserva.
- **Ensinar:** um botão por classe (as cinco e Vazio). Cada toque guarda o
  quadro atual como exemplo, só na memória. "Esquecer o que aprendi" zera.
- **Analisar:** precisa de pelo menos duas classes ensinadas. Lê 5 quadros com
  120 ms entre eles, e `visao/votacao.ts` escolhe a maioria (empate: maior
  confiança média). Só aceita com maioria estrita; senão o Pequi diz que ficou
  na dúvida. k é 10 quando toda classe ensinada tem 10 exemplos, senão 3.
- **Memória:** os embeddings ficam dentro de `tidy()` e são descartados depois
  do `addExample` e do `predictClass`. Seis análises seguidas deixaram o número
  de tensores igual (113 antes e depois).
- **Testado** no navegador com uma câmera falsa (um canvas com uma lata, uma
  garrafa, um jornal e o fundo vazio): com 10 exemplos de cada, acertou as
  quatro cenas com 5 de 5 quadros, em menos de 1 s por análise. Erros de
  câmera (negada, ausente, sem HTTPS) e de download do modelo têm mensagem
  própria. **Falta** testar com objetos de verdade num celular.
- Para abrir sem internet, o modelo terá de ser servido pelo próprio site.
  Fica para a etapa 6 (PWA).

### Etapa 2: o que já existe

- **Banco** (`supabase/migrations/20261116170912_lixeira_exemplos_e_descartes.sql`):
  `lixeira_exemplos` (embedding `vector(1280)` com pgvector, sem normalizar,
  mais `modelo`, `origem`, `ativo`, `foto_path`), `lixeira_descartes` e o bucket
  privado `lixeira-fotos` (JPEG até 512 KB, pasta por usuário).
- **Quem vê o quê:** exemplos de origem `base` (o admin ensina) e `gpt` valem
  para todo mundo; os de origem `usuario` só para quem ensinou. Assim um
  visitante não estraga o Pequi dos outros. O admin enxerga tudo pelo RLS, mas
  o app baixa só a base e os próprios (filtro em `baixarExemplosDesde`).
  Visitante não cria `base` nem promove o próprio exemplo; cada um desativa só
  os seus. Teto de 300 exemplos de usuário por classe e pessoa (gatilho).
  Testado no banco simulando dois visitantes e o admin.
- **Login anônimo:** `garantirSessao` usa a sessão que existir (o admin logado
  no painel ensina a base) ou entra anônimo. O painel trata sessão anônima
  como "fora". Ligado em Authentication → Sign In / Providers → "Allow
  anonymous sign-ins" (e salvo) desde 2026-11-16. Se for desligado, a lixeira
  segue no modo só memória e avisa.
- **Cache:** IndexedDB `pequidev-lixeira`, baixando do banco só o que mudou
  desde o maior `updated_at` já visto. Desativar em vez de apagar faz o
  "esquecer" chegar como mudança. Sem IndexedDB, baixa tudo.
- **Recarregar o KNN:** `visao.carregar` normaliza cada embedding e monta um
  tensor por classe para o `setClassifierDataset`.
- **Ensinar** grava em fila: foto de 384 px no bucket, exemplo no banco, cópia
  no cache. **Analisar** registra o descarte (sem foto nesta etapa).
- **Testado** com a câmera falsa e o login anônimo ligado: 18 exemplos e 18
  fotos (de uns 5 KB) gravados; ao recarregar, "Lembrei de 18 exemplos" e as
  três cenas certas sem ensinar de novo, com os 18 no cache local. "Esquecer"
  desativou os 18 no banco e esvaziou o cache, e continuou esquecido depois de
  recarregar. A mesma sessão anônima, no `/admin`, foi para o login.

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
  index.ts               Chama o GPT e devolve classe, certeza, humor e frase
supabase/migrations/     Uma migration nova para as tabelas da lixeira
```

Antes de escrever código, ler o guia correspondente em `node_modules/next/dist/docs/`
(ver AGENTS.md): esta versão do Next.js muda APIs e convenções.

## Arquitetura e fluxo

Tudo o que é rápido roda no celular. Só os casos com confiança abaixo de 0,85
vão para a nuvem, onde a Edge Function chama o GPT.

1. A câmera traseira captura o objeto.
2. O MobileNet gera o embedding e o KNN devolve a classe e a confiança, sem
   internet.
3. Com confiança de 0,85 ou mais, o Pequi reage na hora com uma frase do banco.
4. Abaixo disso, a foto reduzida vai para a Edge Function, que chama o GPT e
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
| Local < 0,85 e GPT ≥ 0,9 | Usa a classe do GPT | Sim, automaticamente |
| Local < 0,85 e GPT < 0,9 | Usa a classe do GPT e pede confirmação | Só se o usuário confirmar; senão vai para a revisão |
| Usuário toca em "Errou" | Mostra as categorias para escolher | Sim, com a classe do usuário |
| Sem internet | Usa a classe local e marca como pendente | Não; valida quando a conexão voltar |

Os limiares 0,85 e 0,9 são pontos de partida, ajustados depois de olhar o
histórico.

- **Acertou / Errou:** ideia do Gabriel, um cartão estilo Tinder. Arrastar o
  resultado para a direita aprova, para a esquerda reprova e abre "Qual era,
  então?" com as seis classes. Os botões "✗ Errou" e "Acertou ✓" ficam sempre
  embaixo, e as setas ← → também respondem. Nunca obrigatório.
- **Limite por classe:** 150 exemplos aprendidos por pessoa e classe. Passando
  disso, o banco desativa o mais antigo sozinho. A base fica protegida. Também
  há um teto de 500 exemplos novos por pessoa por dia.
- **Prioridade:** correções do usuário e casos que o modelo errou valem mais que
  casos fáceis.
- **Desfazer:** todo exemplo tem `ativo`. Na Revisão, desativar com um toque,
  sem apagar.
- **Carregar rápido:** cópia dos exemplos no IndexedDB, baixando só o que mudou
  desde a última abertura.
- **Foto junto:** cada exemplo guarda a foto, para revisar e para gerar os
  embeddings de novo se um dia o MobileNet mudar.

### Etapa 4: como ficou

O que cada resposta faz:

| Resultado mostrado | Direita (Acertou) | Esquerda (Errou → escolhe a classe) |
| --- | --- | --- |
| Local com confiança ≥ 0,85 | Confirma o descarte. Não aprende | Aprende a classe escolhida e corrige o descarte |
| GPT com certeza ≥ 0,9 (a função já aprendeu) | Confirma | Desativa o exemplo que a função gravou, aprende a escolhida e corrige |
| GPT abaixo de 0,9 | Aprende a classe mostrada e confirma | Aprende a escolhida e corrige |
| Plano B (chute local) | Aprende a classe mostrada e confirma | Aprende a escolhida e corrige |

- **O que o GPT ensina fica com quem fotografou.** O embedding é calculado no
  celular, então nada prova que os números combinam com a foto. Se valesse
  para todos, um visitante conseguiria envenenar o Pequi de todo mundo. Só a
  `base` é compartilhada, e o caminho de um exemplo virar base é a Revisão do
  admin (etapa 6). Quem está logado como admin ensina direto na base.
- **A função grava o exemplo `gpt`:** o app manda junto da foto o embedding do
  mesmo quadro e o caminho da foto. Com certeza ≥ 0,9, a função insere o
  exemplo (só ela pode, com a chave de serviço) e devolve `exemploId`, que o
  app usa para desativar se a pessoa disser "Errou".
- **Descarte:** ganhou `confirmado`. A pessoa só pode mudar `confirmado`,
  `classe_final` e `status` das próprias linhas (permissão por coluna). Uma
  correção fica com `status: revisar`.
- **"Esquecer"** desativa tudo o que a pessoa ensinou, inclusive o que o GPT
  aprendeu com as fotos dela.
- **Teto do site:** além de 30 chamadas por pessoa por hora, a função para em
  500 chamadas por dia no site inteiro (secret `LIXEIRA_TETO_DIARIO`). Sem isso,
  bastava limpar os cookies para ganhar uma sessão anônima nova e um limite
  novo. Um CAPTCHA no login anônimo ainda falta.
- **Testado** no navegador, com a câmera falsa e a nuvem desligada (sem a
  chave): ensinados só Vazio e Metal, o jornal saiu "Metal, 100%". Arrastei
  para a esquerda (o cartão seguiu o ponteiro, girou e mostrou o selo "Errou")
  e escolhi Papel. Depois da segunda correção, o jornal saiu "Papel". O
  Acertou pela seta → ensinou mais um Papel. Recarregando, "Lembrei de 13
  exemplos" e jornal "Papel, 100%". No banco: correções com `confirmado:
  false`, `classe_final: papel` e `status: revisar`; o Acertou com
  `confirmado: true`. As regras do banco foram testadas simulando dois
  visitantes (150 ativos, frase protegida, um não vê nem mexe no do outro).
- **Não testado:** o arraste com o dedo num celular de verdade (o painel do
  navegador estava escondido, então simulei o ponteiro) e o caminho em que a
  função aprende sozinha, que precisa da chave.

## Validação com o GPT

O plano original usava o Claude Haiku. Em 2026-11-16 o Gabriel trocou para o
GPT da OpenAI. O app nunca fala direto com a API: ele manda a foto (no máximo
384 px no lado maior, JPEG com qualidade 0,7, em base64) para a Edge Function
`lixeira-validar` (`supabase/functions/lixeira-validar/index.ts`), que guarda a
chave e faz a chamada.

Resposta:

```json
{
  "classe": "plastico",
  "certeza": 0.93,
  "humor": "feliz",
  "frase": "Garrafa pet! Daqui a pouco ela vira camiseta. Chique demais, sô."
}
```

- **Modelo:** `gpt-5.4-mini` sem raciocínio extra (`reasoning.effort: none`),
  pela Responses API, com a imagem em `detail: low` e a resposta presa a um
  JSON Schema (`strict`), então classe e humor só saem da lista. Escolhido
  numa medição em 2026-11-16 com uma lata desenhada e uma foto: cerca de
  1,4 s, contra 1,6 a 2 s do `gpt-4.1-mini` e 2,1 a 2,4 s do `gpt-6.1-terra`.
  O secret `LIXEIRA_MODELO` troca o modelo sem publicar a função.
- **O prompt** está no código da função (versionado, em vez do secret
  `PROMPT_LIXEIRA` do plano original), com as reações especiais: pequi,
  celular e gato.
- **Quem chama:** a função lê a sessão do Supabase (anônima ou não) pelo
  cabeçalho `Authorization` e confere com `auth.getUser`. Por isso foi
  publicada com `verify_jwt` desligado: a conferência é feita no código.
- **CORS** só para pequidev.com.br, pequidev.vercel.app, as prévias da Vercel
  do projeto e localhost:3000/3001.
- **Timeout** de 8 s na função e no app. A função ainda confere o JSON antes de
  devolver.
- **Erros:** 401 sem sessão, 400 imagem inválida, 429 limite, 502 erro ou
  resposta inválida da OpenAI, 503 sem a chave, 504 tempo esgotado.

**Quando vai para a nuvem:** se o KNN aceitou com confiança de 0,85 ou mais, a
resposta é local e ninguém é chamado. Senão (ou sem exemplos), com sessão, o
Pequi diz "Hmm… deixa eu pensar." e a foto vai para a função. A resposta
aparece na faixa da lixeira com "perguntei pra nuvem" e a frase num balão. A
foto também vai para o bucket, e o descarte fica com `fonte: gpt`.

**Plano B:** em qualquer falha da nuvem, o app usa a classe local, marca o
descarte como `pendente` e o Pequi diz "Hmm, tô sem sinal… vou no chute!" (no
limite: "Já pensei demais por hoje, sô. Vou no chute!"). Sem classe local, ele
pede exemplos ou outra tentativa. Testado com a função sem chave (503): os dois
caminhos aparecem na tela e o descarte pendente é gravado com a foto.

**Abuso:** no máximo 30 chamadas por pessoa por hora, contadas na tabela
`lixeira_chamadas_api` (sem acesso pelo app, só a chave de serviço), mais um
limite mensal de gastos no painel da OpenAI.

## O Pequi na lixeira

O Pequi usa um chapéu de lixeira (o chapéu padrão) e reage a cada descarte.
Personalidade: bem-humorado, um pouco irônico, nunca grosseiro. Expressões
goianas leves (sô, uai, trem, cê) com moderação. Fica feliz com reciclagem,
"decepcionado" com rejeito e confessa quando não sabe.

| Estado | Quando aparece | Animação do sprite |
| --- | --- | --- |
| Neutro | Esperando um objeto | `parado` |
| Pensativo | Esperando o GPT | `sentar`, com três pontinhos no balão |
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
reticências de propósito (a voz pausa nelas) e frases boas do GPT podem ser
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
| `exemplos` | O conhecimento do KNN | classe, embedding `vector(1280)`, foto_path, origem (`base`, `gpt`, `usuario`), ativo |
| `descartes` | Histórico de uso | classe_local, confianca_local, classe_final, fonte, certeza_gpt, frase, humor, status (`ok`, `pendente`, `revisar`), foto_path |
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
mesmas enviadas ao GPT.

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
| Revisão | `/admin/lixeira/revisao` | Admin | Casos para revisar, discordâncias entre o modelo local e o GPT, exemplos recentes com botão de desativar, frases para promover |

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

- **Chave da OpenAI** só nos secrets do Supabase (`OPENAI_API_KEY`, em Edge
  Functions → Secrets). Nunca no código, no GitHub ou em variável
  `NEXT_PUBLIC_*`.
- **Chave de serviço do Supabase** só na Edge Function. O site continua usando
  apenas a chave pública, protegida pelas regras do banco.
- **Privacidade:** o app fotografa o que está na frente da câmera. Avisar na
  primeira abertura, guardar só a foto reduzida e permitir apagar o próprio
  histórico.
- **Custos:** hospedagem, Supabase, voz e TensorFlow.js são grátis. O único
  gasto é a API da OpenAI, uma fração de centavo por chamada (uns 430 tokens
  de entrada e 50 de saída). Como o GPT só é chamado nos casos duvidosos, o
  custo cai conforme o modelo aprende. Acompanhar o gasto real no painel da
  OpenAI nas primeiras semanas. Preços e limites mudam.

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
  do navegador e resposta do GPT.
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
