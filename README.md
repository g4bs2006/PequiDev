# PequiDev

Blog e portfólio do Gabriel, com o Pequi (um gato laranja rajado) de mascote.

Feito com Next.js (App Router), TypeScript e Tailwind CSS. O conteúdo vai ficar no Supabase a partir da fase 2.

## Rodar no computador

```bash
npm install
npm run dev
```

O site abre em http://localhost:3000.

| Comando         | O que faz                               |
| --------------- | --------------------------------------- |
| `npm run dev`   | Sobe o site em modo de desenvolvimento  |
| `npm run build` | Gera a versão de produção               |
| `npm run start` | Serve a versão de produção já gerada    |
| `npm run lint`  | Confere o código com o ESLint           |

Em produção, defina `NEXT_PUBLIC_SITE_URL` com o endereço do site (por exemplo `https://pequidev.com.br`). É ele que entra nos links de compartilhamento.

## Como o código está organizado

Arquitetura por módulo, com os componentes compartilhados em atomic design.

```
src/
  app/                 Rotas, layout, estilos globais, ícone e imagem de compartilhamento
  components/
    atoms/             Peças mínimas: botão, tag, ícones
    molecules/         Combinações pequenas: link do menu, botão de tema
    organisms/         Blocos do site inteiro: menu e rodapé
  modules/
    hero/              Primeira tela da home (textos em content.ts)
    pequi/             O mascote: componentes e medidas dos recortes
    home/              Seções da home
  lib/                 Fontes, dados do site e tema
public/pequi/          Recortes do Pequi já prontos para a web
referencias/           Imagens originais do Pequi
scripts/               Scripts que geram os recortes e a imagem de compartilhamento
```

Regras da casa:

- As páginas em `app/` só montam módulos. Cada módulo expõe o que é público pelo seu `index.ts`.
- Um módulo pode usar `components/` e `lib/`, nunca o contrário.
- Cores, fontes, raios e sombras são tokens definidos em `src/app/globals.css`. Nada de cor solta no componente.

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
