"""
ADAPTADOR: SIOPE (FNDE / Ministério da Educação) — Indicadores de gastos com educação.
Exemplo validado pelo usuário em 02/10/2026: Videira aplicou 28,08% das receitas de impostos
em manutenção e desenvolvimento do ensino em 2024 (o mínimo da Constituição é 25%).

Endereço (OData):
  {siope}/Indicadores_Siope(Ano_Consulta=ANO,Num_Peri=BIMESTRE,Sig_UF='UF')?$filter=COD_MUNI eq COD&$format=json
  COD é o código IBGE SEM o último dígito (Videira: 421930). Num_Peri é o bimestre (6 = ano fechado).
Campos usados: NUM_ANO, NUM_PERI, COD_INDI, COD_EXIB, NOM_INDI, NOM_GRUP_INDI, VAL_INDI.

ATENÇÃO: o SIOPE também tem a remuneração NOMINAL dos profissionais da educação. Ela NÃO é copiada aqui:
publicar nomes exige uma decisão do projeto (veja docs/FONTES.md).
"""
import time
from datetime import date
from urllib.parse import quote

from comum import baixar_json, limpar, numero, agora_iso

NOME = "Indicadores de educação (SIOPE, FNDE)"
VARIAVEL = "OBS_DADOS_SIOPE"
ARQUIVO = "siope.js"
ANOS_PARA_TRAS = 2   # ano atual e os 2 anteriores


def url_periodo(municipio, ano, bimestre):
    filtro = quote(f"COD_MUNI eq {municipio['codigo_siope']}")
    return (f"{municipio['siope'].rstrip('/')}/Indicadores_Siope(Ano_Consulta={ano},Num_Peri={bimestre},"
            f"Sig_UF='{municipio['uf']}')?$filter={filtro}&$format=json")


def resumir(it):
    nome, valor = limpar(it.get("NOM_INDI")), numero(it.get("VAL_INDI"))
    if not nome or valor is None:
        return None
    return {"codigo": limpar(it.get("COD_EXIB")) or limpar(it.get("COD_INDI")), "nome": nome,
            "grupo": limpar(it.get("NOM_GRUP_INDI")), "valor": valor}


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    ano_atual = ano_atual or date.today().year
    periodos = []
    for ano in range(ano_atual, ano_atual - ANOS_PARA_TRAS - 1, -1):
        for bimestre in range(6, 0, -1):          # do fim do ano para o começo: fica o mais recente publicado
            url = url_periodo(municipio, ano, bimestre)
            time.sleep(pausa)
            resposta = baixar_json(url) or {}
            if not isinstance(resposta.get("value", []), list):
                raise ValueError("formato inesperado: falta a lista 'value'")
            indicadores = [r for r in (resumir(i) for i in resposta.get("value") or []) if r]
            if indicadores:
                periodos.append({"ano": ano, "bimestre": bimestre, "url": url, "indicadores": indicadores})
                avisar(f"  siope: {ano}, {bimestre}º bimestre: {len(indicadores)} indicador(es)")
                break
    if not periodos:
        raise RuntimeError("nenhum indicador do SIOPE encontrado")
    return {"meta": {"geradoEm": agora_iso(), "fonte": municipio["siope"]}, "periodos": periodos}
