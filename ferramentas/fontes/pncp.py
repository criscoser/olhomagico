"""
ADAPTADOR: PNCP (Portal Nacional de Contratações Públicas).
Confirmado para Videira em 02/10/2026:
  - Licitações/compras: {pncp}/api/consulta/v1/contratacoes/publicacao?dataInicial=AAAAMMDD&dataFinal=AAAAMMDD
      &codigoModalidadeContratacao=N&codigoMunicipioIbge=IBGE&pagina=P&tamanhoPagina=50
  - Contratos: {pncp}/api/consulta/v1/contratos?dataInicial=...&dataFinal=...&cnpjOrgao=CNPJ&pagina=P
  - Página oficial de cada item (link para pessoas; confirmada no navegador em 03/10/2026):
      compra:   {pncp}/app/editais/{cnpj}/{ano}/{sequencial}
      contrato: {pncp}/app/contratos/{cnpj}/{ano}/{sequencial}
    (os endereços /api/... devolvem JSON, bom para programas e ruim para quem visita o site)
"""
import re
import time
from datetime import date, timedelta

from comum import baixar_json, limpar, numero, mascarar_documento, agora_iso

NOME = "Licitações e contratos (PNCP)"
VARIAVEL = "OBS_DADOS_PNCP"
ARQUIVO = "pncp.js"
MODALIDADES = range(1, 14)   # códigos de modalidade do PNCP (pregão, dispensa, inexigibilidade...)
DIAS = 364                   # últimos 12 meses
POR_PAGINA = 50
LIMITE_PAGINAS = 100         # trava de segurança por consulta


def _paginas(montar_url, tamanho=None, pausa=1.0):
    """Percorre as páginas de uma consulta e devolve todos os itens de "data".
    Para quando acabar (totalPaginas, página vazia ou incompleta)."""
    itens = []
    for pagina in range(1, LIMITE_PAGINAS + 1):
        time.sleep(pausa)
        resposta = baixar_json(montar_url(pagina))
        if not resposta:
            break                                   # HTTP 204 / vazio: acabou
        if not isinstance(resposta, dict) or not isinstance(resposta.get("data", []), list):
            raise ValueError("formato inesperado: falta a lista 'data'")
        dados = resposta.get("data") or []
        itens.extend(dados)
        total = resposta.get("totalPaginas")
        if not dados or (isinstance(total, int) and pagina >= total) or (tamanho and len(dados) < tamanho):
            break
    else:
        raise RuntimeError("número de páginas acima da trava de segurança")
    return itens


def _ano_seq(numero_controle):
    """'83039842000184-1-000003/2026' -> ('2026', '3')."""
    m = re.fullmatch(r"\s*\d{14}-\d+-(\d+)/(\d{4})\s*", str(numero_controle or ""))
    return (m.group(2), str(int(m.group(1)))) if m else (None, None)


def resumir_compra(c, base):
    orgao = c.get("orgaoEntidade") or {}
    cnpj = re.sub(r"\D", "", str(orgao.get("cnpj") or ""))
    ano, seq = c.get("anoCompra"), c.get("sequencialCompra")
    if not (ano and seq):
        ano, seq = _ano_seq(c.get("numeroControlePNCP"))
    return {
        "id": limpar(c.get("numeroControlePNCP")),
        "orgao": limpar(orgao.get("razaoSocial")), "orgaoCnpj": cnpj or None,
        "unidade": limpar((c.get("unidadeOrgao") or {}).get("nomeUnidade")),
        "modalidade": limpar(c.get("modalidadeNome")),
        "objeto": limpar(c.get("objetoCompra")),
        "valorEstimado": numero(c.get("valorTotalEstimado")),
        "valorHomologado": numero(c.get("valorTotalHomologado")),
        "situacao": limpar(c.get("situacaoCompraNome")),
        "dataPublicacao": (limpar(c.get("dataPublicacaoPncp")) or "")[:10] or None,
        "srp": bool(c.get("srp")),
        "url": f"{base}/app/editais/{cnpj}/{ano}/{seq}" if cnpj and ano and seq else None,
    }


def resumir_contrato(c, base):
    orgao = c.get("orgaoEntidade") or {}
    cnpj = re.sub(r"\D", "", str(orgao.get("cnpj") or ""))
    ano, seq = c.get("anoContrato"), c.get("sequencialContrato")
    if not (ano and seq):
        ano, seq = _ano_seq(c.get("numeroControlePNCP"))
    tipo_pessoa = limpar(c.get("tipoPessoa"))
    return {
        "id": limpar(c.get("numeroControlePNCP")),
        "orgao": limpar(orgao.get("razaoSocial")), "orgaoCnpj": cnpj or None,
        "fornecedor": limpar(c.get("nomeRazaoSocialFornecedor")),
        "fornecedorDoc": mascarar_documento(c.get("niFornecedor")),   # CPF sai mascarado
        "tipoPessoa": tipo_pessoa,
        "objeto": limpar(c.get("objetoContrato")),
        "valorInicial": numero(c.get("valorInicial")),
        "valorGlobal": numero(c.get("valorGlobal")),
        "dataAssinatura": limpar(c.get("dataAssinatura")),
        "vigenciaInicio": limpar(c.get("dataVigenciaInicio")),
        "vigenciaFim": limpar(c.get("dataVigenciaFim")),
        "tipo": limpar((c.get("tipoContrato") or {}).get("nome")),
        "categoria": limpar((c.get("categoriaProcesso") or {}).get("nome")),
        "compraId": limpar(c.get("numeroControlePncpCompra")),
        "url": f"{base}/app/contratos/{cnpj}/{ano}/{seq}" if cnpj and ano and seq else None,
    }


def resumo(conteudo):
    """Números curtos para o painel inicial."""
    return {"compras": len(conteudo["compras"]), "contratos": len(conteudo["contratos"]),
            "valorGlobal": round(sum(c["valorGlobal"] or 0 for c in conteudo["contratos"]), 2),
            "periodo": conteudo["meta"]["periodo"]}


def coletar(municipio, pausa=2.5, avisar=print, hoje=None):   # PNCP limita consultas: vamos mais devagar
    base = municipio["pncp"].rstrip("/")
    hoje = hoje or date.today()
    ini, fim = (hoje - timedelta(days=DIAS)).strftime("%Y%m%d"), hoje.strftime("%Y%m%d")

    compras = {}
    for mod in MODALIDADES:
        avisar(f"  pncp: licitações da modalidade {mod} de {len(MODALIDADES)}")   # mostra que não travou
        url = lambda p, mod=mod: (f"{base}/api/consulta/v1/contratacoes/publicacao?dataInicial={ini}&dataFinal={fim}"
                                  f"&codigoModalidadeContratacao={mod}&codigoMunicipioIbge={municipio['codigo_ibge']}"
                                  f"&pagina={p}&tamanhoPagina={POR_PAGINA}")
        for c in _paginas(url, POR_PAGINA, pausa):
            r = resumir_compra(c, base)
            if r["id"]:
                compras[r["id"]] = r          # o número de controle evita repetidos
    avisar(f"  pncp: {len(compras)} licitações/compras")

    # Contratos: consultamos o CNPJ do município e o de cada órgão que apareceu nas compras (fundos, autarquias...).
    cnpjs = sorted({municipio["cnpj"]} | {c["orgaoCnpj"] for c in compras.values() if c["orgaoCnpj"]})
    contratos = {}
    for i, cnpj in enumerate(cnpjs, 1):
        avisar(f"  pncp: contratos do órgão {i} de {len(cnpjs)} (CNPJ {cnpj[:2]}.{cnpj[2:5]}...)")   # mostra que não travou
        url = lambda p, cnpj=cnpj: (f"{base}/api/consulta/v1/contratos?dataInicial={ini}&dataFinal={fim}"
                                    f"&cnpjOrgao={cnpj}&pagina={p}")
        for c in _paginas(url, None, pausa):
            r = resumir_contrato(c, base)
            if r["id"]:
                contratos[r["id"]] = r
    avisar(f"  pncp: {len(contratos)} contratos ({len(cnpjs)} órgão(s) consultado(s))")

    return {
        "meta": {"geradoEm": agora_iso(), "fonte": base, "periodo": {"inicio": ini, "fim": fim}, "orgaosConsultados": cnpjs},
        "compras": sorted(compras.values(), key=lambda c: c["dataPublicacao"] or "", reverse=True),
        "contratos": sorted(contratos.values(), key=lambda c: c["dataAssinatura"] or "", reverse=True),
    }
