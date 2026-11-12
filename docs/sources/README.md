# Fichas das fontes

Uma ficha por fonte de vagas (`<fonte>.md`), escrita **antes** do adapter (regra 3 do [plano](../PLANO.md)).
Fonte que proíbe coleta nos termos ou no `robots.txt` ganha ficha com status "descartada" e não ganha adapter.

Modelo:

```md
# <Fonte>

- **Status:** em análise | ativa | descartada (motivo)
- **Tipo:** per_board | global
- **Endpoint:** URL, método, autenticação
- **Paginação:** como funciona
- **Limites:** rate limit documentado ou observado
- **Termos e robots.txt:** link, data da consulta e o que dizem sobre coleta automatizada
- **Campos:** como cada campo do RawJob (packages/core) é preenchido
- **Fixtures:** arquivos em workers/fixtures/<fonte>/
```
