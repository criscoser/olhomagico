#!/usr/bin/env python3
"""
RECUPERA A ÚLTIMA VERSÃO PUBLICADA DOS DADOS (usado pelo robô do GitHub antes de atualizar as fontes).

Por que existe: se uma fonte falhar hoje, o site continua com o arquivo de ontem. Mas os arquivos dados/*.js
são EXECUTADOS pelo navegador. Se um arquivo com código malicioso fosse publicado uma única vez, simplesmente
copiá-lo de volta todo dia faria esse código se perpetuar. Por isso, cada arquivo baixado é lido como DADO PURO
(o formato "window.VARIAVEL = {json};") e REGRAVADO DO ZERO pelo mesmo gravador dos robôs. Qualquer coisa que
não seja o dado é descartada; arquivo que não for dado válido é ignorado.

Como rodar (dentro da pasta do projeto):
  python ferramentas/recuperar.py --lista                     -> nomes dos arquivos que podem ser recuperados
  python ferramentas/recuperar.py recuperados dados           -> lê de "recuperados/" e grava limpo em "dados/"
"""
import sys
from pathlib import Path

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA))

from comum import gravar_js, ler_js  # noqa: E402
from atualizar import FONTES, VARIAVEL_SITUACAO  # noqa: E402

# Arquivo -> nome da variável. Vem dos próprios adaptadores: incluiu uma fonte nova, ela entra aqui sozinha.
ARQUIVOS = dict({m.ARQUIVO: m.VARIAVEL for m in FONTES.values()}, **{"situacao.js": VARIAVEL_SITUACAO})


def valido(conteudo, variavel):
    """Dado com o formato esperado: um objeto; nas fontes, com o bloco "meta" (o de situação não tem)."""
    if not isinstance(conteudo, dict):
        return False
    return variavel == VARIAVEL_SITUACAO or isinstance(conteudo.get("meta"), dict)


def recuperar(origem, destino, avisar=print):
    """Para cada arquivo conhecido: lê de "origem" como dado puro e regrava limpo em "destino".
    Devolve {arquivo: 'recuperado' | 'descartado' | 'ausente'}. Arquivos desconhecidos são ignorados."""
    origem, destino = Path(origem), Path(destino)
    resultado = {}
    for arquivo, variavel in ARQUIVOS.items():
        caminho = origem / arquivo
        if not caminho.exists():
            resultado[arquivo] = "ausente"
            avisar(f"Sem versão anterior de {arquivo} (normal na primeira publicação)")
            continue
        conteudo = ler_js(caminho, variavel)
        if not valido(conteudo, variavel):
            resultado[arquivo] = "descartado"
            avisar(f"DESCARTADO: {arquivo} não é um arquivo de dados válido (não será publicado de novo)")
            continue
        gravar_js(destino / arquivo, variavel, conteudo)   # regravado do zero: só o dado
        resultado[arquivo] = "recuperado"
        avisar(f"Recuperado (regravado como dado puro): {arquivo}")
    return resultado


if __name__ == "__main__":
    if sys.argv[1:] == ["--lista"]:
        print(" ".join(ARQUIVOS))
    elif len(sys.argv) == 3:
        recuperar(sys.argv[1], sys.argv[2])
    else:
        print(__doc__)
        sys.exit(2)
