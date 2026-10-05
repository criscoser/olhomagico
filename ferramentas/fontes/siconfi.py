"""
ADAPTADOR: SICONFI (Tesouro Nacional) — Relatório de Gestão Fiscal (RGF).
Toda prefeitura é obrigada a enviar o RGF. O Anexo 01 traz a Despesa Total com Pessoal (DTP)
e os limites da Lei de Responsabilidade Fiscal (LRF). Confirmado para Videira em 02/10/2026.

Endereço: {siconfi}/rgf?an_exercicio=ANO&in_periodicidade=Q|S&nr_periodo=N&co_tipo_demonstrativo=RGF&co_poder=E|L&id_ente=IBGE
  co_poder E = Prefeitura (Poder Executivo, limite máximo 54%); L = Câmara (Poder Legislativo, limite máximo 6%).
"""
import re
import time

from comum import baixar_json, numero, agora_iso

NOME = "Gasto com pessoal e limites da LRF (SICONFI, Tesouro Nacional)"
VARIAVEL = "OBS_DADOS_SICONFI"
ARQUIVO = "siconfi.js"
PODERES = {"E": "Prefeitura (Poder Executivo)", "L": "Câmara de Vereadores (Poder Legislativo)"}
ANOS_PARA_TRAS = 2  # ano atual e os 2 anteriores


def url_rgf(municipio, ano, periodicidade, periodo, poder):
    return (f"{municipio['siconfi'].rstrip('/')}/rgf?an_exercicio={ano}&in_periodicidade={periodicidade}"
            f"&nr_periodo={periodo}&co_tipo_demonstrativo=RGF&co_poder={poder}&id_ente={municipio['codigo_ibge']}")


def _valor(itens, padrao_conta, padrao_coluna):
    """Procura no Anexo 01 a linha cuja conta e coluna batem com os padrões e devolve o valor."""
    for it in itens:
        if "01" not in str(it.get("anexo", "")):
            continue
        if re.search(padrao_conta, str(it.get("conta", "")), re.I) and re.search(padrao_coluna, str(it.get("coluna", "")), re.I):
            return numero(it.get("valor"))
    return None


def extrair(itens):
    """Tira do RGF os números do indicador. Devolve None se faltar o essencial (DTP % e limite máximo %)."""
    dtp = r"^DESPESA TOTAL COM PESSOAL\s*-\s*DTP"
    pct, val = r"%", r"^\s*valor\s*$"
    dados = {
        "dtp": _valor(itens, dtp, val),
        "dtpPct": _valor(itens, dtp, pct),
        "rclAjustada": _valor(itens, r"RECEITA CORRENTE L[IÍ]QUIDA AJUSTADA", val),
        "limiteMaximo": _valor(itens, r"^LIMITE M[AÁ]XIMO", val),
        "limiteMaximoPct": _valor(itens, r"^LIMITE M[AÁ]XIMO", pct),
        "limitePrudencialPct": _valor(itens, r"^LIMITE PRUDENCIAL", pct),
        "limiteAlertaPct": _valor(itens, r"^LIMITE DE ALERTA", pct),
    }
    if dados["dtpPct"] is None or dados["limiteMaximoPct"] is None:
        return None
    return dados


def rotulo(periodicidade, periodo, ano):
    nome = "quadrimestre" if periodicidade == "Q" else "semestre"
    return f"{periodo}º {nome} de {ano}"


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    from datetime import date
    ano_atual = ano_atual or date.today().year
    resultado = {"meta": {"geradoEm": agora_iso(), "fonte": municipio["siconfi"], "idEnte": municipio["codigo_ibge"]}, "poderes": {}}
    for poder, nome_poder in PODERES.items():
        periodos = []
        for ano in range(ano_atual - ANOS_PARA_TRAS, ano_atual + 1):
            for periodicidade, total in (("Q", 3), ("S", 2)):  # tenta quadrimestral; se o ano não tiver, semestral
                achou = False
                for p in range(1, total + 1):
                    url = url_rgf(municipio, ano, periodicidade, p, poder)
                    time.sleep(pausa)
                    resposta = baixar_json(url) or {}
                    itens = resposta.get("items") or []
                    if not itens:
                        continue  # período ainda não publicado: normal, não é erro
                    achou = True
                    numeros = extrair(itens)
                    if numeros is None:
                        avisar(f"  siconfi: {nome_poder} {rotulo(periodicidade, p, ano)}: formato não reconhecido, ignorado")
                        continue
                    periodos.append(dict(numeros, ano=ano, periodo=p, periodicidade=periodicidade,
                                         rotulo=rotulo(periodicidade, p, ano), url=url))
                if achou:
                    break
        avisar(f"  siconfi: {nome_poder}: {len(periodos)} período(s)")
        resultado["poderes"][poder] = {"nome": nome_poder, "periodos": periodos}
    if not any(v["periodos"] for v in resultado["poderes"].values()):
        raise RuntimeError("nenhum período do RGF encontrado (resposta vazia)")
    return resultado
