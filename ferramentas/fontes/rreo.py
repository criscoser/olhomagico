"""
ADAPTADOR: SICONFI (Tesouro Nacional) — Relatório Resumido da Execução Orçamentária (RREO): RECEITAS do Município.
Toda prefeitura envia o RREO a cada bimestre. Confirmado para Videira em 03/10/2026 (2026, 4º bimestre: 7 anexos).
  Anexo 01: receita PREVISTA para o ano (previsão atualizada) e REALIZADA até o bimestre, por categoria.
  Anexo 03: receitas dos ÚLTIMOS 12 MESES por origem (IPTU, ISS, ITBI, FPM, ICMS...), usadas no cálculo da
            Receita Corrente Líquida. Período diferente do Anexo 01: o site mostra os dois separados.
Endereço: {siconfi}/rreo?an_exercicio=ANO&nr_periodo=BIMESTRE&co_tipo_demonstrativo=RREO&id_ente=IBGE
As linhas são achadas pelo código da conta (cod_conta), que é fixo; o nome só serve para mostrar.
São números DECLARADOS pelo Município ao Tesouro.
"""
import re
import time
from datetime import date

from comum import baixar_json, numero, agora_iso

NOME = "Receitas do Município (RREO, SICONFI)"
VARIAVEL = "OBS_DADOS_RREO"
ARQUIVO = "rreo.js"
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

TOTAL = "ReceitasExcetoIntraOrcamentarias"
CORRENTES, CAPITAL = "ReceitasCorrentes", "ReceitasDeCapital"
# Categorias do Anexo 01 (código da conta -> nome para as pessoas). As que não vierem no relatório não aparecem.
CATEGORIAS = [
    ("ReceitaTributaria", "Impostos, taxas e contribuições de melhoria"),
    ("ReceitaDeContribuicoes", "Contribuições"),
    ("ReceitaPatrimonial", "Receita patrimonial (aplicações, aluguéis, concessões)"),
    ("ReceitaAgropecuaria", "Receita agropecuária"),
    ("ReceitaIndustrial", "Receita industrial"),
    ("ReceitaDeServicos", "Receita de serviços"),
    ("TransferenciasCorrentes", "Transferências recebidas (União, Estado e outros)"),
    ("OutrasReceitasCorrentes", "Outras receitas correntes (multas, indenizações)"),
    (CAPITAL, "Receitas de capital (empréstimos, venda de bens, transferências para obras)"),
]
# Anexo 03, coluna "TOTAL (ÚLTIMOS 12 MESES)".
ORIGENS_12M = [
    ("IPTULiquidoExcetoTransferenciasEFUNDEB", "IPTU", "imposto do Município"),
    ("ISSLiquidoExcetoTransferenciasEFUNDEB", "ISS", "imposto do Município"),
    ("ITBILiquidoExcetoTransferenciasEFUNDEB", "ITBI", "imposto do Município"),
    ("IRRFLiquidoExcetoTransferenciasEFUNDEB", "Imposto de Renda retido pelo Município (IRRF)", "imposto"),
    ("RREO3CotaParteDoFPM", "Fundo de Participação dos Municípios (FPM)", "da União"),
    ("RREO3CotaParteDoICMS", "Parte do ICMS", "do Estado"),
    ("RREO3CotaParteDoIPVA", "Parte do IPVA", "do Estado"),
    ("RREO3TransferenciasDoFUNDEB", "FUNDEB", "fundo da educação"),
]


def url_rreo(municipio, ano, bimestre):
    return (f"{municipio['siconfi'].rstrip('/')}/rreo?an_exercicio={ano}&nr_periodo={bimestre}"
            f"&co_tipo_demonstrativo=RREO&id_ente={municipio['codigo_ibge']}")


def _valor(itens, anexo, cod, coluna_regex):
    for it in itens:
        if it.get("anexo") == anexo and it.get("cod_conta") == cod and re.search(coluna_regex, str(it.get("coluna", "")), re.I):
            return numero(it.get("valor"))
    return None


def periodo_texto(ano, bimestre):
    return f"janeiro a {MESES[2 * bimestre - 1]} de {ano}"


def extrair(itens, ano, bimestre):
    """Tira do RREO as receitas. Devolve None se faltar o essencial ou se a soma não conferir."""
    a1, a3 = "RREO-Anexo 01", "RREO-Anexo 03"
    prev, real = r"^PREVIS[AÃ]O ATUALIZADA", r"^At[eé] o Bimestre"

    def linha(cod, nome):
        return {"codigo": cod, "nome": nome, "previsto": _valor(itens, a1, cod, prev), "realizado": _valor(itens, a1, cod, real)}

    total = linha(TOTAL, "Receitas do Município (sem as internas)")
    correntes, capital = linha(CORRENTES, "Receitas correntes"), _valor(itens, a1, CAPITAL, real)
    if total["realizado"] is None or total["previsto"] is None or correntes["realizado"] is None:
        return None
    # Conferência: correntes + capital = total (ao centavo). Se não bater, não publica.
    if abs(correntes["realizado"] + (capital or 0) - total["realizado"]) > 0.01:
        raise RuntimeError("RREO: receitas correntes + de capital não somam o total; nada foi publicado")
    categorias = [c for c in (linha(cod, nome) for cod, nome in CATEGORIAS) if c["realizado"] is not None or c["previsto"] is not None]
    doze = []
    for cod, nome, origem in ORIGENS_12M:
        v = _valor(itens, a3, cod, r"TOTAL \(?[UÚ]LTIMOS 12 MESES")
        if v is not None:
            doze.append({"codigo": cod, "nome": nome, "origem": origem, "valor": v})
    meses_12 = f"{MESES[(2 * bimestre) % 12]} de {ano - 1 if bimestre < 6 else ano} a {MESES[2 * bimestre - 1]} de {ano}"
    return {"ano": ano, "bimestre": bimestre, "periodo": periodo_texto(ano, bimestre), "periodo12Meses": meses_12,
            "total": total, "correntes": correntes, "categorias": categorias, "ultimos12Meses": doze}


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    """O bimestre mais recente publicado: tenta o ano atual (do 6º ao 1º) e, se não houver, o ano anterior."""
    ano_atual = ano_atual or date.today().year
    for ano in (ano_atual, ano_atual - 1):
        for bimestre in range(6, 0, -1):
            url = url_rreo(municipio, ano, bimestre)
            time.sleep(pausa)
            itens = (baixar_json(url) or {}).get("items") or []
            if not itens:
                continue   # bimestre ainda não enviado: normal
            dados = extrair(itens, ano, bimestre)
            if dados is None:
                avisar(f"  rreo: {bimestre}º bimestre de {ano}: formato não reconhecido, ignorado")
                continue
            avisar(f"  rreo: {dados['periodo']} ({len(dados['categorias'])} categorias, {len(dados['ultimos12Meses'])} origens)")
            return {"meta": {"geradoEm": agora_iso(), "fonte": "SICONFI (Tesouro Nacional), Relatório Resumido da Execução Orçamentária",
                             "portal": "https://siconfi.tesouro.gov.br/", "url": url, "idEnte": municipio["codigo_ibge"]},
                    "receitas": dados}
    raise RuntimeError("nenhum RREO encontrado no ano atual nem no anterior")


def resumo(conteudo):
    r = conteudo["receitas"]
    return {"periodo": r["periodo"], "previsto": r["total"]["previsto"], "realizado": r["total"]["realizado"]}
