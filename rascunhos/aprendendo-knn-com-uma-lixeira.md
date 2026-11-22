<!--
Campos do painel (/admin)
Título: 
Slug: aprendendo-knn-com-uma-lixeira
Resumo: Precisava de IA num projeto da faculdade e acabei ensinando uma lixeira a separar recicláveis com KNN. O que eu entendi, onde ela erra e o que ainda não sei.
Tags: knn, machine-learning, projetos
Status: draft

O conteúdo começa depois deste comentário.
-->

Na faculdade apareceu um projeto que precisava envolver inteligência artificial. Minha primeira ideia foi um app de competição de agachamento ou de flexão. Ia ter visão computacional, mas achei simples demais para o que eu queria aprender.

Então resolvi tentar algo mais difícil: um modelo meu, que olhasse um objeto pela câmera e dissesse em qual lixeira ele vai. Metal, plástico, papel, vidro ou rejeito.

O projeto começou pequeno e foi crescendo. Hoje, quando o modelo fica em dúvida, ele pede ajuda para o GPT. E quando eu confirmo ou corrijo uma resposta, aquela foto vira um exemplo novo.

## Por que o KNN

Treinar uma rede neural do zero ia dar trabalho demais para um projeto de faculdade. O KNN, de *k nearest neighbors* (os k vizinhos mais próximos), foi o caminho mais simples que eu achei. Simples para os padrões de IA, porque ainda me deu bastante dor de cabeça.

## Como ele decide

O MobileNet é uma rede neural que o Google já treinou com milhões de fotos. Eu não mexo nele. Uso ele só para transformar cada foto em uma lista de 1280 números.

Quando eu mostro um papel para a câmera e aperto para ensinar, a lixeira guarda esses 1280 números com a etiqueta "papel". O treino do KNN é só isso. Ele não ajusta nada, só guarda exemplos.

Para descobrir o que é um objeto novo, ele pega os números da foto e procura os exemplos guardados que mais se parecem com ela. Esses são os vizinhos mais próximos. Se a maioria deles é papel, ele responde papel.

O k é quantos vizinhos ele consulta. No meu projeto são 3 no começo e 10 quando cada lixeira já tem pelo menos 10 exemplos:

```ts
const todasTemDez = classesEnsinadas.every((classe) => quantidades[classe] >= 10);
const k = Math.min(todasTemDez ? 10 : 3, totalExemplos);
```

O `Math.min` cobre o comecinho, quando ainda tem menos exemplos guardados do que vizinhos para consultar.

A câmera ainda olha 5 quadros seguidos, e eles votam entre si. Se a confiança fica abaixo de 85%, ele não arrisca e pergunta para o GPT. Quando eu confirmo ou corrijo a resposta, aquela foto vira um exemplo novo.

## Onde ele erra

O ponto fraco até hoje é o vidro. Testei com as 2.527 fotos de um conjunto público chamado [TrashNet](https://github.com/garythung/trashnet). Ensinando 30 exemplos por lixeira, ele acertou só metade dos vidros. E quando errava, quase 6 em cada 10 vezes dizia que era plástico.

Olhando a foto, faz sentido. Garrafa de vidro e garrafa de plástico têm o mesmo formato, são transparentes e brilham do mesmo jeito.

E esse número ainda é otimista. As fotos do TrashNet são de estúdio, com fundo branco e luz boa. Na câmera de verdade, com a mesa bagunçada atrás, o resultado tende a ser pior.

O GPT também tem o ponto cego dele. No mesmo teste, ele acertou 96% dos recicláveis, mas só 5% do rejeito. Embalagem suja ou metalizada ele chama de plástico ou de papel.

## O que eu ainda não entendi

A parte que mais me incomoda é a dos 1280 números. Eu sei de onde eles saem: são a última camada do MobileNet, logo antes de ele dar o palpite sobre o que tem na foto. E sei que foto parecida gera números parecidos. É isso que faz o KNN funcionar.

O que eu não sei é o que cada número mede. Ninguém escolheu "o número 37 é a cor" ou "o 512 é o brilho". A rede aprendeu sozinha, no treino com milhões de fotos, o que valia a pena medir. Pelo que pesquisei, dá para descobrir quais imagens fazem um número subir mais, e às vezes aparece algo reconhecível, como uma textura ou uma borda. Na maioria das vezes não aparece nada que tenha nome.

Quando comecei, eu achava que a lixeira reconhecia papel porque papel é branco. Hoje sei que isso é um palpite meu. Pode ser a cor, pode ser a textura, pode ser uma mistura que eu nem saberia descrever. E o vidro virando plástico deve vir daí também: nas coisas que a rede escolheu medir, os dois ficam muito perto.

Se quiser ver o vidro virando plástico com os próprios olhos, a lixeira está em [/lixeira](/lixeira). Ensina uns exemplos e tenta enganar ela.
