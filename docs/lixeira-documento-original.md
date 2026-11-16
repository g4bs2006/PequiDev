# Lixeira Inteligente — Documento do Projeto

Nov 16, 2026 · @Gabriel Rodrigues Silva

## Visão geral

A Lixeira Inteligente é um app de celular (PWA) que identifica pela câmera em qual lixeira cada objeto deve ser descartado, com um mascote que fala e um modelo que aprende sozinho com o uso. O projeto é 100% software: a parte física (esteira, servos, ESP32) foi deixada de lado para reduzir custo e complexidade.

O usuário aponta a câmera para o lixo, o app classifica na hora, o mascote reage com uma frase engraçada em voz alta e a tela indica a lixeira certa pela cor da coleta seletiva. Cada descarte vai para um histórico consultável no próprio celular.

**Funcionalidades principais**

- **Classificação no navegador:** MobileNet + KNN rodando no celular, instantâneo e funcionando sem internet.
- **Validação com IA:** quando a confiança é baixa, a foto vai para a API do Claude, que decide a classe e gera a fala do mascote.
- **Aprendizado contínuo:** exemplos validados viram conhecimento do modelo sem retreino demorado.
- **Mascote com voz:** personagem animado com estados de humor e um banco de frases.
- **Histórico:** descartes salvos no Supabase, com contagens, gráficos e fila de revisão.

**Categorias iniciais**

| Categoria | Lixeira | Cor |
| --- | --- | --- |
| Metal | Reciclável | Amarelo |
| Plástico | Reciclável | Vermelho |
| Papel | Reciclável | Azul |
| Vidro | Reciclável | Verde |
| Rejeito | Não reciclável | Cinza |
| Vazio | Nenhuma (nada na frente da câmera) | — |

A classe Vazio existe só para o app não classificar a mesa ou o fundo. Se quiser começar menor, dá para iniciar com Reciclável, Rejeito e Vazio e separar os materiais depois.

## Arquitetura e fluxo

Tudo o que é rápido roda no celular; só os casos com confiança abaixo de 0,85 vão para a nuvem, onde a Edge Function chama o Claude.

&#91;embedded content: arquitetura · fluxo de uma classificação\]

O caminho de uma classificação:

1. A câmera traseira captura o objeto.
2. O MobileNet gera o embedding e o KNN devolve a classe e a confiança, sem internet.
3. Com confiança de 0,85 ou mais, o mascote reage na hora usando o banco de frases.
4. Abaixo disso, a foto reduzida vai para a Edge Function, que chama o Claude e devolve classe, certeza e frase.
5. O descarte é registrado no Supabase; se foi validado, vira também um exemplo novo.
6. Na próxima abertura, o app carrega os exemplos e o KNN já sabe o que aprendeu.

## Stack, programas e contas

Não há nada para comprar: todo o projeto roda com ferramentas gratuitas, e o único custo recorrente é o crédito da API do Claude.

| Camada | Ferramenta | Para quê | Custo |
| --- | --- | --- | --- |
| App | PWA (HTML, CSS, JavaScript) | App instalável na tela inicial, sem loja | Grátis |
| App | Vite | Servidor de desenvolvimento e build | Grátis |
| Visão | TensorFlow.js | Rodar redes neurais no navegador | Grátis |
| Visão | @tensorflow-models/mobilenet | Gerar o embedding de cada imagem | Grátis |
| Visão | @tensorflow-models/knn-classifier | Classificar e aprender exemplos novos | Grátis |
| Backend | Supabase (Postgres, Storage, Edge Functions) | Histórico, fotos, embeddings e chamada segura da API | Plano gratuito |
| IA | API do Claude (modelo Haiku) | Validar classificações duvidosas e gerar falas | Por uso, centavos por chamada |
| Voz | Web Speech API | Síntese de voz nativa do navegador | Grátis |
| Voz (opcional) | ElevenLabs | Vozes mais caricatas e expressivas | Plano gratuito limitado |
| Hospedagem | Vercel ou Netlify | Servir o app em HTTPS (exigido para usar a câmera) | Grátis |
| Desenvolvimento | VS Code, Node.js (LTS), Git e GitHub | Editor, ferramentas de build e versionamento | Grátis |
| Desenvolvimento | Supabase CLI | Criar e publicar as Edge Functions | Grátis |

**Contas a criar antes de começar**

- [ ] GitHub (repositório do projeto)
- [ ] Supabase (projeto novo, região São Paulo para menor latência)
- [ ] Console da Anthropic (chave de API e alguns reais de crédito)
- [ ] Vercel ou Netlify (ligada ao repositório do GitHub)
- [ ] ElevenLabs (só se for usar a voz premium)

Preços e limites dos planos gratuitos mudam com o tempo; confira nos sites oficiais antes de começar.

## Classificação no navegador

A classificação roda inteira no celular, em duas etapas: o MobileNet transforma a imagem num embedding e o KNN decide a classe comparando esse embedding com exemplos guardados.

**Como funciona**

- **MobileNet (a parte que enxerga):** rede já treinada com milhões de imagens. Não é retreinada. Para cada foto, devolve uma lista de números (o embedding) que descreve o que há nela.
- **KNN (a parte que decide):** guarda embeddings de exemplo com seus rótulos. Uma foto nova recebe a classe dos exemplos mais parecidos com ela.
- **Por que essa combinação:** aprender algo novo é só guardar mais um exemplo. Não há treino demorado, e tudo cabe no navegador.

**Código base**

```javascript
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as knn from "@tensorflow-models/knn-classifier";

const net = await mobilenet.load({ version: 2, alpha: 1.0 });
const classificador = knn.create();

export async function classificar(video) {
  if (classificador.getNumClasses() === 0) return null;
  const emb = tf.tidy(() => net.infer(video, true));
  const { label, confidences } = await classificador.predictClass(emb, 10);
  return { emb, label, confianca: confidences[label] };
}

export function aprender(emb, classe) {
  classificador.addExample(emb, classe);
}
```

**Pontos de atenção**

- **Memória:** tensores do TensorFlow.js não são liberados sozinhos. Use `tf.tidy()` e chame `emb.dispose()` quando o embedding não for mais usado, senão o app trava depois de alguns minutos.
- **Valor de k:** o segundo parâmetro do `predictClass` é quantos vizinhos são consultados. Comece com 10; com poucos exemplos por classe, reduza para 3 a 5.
- **Confiança:** no KNN, a confiança é a fração dos k vizinhos que concordam. Com k = 10, uma confiança de 0,9 significa que 9 dos 10 vizinhos são da mesma classe.
- **Estabilidade:** classifique alguns quadros seguidos (por exemplo, 5) e só aceite o resultado se a maioria concordar. Isso evita respostas trocando a cada quadro.
- **Quando classificar:** não rode em todo quadro. Detecte que algo novo entrou em cena (classe Vazio deixa de vencer) ou use um botão "Analisar" para começar.

**Base inicial de exemplos**

O KNN começa vazio. Antes do primeiro uso, crie uma tela de coleta no app que tira 20 a 30 fotos por classe com a câmera do celular, com objetos variados, ângulos diferentes e fundos comuns de casa. Essa base é salva no Supabase como os primeiros exemplos e carregada toda vez que o app abre.

## Aprendizado contínuo

O modelo aprende guardando novos exemplos validados no Supabase, e qualquer pessoa que abrir o app depois já usa o modelo mais esperto. A regra central é só aprender com o que foi confirmado, para um erro nunca virar conhecimento.

**Regras de decisão**

| Situação | O que o app faz | Aprende? |
| --- | --- | --- |
| Confiança local ≥ 0,85 | Aceita a classe na hora | Não (o modelo já sabe; exemplos repetidos só desequilibram) |
| Confiança local < 0,85 e Claude com certeza ≥ 0,9 | Usa a classe do Claude | Sim, automaticamente |
| Confiança local < 0,85 e Claude com certeza < 0,9 | Usa a classe do Claude e pede confirmação | Só se o usuário confirmar; senão vai para a fila de revisão |
| Usuário toca em "Errou" | Mostra as categorias para ele escolher a certa | Sim, com a classe do usuário |
| Sem internet | Usa a classe local e marca como pendente | Não; valida quando a conexão voltar |

Os limiares (0,85 e 0,9) são pontos de partida. Ajuste depois de olhar o histórico: se o Claude estiver sendo chamado demais, baixe o primeiro; se aparecerem erros aceitos com confiança alta, suba.

**Confirmação do usuário**

Depois de cada classificação, o mascote mostra dois botões discretos: "Acertou" e "Errou". A correção do usuário é o sinal mais confiável que existe, e ainda rende fala do mascote ("Anotado! Da próxima eu acerto"). O app nunca deve exigir a confirmação: se o usuário ignorar, vale a regra da tabela.

**Balanceamento**

- **Limite por classe:** no máximo 150 exemplos aprendidos por classe. Ao passar do limite, o mais antigo aprendido é desativado.
- **Base protegida:** os exemplos da coleta inicial (origem "base") nunca são substituídos automaticamente.
- **Prioridade:** correções do usuário e casos que o modelo errou valem mais que casos fáceis. São eles que ensinam algo novo.

**Armazenamento dos embeddings**

- Cada exemplo é um vetor de 1.280 números (MobileNet v2), salvo numa coluna do tipo `vector` com a extensão pgvector do Supabase.
- A foto vai junto para o Storage. Assim dá para revisar exemplos e, se um dia trocar o MobileNet, gerar todos os embeddings de novo.
- Ao abrir, o app baixa os exemplos ativos e chama `addExample` em cada um. Guarde uma cópia no IndexedDB para abrir rápido e funcionar offline, e baixe só o que mudou desde a última vez.

**Desfazer erros**

Todo exemplo tem um campo `ativo`. Na tela de revisão, você desativa exemplos ruins com um toque e o modelo deixa de usá-los na próxima abertura, sem apagar nada.

## Validação com Claude

O app nunca fala direto com a API do Claude: ele envia a foto para uma Supabase Edge Function, que guarda a chave e faz a chamada. Uma única chamada devolve a classe, o grau de certeza e a fala do mascote.

**Quando chamar**

- Sempre que a confiança local ficar abaixo de 0,85.
- Opcionalmente, também nos casos confiantes, só para gerar a fala. Para economizar, use o banco de frases prontas nesses casos (ver seção Mascote).

**Preparar a imagem no app**

Reduza a foto para no máximo 384 px no lado maior e exporte em JPEG com qualidade 0,7 antes de enviar. Fica com poucas dezenas de KB, o que deixa a chamada mais rápida e mais barata, sem perder o que importa para identificar o objeto.

**Formato da resposta**

```json
{
  "classe": "plastico",
  "certeza": 0.93,
  "humor": "feliz",
  "frase": "Garrafa pet! Daqui a pouco ela vira camiseta. Chique demais."
}
```

- `classe`: uma de metal, plastico, papel, vidro, rejeito, vazio.
- `certeza`: de 0 a 1, o quanto o modelo tem certeza.
- `humor`: um dos estados do mascote (feliz, decepcionado, pensativo, surpreso).
- `frase`: no máximo 15 palavras, pronta para ser falada.

**Prompt de sistema (ponto de partida)**

```text
Você é a Lixeira Inteligente, uma lixeira goiana sarcástica, carinhosa e orgulhosa do seu trabalho.
Olhe a imagem e identifique o objeto principal que a pessoa quer descartar.
Classifique em: metal, plastico, papel, vidro, rejeito ou vazio.
Use rejeito para itens sujos, misturados ou que a coleta seletiva comum não aceita (guardanapo engordurado, fralda, bituca).
Use vazio se não houver objeto claro.
Responda SOMENTE com um JSON válido com as chaves classe, certeza, humor e frase.
A frase deve ter no máximo 15 palavras, em português do Brasil, engraçada e sem ofender ninguém.
```

**Edge Function (Deno / TypeScript)**

````typescript
// supabase/functions/validar/index.ts
const PROMPT = Deno.env.get("PROMPT_LIXEIRA")!;

Deno.serve(async (req) => {
  const { imagem } = await req.json(); // JPEG em base64, sem o prefixo data:

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 200,
      system: PROMPT,
      messages: [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imagem } },
        { type: "text", text: "Que lixo é esse?" },
      ]}],
    }),
    signal: AbortSignal.timeout(8000),
  });

  const dados = await resp.json();
  const texto = dados.content?.[0]?.text ?? "{}";
  const limpo = texto.replace(/```json|```/g, "").trim();
  return new Response(limpo, { headers: { "content-type": "application/json" } });
});
````

A chave entra com `supabase secrets set ANTHROPIC_API_KEY=...` e nunca aparece no código do repositório. A função também precisa de cabeçalhos CORS para o domínio do app e de validação do JSON antes de devolver.

**Falhas e plano B**

- **Timeout ou erro da API:** o app usa a classe local, marca o descarte como "pendente" e fala uma frase genérica do banco ("Hmm, tô sem sinal... vou no chute!").
- **JSON inválido:** descarta a resposta e segue o mesmo caminho do timeout.
- **Classe fora da lista:** trata como resposta inválida.
- **Abuso:** limite de chamadas por dispositivo (por exemplo, 30 por hora) controlado numa tabela no Supabase, para ninguém esgotar seus créditos.

## Mascote

O mascote é a cara do app: uma lixeira goiana sarcástica, carinhosa e orgulhosa do próprio trabalho, que reage a cada descarte com uma expressão e uma frase falada. O nome ainda está em aberto.

**Personalidade**

- Bem-humorada e um pouco irônica, nunca grosseira nem ofensiva.
- Usa expressões goianas leves (sô, uai, trem, cê) com moderação, sem virar caricatura.
- Fica feliz com reciclagem, "decepcionada" com rejeito e confessa quando não sabe.
- Frases curtas: no máximo 15 palavras, porque soam melhor em voz sintetizada.

**Estados visuais**

| Estado | Quando aparece | Visual sugerido |
| --- | --- | --- |
| Neutro | Esperando um objeto | Olhos piscando devagar, leve balanço |
| Pensativo | Esperando a resposta do Claude | Olhos para cima, três pontinhos animados |
| Feliz | Classificou algo reciclável | Sorriso, pulinho, brilho na cor da lixeira |
| Decepcionado | Classificou rejeito | Olhos caídos, suspiro |
| Surpreso | Objeto inesperado ou mão na frente | Olhos arregalados |
| Aprendendo | Salvou um exemplo novo | Caderninho ou lâmpada acendendo |
| Dormindo | Muito tempo sem uso | Olhos fechados, "zzz" |

O desenho será em SVG com animações em CSS: leve, nítido em qualquer tela e fácil de trocar de estado mudando uma classe. O personagem deve ser original, sem se parecer com mascotes existentes.

**Banco de frases**

As frases abaixo ficam num arquivo JSON no app. São usadas nos casos de confiança alta (sem chamar a API) e como plano B quando a API falha.

*Ao abrir o app*

- Bom dia! Tô de barriga vazia e pronta pra trabalhar.
- Sistema ligado. Pode mandar o lixo, que eu não julgo... muito.
- Lixeira inteligente online. Mais inteligente que muita gente por aí.

*Metal*

- Latinha! Essa aqui vai virar latinha de novo. Ciclo da vida, sô.
- Alumínio detectado. Cê tá bebendo refri demais, hein?
- Essa latinha tem mais futuro que muito projeto que eu conheço.

*Plástico*

- Garrafa pet! Daqui a pouco ela vira camiseta. Chique demais.
- Plástico no lugar certo. O planeta agradece, e eu também.
- Essa garrafa já viu coisa... mas agora ela vai renascer.

*Papel*

- Papel amassado... era a prova de cálculo, né? Relaxa, eu não conto pra ninguém.
- Papel! Pena que eu não sei ler, parecia interessante.
- Isso aqui já foi árvore. Respeita a trajetória dele.

*Rejeito*

- Ih, esse aqui não tem volta. Vai pro lado triste.
- Não reciclável. Que fase, hein?
- Esse trem aí não serve nem pra reciclar, uai.
- Rejeito detectado. Não é você, é ele.
- Descanse em paz, guardanapo engordurado.

*Dúvida (esperando o Claude)*

- Pera, deixa eu colocar meus óculos...
- Hmm, que trem é esse? Vou pedir ajuda aos universitários.
- Isso é uma latinha ou uma crise existencial?
- Um segundinho, tô processando... literalmente.

*Aprendendo*

- Anotado! Da próxima eu acerto.
- Errei, admito. Mas eu aprendo rápido, viu?

*Muito tempo parada*

- Ninguém me alimenta mais...
- Tô aqui, viu? Limpinha e cheirosa. Por enquanto.
- Pode vir, que hoje eu tô inspirada.

*Situações especiais*

- Mão na frente da câmera: Isso é uma mão. Mão não se recicla, por favor.
- Mesma classe três vezes seguidas: Terceira latinha seguida? Tá fazendo festa e não me chamou?
- Sem internet: Hmm, tô sem sinal... vou no chute!

**Regras de uso das frases**

- Nunca repetir uma das últimas 5 frases faladas.
- Usar as reticências de propósito: a síntese de voz faz uma pausa nelas, o que dá timing à piada.
- Frases geradas pelo Claude que ficarem boas podem ser promovidas para o banco fixo pela tela de revisão.

## Voz

A voz começa com a Web Speech API, que é gratuita e já vem no navegador; o ElevenLabs fica como melhoria opcional para uma voz mais caricata.

| Opção | Qualidade | Custo | Onde roda | Observação |
| --- | --- | --- | --- | --- |
| Web Speech API | Boa, varia por celular | Grátis | No próprio navegador | Funciona offline em muitos aparelhos |
| ElevenLabs | Muito expressiva, voz de personagem | Plano gratuito limitado, depois pago | Edge Function | Exige internet; gerar o áudio na Edge Function para proteger a chave |

**Web Speech API**

```javascript
function falar(texto) {
  const fala = new SpeechSynthesisUtterance(texto);
  const vozes = speechSynthesis.getVoices();
  fala.voice = vozes.find(v => v.lang === "pt-BR") ?? null;
  fala.lang = "pt-BR";
  fala.pitch = 1.6;  // 0 a 2: mais alto = mais caricato
  fala.rate = 1.15;  // um pouco mais rápido
  speechSynthesis.cancel(); // interrompe a fala anterior
  speechSynthesis.speak(fala);
}
```

**Cuidados**

- **Desbloqueio de áudio:** navegadores de celular só tocam som depois de um toque do usuário. Coloque um botão "Começar" na abertura do app e fale a frase de boas-vindas nesse toque.
- **Lista de vozes:** no Chrome, `getVoices()` pode vir vazia no início. Escute o evento `voiceschanged` antes de escolher a voz.
- **Diferença entre aparelhos:** cada sistema tem vozes diferentes. Teste no Android e no iPhone e ajuste `pitch` e `rate` para soar bem nos dois.
- **Botão de mudo:** sempre visível, com a preferência salva no `localStorage`.
- **Legenda:** a frase também aparece em texto num balão de fala do mascote, para quem estiver no mudo.

**ElevenLabs (opcional)**

Se a voz nativa ficar sem graça, a mesma Edge Function de validação pode gerar o áudio da frase com o ElevenLabs e devolver o MP3 junto do JSON. Para economizar, gere uma vez o áudio de todas as frases do banco fixo, guarde no Storage e use só a geração ao vivo para frases novas do Claude.

## Banco de dados (Supabase)

O Supabase guarda três coisas: os exemplos que formam o modelo, o histórico de descartes e o controle de uso da API. As fotos ficam num bucket privado do Storage.

**Tabelas**

| Tabela | Guarda | Campos principais |
| --- | --- | --- |
| exemplos | Conhecimento do KNN | classe, embedding, foto\_path, origem, ativo |
| descartes | Histórico de uso | classe\_local, confianca\_local, classe\_final, fonte, frase, status |
| chamadas\_api | Limite de uso por dispositivo | user\_id, created\_at |

**SQL de criação**

```sql
create extension if not exists vector;

create table exemplos (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users default auth.uid(),
  classe text not null check (classe in ('metal','plastico','papel','vidro','rejeito','vazio')),
  embedding vector(1280) not null,
  foto_path text,
  origem text not null check (origem in ('base','claude','usuario')),
  ativo boolean not null default true
);

create table descartes (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users default auth.uid(),
  classe_local text,
  confianca_local real,
  classe_final text not null,
  fonte text not null check (fonte in ('local','claude','usuario')),
  certeza_claude real,
  frase text,
  humor text,
  status text not null default 'ok' check (status in ('ok','pendente','revisar')),
  foto_path text
);

create table chamadas_api (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  created_at timestamptz default now()
);

create index on exemplos (classe) where ativo;
create index on descartes (user_id, created_at desc);
create index on chamadas_api (user_id, created_at desc);
```

**Identificação sem cadastro**

Use o login anônimo do Supabase (anonymous sign-ins). Cada celular ganha um usuário próprio sem precisar de e-mail e senha, e o `user_id` passa a separar o histórico de cada um. Se um dia quiser login de verdade, a conta anônima pode ser convertida.

**Políticas de acesso (RLS)**

- Ativar RLS nas três tabelas.
- `exemplos`: qualquer usuário autenticado lê os exemplos ativos; só insere com o próprio `user_id`; desativar exemplos fica restrito ao seu usuário de administrador.
- `descartes`: cada usuário lê e insere apenas as próprias linhas.
- `chamadas_api`: sem acesso pelo app; só a Edge Function escreve, usando a chave de serviço.

**Storage**

- Bucket privado `fotos`, com pastas por usuário (`fotos/<user_id>/<arquivo>.jpg`).
- Política: cada usuário grava e lê só a própria pasta; o administrador lê tudo para a revisão.
- Fotos no tamanho reduzido de 384 px, as mesmas enviadas ao Claude, para economizar espaço do plano gratuito.

**Realtime**

Ative o Realtime na tabela `descartes` para a tela de histórico atualizar sozinha quando um descarte novo entrar, inclusive se ela estiver aberta em outro aparelho.

## Interface do app (PWA)

O app tem quatro telas: câmera com o mascote (a principal), histórico, coleta de exemplos e revisão. As duas últimas são de administração e ficam escondidas para o usuário comum.

| Tela | Para quem | O que mostra |
| --- | --- | --- |
| Câmera | Todos | Vídeo da câmera traseira, mascote, balão de fala, faixa colorida com a lixeira indicada, botões Acertou / Errou, botão de mudo |
| Histórico | Todos | Lista de descartes com miniatura, contagem por categoria (hoje, semana, mês), gráfico de evolução, percentual reciclável |
| Coleta | Administrador | Escolha da classe e botão que tira uma sequência de fotos, com contador por classe |
| Revisão | Administrador | Casos marcados para revisar, discordâncias entre modelo local e Claude, exemplos recentes com botão de desativar |

**Tela da câmera, em detalhe**

- A câmera ocupa a tela toda; o mascote fica num canto, grande o suficiente para as expressões serem vistas.
- Um retângulo guia no centro mostra onde posicionar o objeto.
- Depois da classificação, uma faixa na cor da coleta seletiva aparece com o nome da lixeira ("Amarelo — Metal").
- Enquanto o Claude responde, o mascote fica pensativo e fala uma frase de dúvida, para a espera parecer parte da piada.

**Requisitos do PWA**

- **Manifest** (`manifest.webmanifest`) com nome, ícones de 192 e 512 px, cor do tema e `display: standalone`, para instalar na tela inicial.
- **Service worker** guardando o app, o MobileNet e o banco de frases em cache, para abrir e classificar sem internet.
- **HTTPS obrigatório:** o navegador só libera a câmera em HTTPS ou em `localhost`. Para testar no celular durante o desenvolvimento, use o deploy de preview da Vercel ou um túnel.
- **Câmera traseira:** `getUserMedia({ video: { facingMode: "environment" } })`.
- **Modo claro e escuro** seguindo o sistema.
- **Acessibilidade:** botões grandes, legenda das falas e cores sempre acompanhadas do nome da lixeira, para quem não distingue cores.

## Segurança e custos

O único gasto real é a API do Claude, e o maior risco é alguém usar sua chave; os dois se resolvem mantendo a chave só na Edge Function e limitando as chamadas.

**Segurança**

- **Chave da Anthropic só nos secrets do Supabase.** Nunca no código do app, no GitHub ou em variáveis `VITE_*`, que acabam visíveis no navegador.
- **Chave de serviço do Supabase** (service role) também só na Edge Function. O app usa apenas a chave pública (anon), protegida pelas políticas RLS.
- **`.env` no `.gitignore`** desde o primeiro commit.
- **Limite de uso** por usuário na Edge Function (por exemplo, 30 chamadas por hora) e um limite mensal de gastos configurado no console da Anthropic.
- **CORS** liberado só para o domínio do app.
- **Privacidade:** o app fotografa o que está na frente da câmera. Avise isso na primeira abertura, guarde só a foto reduzida e permita apagar o próprio histórico.

**Custos**

| Item | Custo | Observação |
| --- | --- | --- |
| Hardware | R$ 0 | Usa o celular |
| Supabase | R$ 0 | Plano gratuito; projetos inativos podem ser pausados |
| Vercel ou Netlify | R$ 0 | Plano gratuito |
| Web Speech API | R$ 0 | Nativa do navegador |
| API do Claude (Haiku) | Fração de centavo por chamada | Algumas dezenas de reais de crédito cobrem milhares de validações |
| ElevenLabs | R$ 0 a pago | Só se usar a voz premium além do plano gratuito |

Os valores da API dependem do tamanho da imagem e da tabela de preços vigente; confira em docs.claude.com e acompanhe o gasto real pelo console nas primeiras semanas. Como o Claude só é chamado nos casos duvidosos, o custo cai conforme o modelo aprende.

## Roteiro de desenvolvimento

O desenvolvimento segue em oito fases, cada uma terminando com algo funcionando no celular. A ordem coloca primeiro o que prova que a ideia funciona (classificar pela câmera) e deixa o acabamento para o fim.

**Fase 0 — Preparação**

- [ ] Criar as contas (GitHub, Supabase, Anthropic, Vercel)
- [ ] Instalar Node.js, VS Code e Supabase CLI
- [ ] Criar o repositório com Vite e o `.gitignore` incluindo `.env`
- [ ] Ligar o repositório à Vercel e confirmar que o deploy abre em HTTPS no celular
- [ ] Definir o nome do mascote e as categorias iniciais

Pronto quando: uma página "Olá" abre no celular por um link HTTPS.

**Fase 1 — Câmera e classificação local**

- [ ] Abrir a câmera traseira com `getUserMedia`
- [ ] Carregar o MobileNet e o KNN
- [ ] Tela de coleta: tirar fotos por classe e adicionar ao KNN (só na memória, por enquanto)
- [ ] Mostrar a classe e a confiança na tela
- [ ] Votação entre 5 quadros e `tf.tidy` / `dispose` para não vazar memória

Pronto quando: depois de coletar alguns exemplos, o app acerta os objetos de teste na maioria das vezes.

**Fase 2 — Supabase: exemplos e histórico**

- [ ] Criar as tabelas, índices e o bucket `fotos`
- [ ] Ativar login anônimo e as políticas RLS
- [ ] Salvar exemplos coletados (embedding + foto) e carregá-los ao abrir o app
- [ ] Registrar cada descarte na tabela `descartes`
- [ ] Cache dos exemplos no IndexedDB

Pronto quando: fechar e reabrir o app mantém o que ele aprendeu.

**Fase 3 — Validação com Claude**

- [ ] Criar a Edge Function `validar` e configurar o secret da chave
- [ ] Redimensionar a foto para 384 px antes de enviar
- [ ] Chamar a função quando a confiança local for menor que 0,85
- [ ] Validar o JSON de resposta e implementar o plano B (timeout, erro, classe inválida)
- [ ] Limite de chamadas por usuário e limite de gasto no console da Anthropic

Pronto quando: um objeto ambíguo é resolvido pelo Claude e a resposta aparece em até 3 segundos.

**Fase 4 — Aprendizado contínuo**

- [ ] Aplicar as regras de decisão (quando aprender automaticamente, quando pedir confirmação)
- [ ] Botões Acertou / Errou e correção pelo usuário
- [ ] Limite de 150 exemplos aprendidos por classe, com base protegida
- [ ] Carregar só os exemplos novos desde a última abertura

Pronto quando: um objeto que o app errou passa a ser acertado depois de uma correção.

**Fase 5 — Mascote e voz**

- [ ] Desenhar o mascote em SVG com os sete estados
- [ ] Animações em CSS e troca de estado conforme o resultado
- [ ] Banco de frases em JSON, sem repetir as últimas 5
- [ ] Web Speech API com botão "Começar", mudo e legenda
- [ ] Ajustar `pitch` e `rate` em Android e iPhone

Pronto quando: cada tipo de descarte gera uma reação visual e uma fala diferentes.

**Fase 6 — Histórico, revisão e PWA**

- [ ] Tela de histórico com contagens, gráfico e Realtime
- [ ] Tela de revisão com desativação de exemplos
- [ ] Manifest, ícones e service worker para uso offline
- [ ] Aviso de privacidade e opção de apagar o histórico

Pronto quando: o app instala na tela inicial e abre sem internet.

**Fase 7 — Testes e apresentação**

- [ ] Testar com pelo menos 10 objetos por categoria que não estão na base
- [ ] Medir acerto local, taxa de chamadas ao Claude e gasto real
- [ ] Ajustar os limiares de confiança com base no histórico
- [ ] Preparar um roteiro de demonstração com objetos escolhidos e um "erro de propósito" para mostrar o aprendizado

Pronto quando: a demonstração roda do início ao fim sem intervenção.

## Riscos, limitações e ideias futuras

O maior risco técnico é o modelo aprender errado; o maior risco prático é o desempenho em celulares mais fracos. Ambos têm mitigação simples.

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Exemplos errados contaminam o KNN | Acerto cai com o tempo | Aprender só com casos confirmados, campo `ativo`, tela de revisão |
| Classes desequilibradas | Modelo "vê" a classe mais comum em tudo | Limite de 150 por classe, base protegida |
| Celular fraco | Classificação lenta ou app travando | MobileNet v2 com alpha menor (0,5), classificar só sob demanda, `dispose` dos tensores |
| Muitos exemplos para carregar | Abertura lenta | Cache no IndexedDB e download só do que mudou |
| Iluminação e fundos variados | Erros em ambientes diferentes da base | Coletar a base em vários lugares; o aprendizado contínuo cobre o resto |
| API fora do ar ou lenta | Mascote sem resposta | Timeout de 8 s, classe local e frase genérica |
| Chave da API exposta | Gasto indevido | Chave só na Edge Function, limite por usuário e limite mensal |
| Regras de coleta seletiva variam por cidade | Indicação "certa" pode não valer em todo lugar | Deixar claro que segue o padrão de cores geral e permitir ajustar as categorias |

**Limitações conhecidas**

- O app identifica um objeto por vez; vários objetos na mesma foto confundem o modelo.
- Material composto (embalagem longa vida, papel plastificado) é difícil até para pessoas; o Claude ajuda, mas pode errar.
- A voz nativa muda de aparelho para aparelho.

**Ideias futuras**

- Gamificação: pontos, sequências de dias e conquistas por reciclar.
- Ranking entre amigos ou turmas.
- Dicas do mascote sobre preparo do lixo ("lava a latinha antes, sô").
- Mapa de pontos de coleta perto do usuário.
- Retomar a parte física no futuro: o mesmo app comandando um ESP32 com servo por Wi-Fi.

**Em aberto**

- Nome do mascote.
- Começar com cinco categorias de material ou só com reciclável e rejeito.
