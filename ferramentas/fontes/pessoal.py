"""
ADAPTADOR: LISTA DE SERVIDORES (API de Pessoal do portal Atende.net da Prefeitura).
Endereço confirmado: {portal_atende}/api/transparencia-pessoal-funcionarios (paginada, 100 por página).
Guarda SÓ o necessário: sem CPF, matrícula, horário, local de trabalho e situação (afastado).
"""
import re
import time

from comum import baixar_json, limpar, numero, agora_iso

NOME = "Lista de servidores (API de Pessoal da Prefeitura)"
VARIAVEL = "OBS_DADOS_PESSOAL"
ARQUIVO = "pessoal.js"
LIMITE_PAGINAS = 200  # trava de segurança


def url_base(municipio):
    return municipio["portal_atende"].rstrip("/") + "/api/transparencia-pessoal-funcionarios"


def mes_ano(data):
    """'15/03/2021' -> '03/2021' (o dia não é necessário)."""
    m = re.fullmatch(r"\s*\d{2}/(\d{2})/(\d{4})\s*", str(data or ""))
    return f"{m.group(1)}/{m.group(2)}" if m else None


def horas(texto):
    """'200:00' -> 200 (horas por mês)."""
    m = re.fullmatch(r"\s*(\d{1,3}):\d{2}\s*", str(texto or ""))
    return int(m.group(1)) if m else None


def resumir(r):
    """Só os campos que o site mostra. CPF, matrícula, horário, local e situação NÃO entram."""
    return {
        "nome": limpar(r.get("nome")),
        "cargo": limpar(r.get("cargo")),
        "funcao": limpar(r.get("funcao")),
        "lotacao": limpar(r.get("centroCusto")),
        "entidade": limpar(r.get("entidade")),
        "vinculo": limpar(r.get("regime")),
        "ingresso": limpar(r.get("formaInvestidura")),
        "desde": mes_ano(r.get("admissao")),
        "salario": numero(r.get("salarioBase")),
        "horasMes": horas(r.get("horasMensais")),
    }


def validar_pagina(dados):
    if not isinstance(dados, dict) or not isinstance(dados.get("registros"), list):
        raise ValueError("formato inesperado: falta a lista 'registros'")
    for campo in ("totalPaginas", "totalRegistros"):
        try:
            int(dados.get(campo))
        except (TypeError, ValueError):
            raise ValueError(f"formato inesperado: '{campo}' ausente ou inválido")


def remover_repetidos(registros):
    """Se a lista mudar durante a cópia, alguém pode aparecer em duas páginas. A matrícula serve
    SÓ para achar repetidos; depois é descartada."""
    vistos, unicos = set(), []
    for r in registros:
        chave = (r.get("entidade"), r.get("matricula")) if r.get("matricula") else None
        if chave and chave in vistos:
            continue
        if chave:
            vistos.add(chave)
        unicos.append(r)
    return unicos


def resumo(conteudo):
    """Números curtos para o painel inicial: total de registros, cargos comissionados e aposentados/pensionistas
    (a lista é do Município inteiro e inclui inativos do instituto de previdência)."""
    lista = conteudo["servidores"]
    vinculo = lambda s: (s.get("vinculo") or "").lower()
    return {"registros": len(lista), "comissionados": sum(1 for s in lista if "comission" in vinculo(s)),
            "inativos": sum(1 for s in lista if "aposentad" in vinculo(s) or "pensionist" in vinculo(s))}


def coletar(municipio, pausa=1.5, avisar=print):
    base = url_base(municipio)
    primeira = baixar_json(f"{base}?pagina=1")
    validar_pagina(primeira)
    total_paginas, total_registros = int(primeira["totalPaginas"]), int(primeira["totalRegistros"])
    if total_paginas > LIMITE_PAGINAS:
        raise RuntimeError(f"{total_paginas} páginas, acima da trava de {LIMITE_PAGINAS}")
    avisar(f"  pessoal: a API informa {total_registros} registros em {total_paginas} páginas")
    brutos = list(primeira["registros"])
    for pagina in range(2, total_paginas + 1):
        time.sleep(pausa)
        dados = baixar_json(f"{base}?pagina={pagina}")
        validar_pagina(dados)
        brutos.extend(dados["registros"])
        avisar(f"  pessoal: página {pagina}/{total_paginas}")
    unicos = remover_repetidos(brutos)
    # A lista pode mudar um pouco durante a cópia, mas não muito: diferença grande = cópia incompleta.
    if abs(len(unicos) - total_registros) > max(5, total_registros // 100):
        raise RuntimeError(f"copiei {len(unicos)} registros, mas a API informou {total_registros}")
    servidores = [s for s in (resumir(r) for r in unicos) if s["nome"]]
    return {
        "meta": {
            "geradoEm": agora_iso(), "fonte": base, "totalInformado": total_registros, "totalCopiado": len(servidores),
            "observacao": "Servidores trabalhando e afastados. Sem CPF, matrícula, horário, local de trabalho e situação.",
        },
        "servidores": servidores,
    }
