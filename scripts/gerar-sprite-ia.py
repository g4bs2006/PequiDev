"""Gera com a OpenAI uma imagem-fonte do sprite do Pequi (pixel art ampliada).

Entrada:  referencias/sprite-ia/prompt-<nome>.txt
Saída:    referencias/sprite-ia/<nome>.webp (sem perda)

A pose-chave ("chave") usa as fotos do Pequi como referência. As animações usam
a pose-chave, para o gato sair igual em todas. Depois de gerar, rode
scripts/montar-sprite.py para refazer a folha.

Como rodar (o Pillow é o único pacote fora da biblioteca padrão):

    $env:OPENAI_API_KEY = "..."          # PowerShell
    python scripts/gerar-sprite-ia.py caminhada

Cada chamada sai diferente da anterior: confira o resultado antes de montar a
folha. A imagem antiga é sobrescrita (o Git guarda a versão anterior).
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
FONTES = RAIZ / "referencias" / "sprite-ia"
FOTOS = [RAIZ / "referencias" / "pequi-folha-referencia.png", RAIZ / "referencias" / "pequi-acordado.png"]
MODELO = "gpt-image-2"
URL = "https://api.openai.com/v1/images/edits"


def multipart(campos: dict[str, str], imagens: list[Path]) -> tuple[bytes, str]:
    limite = uuid.uuid4().hex
    partes: list[bytes] = []
    for nome, valor in campos.items():
        partes.append(
            f'--{limite}\r\nContent-Disposition: form-data; name="{nome}"\r\n\r\n{valor}\r\n'.encode()
        )
    for caminho in imagens:
        # a API aceita PNG; as fontes guardadas em WebP são convertidas na hora
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
    prompt = (FONTES / f"prompt-{nome}.txt").read_text(encoding="utf-8")
    referencias = FOTOS if nome == "chave" else [FONTES / "chave.webp"]

    corpo, tipo = multipart(
        {"model": MODELO, "size": "1536x1024", "quality": "high", "n": "1", "prompt": prompt},
        referencias,
    )
    pedido = urllib.request.Request(
        URL, data=corpo, headers={"Authorization": f"Bearer {chave}", "Content-Type": tipo}
    )
    try:
        with urllib.request.urlopen(pedido, timeout=300) as resposta:
            dados = json.load(resposta)
    except urllib.error.HTTPError as erro:
        sys.exit(f"A OpenAI recusou: {erro.code} {erro.read().decode(errors='replace')}")

    imagem = Image.open(io.BytesIO(base64.b64decode(dados["data"][0]["b64_json"])))
    destino = FONTES / f"{nome}.webp"
    imagem.save(destino, lossless=True, quality=100, method=6)
    print(f"{destino.relative_to(RAIZ)} gravada ({dados.get('usage', {}).get('total_tokens', '?')} tokens)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        nomes = sorted(p.stem.removeprefix("prompt-") for p in FONTES.glob("prompt-*.txt"))
        sys.exit(f"Uso: python scripts/gerar-sprite-ia.py <nome>\nNomes: {', '.join(nomes)}")
    gerar(sys.argv[1])
