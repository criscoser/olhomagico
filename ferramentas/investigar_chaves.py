"""
INVESTIGADOR DAS FONTES COM CHAVE (Câmara de Videira e CGU) — só para descobrir o FORMATO das respostas.

Não grava nada e não imprime valores: mostra só o código HTTP, quantos itens vieram e os NOMES dos campos.
Com isso o Claude escreve os robôs de verdade sem inventar campos.

Como rodar (PowerShell, dentro da pasta OBS):
  $env:CGU_CHAVE = "cole-a-chave-aqui"
  $env:CAMARA_TOKEN = "cole-o-token-aqui"
  python ferramentas\\investigar_chaves.py

As chaves são lidas do ambiente (nunca ficam escritas em arquivo) e NÃO aparecem na saída.
"""
import json
import os
import re
from urllib.parse import quote
import time
import urllib.error
import urllib.request

UA = "OlhoMagico-robo/0.2 (copia de dados publicos)"
IBGE = "4219309"

# Câmara: endereço e serviços conforme a página de dados abertos da Câmara (camaravideira.sc.gov.br/dadosabertos).
CAMARA = "https://www.camaravideira.sc.gov.br/jsonweb/web-aplicativo.php?keysoft={token}&call={servico}"
SERVICOS_CAMARA = ["vereadores", "proposicoes_tipos", "legislacoes_tipos", "pautas&pagina=1", "publicacoes_tipos&menu=transparencia"]

# CGU: a chave vai no cabeçalho "chave-api-dados" (confirmado na página de cadastro).
# Os endereços abaixo são TENTATIVAS: o objetivo deste script é justamente ver quais respondem para Videira.
CGU = "https://api.portaldatransparencia.gov.br/api-de-dados"
TESTES_CGU = [
    f"/convenios?codigoIBGE={IBGE}&pagina=1",
    f"/convenios?codigoIBGE={IBGE}&pagina=2",          # para ver se a paginação continua
    f"/novo-bolsa-familia-por-municipio?codigoIbge={IBGE}&mesAno=202508&pagina=1",
    f"/bpc-por-municipio?codigoIbge={IBGE}&mesAno=202508&pagina=1",
    "/emendas?ano=2025&pagina=1",
]


def pedir(url, cabecalhos=None):
    req = urllib.request.Request(url, headers=dict({"User-Agent": UA, "Accept": "application/json"}, **(cabecalhos or {})))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # sem conexão, tempo esgotado...
        return None, str(e)


def campos(item):
    """Nomes dos campos de um item; se um campo for um "objeto", mostra também os nomes de dentro dele."""
    if not isinstance(item, dict):
        return type(item).__name__
    partes = []
    for k in sorted(item):
        v = item[k]
        if isinstance(v, dict):
            partes.append(f"{k}{{{', '.join(sorted(v))}}}")
        elif isinstance(v, list) and v and isinstance(v[0], dict):
            partes.append(f"{k}[{{{', '.join(sorted(v[0]))}}}]")
        else:
            partes.append(f"{k}:{type(v).__name__}")
    return ", ".join(partes)


def descrever(texto):
    """Mostra a ESTRUTURA (tipos e nomes de campos), nunca os valores."""
    try:
        dados = json.loads(texto)
    except ValueError:
        return f"não é JSON (começa com: {texto[:60]!r})"
    if isinstance(dados, list):
        return f"lista com {len(dados)} item(ns); campos: {campos(dados[0]) if dados else '-'}"
    if isinstance(dados, dict):
        partes = []
        for k, v in dados.items():
            if isinstance(v, list):
                partes.append(f"{k}: lista com {len(v)} item(ns), campos [{campos(v[0]) if v else '-'}]")
            else:
                partes.append(f"{k}: {type(v).__name__}")
        return "objeto -> " + "; ".join(partes)
    return type(dados).__name__


def main():
    # .strip() tira espaços colados sem querer antes ou depois da chave.
    # Tira QUALQUER espaço ou quebra de linha colada sem querer (até no meio), e protege símbolos como "@"
    # para poderem ir dentro do endereço (quote). Um espaço no endereço causava o erro "control characters".
    token = re.sub(r"\s+", "", os.environ.get("CAMARA_TOKEN") or "")
    chave = re.sub(r"\s+", "", os.environ.get("CGU_CHAVE") or "")
    print("=" * 70)
    print("CÂMARA DE VIDEIRA" + ("" if token else "  (pulado: CAMARA_TOKEN não definido)"))
    if token:
        for s in SERVICOS_CAMARA:
            cod, texto = pedir(CAMARA.format(token=quote(token, safe=''), servico=s))
            print(f"- {s.split('&')[0]}: HTTP {cod} | {descrever(texto)}")
            time.sleep(1)
    print("=" * 70)
    print("CGU (Portal da Transparência federal)" + ("" if chave else "  (pulado: CGU_CHAVE não definida)"))
    if chave:
        for t in TESTES_CGU:
            cod, texto = pedir(CGU + t, {"chave-api-dados": chave})
            print(f"- {t.split('?')[0]} ({t.split('pagina=')[-1] if 'pagina=' in t else ''}): HTTP {cod} | {descrever(texto)}")
            time.sleep(1)
    print("=" * 70)
    print("Pronto. Copie tudo acima e mande para o Claude (não há chaves nem dados pessoais nesta saída).")


if __name__ == "__main__":
    main()
