"""Monta a folha de sprites do Pequi a partir das imagens-fonte da IA.

Entrada:  referencias/sprite-ia/<animação>.webp (e chave.webp, a pose de referência)
Saída:    public/pequi/sprite/pequi.png
          src/modules/pequi/data/sprite.json (célula, animações e paleta)

Para cada imagem-fonte, o pixelizar-sprite.py separa as poses e reduz cada uma
ao tamanho de pixel real. Aqui cada animação vira uma linha da folha: todos os
quadros apoiados no fundo da célula (a linha do chão) e deslocados na
horizontal para casar com o quadro anterior, assim o corpo não escorrega. O
primeiro quadro de cada animação casa com o Pequi parado da pose-chave, para a
troca de animação também não dar pulo. No fim, a folha inteira vai para uma
paleta só.

Como rodar (precisa de Pillow e numpy):

    python scripts/montar-sprite.py

Para mudar ordem, velocidade ou repetição de uma animação, edite ANIMACOES.
"""

import importlib.util
import json
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "referencias" / "sprite-ia"
FOLHA = RAIZ / "public" / "pequi" / "sprite" / "pequi.png"
DADOS = RAIZ / "src" / "modules" / "pequi" / "data" / "sprite.json"

# nome, quadros por segundo, se repete, ordem dos quadros (índices a partir de 1)
ANIMACOES = [
    ("parado", 4, True, [1, 2, 3, 4, 5, 6]),
    ("caminhada", 10, True, [1, 2, 3, 4, 5, 6]),
    ("pulo", 12, False, [1, 2, 3, 4, 5, 6]),
    ("patada", 12, False, [1, 2, 3, 4, 5, 6]),
    ("dormir", 4, False, [1, 2, 3, 4, 5, 6]),
]
CORES = 16


def carregar(caminho) -> np.ndarray:
    return np.asarray(Image.open(caminho).convert("RGBA"))


def mascara(q: np.ndarray) -> np.ndarray:
    return q[..., 3] > 0


def melhor_deslocamento(ref: np.ndarray, q: np.ndarray, alcance: int = 12) -> int:
    """Quanto mover q na horizontal (ambos apoiados no chão) para cobrir melhor ref."""
    h = max(ref.shape[0], q.shape[0])
    w = max(ref.shape[1], q.shape[1]) + 2 * alcance
    a = np.zeros((h, w), bool)
    a[h - ref.shape[0] :, alcance : alcance + ref.shape[1]] = mascara(ref)
    melhor, melhor_dx = -1.0, 0
    for dx in range(-alcance, alcance + 1):
        b = np.zeros((h, w), bool)
        x0 = alcance + dx
        b[h - q.shape[0] :, x0 : x0 + q.shape[1]] = mascara(q)
        iou = (a & b).sum() / max((a | b).sum(), 1)
        if iou > melhor:
            melhor, melhor_dx = iou, dx
    return melhor_dx


def kmeans(cores: np.ndarray, k: int, voltas: int = 30) -> np.ndarray:
    unicas, peso = np.unique(cores, axis=0, return_counts=True)
    unicas = unicas.astype(float)
    centros = unicas[np.argsort(-peso)[:1]]
    while len(centros) < k:
        d = ((unicas[:, None, :] - centros[None]) ** 2).sum(2).min(1) * peso
        centros = np.vstack([centros, unicas[d.argmax()]])
    for _ in range(voltas):
        rot = ((unicas[:, None, :] - centros[None]) ** 2).sum(2).argmin(1)
        for c in range(k):
            m = rot == c
            if m.any():
                centros[c] = np.average(unicas[m], axis=0, weights=peso[m])
    return np.round(centros).astype(int)


def pixelizar():
    """O outro script tem hífen no nome, então é carregado pelo caminho."""
    spec = importlib.util.spec_from_file_location("pixelizar", Path(__file__).with_name("pixelizar-sprite.py"))
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def montar():
    conversor = pixelizar()
    temp = tempfile.TemporaryDirectory()
    pasta = Path(temp.name)
    conversor.extrair(str(FONTES / "chave.webp"), str(pasta / "chave"), "chave")
    for nome, *_ in ANIMACOES:
        conversor.extrair(str(FONTES / f"{nome}.webp"), str(pasta), nome)
    ref = carregar(pasta / "chave" / "chave-01.png")
    linhas = []  # por animação: lista de (quadro, x relativo à referência)
    for nome, _, _, ordem in ANIMACOES:
        quadros = [carregar(Path(pasta) / f"{nome}-{i:02d}.png") for i in ordem]
        xs = [melhor_deslocamento(ref, quadros[0])]
        for anterior, atual in zip(quadros, quadros[1:]):
            xs.append(xs[-1] + melhor_deslocamento(anterior, atual))
        linhas.append(list(zip(quadros, xs)))

    # célula: cabe todo mundo, com a referência centralizada
    esquerda = min(x for linha in linhas for _, x in linha)
    direita = max(x + q.shape[1] for linha in linhas for q, x in linha)
    altura = max(q.shape[0] for linha in linhas for q, _ in linha)
    meio_ref = ref.shape[1] / 2
    meia = int(np.ceil(max(meio_ref - esquerda, direita - meio_ref))) + 1
    cel_w = int(np.ceil(2 * meia / 8) * 8)
    cel_h = int(np.ceil((altura + 1) / 8) * 8)
    origem = cel_w / 2 - meio_ref  # onde o x=0 da referência cai na célula

    colunas = max(len(linha) for linha in linhas)
    folha = np.zeros((cel_h * len(linhas), cel_w * colunas, 4), np.uint8)
    for r, linha in enumerate(linhas):
        for c, (q, x) in enumerate(linha):
            y0 = r * cel_h + cel_h - q.shape[0]
            x0 = c * cel_w + int(round(origem + x))
            area = folha[y0 : y0 + q.shape[0], x0 : x0 + q.shape[1]]
            m = mascara(q)
            area[m] = q[m]

    # paleta única para a folha inteira
    m = folha[..., 3] > 0
    centros = kmeans(folha[m][:, :3].astype(int), CORES)
    rot = ((folha[m][:, None, :3].astype(int) - centros[None]) ** 2).sum(2).argmin(1)
    folha[m, :3] = centros[rot]
    folha[m, 3] = 255

    FOLHA.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(folha, "RGBA").save(FOLHA, optimize=True)
    dados = {
        "imagem": "/" + FOLHA.relative_to(RAIZ / "public").as_posix(),
        "celula": {"largura": cel_w, "altura": cel_h},
        "animacoes": {
            nome: {"linha": r, "quadros": len(ordem), "fps": fps, "repete": repete}
            for r, (nome, fps, repete, ordem) in enumerate(ANIMACOES)
        },
        "paleta": ["#%02x%02x%02x" % tuple(c) for c in centros],
    }
    DADOS.write_text(json.dumps(dados, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.cleanup()
    print(f"célula {cel_w}x{cel_h}, folha {folha.shape[1]}x{folha.shape[0]}")
    print(f"gravados {FOLHA.relative_to(RAIZ).as_posix()} e {DADOS.relative_to(RAIZ).as_posix()}")


if __name__ == "__main__":
    montar()
