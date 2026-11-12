"""Gera com a OpenAI uma pose do Pequi em foto realista (as reações de meme).

Entrada:  referencias/poses/base.txt (identidade do Pequi e regras comuns)
          referencias/poses/prompt-<nome>.txt (a pose)
Saída:    referencias/poses/<nome>.webp (fonte, sem perda)
          public/pequi/poses/<nome>.webp (versão para o site)

As fotos de referência do Pequi vão junto no pedido, para o gato sair igual.
O catálogo das poses está em docs/poses-do-pequi.md.

Como rodar (o Pillow é o único pacote fora da biblioteca padrão):

    $env:OPENAI_API_KEY = "..."          # PowerShell
    python scripts/gerar-pose-ia.py bravo

Cada chamada sai diferente da anterior e gasta crédito da chave: confira o
resultado antes de gerar a próxima. A imagem antiga é sobrescrita (o Git guarda
a versão anterior).
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "referencias" / "poses"
SITE = RAIZ / "public" / "pequi" / "poses"
FOTOS = [RAIZ / "referencias" / "pequi-acordado.png", RAIZ / "referencias" / "pequi-folha-referencia.png"]
MODELO = "gpt-image-2"
URL = "https://api.openai.com/v1/images/edits"
TAMANHO = "1024x1024"
LARGURA_SITE = 1024


def multipart(campos: dict[str, str], imagens: list[Path]) -> tuple[bytes, str]:
    limite = uuid.uuid4().hex
    partes: list[bytes] = []
    for nome, valor in campos.items():
        partes.append(
            f'--{limite}\r\nContent-Disposition: form-data; name="{nome}"\r\n\r\n{valor}\r\n'.encode()
        )
    for caminho in imagens:
        buffer = io.BytesIO()
        Image.open(caminho).convert("RGB").save(buffer, "PNG")
        partes.append(
            (
                f"--{limite}\r\nContent-Disposition: form-data; "
                f'name="image[]"; filename="{caminho.stem}.png"\r\n'
                "Content-Type: image/png\r\n\r\n"
            ).encode()
            + buffer.getvalue()
            + b"\r\n"
        )
    partes.append(f"--{limite}--\r\n".encode())
    return b"".join(partes), f"multipart/form-data; boundary={limite}"


def gerar(nome: str) -> None:
    chave = os.environ.get("OPENAI_API_KEY")
    if not chave:
        sys.exit("Defina OPENAI_API_KEY antes de rodar.")

    base = (FONTES / "base.txt").read_text(encoding="utf-8").strip()
    pose = (FONTES / f"prompt-{nome}.txt").read_text(encoding="utf-8").strip()

    corpo, tipo = multipart(
        {"model": MODELO, "size": TAMANHO, "quality": "high", "n": "1", "prompt": f"{base}\n\n{pose}"},
        FOTOS,
    )
    pedido = urllib.request.Request(
        URL, data=corpo, headers={"Authorization": f"Bearer {chave}", "Content-Type": tipo}
    )
    try:
        with urllib.request.urlopen(pedido, timeout=300) as resposta:
            dados = json.load(resposta)
    except urllib.error.HTTPError as erro:
        sys.exit(f"A OpenAI recusou: {erro.code} {erro.read().decode(errors='replace')}")

    imagem = Image.open(io.BytesIO(base64.b64decode(dados["data"][0]["b64_json"]))).convert("RGB")

    fonte = FONTES / f"{nome}.webp"
    imagem.save(fonte, lossless=True, quality=100, method=6)

    SITE.mkdir(parents=True, exist_ok=True)
    site = SITE / f"{nome}.webp"
    web = imagem if imagem.width <= LARGURA_SITE else imagem.resize(
        (LARGURA_SITE, round(imagem.height * LARGURA_SITE / imagem.width)), Image.LANCZOS
    )
    web.save(site, quality=82, method=6)

    tokens = dados.get("usage", {}).get("total_tokens", "?")
    print(f"{fonte.relative_to(RAIZ)} e {site.relative_to(RAIZ)} gravadas ({tokens} tokens)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        nomes = sorted(p.stem.removeprefix("prompt-") for p in FONTES.glob("prompt-*.txt"))
        sys.exit(f"Uso: python scripts/gerar-pose-ia.py <nome>\nNomes: {', '.join(nomes)}")
    gerar(sys.argv[1])
