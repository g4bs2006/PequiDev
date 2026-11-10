# PequiDev

Blog e portfólio do Gabriel, com o Pequi (um gato laranja rajado) de mascote.

Feito com Next.js (App Router), TypeScript e Tailwind CSS. Os posts e os projetos ficam no Supabase.

## Rodar no computador

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha o `.env.local` com o endereço e a chave pública do Supabase antes de subir. O site abre em http://localhost:3000.

| Comando         | O que faz                               |
| --------------- | --------------------------------------- |
| `npm run dev`   | Sobe o site em modo de desenvolvimento  |
| `npm run build` | Gera a versão de produção               |
| `npm run start` | Serve a versão de produção já gerada    |
| `npm run lint`  | Confere o código com o ESLint           |

Na Vercel o endereço do site é detectado sozinho. Quando houver domínio próprio, defina `NEXT_PUBLIC_SITE_URL` (por exemplo `https://pequidev.com.br`): é ele que entra nos links de compartilhamento.

## Como o código está organizado

Arquitetura por módulo, com os componentes compartilhados em atomic design.

```
src/
  app/                 Rotas, layout, estilos globais, ícone e imagem de compartilhamento
  components/
    atoms/             Peças mínimas: botão, tag, etiqueta de tecnologia, ícones
    molecules/         Combinações pequenas: link do menu, botão de tema, texto em Markdown
    organisms/         Blocos do site inteiro: menu e rodapé
    motion/            Transição entre páginas, morph e tipos de navegação
  modules/
    hero/              Primeira tela da home (textos em content.ts)
    pequi/             O personagem: o Pequi do canto, o do índice, o dormindo do hero e o sprite (guia em docs/pequi.md)
    home/              Seções da home: Projetos, Últimos posts e O humano por trás (textos e marcadores em content.ts)
    blog/              Posts: tipos, consultas, a linha de post e a moldura do post com o índice lateral
    projects/          Projetos e guias: consultas, card, barra lateral de /projetos e a página de cada projeto
  lib/                 Fontes, dados do site, datas, tema e cliente do Supabase
supabase/migrations/   Histórico do banco: tabelas e regras de acesso
public/pequi/          Recortes do Pequi e a folha de sprites, já prontos para a web
referencias/           Imagens originais do Pequi e as fontes do sprite (sprite-ia/)
scripts/               Scripts que geram os recortes, o sprite e a imagem de compartilhamento
docs/                  Guias e planos: o Pequi, animações, modo sonho
```

Regras da casa:

- As páginas em `app/` só montam módulos. Cada módulo expõe o que é público pelo seu `index.ts`.
- Um módulo pode usar `components/` e `lib/`, nunca o contrário.
- Componente nenhum fala com o Supabase. Cada módulo lê o banco no seu `queries.ts`, e o cliente fica em `lib/supabase/`.
- Cores, fontes, raios e sombras são tokens definidos em `src/app/globals.css`. Nada de cor solta no componente.
- Movimento também: durações, curvas e distâncias são tokens, e cada animação usa um dos padrões de [docs/animacoes.md](docs/animacoes.md). Toda `page.tsx` envolve o conteúdo no `PageTransition`.

## Banco de dados

O conteúdo mora em cinco tabelas no Supabase:

| Tabela               | O que guarda                                              |
| -------------------- | --------------------------------------------------------- |
| `posts`              | Posts do blog, em Markdown                                |
| `tags`               | Tags dos posts                                            |
| `post_tags`          | Quais tags cada post tem                                  |
| `projects`           | Projetos do portfólio                                     |
| `project_categories` | Guias e subguias da barra lateral de `/projetos`          |

As imagens de projetos e posts ficam no bucket público `imagens` do Storage, em WebP: `projetos/<slug>/...` para as capas e telas de cada projeto. Só admin envia ou apaga.

Quem visita o site só lê o que está com status `published`. Para escrever é preciso estar logado e constar em `private.admins`. Essas regras ficam no próprio banco (RLS), então valem mesmo para quem chamar a API direto com a chave pública.

Toda mudança no banco entra como um arquivo novo em `supabase/migrations/`. Depois de mudar o esquema, gere de novo os tipos em `src/lib/supabase/database.types.ts`:

```bash
npx supabase gen types typescript --project-id aycoiszeubfwdtemeldj > src/lib/supabase/database.types.ts
```

As consultas ficam em cache por algumas horas, com as etiquetas `posts` e `projects`. Quem publicar pelo painel invalida a etiqueta e o site mostra o conteúdo novo na hora.

## Imagens do Pequi

O Pequi dormindo é montado em três camadas (corpo, pata e rabo) para a pata e o rabo se mexerem sozinhos. Os recortes saem das imagens em `referencias/`:

```bash
python -m venv .venv
.venv/Scripts/pip install "rembg[cpu]" pillow numpy
.venv/Scripts/python scripts/recortar-pequi.py
.venv/Scripts/python scripts/gerar-og.py
```

- `recortar-pequi.py` tira o fundo das fotos e grava os recortes em `public/pequi/`, as medidas em `src/modules/pequi/data/dormindo.json` e o ícone do site. Na primeira vez ele baixa um modelo de uns 180 MB para `~/.rembg`.
- `gerar-og.py` monta a imagem que aparece quando o link é compartilhado. Só precisa do Pillow.

## Modo sonho (em construção)

O Pequi em pixel art que vai andar e pular por cima do site. Por enquanto só o sprite está pronto, com prévia em `/brincar` (fora do índice de busca). Para refazer a folha a partir das imagens-fonte:

```bash
python scripts/montar-sprite.py
```

O mesmo sprite já acompanha a leitura no índice lateral do post: o Pequi pula até a seção que está na tela e dorme se ninguém rolar a página. A prévia fica em `/brincar/leitura`.

O plano, as decisões, o estado de cada etapa e como gerar ou adicionar animações estão em [docs/modo-sonho.md](docs/modo-sonho.md).
