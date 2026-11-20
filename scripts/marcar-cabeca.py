"""
Marca onde fica o topo da cabeça do Pequi em cada quadro da folha de sprites,
para um chapéu acompanhar a cabeça (Lixeira do Pequi, etapas 5 e 7).

O desenho olha para a direita e a cauda é a única coisa que sobe tão alto do
lado esquerdo, então a cabeça é procurada só da coluna 40 em diante. O topo é a
linha mais alta com pixel opaco ali (a ponta das orelhas); o centro é o meio
entre a orelha da esquerda e a da direita, medido 3 linhas abaixo da ponta.

Uso: python scripts/marcar-cabeca.py
Grava src/modules/pequi/data/cabeca.json: para cada animação, uma lista de
[x, y] por quadro, em pixels da célula (x do centro entre as orelhas, y da
ponta das orelhas). Confira na prévia e corrija à mão o que sair torto.
"""

import json
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SPRITE = json.loads((RAIZ / "src/modules/pequi/data/sprite.json").read_text(encoding="utf-8"))
FOLHA = Image.open(RAIZ / "public" / SPRITE["imagem"].lstrip("/")).convert("RGBA")
LARGURA = SPRITE["celula"]["largura"]
ALTURA = SPRITE["celula"]["altura"]
COLUNA_MINIMA = 40
# Enrolado para dormir, as costas ficam mais altas que a cabeça: nesses quadros
# a cabeça é procurada mais à direita.
COLUNA_POR_QUADRO = {("dormir", 3): 62, ("dormir", 4): 62, ("dormir", 5): 62}


def opaco(x: int, y: int, x0: int, y0: int) -> bool:
    return FOLHA.getpixel((x0 + x, y0 + y))[3] > 128


def cabeca(nome: str, linha: int, quadro: int) -> list[int]:
    x0, y0 = quadro * LARGURA, linha * ALTURA
    coluna = COLUNA_POR_QUADRO.get((nome, quadro), COLUNA_MINIMA)
    for y in range(ALTURA):
        if any(opaco(x, y, x0, y0) for x in range(coluna, LARGURA)):
            topo = y
            break
    else:
        raise ValueError(f"quadro vazio: linha {linha}, quadro {quadro}")

    # 3 linhas abaixo da ponta, as duas orelhas já aparecem.
    medida = min(topo + 3, ALTURA - 1)
    xs = [x for x in range(coluna, LARGURA) if opaco(x, medida, x0, y0)]
    centro = round((min(xs) + max(xs)) / 2)
    return [centro, topo]


def main() -> None:
    marcas = {
        nome: [cabeca(nome, anim["linha"], q) for q in range(anim["quadros"])]
        for nome, anim in SPRITE["animacoes"].items()
    }
    destino = RAIZ / "src/modules/pequi/data/cabeca.json"
    destino.write_text(json.dumps(marcas, indent=2) + "\n", encoding="utf-8")
    for nome, pontos in marcas.items():
        print(f"{nome:10} {pontos}")


if __name__ == "__main__":
    main()
