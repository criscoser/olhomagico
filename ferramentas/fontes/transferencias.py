"""
ADAPTADOR: TRANSFERÊNCIAS CONSTITUCIONAIS (Tesouro Nacional).
É o dinheiro que a União repassa ao município por obrigação da Constituição: FPM, FUNDEB, ITR, CIDE, royalties etc.
Confirmado para Videira pelo usuário em 02/10/2026 (a resposta traz CO_IBGE 4219309).

Endereço: {tesouro_transferencias}/por_estado_municipio?p_estado=UF&p_municipio=COD&p_ano=ANO
  UF e COD são códigos PRÓPRIOS desse sistema (SC = 24, Videira = 8379), não os do IBGE.
  A resposta vem em páginas (10 itens por página) e cada página aponta para a próxima ("next").

Campos usados: ANO, MES, TRANSFERENCIA (tipo), VALOR, CO_IBGE. O VALOR pode ser negativo (ajustes e devoluções).
"""
import re
import time
from datetime import date
from urllib.parse import urlparse, parse_qs

from comum import baixar_json, limpar, numero, agora_iso

NOME = "Transferências constitucionais da União (Tesouro Nacional)"
VARIAVEL = "OBS_DADOS_TRANSFERENCIAS"
ARQUIVO = "transferencias.js"
ANOS_PARA_TRAS = 2      # ano atual e os 2 anteriores
LIMITE_PAGINAS = 400    # trava de segurança por ano (10 itens por página)

MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def url_ano(municipio, ano):
    base = municipio["tesouro_transferencias"].rstrip("/")
    return (f"{base}/por_estado_municipio?p_estado={municipio['codigo_uf_tesouro_transferencias']}"
            f"&p_municipio={municipio['codigo_tesouro_transferencias']}&p_ano={ano}")


def minusculas(item):
    """O sistema pode mandar os nomes dos campos em MAIÚSCULAS ou minúsculas: padronizamos em minúsculas."""
    return {str(k).lower(): v for k, v in item.items()} if isinstance(item, dict) else {}


def mes_numero(valor):
    """Aceita 1, "01", "JAN", "Janeiro" ou "01/2025" e devolve o número do mês (1 a 12). Inválido -> None."""
    texto = str(valor if valor is not None else "").strip().lower()
    m = re.match(r"^(\d{1,2})(?:/\d{4})?$", texto)
    if m and 1 <= int(m.group(1)) <= 12:
        return int(m.group(1))
    texto = texto.replace("ç", "c")
    for i, abreviado in enumerate(MESES):
        if texto.startswith(abreviado):
            return i + 1
    return None


def proxima_pagina(resposta, url_atual):
    """Descobre o endereço da próxima página.
    O link "next" pode apontar para um endereço INTERNO do Tesouro (que não abre de fora). Por isso
    copiamos só o parâmetro de página dele ("page" ou "offset") e o aplicamos ao NOSSO endereço."""
    proximo = resposta.get("next")
    if isinstance(proximo, dict):
        proximo = proximo.get("$ref")
    if not proximo:
        for link in resposta.get("links") or []:
            if isinstance(link, dict) and link.get("rel") == "next":
                proximo = link.get("href")
    if not proximo:
        return None
    parametros = parse_qs(urlparse(proximo).query)
    for nome in ("page", "offset"):
        if nome in parametros:
            base = re.sub(rf"&{nome}=[^&]*", "", url_atual)
            return f"{base}&{nome}={parametros[nome][0]}"
    raise ValueError(f"link de próxima página sem parâmetro reconhecido: {proximo[:120]}")


def baixar_ano(municipio, ano, pausa):
    """Percorre todas as páginas de um ano e devolve a lista bruta de itens."""
    url, itens, vistos = url_ano(municipio, ano), [], set()
    for _ in range(LIMITE_PAGINAS):
        if url in vistos:
            raise RuntimeError("a paginação voltou para uma página já lida")
        vistos.add(url)
        time.sleep(pausa)
        resposta = baixar_json(url) or {}
        if not isinstance(resposta, dict) or not isinstance(resposta.get("items", []), list):
            raise ValueError("formato inesperado: falta a lista 'items'")
        itens.extend(resposta.get("items") or [])
        url = proxima_pagina(resposta, url)
        if not url:
            return itens
    raise RuntimeError("número de páginas acima da trava de segurança")


def resumir(item, ano, codigo_ibge):
    """Um item da fonte -> {ano, mes, tipo, valor}. Devolve None se faltar algo essencial ou se for de outro município."""
    it = minusculas(item)
    ibge = re.sub(r"\D", "", str(it.get("co_ibge") or ""))
    if ibge and ibge != str(codigo_ibge):
        return None
    mes, valor, tipo = mes_numero(it.get("mes")), numero(it.get("valor")), limpar(it.get("transferencia"))
    if mes is None or valor is None or not tipo:
        return None
    return {"ano": int(it.get("ano") or ano), "mes": mes, "tipo": tipo, "valor": valor}


def resumo(conteudo):
    """Números curtos para o painel de situação."""
    return {"registros": len(conteudo["registros"])}


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    ano_atual = ano_atual or date.today().year
    registros, descartados, anos = [], 0, []
    for ano in range(ano_atual - ANOS_PARA_TRAS, ano_atual + 1):
        brutos = baixar_ano(municipio, ano, pausa)
        bons = [r for r in (resumir(i, ano, municipio["codigo_ibge"]) for i in brutos) if r]
        descartados += len(brutos) - len(bons)
        if bons:
            anos.append({"ano": ano, "url": url_ano(municipio, ano)})
        registros.extend(bons)
        avisar(f"  transferencias: {ano}: {len(bons)} registro(s)")
    if not registros:
        raise RuntimeError("nenhuma transferência encontrada (resposta vazia)")
    registros.sort(key=lambda r: (r["ano"], r["mes"], r["tipo"]))
    return {
        "meta": {"geradoEm": agora_iso(), "fonte": municipio["tesouro_transferencias"], "anos": anos, "descartados": descartados},
        "registros": registros,
    }
