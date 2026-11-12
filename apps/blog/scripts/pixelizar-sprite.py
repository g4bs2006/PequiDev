"""Converte uma imagem gerada por IA (pixel art ampliada, fundo magenta) em
quadros no tamanho de pixel real.

Entrada:  uma imagem com várias poses do Pequi sobre fundo magenta
Saída:    <pasta>/<nome>-01.png, <nome>-02.png... (1 pixel do desenho = 1 pixel)

As poses são separadas pelo fundo e lidas em ordem de leitura (linhas de cima
para baixo, cada linha da esquerda para a direita). A IA desenha cada pose numa
escala um pouco diferente, então cada uma tem a sua grade de pixels, achada
pelas bordas de cor. Cada pixel do desenho vira a cor mais comum no miolo da
célula da grade.

Normalmente quem chama é o montar-sprite.py. Para ver os quadros de uma imagem:

    python scripts/pixelizar-sprite.py <imagem> <pasta-saida> <nome>
"""

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

MAGENTA_LIMIAR = 90


def mascara_frente(im: np.ndarray) -> np.ndarray:
    """True onde não é fundo magenta."""
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    magenta = (r > 255 - MAGENTA_LIMIAR * 1.6) & (g < MAGENTA_LIMIAR) & (b > 255 - MAGENTA_LIMIAR * 1.6)
    return ~magenta


def separar_poses(frente: np.ndarray, bloco: int = 6, folga: int = 3):
    """Caixas (y0, y1, x0, x1) de cada pose, juntando pedaços próximos (bigode, rabo)."""
    h, w = frente.shape
    hb, wb = h // bloco, w // bloco
    peq = frente[: hb * bloco, : wb * bloco].reshape(hb, bloco, wb, bloco).mean((1, 3)) > 0.15
    # dilata para juntar pedaços que quase se tocam
    dil = peq.copy()
    for dy in range(-folga, folga + 1):
        for dx in range(-folga, folga + 1):
            dil |= np.roll(np.roll(peq, dy, 0), dx, 1)
    rot = np.zeros(dil.shape, int)
    caixas = []
    for y in range(hb):
        for x in range(wb):
            if dil[y, x] and not rot[y, x]:
                fila = deque([(y, x)])
                rot[y, x] = len(caixas) + 1
                ys, xs = [y], [x]
                while fila:
                    cy, cx = fila.popleft()
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < hb and 0 <= nx < wb and dil[ny, nx] and not rot[ny, nx]:
                            rot[ny, nx] = rot[y, x]
                            fila.append((ny, nx))
                            ys.append(ny)
                            xs.append(nx)
                area = ((rot == rot[y, x]) & peq).sum()
                if area > 40:
                    caixas.append((min(ys) * bloco, (max(ys) + 1) * bloco, min(xs) * bloco, (max(xs) + 1) * bloco))
    # ordem de leitura: linhas (por centro vertical), depois esquerda para direita
    caixas.sort(key=lambda c: (c[0] + c[1]) / 2)
    linhas, atual = [], []
    for c in caixas:
        if atual and (c[0] + c[1]) / 2 > max(a[1] for a in atual):
            linhas.append(atual)
            atual = []
        atual.append(c)
    if atual:
        linhas.append(atual)
    return [c for linha in linhas for c in sorted(linha, key=lambda c: c[2])]


def perfil_bordas(recorte: np.ndarray, eixo: int) -> np.ndarray:
    d = np.abs(np.diff(recorte.astype(int), axis=eixo)).sum(2) > 50
    return d.sum(axis=1 - eixo).astype(float)


def pontuar(perfil: np.ndarray, p: float):
    """Quanto as linhas de uma grade de período p coincidem com as bordas (e o melhor deslocamento)."""
    n = len(perfil)
    media = perfil.mean() + 1e-9
    melhor = (-1.0, 0.0)
    for o in np.arange(0, p, 0.25):
        pos = np.round(np.arange(o, n - 1, p)).astype(int)
        pos = pos[pos < n]
        # a borda pode cair 1 px antes da linha ideal
        v = np.maximum(perfil[pos], perfil[np.clip(pos - 1, 0, n - 1)]).mean() / media
        if v > melhor[0]:
            melhor = (v, o + 1)  # a borda fica entre as colunas i e i+1
    return melhor


def achar_periodo(perfil: np.ndarray) -> float:
    """Estimativa grosseira do tamanho do pixel, num eixo só."""
    resultados = [(pontuar(perfil, p)[0], p) for p in np.arange(4.0, 10.0, 0.02)]
    topo = max(v for v, _ in resultados)
    # entre os quase empatados, o menor período (múltiplos também alinham)
    return next(p for v, p in resultados if v >= topo * 0.93)


def grade_quadrada(recorte: np.ndarray, perto_de: float):
    """Período (igual nos dois eixos, pixel é quadrado) e deslocamentos x e y."""
    bx, by = perfil_bordas(recorte, 1), perfil_bordas(recorte, 0)
    melhor = None
    for p in np.arange(perto_de * 0.88, perto_de * 1.12, 0.01):
        (vx, ox), (vy, oy) = pontuar(bx, p), pontuar(by, p)
        if melhor is None or vx + vy > melhor[0]:
            melhor = (vx + vy, p, ox, oy)
    return melhor[1:]


def amostrar(recorte: np.ndarray, frente: np.ndarray, px, ox, py, oy) -> np.ndarray:
    h, w = frente.shape
    xs = np.arange(ox - px, w, px)
    ys = np.arange(oy - py, h, py)
    saida = np.zeros((len(ys), len(xs), 4), np.uint8)
    for j, y0 in enumerate(ys):
        for i, x0 in enumerate(xs):
            a0, a1 = int(y0 + py * 0.25), int(y0 + py * 0.75) + 1
            b0, b1 = int(x0 + px * 0.25), int(x0 + px * 0.75) + 1
            a0, b0 = max(a0, 0), max(b0, 0)
            if a1 <= a0 or b1 <= b0 or a0 >= h or b0 >= w:
                continue
            f = frente[a0:a1, b0:b1]
            if f.mean() < 0.5:
                continue
            cores = recorte[a0:a1, b0:b1][f].astype(int)
            chave = (cores // 24) @ np.array([10000, 100, 1])
            valores, contagem = np.unique(chave, return_counts=True)
            moda = cores[chave == valores[contagem.argmax()]].mean(0)
            if moda[0] > 150 and moda[2] > 150 and moda[1] < 120:
                continue  # sobra do fundo magenta na borda do contorno
            saida[j, i, :3] = np.round(moda)
            saida[j, i, 3] = 255
    return aparar(saida)


def aparar(rgba: np.ndarray) -> np.ndarray:
    a = rgba[..., 3] > 0
    ys, xs = np.nonzero(a)
    return rgba[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def extrair(caminho: str, pasta: str, nome: str):
    im = np.asarray(Image.open(caminho).convert("RGB"))
    frente = mascara_frente(im)
    Path(pasta).mkdir(parents=True, exist_ok=True)
    recortes = []
    for y0, y1, x0, x1 in separar_poses(frente):
        y0, x0 = max(y0 - 4, 0), max(x0 - 4, 0)
        recortes.append((im[y0 : y1 + 4, x0 : x1 + 4], frente[y0 : y1 + 4, x0 : x1 + 4]))
    # A IA desenha cada pose numa escala um pouco diferente, então cada uma tem
    # a sua grade; a mediana da imagem só serve para não cair num múltiplo.
    estimativas = []
    for rec, _ in recortes:
        estimativas += [achar_periodo(perfil_bordas(rec, 1)), achar_periodo(perfil_bordas(rec, 0))]
    mediana = float(np.median(estimativas))
    for n, (rec, fr) in enumerate(recortes, 1):
        p, ox, oy = grade_quadrada(rec, mediana)
        quadro = amostrar(rec, fr, p, ox, p, oy)
        destino = Path(pasta) / f"{nome}-{n:02d}.png"
        Image.fromarray(quadro, "RGBA").save(destino)
        print(f"{destino.name}: grade {p:.2f}, {quadro.shape[1]}x{quadro.shape[0]} px")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    extrair(sys.argv[1], sys.argv[2], sys.argv[3])
