# Painel admin

O painel fica em `/admin` e serve para publicar posts e projetos sem mexer no
código nem no banco. Fora da busca e sem link no site: entra quem sabe o
endereço e tem a conta certa.

## Entrar

Em `/admin/entrar`, com o e-mail e a senha da conta do Supabase Auth. Só entra
quem está em `private.admins`; uma conta que existe mas não é admin recebe um
aviso e é desconectada. "Sair" fica no alto de toda tela do painel.

## Posts

`/admin/posts` lista todos, rascunhos inclusive, do editado mais recente ao
mais antigo. Cada post tem:

| Campo | O que é |
| --- | --- |
| Título | Vira o h1 e o título do link compartilhado |
| Endereço | `/blog/<endereço>`. Sai sozinho do título enquanto você não mexer nele |
| Resumo | Na lista, embaixo do título e no link compartilhado |
| Tags | Separadas por vírgula; as novas são criadas na hora |
| Conteúdo | Markdown (ver [docs/blog.md](blog.md)) |
| Capa | Opcional. Enviada pelo painel ou colada como endereço, com texto alternativo |
| Situação | Rascunho (só no painel) ou Publicado (vai para o site) |
| Data | A que aparece no post. Publicando sem data, vale o dia de hoje |
| Reação do Pequi | A foto que fecha o post ("O Pequi leu"), ou nenhuma. A legenda própria troca a da pose |

"Ver como fica" abre a prévia do post do jeito que ele aparece no site, mesmo
sendo rascunho. Só quem está logado no painel vê a prévia.

## Projetos

`/admin/projetos` lista todos. Além de nome, endereço, resumo, guia e stack,
cada projeto tem os três textos da página (o problema, o resultado e como foi
construído, em Markdown), os links (repositório só se for público; vídeo em
.mp4 ou .webm toca na página), a capa, as telas com texto alternativo e
legenda (na ordem da página, com "Subir" e "Descer"), o destaque na home (a
home mostra até quatro) e a ordem.

## O humano por trás

`/admin/sobre` edita a seção "O humano por trás" da home: a apresentação, a
trajetória (vazia, o bloco não aparece), a ficha ao lado (rótulo e valor, na
ordem) e as tecnologias, separadas por vírgula. Fica na tabela `sobre` (uma
linha só, migração `sobre_editavel`); salvar atualiza a home na hora.

## Imagens

Toda imagem enviada pelo painel vai para o bucket público `imagens` do
Supabase Storage, já convertida para WebP e com no máximo 1600 px de largura.
A conversão acontece no navegador, antes do envio. Ficam em `posts/` e
`projetos/` dentro do bucket. Aceita JPG, PNG, WebP e AVIF de até 5 MB.

Tirar uma imagem do post ou do projeto não apaga o arquivo do bucket.

## O site atualiza na hora

Salvar invalida o cache do site (`updateTag` com as etiquetas `posts` ou
`projects`), então a próxima visita já vê a mudança. Um post publicado pela
primeira vez ganha a página dele na primeira visita.

## Segurança

- Quem decide o que cada conta pode fazer é o banco (RLS): visitante só lê o
  que está publicado; escrever, ler rascunhos e enviar imagens exige estar em
  `private.admins`. Isso vale mesmo para quem chamar a API direto.
- O painel confere a conta no servidor do Supabase (`getUser`) e a permissão no
  banco (`sou_admin()`) antes de mostrar ou salvar qualquer coisa.
- A sessão fica em cookies. O `src/proxy.ts` renova o token a cada página do
  `/admin`; ele vence em uma hora sem uso.
- O Pequi do canto não entra no painel.

## Onde mora o código

| O quê | Onde |
| --- | --- |
| Telas | `src/modules/admin/components/views.tsx` (as páginas em `app/admin` só montam) |
| Formulários | `PostForm`, `ProjectForm`, `ImageField`, `ScreenshotsField`, `fields.tsx` |
| Salvar, apagar, entrar, sair | `src/modules/admin/actions.ts` (Server Actions) |
| Leituras do painel | `src/modules/admin/data.ts` (com a sessão; sem cache) |
| Quem é admin | `src/modules/admin/auth.ts` |
| Envio de imagens | `src/modules/admin/upload.ts` |
| Sessão | `src/lib/supabase/server.ts`, `browser.ts` e `src/proxy.ts` |
