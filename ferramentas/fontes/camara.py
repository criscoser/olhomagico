"""
ADAPTADOR: Câmara Municipal de Videira — API de dados abertos (camaravideira.sc.gov.br/dadosabertos).
Precisa do token CAMARA_TOKEN (aparece na própria página de dados abertos da Câmara).
Sem o token, esta fonte é PULADA (o resto do site continua normal).

Endereço: https://www.camaravideira.sc.gov.br/jsonweb/web-aplicativo.php?keysoft=TOKEN&call=SERVIÇO
Testado em 02/10/2026 (estrutura conferida pelo script investigar_chaves.py):
  call=vereadores         lista: nome, partido, funcao, imagem, link
  call=pautas&pagina=N    lista (50 por página): data, titulo, link

CUIDADO: o token vai DENTRO do endereço. Por isso nenhum endereço de consulta é gravado no arquivo publicado;
só os links públicos que a própria Câmara devolve (campo "link").
"""
import time
from urllib.parse import quote

from comum import baixar_json, chave, limpar, agora_iso

NOME = "Câmara de Vereadores (API de dados abertos da Câmara)"
VARIAVEL = "OBS_DADOS_CAMARA"
ARQUIVO = "camara.js"
BASE = "https://www.camaravideira.sc.gov.br/jsonweb/web-aplicativo.php"
PAGINAS_PAUTAS = 4    # 4 páginas x 50 = as 200 pautas mais recentes


def _lista(resposta, servico):
    if resposta is None:
        return []
    if not isinstance(resposta, list):
        raise ValueError(f"formato inesperado em '{servico}' (era esperada uma lista)")
    return resposta


def link_publico(valor):
    """Só aceita links http(s) da própria Câmara devolvidos pela API."""
    v = limpar(valor)
    return v if v and v.startswith(("http://", "https://")) else None


def coletar(municipio, pausa=1.0, avisar=print, base=None):
    token = quote(chave("CAMARA_TOKEN"), safe="")       # sem token -> SemChave (a fonte é pulada)
    base = base or municipio.get("camara_api") or BASE
    url = lambda servico: f"{base}?keysoft={token}&call={servico}"

    time.sleep(pausa)
    vereadores = [{"nome": limpar(v.get("nome")), "partido": limpar(v.get("partido")), "funcao": limpar(v.get("funcao")),
                   "link": link_publico(v.get("link"))}
                  for v in _lista(baixar_json(url("vereadores")), "vereadores") if limpar(v.get("nome"))]
    avisar(f"  camara: {len(vereadores)} vereador(es)")

    pautas, vistos = [], set()
    for pagina in range(1, PAGINAS_PAUTAS + 1):
        time.sleep(pausa)
        lote = _lista(baixar_json(url(f"pautas&pagina={pagina}")), "pautas")
        novos = [p for p in lote if (p.get("link"), p.get("titulo")) not in vistos]
        if not novos:
            break
        for p in novos:
            vistos.add((p.get("link"), p.get("titulo")))
            pautas.append({"data": limpar(p.get("data")), "titulo": limpar(p.get("titulo")), "link": link_publico(p.get("link"))})
    avisar(f"  camara: {len(pautas)} pauta(s)")

    if not vereadores:
        raise RuntimeError("a Câmara não devolveu a lista de vereadores")
    return {
        # Nada de endereço com token aqui: só a página pública de dados abertos.
        "meta": {"geradoEm": agora_iso(), "fonte": "API de dados abertos da Câmara Municipal de Videira",
                 "pagina": "https://www.camaravideira.sc.gov.br/dadosabertos"},
        "vereadores": vereadores,
        "pautas": pautas,
    }


def resumo(conteudo):
    return {"vereadores": len(conteudo["vereadores"]), "pautas": len(conteudo["pautas"])}
