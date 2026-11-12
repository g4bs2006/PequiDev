# Perguntas em aberto

Dúvidas de produto que só o Gabriel decide (regra 8 do [plano](PLANO.md)). Quem encontrar uma dúvida nova
deixa um `TODO(gabriel):` no código e acrescenta uma linha aqui. Quando houver resposta, mova para
"Respondidas" com a data e, se mudar arquitetura, registre um ADR em `decisions/`.

## Abertas

| #   | Pergunta                                                                                                                                                     | Fase que bloqueia | Origem    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | --------- |
| 1   | Domínio final do subdomínio (`vagas.<dominio>`)?                                                                                                             | F0 (deploy)       | Plano §11 |
| 2   | Limiar de score para push (padrão 75) e N diário de vagas para o LLM (padrão 30)?                                                                            | F6, F9            | Plano §11 |
| 3   | Preferências iniciais: cidades, remoto/híbrido, senioridade, faixa salarial, stacks prioritárias, empresas a excluir.                                        | F6                | Plano §11 |
| 4   | Idiomas do currículo (PT e EN?) e se haverá template separado para vagas internacionais.                                                                     | F7                | Plano §11 |
| 5   | O repositório `PequiDev` hoje é **público**. Os scrapers e o app de vagas devem ficar nele (Actions sem cota, mas código exposto) ou num repo privado?       | F2                | Fase 0    |
| 6   | A Fase 0 manteve o blog com cópia própria dos tokens em `globals.css`. Migrar o blog para `@pequidev/ui` agora ou só quando houver componente compartilhado? | —                 | Fase 0    |

## Respondidas

_Nenhuma ainda._
