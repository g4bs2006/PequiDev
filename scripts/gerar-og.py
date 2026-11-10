"""Monta a imagem de compartilhamento (Open Graph) a partir dos recortes do Pequi.

Usa os arquivos que o recortar-pequi.py já gerou, então só precisa do Pillow:
    python scripts/gerar-og.py
"""

import json
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PEQUI = RAIZ / "public" / "pequi"
GEOMETRIA = RAIZ / "src" / "modules" / "pequi" / "data" / "dormindo.json"
SAIDA = RAIZ / "src" / "app" / "opengraph-image.png"
TEXTO_ALT = RAIZ / "src" / "app" / "opengraph-image.alt.txt"

LARGURA, ALTURA = 1200, 630
CREME = (255, 244, 220, 255)
CEU = (124, 200, 191, 255)
FAIXA = 0.62  # onde começa a faixa Céu, em fração da altura
PEQUI_LARGURA = 1120


def main() -> None:
    g = json.loads(GEOMETRIA.read_text(encoding="utf-8"))
    escala = PEQUI_LARGURA / g["width"]
    altura_pequi = round(g["height"] * escala)
    topo_faixa = round(ALTURA * FAIXA)

    imagem = Image.new("RGBA", (LARGURA, ALTURA), CREME)
    imagem.paste(CEU, (0, topo_faixa, LARGURA, ALTURA))

    # A linha de apoio do Pequi encosta na borda de cima da faixa.
    x0 = (LARGURA - PEQUI_LARGURA) // 2
    y0 = topo_faixa - round(g["supportLine"] * altura_pequi)

    def colar(arquivo: str, parte: dict | None) -> None:
        camada = Image.open(PEQUI / arquivo).convert("RGBA")
        if parte is None:
            tamanho, posicao = (PEQUI_LARGURA, altura_pequi), (x0, y0)
        else:
            tamanho = (
                round(parte["width"] * PEQUI_LARGURA),
                round(parte["height"] * altura_pequi),
            )
            posicao = (
                x0 + round(parte["left"] * PEQUI_LARGURA),
                y0 + round(parte["top"] * altura_pequi),
            )
        camada = camada.resize(tamanho, Image.LANCZOS)
        imagem.alpha_composite(camada, posicao)

    # Mesma ordem do site: rabo e pata por baixo, corpo por cima.
    colar("dormindo-rabo.webp", g["tail"])
    colar("dormindo-pata.webp", g["paw"])
    colar("dormindo-corpo.webp", None)

    imagem.convert("RGB").save(SAIDA, optimize=True)
    TEXTO_ALT.write_text(
        "Pequi, um gato laranja rajado, dormindo esticado em cima de uma faixa verde-água",
        encoding="utf-8",
    )
    print(f"{SAIDA.relative_to(RAIZ)}  {LARGURA}x{ALTURA}")


if __name__ == "__main__":
    main()
