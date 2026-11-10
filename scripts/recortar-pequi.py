"""Recorta as imagens do Pequi e exporta os arquivos que o site usa.

Entrada:  referencias/pequi-dormindo.png e referencias/pequi-acordado.png
Saída:    public/pequi/*.webp
          src/app/icon.png
          src/modules/pequi/data/dormindo.json (geometria das camadas)

O gato dormindo sai em três camadas (corpo, pata pendurada e rabo) para que a
pata e o rabo possam se mexer sozinhos. A prateleira branca some junto com o
fundo, e a linha onde o corpo apoia vira a "linha de apoio" usada no hero.

Como rodar (uma vez, ou sempre que uma imagem de referência mudar):

    python -m venv .venv
    .venv/Scripts/python -m pip install "rembg[cpu]" pillow numpy
    .venv/Scripts/python scripts/recortar-pequi.py

Na primeira execução o rembg baixa o modelo isnet-general-use (cerca de 180 MB)
para a pasta ~/.rembg.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

RAIZ = Path(__file__).resolve().parent.parent
REFERENCIAS = RAIZ / "referencias"
SAIDA = RAIZ / "public" / "pequi"
GEOMETRIA = RAIZ / "src" / "modules" / "pequi" / "data" / "dormindo.json"
ICONE = RAIZ / "src" / "app" / "icon.png"

CEU = (124, 200, 191, 255)

# Quanto do corpo continua desenhado abaixo da linha de apoio, por cima da
# pata e do rabo. Esse "toco" esconde a emenda quando as camadas giram.
TOCO = 18
ESFUMADO = 10


def recortar(caminho: Path, sessao) -> Image.Image:
    """Remove o fundo e aperta um pouco a borda para tirar o halo branco."""
    imagem = Image.open(caminho).convert("RGB")
    recorte = remove(imagem, session=sessao, post_process_mask=False)
    dados = np.asarray(recorte).astype(np.float32)
    alfa = dados[..., 3] / 255.0
    alfa = np.clip((alfa - 0.15) / 0.85, 0.0, 1.0)
    dados[..., 3] = alfa * 255.0
    return Image.fromarray(dados.astype(np.uint8), "RGBA")


def salvar_webp(imagem: Image.Image, nome: str) -> None:
    destino = SAIDA / nome
    imagem.save(destino, "WEBP", quality=86, method=6, exact=False)
    print(f"  {destino.relative_to(RAIZ)}  {imagem.size[0]}x{imagem.size[1]}  {destino.stat().st_size // 1024} KB")


def linha_de_apoio(opaco: np.ndarray) -> int:
    """Linha em que o corpo termina: a maior queda de largura entre duas linhas."""
    largura = opaco.sum(axis=1).astype(np.int64)
    queda = largura[:-4] - largura[4:]
    return int(np.argmax(queda)) + 2


def faixas_abaixo(opaco: np.ndarray, y: int) -> list[tuple[int, int]]:
    """Trechos horizontais do gato que continuam abaixo da linha y."""
    colunas = opaco[y:].any(axis=0).astype(np.int8)
    bordas = np.diff(np.concatenate([[0], colunas, [0]]))
    return list(zip(np.nonzero(bordas == 1)[0].tolist(), np.nonzero(bordas == -1)[0].tolist()))


def camada_movel(dados: np.ndarray, x0: int, x1: int, y0: int) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Recorta uma parte pendurada (pata ou rabo) já na sua caixa mínima."""
    parte = np.zeros_like(dados)
    parte[y0:, x0:x1] = dados[y0:, x0:x1]
    ys, xs = np.nonzero(parte[..., 3] > 8)
    caixa = (int(xs.min()) - 2, y0, int(xs.max()) + 3, int(ys.max()) + 3)
    return Image.fromarray(parte, "RGBA").crop(caixa), caixa


def dormindo(sessao) -> None:
    print("Pequi dormindo")
    recorte = recortar(REFERENCIAS / "pequi-dormindo.png", sessao)
    dados = np.asarray(recorte).copy()
    altura, largura = dados.shape[:2]
    opaco = dados[..., 3] > 128

    apoio = linha_de_apoio(opaco)
    # Abaixo da linha sobram três coisas: o pingente, a pata e o rabo.
    # A pata é o trecho mais largo; o rabo é o mais à direita.
    faixas = [f for f in faixas_abaixo(opaco, apoio + TOCO + ESFUMADO) if f[1] - f[0] > 40]
    pata_x = max(faixas, key=lambda f: f[1] - f[0])
    rabo_x = max(faixas, key=lambda f: f[0])
    assert pata_x != rabo_x, "não achei a pata e o rabo separados abaixo da linha de apoio"

    margem = 24
    corpo = dados.copy()
    camadas = {}
    for nome, (x0, x1) in (("pata", pata_x), ("rabo", rabo_x)):
        x0, x1 = max(0, x0 - margem), min(largura, x1 + margem)
        imagem, caixa = camada_movel(dados, x0, x1, apoio)
        salvar_webp(imagem, f"dormindo-{nome}.webp")

        # No corpo, a parte pendurada some depois do toco, com a borda esfumada.
        y_toco = apoio + TOCO
        rampa = np.linspace(1.0, 0.0, ESFUMADO, dtype=np.float32)[:, None]
        corpo[y_toco : y_toco + ESFUMADO, x0:x1, 3] = (
            corpo[y_toco : y_toco + ESFUMADO, x0:x1, 3] * rampa
        ).astype(np.uint8)
        corpo[y_toco + ESFUMADO :, x0:x1, 3] = 0

        # Eixo de giro: no meio da largura da parte, logo abaixo da linha de apoio.
        topo = np.nonzero(opaco[apoio + TOCO, x0:x1])[0]
        eixo_x = x0 + (int(topo.min()) + int(topo.max())) / 2
        eixo_y = apoio + TOCO / 2
        ponta_y = caixa[3]
        ponta = np.nonzero(opaco[ponta_y - 30, x0:x1])[0]
        camadas[nome] = {
            "left": caixa[0] / largura,
            "top": caixa[1] / altura,
            "width": (caixa[2] - caixa[0]) / largura,
            "height": (caixa[3] - caixa[1]) / altura,
            "pixelWidth": caixa[2] - caixa[0],
            "pixelHeight": caixa[3] - caixa[1],
            "originX": (eixo_x - caixa[0]) / (caixa[2] - caixa[0]),
            "originY": (eixo_y - caixa[1]) / (caixa[3] - caixa[1]),
            "tipX": (x0 + (int(ponta.min()) + int(ponta.max())) / 2) / largura,
            "tipY": ponta_y / altura,
        }

    salvar_webp(Image.fromarray(corpo, "RGBA"), "dormindo-corpo.webp")

    ys, xs = np.nonzero(opaco)
    geometria = {
        "width": largura,
        "height": altura,
        "supportLine": apoio / altura,
        "top": int(ys.min()) / altura,
        "paw": camadas["pata"],
        "tail": camadas["rabo"],
    }
    GEOMETRIA.parent.mkdir(parents=True, exist_ok=True)
    GEOMETRIA.write_text(json.dumps(geometria, indent=2) + "\n", encoding="utf-8")
    print(f"  {GEOMETRIA.relative_to(RAIZ)}  linha de apoio em {apoio}px de {altura}px")


def acordado(sessao) -> None:
    print("Pequi acordado")
    recorte = recortar(REFERENCIAS / "pequi-acordado.png", sessao)
    alfa = np.asarray(recorte)[..., 3]
    ys, xs = np.nonzero(alfa > 8)
    folga = 12
    caixa = (
        max(0, int(xs.min()) - folga),
        max(0, int(ys.min()) - folga),
        min(recorte.width, int(xs.max()) + folga),
        min(recorte.height, int(ys.max()) + folga),
    )
    salvar_webp(recorte.crop(caixa), "acordado.webp")

    # Ícone do site: o rosto do Pequi sobre um círculo na cor Céu.
    lado = int((caixa[2] - caixa[0]) * 0.66)
    centro_x = caixa[0] + int((caixa[2] - caixa[0]) * 0.31)
    topo = caixa[1] - int(lado * 0.04)
    rosto = recorte.crop((centro_x - lado // 2, topo, centro_x + lado // 2, topo + lado))
    tamanho = 256
    escala = 4
    mascara = Image.new("L", (tamanho * escala, tamanho * escala), 0)
    from PIL import ImageDraw

    ImageDraw.Draw(mascara).ellipse((0, 0, tamanho * escala - 1, tamanho * escala - 1), fill=255)
    mascara = mascara.resize((tamanho, tamanho), Image.LANCZOS)
    fundo = Image.new("RGBA", (tamanho, tamanho), CEU)
    fundo.alpha_composite(rosto.resize((tamanho, tamanho), Image.LANCZOS))
    icone = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    icone.paste(fundo, (0, 0), mascara)
    icone.save(ICONE, "PNG", optimize=True)
    print(f"  {ICONE.relative_to(RAIZ)}  {tamanho}x{tamanho}")


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    sessao = new_session("isnet-general-use")
    dormindo(sessao)
    acordado(sessao)


if __name__ == "__main__":
    main()
