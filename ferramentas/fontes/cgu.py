"""
ADAPTADOR: Portal da Transparência do Governo Federal (CGU) — dinheiro federal em Videira.
Precisa da chave CGU_CHAVE (cadastro gratuito por e-mail). Ela vai no cabeçalho "chave-api-dados".
Sem a chave, esta fonte é PULADA (o resto do site continua normal).

Testado com a chave do projeto em 02/10/2026 (estrutura conferida pelo script investigar_chaves.py):
  /convenios?codigoIBGE=4219309&pagina=N          convênios com Videira (15 por página, várias páginas)
  /novo-bolsa-familia-por-municipio?codigoIbge=4219309&mesAno=AAAAMM&pagina=1
  /bpc-por-municipio?codigoIbge=4219309&mesAno=AAAAMM&pagina=1

Privacidade: o convenente costuma ser uma entidade (CNPJ). Se for pessoa física, o CPF NÃO é guardado.
Emendas parlamentares ficaram de fora: a consulta /emendas não filtra por município (traria o Brasil inteiro).
"""
import time
from datetime import date

from comum import baixar_json, chave, limpar, numero, agora_iso

NOME = "Convênios e benefícios federais (Portal da Transparência, CGU)"
VARIAVEL = "OBS_DADOS_CGU"
ARQUIVO = "cgu.js"
BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"
LIMITE_PAGINAS = 200   # trava de segurança (15 itens por página)
MESES_BENEFICIOS = 13  # últimos 13 meses (o mês atual quase nunca está publicado)


def _sub(obj, campo):
    """Lê um campo de dentro de um "objeto" da resposta, sem quebrar se ele não existir."""
    return limpar((obj or {}).get(campo)) if isinstance(obj, dict) else None


def resumir_convenio(c):
    dim, orgao, conv = c.get("dimConvenio") or {}, c.get("orgao") or {}, c.get("convenente") or {}
    sub = c.get("subfuncao") or {}
    return {
        "id": c.get("id"),
        "numero": _sub(dim, "numero"),            # número do instrumento original (ex.: "CR.NR.0195006-65")
        "numeroPortal": _sub(dim, "codigo"),      # número que o Portal da Transparência mostra e pesquisa (ex.: "567523")
        "objeto": _sub(dim, "objeto"),
        "situacao": limpar(c.get("situacao")),
        "instrumento": _sub(c.get("tipoInstrumento"), "descricao"),
        "orgao": _sub(orgao, "nome"),
        "orgaoSigla": _sub(orgao, "sigla"),
        "convenente": _sub(conv, "nome") or _sub(conv, "razaoSocialReceita"),
        "convenenteCnpj": _sub(conv, "cnpjFormatado"),          # CPF de pessoa física não é guardado
        "area": _sub(sub, "descricaoSubfuncap") or _sub(sub, "descricaoSubfuncao"),
        "valor": numero(c.get("valor")),                         # valor total do convênio
        "valorLiberado": numero(c.get("valorLiberado")),         # quanto já foi liberado (não somar com o valor)
        "valorContrapartida": numero(c.get("valorContrapartida")),
        "inicioVigencia": limpar(c.get("dataInicioVigencia")),
        "fimVigencia": limpar(c.get("dataFinalVigencia")),
        "publicacao": limpar(c.get("dataPublicacao")),
        "ultimaLiberacao": limpar(c.get("dataUltimaLiberacao")),
    }


def resumir_beneficio(b, programa):
    tipo = b.get("tipo") or {}
    return {
        "programa": programa,
        "referencia": limpar(b.get("dataReferencia")),
        "tipo": _sub(tipo, "descricao"),
        "beneficiados": b.get("quantidadeBeneficiados") if isinstance(b.get("quantidadeBeneficiados"), int) else None,
        "valor": numero(b.get("valor")),
    }


def meses(hoje, n):
    """Lista "AAAAMM" dos n meses anteriores ao mês de hoje, do mais antigo para o mais recente."""
    lista, a, m = [], hoje.year, hoje.month
    for _ in range(n):
        m -= 1
        if m == 0:
            a, m = a - 1, 12
        lista.append(f"{a}{m:02d}")
    return list(reversed(lista))


def coletar(municipio, pausa=1.0, avisar=print, hoje=None, base=None):
    cab = {"chave-api-dados": chave("CGU_CHAVE")}       # sem chave -> SemChave (a fonte é pulada)
    base = (base or municipio.get("cgu") or BASE).rstrip("/")
    ibge = municipio["codigo_ibge"]
    hoje = hoje or date.today()

    convenios, vistos = [], set()
    for pagina in range(1, LIMITE_PAGINAS + 1):
        time.sleep(pausa)
        lote = baixar_json(f"{base}/convenios?codigoIBGE={ibge}&pagina={pagina}", cabecalhos=cab) or []
        if not isinstance(lote, list):
            raise ValueError("formato inesperado em /convenios (era esperada uma lista)")
        novos = [c for c in lote if c.get("id") not in vistos]
        if not novos:
            break
        for c in novos:
            vistos.add(c.get("id"))
            convenios.append(resumir_convenio(c))
    else:
        raise RuntimeError("convênios: número de páginas acima da trava de segurança")
    avisar(f"  cgu: {len(convenios)} convênio(s)")

    beneficios = []
    for programa, caminho in (("Bolsa Família", "novo-bolsa-familia-por-municipio"), ("BPC", "bpc-por-municipio")):
        for mes in meses(hoje, MESES_BENEFICIOS):
            time.sleep(pausa)
            lote = baixar_json(f"{base}/{caminho}?codigoIbge={ibge}&mesAno={mes}&pagina=1", cabecalhos=cab) or []
            if not isinstance(lote, list):
                raise ValueError(f"formato inesperado em /{caminho}")
            beneficios.extend(dict(resumir_beneficio(b, programa), mes=mes) for b in lote)
    avisar(f"  cgu: {len(beneficios)} registro(s) de benefícios")

    if not convenios and not beneficios:
        raise RuntimeError("a CGU não devolveu nada para o município")
    return {
        "meta": {"geradoEm": agora_iso(), "fonte": "Portal da Transparência do Governo Federal (CGU)",
                 "consultaConvenios": f"https://api.portaldatransparencia.gov.br/api-de-dados/convenios?codigoIBGE={ibge}&pagina=1",
                 "portal": "https://portaldatransparencia.gov.br/"},
        "convenios": sorted(convenios, key=lambda c: c["publicacao"] or "", reverse=True),
        "beneficios": beneficios,
    }


def resumo(conteudo):
    return {"convenios": len(conteudo["convenios"]), "beneficios": len(conteudo["beneficios"])}
