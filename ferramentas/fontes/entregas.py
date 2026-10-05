"""
ADAPTADOR: SICONFI (Tesouro Nacional) — Extrato de entregas.
Mostra QUANDO a Prefeitura e a Câmara enviaram cada relatório obrigatório ao Tesouro
(RGF, RREO, DCA, MSC). Confirmado para Videira em 02/10/2026 (2025: 39 registros).

Endereço: {siconfi}/extrato_entregas?id_ente=IBGE&an_referencia=ANO
Campos usados: exercicio, instituicao, entregavel, periodo, periodicidade, status_relatorio, data_status, forma_envio.

O site NÃO afirma se a entrega foi "no prazo": os prazos variam por relatório e por porte do município.
Mostramos só o que a fonte informa (o que foi entregue e quando).
"""
import time
from datetime import date

from comum import baixar_json, limpar, agora_iso

NOME = "Entregas de relatórios ao Tesouro (SICONFI)"
VARIAVEL = "OBS_DADOS_ENTREGAS"
ARQUIVO = "entregas.js"
ANOS_PARA_TRAS = 1   # ano atual e o anterior


def url_ano(municipio, ano):
    return f"{municipio['siconfi'].rstrip('/')}/extrato_entregas?id_ente={municipio['codigo_ibge']}&an_referencia={ano}"


def resumir(it):
    entregavel, instituicao = limpar(it.get("entregavel")), limpar(it.get("instituicao"))
    if not entregavel or not instituicao:
        return None
    periodo = it.get("periodo")
    return {
        "exercicio": it.get("exercicio"),
        "instituicao": instituicao,
        "entregavel": entregavel,
        "periodo": periodo if isinstance(periodo, int) else None,
        "periodicidade": limpar(it.get("periodicidade")),   # M mensal, B bimestral, Q quadrimestral, S semestral, A anual
        "status": limpar(it.get("status_relatorio")),
        "data": limpar(it.get("data_status")),
        "forma": limpar(it.get("forma_envio")),
    }


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    ano_atual = ano_atual or date.today().year
    registros, anos = [], []
    for ano in range(ano_atual, ano_atual - ANOS_PARA_TRAS - 1, -1):
        url = url_ano(municipio, ano)
        time.sleep(pausa)
        resposta = baixar_json(url) or {}
        bons = [r for r in (resumir(i) for i in resposta.get("items") or []) if r]
        avisar(f"  entregas: {ano}: {len(bons)} registro(s)")
        if bons:
            anos.append({"ano": ano, "url": url})
        registros.extend(bons)
    if not registros:
        raise RuntimeError("nenhuma entrega encontrada (resposta vazia)")
    registros.sort(key=lambda r: r["data"] or "", reverse=True)
    return {"meta": {"geradoEm": agora_iso(), "fonte": municipio["siconfi"], "anos": anos}, "registros": registros}
