"""
ADAPTADOR: RESUMO DAS DESPESAS (API de Dados Abertos, Contabilidade, do portal Atende.net da Prefeitura).
Endereço confirmado: {portal_atende}/api/WCPDadosAbertos/despesas?dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
  (as barras vão SEM codificar: "%2F" faz a API responder erro 400).

Por que existe: a API devolve ~800 KB por mês e NÃO é compactada. A página inicial e o gráfico de 12 meses
baixariam ~10 MB no celular. Este robô faz, uma vez por dia, as MESMAS somas que o site faz (js/agregacao.js) e
grava só os totais: 13 meses x órgão x etapa, em poucos KB. A aba "Gastos" continua consultando a API ao vivo para
o detalhe (quem recebeu), quando a pessoa pede.

REGRAS (iguais às do site, para os números baterem):
  - linha válida = empenhado, liquidado e pago são números; as outras são contadas como "descartadas";
  - anulado e retido vazios contam como 0;
  - empenhado, liquidado e pago são guardados SEPARADOS e nunca somados entre si;
  - "credores que receberam" = credores com valor pago POSITIVO, juntados pelo documento (sem ele, pelo nome).
Privacidade: NÃO guarda CPF, CNPJ nem nome de ninguém; só totais e a quantidade de credores.
Abrangência: a API é a contabilidade do MUNICÍPIO inteiro (Prefeitura, Câmara, autarquias, fundação e fundos).
"""
import calendar
import re
import time
from datetime import date

from comum import baixar_json, numero, agora_iso

NOME = "Resumo das despesas por mês (API de despesas da Prefeitura)"
VARIAVEL = "OBS_DADOS_DESPESAS"
ARQUIVO = "despesas-resumo.js"
MESES = 13   # o mês atual (parcial) e os 12 anteriores


def url_mes(municipio, ano, mes):
    ultimo = calendar.monthrange(ano, mes)[1]
    base = municipio["portal_atende"].rstrip("/") + "/api/WCPDadosAbertos/despesas"
    return f"{base}?dataInicial=01/{mes:02d}/{ano}&dataFinal={ultimo:02d}/{mes:02d}/{ano}"


def lista_meses(hoje, n=MESES):
    """[(ano, mes), ...] do mais antigo ao mais recente, terminando no mês de hoje."""
    a, m, saida = hoje.year, hoje.month, []
    for _ in range(n):
        saida.append((a, m))
        m -= 1
        if m == 0:
            a, m = a - 1, 12
    return list(reversed(saida))


def somar(linhas):
    """Mesmas contas de js/agregacao.js. Devolve os totais do mês, por órgão, e as quantidades."""
    total = {"empenhado": 0.0, "liquidado": 0.0, "pago": 0.0, "anulado": 0.0, "retido": 0.0}
    orgaos, credores, descartadas = {}, {}, 0
    for l in linhas:
        if not isinstance(l, dict):
            descartadas += 1
            continue
        emp, liq, pag = numero(l.get("valorEmpenhado")), numero(l.get("valorLiquidado")), numero(l.get("valorPago"))
        if emp is None or liq is None or pag is None:
            descartadas += 1
            continue
        total["empenhado"] += emp; total["liquidado"] += liq; total["pago"] += pag
        total["anulado"] += numero(l.get("valorAnulado")) or 0
        total["retido"] += numero(l.get("valorRetido")) or 0
        nome_orgao = (l.get("orgaoDescricao") or "").strip() or "(órgão não informado)"
        o = orgaos.setdefault(nome_orgao, {"nome": nome_orgao, "empenhado": 0.0, "liquidado": 0.0, "pago": 0.0})
        o["empenhado"] += emp; o["liquidado"] += liq; o["pago"] += pag
        chave = re.sub(r"\D", "", str(l.get("cpfCnpjCredor") or "")) or l.get("nomeCredor") or "(sem nome)"
        credores[chave] = credores.get(chave, 0.0) + pag   # a chave (documento) só serve para contar: não é guardada
    arred = lambda d: {k: (round(v, 2) if isinstance(v, float) else v) for k, v in d.items()}
    return {
        "total": arred(total),
        "orgaos": sorted((arred(o) for o in orgaos.values()), key=lambda o: -o["pago"]),
        "registros": len(linhas),
        "descartadas": descartadas,
        "credoresQueReceberam": sum(1 for v in credores.values() if v > 0),
    }


def resumo(conteudo):
    """Números curtos para o painel de situação."""
    return {"meses": len(conteudo["meses"])}


def coletar(municipio, pausa=3.0, avisar=print, hoje=None):   # o portal pede calma (HTTP 429) se formos rápido
    hoje = hoje or date.today()
    meses = []
    for i, (ano, mes) in enumerate(lista_meses(hoje)):
        if i:
            time.sleep(pausa)
        url = url_mes(municipio, ano, mes)
        resposta = baixar_json(url, timeout=120)
        if not isinstance(resposta, dict) or resposta.get("status") != "ok" or not isinstance(resposta.get("retorno"), list):
            raise ValueError(f"formato inesperado na resposta de {mes:02d}/{ano}")
        s = somar(resposta["retorno"])
        s.update(anoMes=f"{ano}-{mes:02d}", parcial=(ano, mes) == (hoje.year, hoje.month), url=url)
        meses.append(s)
        avisar(f"  despesas: {mes:02d}/{ano}: {s['registros']} registros, pago R$ {s['total']['pago']:,.2f}")
    if not any(m["registros"] for m in meses):
        raise RuntimeError("a API não devolveu despesas em nenhum dos meses")
    return {
        "meta": {"geradoEm": agora_iso(), "fonte": municipio["portal_atende"].rstrip("/") + "/api/WCPDadosAbertos/despesas",
                 "observacao": "Totais do Município (Prefeitura, Câmara, autarquias, fundação e fundos), somados como no site."},
        "meses": meses,
    }
