#!/usr/bin/env python3
"""
CONFERÊNCIA DO PIX ANTES DE PUBLICAR (último passo do robô de publicação).

Compara a "impressão digital" (SHA-256) do código Pix Copia e Cola que VAI PARA O AR com a impressão guardada
FORA do repositório, no Secret PIX_SHA256 do GitHub. Se forem diferentes, o site NÃO é publicado.

Por que fora do repositório? Quem conseguir trocar o código no repositório também trocaria uma impressão guardada
nele, no mesmo commit. O Secret fica fora dos arquivos: trocar o código não troca a referência.
O que isto NÃO protege: quem controla a conta dona do repositório (pode editar este passo ou o Secret).

Regras:
  - Secret ausente: aviso amarelo e publica (o mantenedor ainda não cadastrou o Secret).
  - Secret presente e código diferente (ou ausente, ou repetido): ERRO e NÃO publica.
  - A impressão digital NUNCA é escrita no registro (log).

Uso: PIX_SHA256=... python ferramentas/conferir_pix.py _site
"""
import hashlib
import hmac
import os
import re
import sys
from pathlib import Path


def extrair_codigo(texto_config):
    """Devolve o código Pix do js/config.js, ou None se não houver exatamente um."""
    achados = re.findall(r"PIX_COPIA_E_COLA:\s*'([^'\\]*)'", texto_config)
    return achados[0] if len(achados) == 1 else None


def conferir(pasta_site, esperado):
    """Devolve (codigo_de_saida, mensagem). 0 = pode publicar; 1 = não publicar."""
    esperado = (esperado or "").strip().lower()
    if not esperado:
        return 0, "::warning::Secret PIX_SHA256 não cadastrado: a conferência do Pix foi pulada (veja REGRAS_INVIOLAVEIS.md)."
    config = Path(pasta_site) / "js" / "config.js"
    if not config.exists():
        return 1, "::error::js/config.js não está na pasta que vai para o ar."
    codigo = extrair_codigo(config.read_text(encoding="utf-8"))
    if codigo is None:
        return 1, "::error::Não encontrei exatamente um PIX_COPIA_E_COLA em js/config.js. Publicação bloqueada."
    atual = hashlib.sha256(codigo.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(atual, esperado):
        return 1, "::error::O código Pix que iria para o ar é DIFERENTE do registrado no Secret PIX_SHA256. Publicação bloqueada."
    return 0, "Pix conferido: o código que vai para o ar é o registrado no Secret."


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    saida, mensagem = conferir(sys.argv[1], os.environ.get("PIX_SHA256"))
    print(mensagem)
    sys.exit(saida)
