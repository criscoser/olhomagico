"""
ADAPTADOR: SICONFI (Tesouro Nacional) — Declaração de Contas Anuais (DCA), Anexo I-E: despesa por FUNÇÃO.
"Função" é a grande área do gasto: Saúde, Educação, Urbanismo, Administração...
Confirmado para Videira em 02/10/2026 (exercício 2024: 240 linhas).

Endereço: {siconfi}/dca?an_exercicio=ANO&no_anexo=DCA-Anexo I-E&id_ente=IBGE
Cada linha tem: conta (ex.: "10 - Saúde", "10.301 - Atenção Básica", "FU10 - Demais Subfunções"),
coluna (Despesas Empenhadas, Liquidadas, Pagas, Inscrição de Restos a Pagar...) e valor.
A soma das funções é igual à linha "Despesas Exceto Intraorçamentárias" (conferido com 2024).

REGRA DO PROJETO: empenhado, liquidado e pago são guardados SEPARADOS e nunca somados entre si.
"""
import re
import time
from datetime import date
from urllib.parse import quote

from comum import baixar_json, numero, limpar, agora_iso

NOME = "Despesa por área de governo (SICONFI, contas anuais)"
VARIAVEL = "OBS_DADOS_DCA"
ARQUIVO = "dca.js"
ANEXO = "DCA-Anexo I-E"
ANOS_TENTADOS = 4   # procura os 4 anos anteriores ao atual (a DCA de um ano é entregue até abril do ano seguinte)
ANOS_GUARDADOS = 2  # guarda os 2 mais recentes que existirem

# Nome da coluna na fonte -> nome curto no nosso arquivo.
COLUNAS = {
    "despesas empenhadas": "empenhado",
    "despesas liquidadas": "liquidado",
    "despesas pagas": "pago",
    "inscrição de restos a pagar não processados": "rpNaoProcessados",
    "inscrição de restos a pagar processados": "rpProcessados",
}


def url_ano(municipio, ano):
    return f"{municipio['siconfi'].rstrip('/')}/dca?an_exercicio={ano}&no_anexo={quote(ANEXO)}&id_ente={municipio['codigo_ibge']}"


def classificar(conta):
    """Diz se a conta é função, subfunção, ou um dos totais. Devolve (tipo, codigo, codigo_da_funcao, nome)."""
    conta = str(conta or "").strip()
    m = re.fullmatch(r"(\d{2}) - (.+)", conta)
    if m:
        return "funcao", m.group(1), m.group(1), m.group(2).strip()
    m = re.fullmatch(r"(\d{2})\.(\d{3}) - (.+)", conta)
    if m:
        return "subfuncao", f"{m.group(1)}.{m.group(2)}", m.group(1), m.group(3).strip()
    m = re.fullmatch(r"FU(\d{2}) - (.+)", conta)
    if m:
        return "subfuncao", f"FU{m.group(1)}", m.group(1), m.group(2).strip()
    if re.search(r"exceto intra", conta, re.I):
        return "total", "exceto", None, conta
    if re.search(r"intraor", conta, re.I):
        return "total", "intra", None, conta
    return None, None, None, conta


def extrair(itens):
    """Monta {funcoes: [...], totais: {...}, instituicao}. Cada função traz as subfunções dentro dela.
    Devolve None se não houver nenhuma função reconhecida."""
    funcoes, totais, instituicao = {}, {}, None
    for it in itens:
        coluna = COLUNAS.get(str(it.get("coluna") or "").strip().lower())
        valor = numero(it.get("valor"))
        if not coluna or valor is None:
            continue
        instituicao = instituicao or limpar(it.get("instituicao"))
        tipo, codigo, cod_funcao, nome = classificar(it.get("conta"))
        if tipo == "total":
            totais.setdefault(codigo, {})[coluna] = valor
        elif tipo == "funcao":
            f = funcoes.setdefault(codigo, {"codigo": codigo, "nome": nome, "valores": {}, "subfuncoes": {}})
            f["nome"] = nome
            f["valores"][coluna] = valor
        elif tipo == "subfuncao":
            f = funcoes.setdefault(cod_funcao, {"codigo": cod_funcao, "nome": None, "valores": {}, "subfuncoes": {}})
            s = f["subfuncoes"].setdefault(codigo, {"codigo": codigo, "nome": nome, "valores": {}})
            s["valores"][coluna] = valor
    lista = []
    for f in funcoes.values():
        if not f["nome"]:      # subfunção sem a linha da função: não dá para rotular, então não entra
            continue
        f["subfuncoes"] = sorted(f["subfuncoes"].values(), key=lambda s: -(s["valores"].get("empenhado") or 0))
        lista.append(f)
    if not lista:
        return None
    lista.sort(key=lambda f: -(f["valores"].get("empenhado") or 0))
    return {"instituicao": instituicao, "funcoes": lista, "totais": totais}


def coletar(municipio, pausa=1.0, avisar=print, ano_atual=None):
    ano_atual = ano_atual or date.today().year
    anos = []
    for ano in range(ano_atual - 1, ano_atual - 1 - ANOS_TENTADOS, -1):
        url = url_ano(municipio, ano)
        time.sleep(pausa)
        resposta = baixar_json(url) or {}
        itens = resposta.get("items") or []
        dados = extrair(itens) if itens else None
        avisar(f"  dca: {ano}: {len(itens)} linha(s)" + ("" if dados or not itens else ", formato não reconhecido"))
        if dados:
            anos.append(dict(dados, ano=ano, url=url))
        if len(anos) == ANOS_GUARDADOS:
            break
    if not anos:
        raise RuntimeError("nenhuma DCA encontrada nos últimos anos")
    return {"meta": {"geradoEm": agora_iso(), "fonte": municipio["siconfi"], "anexo": ANEXO}, "anos": anos}
