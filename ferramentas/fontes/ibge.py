"""
ADAPTADOR: IBGE (SIDRA) — números do município: população, área, densidade e PIB.
Tabelas confirmadas em 03/10/2026, todas com dado no nível MUNICIPAL (N6):
  4714  Censo 2022: população residente (v 93), área (v 6318, km²), densidade (v 614, hab/km²)
  6579  População residente ESTIMADA, anual (v 9324)
  5938  PIB dos Municípios: PIB (v 37, mil reais), participação no PIB do estado (v 497, %),
        valor adicionado total (v 498) e por setor: agropecuária (513), indústria (517),
        serviços sem administração pública (6575), administração pública (525). Impostos sobre produtos (543).
  ATENÇÃO: a tabela 6784 (PIB per capita) só tem o Brasil inteiro (N1); não serve para município.
  O detalhe por setor sai ~2 anos depois do total: cada número guarda o SEU ano.
Endereço: {sidra}/t/TABELA/n6/CODIGO_IBGE/v/VARIAVEIS/p/PERIODO
O SIDRA escreve "...", "-", "X" quando não há dado: aqui vira null, NUNCA zero.
"""
import time

from comum import baixar_json, agora_iso

NOME = "Números do município (IBGE, SIDRA)"
VARIAVEL = "OBS_DADOS_IBGE"
ARQUIVO = "ibge.js"
SIDRA_PADRAO = "https://apisidra.ibge.gov.br/values"

# chave: (tabela, variável, nome para as pessoas, unidade, multiplicador para chegar à unidade)
INDICADORES = {
    "populacaoCenso": ("4714", "93", "População (Censo)", "pessoas", 1),
    "area": ("4714", "6318", "Área do município", "km²", 1),
    "densidade": ("4714", "614", "Densidade demográfica", "habitantes por km²", 1),
    "populacaoEstimada": ("6579", "9324", "População estimada", "pessoas", 1),
    "pib": ("5938", "37", "PIB do município", "reais", 1000),
    "participacaoPibEstado": ("5938", "497", "Participação no PIB de Santa Catarina", "%", 1),
    "valorAdicionado": ("5938", "498", "Valor adicionado total", "reais", 1000),
    "vaAgropecuaria": ("5938", "513", "Agropecuária", "reais", 1000),
    "vaIndustria": ("5938", "517", "Indústria", "reais", 1000),
    "vaServicos": ("5938", "6575", "Serviços (sem administração pública)", "reais", 1000),
    "vaAdministracao": ("5938", "525", "Administração, educação, saúde e seguridade públicas", "reais", 1000),
    "impostosProdutos": ("5938", "543", "Impostos sobre produtos (menos subsídios)", "reais", 1000),
}
SETORES = ["vaAgropecuaria", "vaIndustria", "vaServicos", "vaAdministracao"]
PERIODOS = {"4714": "all", "6579": "last%203", "5938": "all"}   # PIB: a série inteira (2002 em diante), para o seletor de anos


def valor_sidra(texto):
    """'4129523' -> 4129523.0; '384.127' -> 384.127; '...', '-', 'X', '' -> None (sem dado, não é zero)."""
    try:
        return float(str(texto).strip())
    except (TypeError, ValueError):
        return None


def url_tabela(base, tabela, codigo, variaveis):
    return f"{base.rstrip('/')}/t/{tabela}/n6/{codigo}/v/{','.join(variaveis)}/p/{PERIODOS[tabela]}"


def mais_recente(linhas, variavel):
    """Da resposta do SIDRA, o valor mais recente (com dado) de uma variável: (ano, valor) ou (None, None)."""
    melhor = (None, None)
    for linha in linhas:
        if str(linha.get("D2C")) != variavel:
            continue
        v, ano = valor_sidra(linha.get("V")), str(linha.get("D3C") or "")
        if v is not None and ano.isdigit() and (melhor[0] is None or ano > melhor[0]):
            melhor = (ano, v)
    return melhor


def serie_pib(linhas):
    """PIB ano a ano (seletor de anos do site), da tabela 5938: [{ano, pib, participacaoEstado, setores, valorAdicionado,
    impostosProdutos}], do mais antigo ao mais novo. Valores em reais (a tabela vem em mil reais). Ano sem PIB fica de fora.
    Os setores de um ano só entram se os 4 existirem e somarem o valor adicionado daquele ano (folga de 2 mil reais)."""
    por_ano = {}
    for linha in linhas:
        ano, var, v = str(linha.get("D3C") or ""), str(linha.get("D2C")), valor_sidra(linha.get("V"))
        if ano.isdigit() and v is not None:
            por_ano.setdefault(int(ano), {})[var] = v
    serie = []
    for ano in sorted(por_ano):
        d = por_ano[ano]
        if "37" not in d:
            continue
        item = {"ano": ano, "pib": round(d["37"] * 1000, 2)}
        if "497" in d:
            item["participacaoEstado"] = d["497"]
        cods = {k: INDICADORES[k][1] for k in SETORES}
        if all(c in d for c in cods.values()) and "498" in d and abs(sum(d[c] for c in cods.values()) - d["498"]) <= 2:
            item["setores"] = {k: round(d[c] * 1000, 2) for k, c in cods.items()}
            item["valorAdicionado"] = round(d["498"] * 1000, 2)
            if "543" in d:
                item["impostosProdutos"] = round(d["543"] * 1000, 2)
        serie.append(item)
    return serie


def montar(respostas, urls, avisar=print):
    """respostas: {tabela: lista do SIDRA (a 1ª linha é o cabeçalho)}. Devolve os indicadores, com ano e fonte."""
    indicadores = {}
    for chave, (tabela, variavel, nome, unidade, mult) in INDICADORES.items():
        ano, v = mais_recente((respostas.get(tabela) or [])[1:], variavel)
        if v is None:
            continue   # sem dado: o indicador não aparece (nada de zero)
        indicadores[chave] = {"nome": nome, "valor": round(v * mult, 2), "unidade": unidade, "ano": int(ano),
                              "tabela": tabela, "variavel": variavel, "url": urls[tabela]}
    # Conferência: os 4 setores do mesmo ano têm de somar o valor adicionado total (em mil reais, com folga de 2
    # por causa do arredondamento). Se não somarem, o detalhe por setor fica de fora.
    # Também saem os setores se faltar algum, se forem de anos diferentes ou se o total não for do mesmo ano.
    setores = [indicadores.get(s) for s in SETORES]
    total = indicadores.get("valorAdicionado")
    confere = (all(setores) and total is not None and {s["ano"] for s in setores} == {total["ano"]}
               and abs(sum(s["valor"] for s in setores) - total["valor"]) <= 2000)
    if not confere:
        if any(setores):
            avisar("  ibge: detalhe por setor incompleto ou não soma o valor adicionado; removido")
        for s in SETORES + ["valorAdicionado"]:
            indicadores.pop(s, None)
    return indicadores


def coletar(municipio, pausa=1.0, avisar=print):
    base = municipio.get("sidra") or SIDRA_PADRAO
    codigo = municipio["codigo_ibge"]
    respostas, urls = {}, {}
    for tabela in PERIODOS:
        variaveis = [v for (t, v, *_resto) in INDICADORES.values() if t == tabela]
        urls[tabela] = url_tabela(base, tabela, codigo, variaveis)
        time.sleep(pausa)
        respostas[tabela] = baixar_json(urls[tabela]) or []
    indicadores = montar(respostas, urls, avisar)
    if "populacaoCenso" not in indicadores or "pib" not in indicadores:
        raise RuntimeError("o IBGE não devolveu população e PIB do município")
    avisar(f"  ibge: {len(indicadores)} indicador(es)")
    serie = serie_pib((respostas.get("5938") or [])[1:])
    avisar(f"  ibge: PIB de {len(serie)} ano(s), {sum(1 for s in serie if 'setores' in s)} com setores")
    return {"meta": {"geradoEm": agora_iso(), "fonte": "IBGE, SIDRA (Sistema IBGE de Recuperação Automática)",
                     "portal": "https://sidra.ibge.gov.br/", "codigoIbge": codigo, "urlPib": urls["5938"]},
            "indicadores": indicadores, "pibAnual": serie}


def resumo(conteudo):
    i = conteudo["indicadores"]
    return {k: {"valor": i[k]["valor"], "ano": i[k]["ano"]} for k in ("populacaoEstimada", "pib") if k in i}
