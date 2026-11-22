# Avaliação do modelo da Lixeira do Pequi

Teste em larga escala, sem câmera, feito em 2026-11-22 a pedido do Gabriel.
Para repetir, veja [Como rodar](#como-rodar).

## O que foi testado

- **Conjunto:** [TrashNet](https://github.com/garythung/trashnet) (licença
  MIT), 2.527 fotos etiquetadas. Mapeamento: cardboard e paper → papel, glass →
  vidro, metal → metal, plastic → plástico, trash → rejeito. Não há "vazio".
  As fotos são de estúdio (fundo branco, um objeto, boa luz): **o uso real
  tende a ser pior** que estes números.
- **Modelo local:** o mesmo MobileNet do app (`public/lixeira/modelo/`) gerou o
  embedding de cada foto; depois o KNN do app (mesmas regras de
  `visao/modelo.ts`: cosseno, k = 10 com 10 ou mais exemplos por classe, senão
  3, confiança = fração dos votos) foi simulado em 30 divisões aleatórias entre
  fotos "ensinadas" e "testadas". Cada teste usa uma foto só (o app vota entre
  5 quadros quase iguais, o que muda pouco).
- **GPT:** 200 fotos (40 por lixeira), com o modelo, o prompt e o formato da
  Edge Function `lixeira-validar`.

## Resumo

1. **O KNN aprende devagar.** Acerta 70% com 30 exemplos por lixeira e 78% com
   100. O vidro é o ponto fraco (50 a 65%), confundido com plástico e metal.
2. **O corte de 0,85 manda quase tudo para a nuvem.** Com 30 exemplos por
   lixeira, só 9% das análises passam do corte (e acertam 98%). Com 0,7, 32%
   ficam no celular com 91% de acerto; com 100 exemplos, 56% com 92%.
3. **O GPT acerta 96% das recicláveis** (153 de 160) em cerca de 1,5 s, mas
   **só 5% do rejeito**: ele chama embalagem suja ou metalizada de plástico ou
   papel. Isso pode ser a regra do prompt ou a etiqueta do TrashNet; vale
   decidir o que a lixeira considera rejeito.
4. **A certeza do GPT não separa erro de acerto:** quando erra, ele também diz
   87 a 91% de certeza. Com o aprendizado automático (certeza ≥ 0,9), 16% do
   que ele ensinaria estaria errado, quase tudo rejeito virando plástico.

## Modelo local (KNN)

### Curva de aprendizado (exemplos ensinados por lixeira)

| Exemplos por lixeira | Acerto geral | Média das lixeiras |
| --- | --- | --- |
| 3 | 43.2% | 40.8% |
| 5 | 50.6% | 48.1% |
| 10 | 57.8% | 53.8% |
| 20 | 66.1% | 63.3% |
| 30 | 69.6% | 67.3% |
| 50 | 73.1% | 71.1% |
| 100 | 78.1% | 76.3% |

### Acerto por lixeira (30 exemplos por lixeira)

| Lixeira | Acerto |
| --- | --- |
| metal | 68.8% |
| plastico | 71.7% |
| papel | 78.4% |
| vidro | 50.4% |
| rejeito | 67.2% |

### Confusão (30 por lixeira; linha = real, coluna = o que o Pequi disse)

| real \ Pequi | metal | plastico | papel | vidro | rejeito |
| --- | --- | --- | --- | --- | --- |
| metal | 68.8% | 8.2% | 1.3% | 8.2% | 13.4% |
| plastico | 8.4% | 71.7% | 2.0% | 11.8% | 6.1% |
| papel | 3.5% | 5.0% | 78.4% | 0.6% | 12.4% |
| vidro | 18.2% | 28.7% | 0.8% | 50.4% | 1.8% |
| rejeito | 9.9% | 12.5% | 7.3% | 3.1% | 67.2% |

### Faixas de confiança (30 por lixeira)

| Confiança | Parte das análises | Acerto |
| --- | --- | --- |
| abaixo de 50% | 24.9% | 46.4% |
| 50 a 69% | 42.8% | 66.7% |
| 70 a 84% | 23.5% | 88.5% |
| 85 a 99% | 5.7% | 97.5% |
| 100% | 3.1% | 99.1% |

### Corte para ir à nuvem (30 por lixeira)

| Corte | Resolve sem nuvem | Acerto dos resolvidos |
| --- | --- | --- |
| 0.6 | 51.5% | 84.7% |
| 0.7 | 32.3% | 91.1% |
| 0.8 | 18.3% | 95.3% |
| 0.85 | 8.8% | 98.1% |
| 0.9 | 8.8% | 98.1% |
| 1 | 3.1% | 99.1% |

### Acerto por lixeira (100 exemplos por lixeira)

| Lixeira | Acerto |
| --- | --- |
| metal | 79.6% |
| plastico | 77.4% |
| papel | 83.7% |
| vidro | 65.1% |
| rejeito | 75.9% |

### Confusão (100 por lixeira; linha = real, coluna = o que o Pequi disse)

| real \ Pequi | metal | plastico | papel | vidro | rejeito |
| --- | --- | --- | --- | --- | --- |
| metal | 79.6% | 5.4% | 0.8% | 7.3% | 6.9% |
| plastico | 6.3% | 77.4% | 1.2% | 9.3% | 5.8% |
| papel | 2.1% | 2.9% | 83.7% | 0.5% | 10.8% |
| vidro | 12.1% | 20.8% | 0.6% | 65.1% | 1.5% |
| rejeito | 8.8% | 6.9% | 5.7% | 2.7% | 75.9% |

### Faixas de confiança (100 por lixeira)

| Confiança | Parte das análises | Acerto |
| --- | --- | --- |
| abaixo de 50% | 12.0% | 46.4% |
| 50 a 69% | 32.1% | 64.9% |
| 70 a 84% | 27.8% | 86.9% |
| 85 a 99% | 13.0% | 96.7% |
| 100% | 15.1% | 99.1% |

### Corte para ir à nuvem (100 por lixeira)

| Corte | Resolve sem nuvem | Acerto dos resolvidos |
| --- | --- | --- |
| 0.6 | 72.0% | 87.8% |
| 0.7 | 55.9% | 92.5% |
| 0.8 | 41.4% | 95.9% |
| 0.85 | 28.1% | 98.0% |
| 0.9 | 28.1% | 98.0% |
| 1 | 15.1% | 99.1% |

## GPT

### GPT (gpt-5.4-mini) em 200 fotos (0 erros)

Acerto geral: **77.5%**. Tempo: mediana 1549 ms, 90% abaixo de 1855 ms. Tokens: 118200 de entrada e 9886 de saída.

| Lixeira | Acerto | Certeza média quando acerta | Quando erra |
| --- | --- | --- | --- |
| metal | 100.0% | 95.9% | — |
| plastico | 90.0% | 95.9% | 87.3% |
| papel | 97.5% | 95.2% | 78.0% |
| vidro | 95.0% | 97.7% | 91.0% |
| rejeito | 5.0% | 96.5% | 90.2% |

| real \ GPT | metal | plastico | papel | vidro | rejeito | vazio |
| --- | --- | --- | --- | --- | --- | --- |
| metal | 40 | 0 | 0 | 0 | 0 | 0 |
| plastico | 3 | 36 | 0 | 1 | 0 | 0 |
| papel | 0 | 1 | 39 | 0 | 0 | 0 |
| vidro | 1 | 1 | 0 | 38 | 0 | 0 |
| rejeito | 4 | 25 | 9 | 0 | 2 | 0 |

Com certeza ≥ 0,9 (quando o Pequi aprende sozinho): 86.5% das fotos, acerto 83.8%.

## O que foi aplicado (2026-11-22)

O Gabriel aprovou as quatro recomendações:

1. **Base inicial do site.** 50 fotos por lixeira do TrashNet, já em
   embeddings, em `public/lixeira/base/` (`trashnet.f32`, 1,25 MB, e
   `trashnet.json`), geradas por `scripts/avaliar-lixeira/base.mjs`. O app as
   carrega junto com os exemplos do banco (`visao/modelo.ts`); o "Esquecer"
   apaga o que a pessoa ensinou e mantém a base. O service worker guarda para
   o modo offline. Pela curva acima, 50 por lixeira dá cerca de 73% de acerto
   nas fotos de estúdio.
2. **Corte local de 0,85 para 0,7** (`CORTE_LOCAL` em `LixeiraCamera.tsx`):
   cerca de 3 vezes mais análises resolvidas no celular, com 91% de acerto.
3. **Aprendizado automático pelo GPT desligado.** O Pequi só aprende quando a
   pessoa confirma ou corrige. Para religar, criar o secret
   `LIXEIRA_GPT_APRENDE=sim` na Edge Function.
4. **Regra de rejeito no prompt**, com os casos do TrashNet: embalagem
   metalizada, sachê, tubo de pasta de dente, escova, papel ou guardanapo sujo,
   e "embalagem metalizada não é metal". Reteste com as mesmas 200 fotos:

### GPT (gpt-5.4-mini) em 200 fotos (0 erros)

Acerto geral: **85.0%**. Tempo: mediana 1444 ms, 90% abaixo de 1713 ms. Tokens: 138000 de entrada e 10046 de saída.

| Lixeira | Acerto | Certeza média quando acerta | Quando erra |
| --- | --- | --- | --- |
| metal | 95.0% | 95.7% | 97.0% |
| plastico | 87.5% | 94.9% | 95.2% |
| papel | 95.0% | 93.6% | 87.5% |
| vidro | 92.5% | 97.9% | 87.3% |
| rejeito | 55.0% | 97.0% | 87.3% |

| real \ GPT | metal | plastico | papel | vidro | rejeito | vazio |
| --- | --- | --- | --- | --- | --- | --- |
| metal | 38 | 0 | 0 | 0 | 2 | 0 |
| plastico | 2 | 35 | 0 | 2 | 1 | 0 |
| papel | 0 | 1 | 38 | 0 | 1 | 0 |
| vidro | 1 | 2 | 0 | 37 | 0 | 0 |
| rejeito | 1 | 13 | 4 | 0 | 22 | 0 |

Com certeza ≥ 0,9 (quando o Pequi aprende sozinho): 87.0% das fotos, acerto 91.4%.

Rejeito subiu de 5% para 55% e o geral de 77,5% para 85%; as recicláveis
caíram de 96% para 92,5%. Boa parte dos 13 rejeitos que ainda saem como
plástico são saquinhos plásticos limpos, que pela coleta comum daqui são
plástico mesmo: divergência entre a etiqueta do TrashNet e a regra local.

## Como rodar

1. Numa pasta fora do projeto: `npm init -y && npm i @tensorflow/tfjs-node@4.22.0
   @tensorflow-models/mobilenet@2.1.1`, depois `npm approve-scripts
   @tensorflow/tfjs-node && npm rebuild @tensorflow/tfjs-node`. No Windows,
   copie `node_modules/@tensorflow/tfjs-node/deps/lib/tensorflow.dll` para
   `node_modules/@tensorflow/tfjs-node/lib/napi-v8/`.
2. Baixe e extraia `data/dataset-resized.zip` do TrashNet.
3. `DEPS=<pasta> node scripts/avaliar-lixeira/embeddings.mjs <dataset-resized> <saida>`
   (uns 2 min para 2.527 fotos).
4. `node scripts/avaliar-lixeira/analisar.mjs <saida>` (uns 2 min, sem rede).
5. Opcional, custa chamadas: `OPENAI_API_KEY=... node scripts/avaliar-lixeira/gpt.mjs <dataset-resized> 40`.

Não testado: as fotos reais dos testes do Gabriel no celular (ficam no bucket
privado e não entraram aqui).
