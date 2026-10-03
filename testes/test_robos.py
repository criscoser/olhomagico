"""
TESTES DOS ROBÔS (Python). Rodar: python -m unittest discover -s testes -p "test_*.py"
Usam um servidor FALSO, com dados fictícios: não acessam nenhuma fonte real.
(Testes com servidor falso NÃO substituem a conferência com as fontes reais.)
"""
import json
import os
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import date
from pathlib import Path
from urllib.parse import urlparse, parse_qs

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "ferramentas"))
from comum import numero, mascarar_documento, ler_js, gravar_js  # noqa: E402
from fontes import siconfi, pncp, pessoal, transferencias, dca, entregas, siope, cgu, camara  # noqa: E402
import comum  # noqa: E402

# Anos RELATIVOS ao ano atual: assim os testes não quebram na virada do ano (e não travam a publicação).
ANO = date.today().year
ANO_ANT, ANO_ANT2 = str(ANO - 1), str(ANO - 2)

# ---------------- Dados fictícios no formato real das fontes ----------------
RGF_EXEC = [
    {"anexo": "RGF-Anexo 01", "conta": "DESPESA TOTAL COM PESSOAL - DTP (VI) = (IIIa + IIIb)", "coluna": "Valor", "valor": 171234364.14},
    {"anexo": "RGF-Anexo 01", "conta": "DESPESA TOTAL COM PESSOAL - DTP (VI) = (IIIa + IIIb)", "coluna": "% sobre a RCL Ajustada", "valor": 41.78},
    {"anexo": "RGF-Anexo 01", "conta": "RECEITA CORRENTE LÍQUIDA AJUSTADA PARA CÁLCULO DOS LIMITES DA DESPESA COM PESSOAL (V)", "coluna": "Valor", "valor": 409829170.05},
    {"anexo": "RGF-Anexo 01", "conta": "LIMITE MÁXIMO (VII) (incisos I, II e III, art. 20 da LRF)", "coluna": "Valor", "valor": 221307751.83},
    {"anexo": "RGF-Anexo 01", "conta": "LIMITE MÁXIMO (VII) (incisos I, II e III, art. 20 da LRF)", "coluna": "% sobre a RCL Ajustada", "valor": 54},
    {"anexo": "RGF-Anexo 01", "conta": "LIMITE PRUDENCIAL (VIII) = (0,95 x VII) (parágrafo único do art. 22 da LRF)", "coluna": "% sobre a RCL Ajustada", "valor": 51.3},
    {"anexo": "RGF-Anexo 01", "conta": "LIMITE DE ALERTA (IX) = (0,90 x VII) (inciso II do §1º do art. 59 da LRF)", "coluna": "% sobre a RCL Ajustada", "valor": 48.6},
    {"anexo": "RGF-Anexo 02", "conta": "DESPESA TOTAL COM PESSOAL - DTP (outro anexo, deve ser ignorado)", "coluna": "% sobre a RCL Ajustada", "valor": 99},
]


def compra(i, modalidade="Pregão - Eletrônico"):
    return {"numeroControlePNCP": f"83039842000184-1-{i:06d}/2026", "anoCompra": 2026, "sequencialCompra": i,
            "orgaoEntidade": {"cnpj": "83039842000184", "razaoSocial": "MUNICIPIO EXEMPLO"},
            "unidadeOrgao": {"nomeUnidade": "UNIDADE EXEMPLO"}, "modalidadeNome": modalidade,
            "objetoCompra": f"Objeto fictício {i}", "valorTotalEstimado": 1000.0 * i, "valorTotalHomologado": 900.0 * i,
            "situacaoCompraNome": "Divulgada no PNCP", "dataPublicacaoPncp": "2026-03-01T10:00:00", "srp": False}


def contrato(i, cnpj="83039842000184", ni="11222333000144", tipo="PJ"):
    return {"numeroControlePNCP": f"{cnpj}-2-{i:06d}/2025", "anoContrato": 2025, "sequencialContrato": i,
            "orgaoEntidade": {"cnpj": cnpj, "razaoSocial": "ORGAO EXEMPLO"}, "nomeRazaoSocialFornecedor": f"FORNECEDOR {i}",
            "niFornecedor": ni, "tipoPessoa": tipo, "objetoContrato": f"Contrato fictício {i}", "valorInicial": 100.0,
            "valorGlobal": 500.0 * i, "dataAssinatura": "2025-12-10", "dataVigenciaInicio": "2025-12-10",
            "dataVigenciaFim": "2026-12-10", "tipoContrato": {"nome": "Contrato"}, "categoriaProcesso": {"nome": "Serviços"}}


SERVIDORES = [{"entidade": "MUNICIPIO EXEMPLO", "matricula": f"{i}-1", "nome": f"PESSOA FICTICIA {i}", "cpf": "***.999.000-**",
               "situacao": "Afastado", "admissao": "15/03/2021", "regime": "Estatutário", "formaInvestidura": "Concurso Público",
               "centroCusto": "SETOR EXEMPLO", "localTrabalho": "ESCOLA EXEMPLO", "cargo": "PROFESSOR", "funcao": "X",
               "nivel": "A", "salarioBase": "5.000,00", "horario": "08:00", "horasMensais": "200:00", "horasSemanais": "40:00"}
              for i in range(1, 151)]


# Transferências: 25 itens fictícios de 2025 (3 páginas de 10). O link "next" aponta para um endereço
# INTERNO (como o do Tesouro), então o robô precisa reaproveitar só o número da página.
TRANSF_2025 = [{"UF": "SC", "ANO": 2025, "TRANSFERENCIA": "FPM" if i % 2 else "FUNDEB", "codigo_siafi": 8379,
                "CO_IBGE": 4219309, "MES": (i % 12) + 1, "MUNICIPIO": "VIDEIRA", "VALOR": 1000.5 * i}
               for i in range(1, 25)] + [{"ANO": 2025, "TRANSFERENCIA": "AJUSTE", "CO_IBGE": 4219309, "MES": "JAN", "VALOR": -50}]

DCA_2024 = [
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "Despesas Exceto Intraorçamentárias", "valor": 300.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "Despesas Intraorçamentárias", "valor": 7.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "10 - Saúde", "valor": 100.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Pagas", "conta": "10 - Saúde", "valor": 90.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "10.301 - Atenção Básica", "valor": 60.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "FU10 - Demais Subfunções", "valor": 40.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Despesas Empenhadas", "conta": "12 - Educação", "valor": 200.0},
    {"instituicao": "Prefeitura Exemplo", "coluna": "Coluna desconhecida", "conta": "12 - Educação", "valor": 999.0},
]

ENTREGAS_2025 = [
    {"exercicio": 2025, "instituicao": "Prefeitura Exemplo", "entregavel": "Relatório de Gestão Fiscal", "periodo": 1,
     "periodicidade": "Q", "status_relatorio": "HO", "data_status": "2025-05-28T10:00:00Z", "forma_envio": "Planilha"},
    {"exercicio": 2025, "instituicao": "Câmara Exemplo", "entregavel": "MSC Agregada", "periodo": 1,
     "periodicidade": "M", "status_relatorio": None, "data_status": "2025-02-25T09:15:08Z", "forma_envio": "XML"},
]

SIOPE_2024 = [{"NUM_ANO": 2024, "NUM_PERI": 6, "COD_MUNI": 421930, "COD_INDI": 1, "COD_EXIB": "1.1",
               "NOM_INDI": "Percentual de aplicação em MDE", "NOM_GRUP_INDI": "Grupo exemplo", "VAL_INDI": 28.08}]


# CGU e Câmara (formato conferido com as chaves reais pelo script investigar_chaves.py). Valores fictícios.
CONVENIO = lambda i: {"id": i, "dimConvenio": {"codigo": f"5{i:05d}", "numero": f"9{i:05d}", "objeto": f"Objeto fictício {i}"},
                      "situacao": "EM EXECUÇÃO", "tipoInstrumento": {"codigo": "1", "descricao": "Convênio", "id": 1},
                      "orgao": {"cnpj": "1", "codigoSIAFI": "2", "descricaoPoder": "E", "nome": "MINISTÉRIO EXEMPLO", "orgaoMaximo": {}, "sigla": "ME"},
                      "convenente": {"cnpjFormatado": "83.039.842/0001-84", "cpfFormatado": "", "id": 1, "nome": "MUNICIPIO EXEMPLO",
                                     "nomeFantasiaReceita": "", "numeroInscricaoSocial": "", "razaoSocialReceita": "", "tipo": "PJ"},
                      "subfuncao": {"codigoSubfuncao": "1", "descricaoSubfuncap": "ATENÇÃO BÁSICA", "funcao": {}},
                      "valor": 1000.0 * i, "valorLiberado": 500.0 * i, "valorContrapartida": 10.0,
                      "dataInicioVigencia": "2025-01-10", "dataFinalVigencia": "2026-12-31", "dataPublicacao": f"2025-0{1 + i % 9}-01",
                      "dataUltimaLiberacao": "2025-06-01"}
CONVENIOS = [CONVENIO(i) for i in range(1, 21)]   # 20 = 2 páginas (15 + 5)
BENEFICIO = {"dataReferencia": "01/08/2025", "id": 1, "municipio": {"codigoIBGE": "4219309"}, "quantidadeBeneficiados": 1234,
             "tipo": {"descricao": "Bolsa Família", "descricaoDetalhada": "x", "id": 1}, "valor": 850000.5}
VEREADORES = [{"nome": f"VEREADOR FICTICIO {i}", "partido": "XYZ", "funcao": "Vereador", "imagem": "https://x/y.jpg",
               "link": f"https://www.camaravideira.sc.gov.br/vereador/{i}"} for i in range(1, 12)]
PAUTAS = [{"data": "06/10/2026", "titulo": f"Pauta fictícia {i}", "link": f"https://www.camaravideira.sc.gov.br/pauta/{i}"} for i in range(1, 61)]


class ServidorFalso(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, obj, cod=200):
        corpo = json.dumps(obj).encode()
        self.send_response(cod); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corpo))); self.end_headers(); self.wfile.write(corpo)

    def _vazio(self):
        self.send_response(204); self.end_headers()

    def do_GET(self):
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
        if u.path == "/calma":
            # Simula o PNCP: na 1ª vez responde 429 ("muitas consultas", espere 0 s); na 2ª, responde normal.
            ServidorFalso.pedidos_calma = getattr(ServidorFalso, "pedidos_calma", 0) + 1
            if ServidorFalso.pedidos_calma == 1:
                corpo = b"{}"
                self.send_response(429); self.send_header("Retry-After", "0")
                self.send_header("Content-Length", str(len(corpo))); self.end_headers(); self.wfile.write(corpo)
                return
            return self._json({"ok": True})
        if u.path.startswith("/quebrado"):
            return self._json({"erro": "falha simulada"}, 500)
        if u.path.endswith("/api/transparencia-pessoal-funcionarios"):
            p = int(q.get("pagina", 1)); fatia = SERVIDORES[(p - 1) * 100: p * 100]
            return self._json({"registros": fatia, "paginaAtual": str(p), "totalPaginas": 2, "totalRegistros": len(SERVIDORES)})
        if u.path.endswith("/rgf"):
            if q["an_exercicio"] == ANO_ANT and q["in_periodicidade"] == "Q" and (q["co_poder"] == "E" or q["nr_periodo"] == "3"):
                return self._json({"items": RGF_EXEC, "hasMore": False})
            return self._json({"items": [], "hasMore": False})
        if u.path.endswith("/contratacoes/publicacao"):
            mod, p = q["codigoModalidadeContratacao"], int(q["pagina"])
            if mod == "6":
                lote = [compra(i) for i in range(1, 61)][(p - 1) * 50: p * 50]
                return self._json({"data": lote, "totalPaginas": 2}) if lote else self._vazio()
            if mod == "8" and p == 1:
                return self._json({"data": [compra(100 + i, "Dispensa") for i in range(3)] + [compra(1)]})  # 1 repetida
            return self._vazio()
        if u.path.endswith("/contratos"):
            if q["pagina"] == "1":
                return self._json({"data": [contrato(1), contrato(2, ni="12345678901", tipo="PF")]})
            return self._vazio()
        if u.path.startswith("/cgu/"):
            if self.headers.get("chave-api-dados") != "chave-teste":
                return self._json({"erro": "chave inválida"}, 401)
            if u.path.endswith("/convenios"):
                p = int(q["pagina"]); return self._json(CONVENIOS[(p - 1) * 15:p * 15])
            return self._json([BENEFICIO] if q.get("mesAno", "").endswith("08") else [])
        if u.path.endswith("/web-aplicativo.php"):
            if q.get("keysoft") != "token@teste":
                return self._json({"erro": "token inválido"}, 403)
            if q["call"] == "vereadores":
                return self._json(VEREADORES)
            if q["call"] == "pautas":
                p = int(q["pagina"]); return self._json(PAUTAS[(p - 1) * 50:p * 50])
            return self._json([])
        if u.path.endswith("/por_estado_municipio"):
            # Imita o Tesouro de verdade: lista em "registros" e link "next" SEMPRE presente (até nas páginas vazias).
            p = int(q.get("page", 0))
            fatia = TRANSF_2025[p * 10:(p + 1) * 10] if q.get("p_ano") == ANO_ANT else []
            return self._json({"registros": fatia, "page": p, "pageSize": 10, "status": "ok",
                               "next": f"https://endereco-interno.exemplo/aria//v1/x?p_ano={q.get('p_ano')}&page={p + 1}&pageSize=10"})
        if u.path.endswith("/dca"):
            return self._json({"items": DCA_2024 if q["an_exercicio"] == ANO_ANT2 else [], "hasMore": False})
        if u.path.endswith("/extrato_entregas"):
            return self._json({"items": ENTREGAS_2025 if q["an_referencia"] == ANO_ANT else [], "hasMore": False})
        if "/Indicadores_Siope(" in u.path:
            ok = f"Ano_Consulta={ANO_ANT2},Num_Peri=6" in u.path and q.get("$filter") == "COD_MUNI eq 421930"
            return self._json({"value": SIOPE_2024 if ok else []})
        return self._json({"erro": "rota desconhecida"}, 404)


class TestExtracao(unittest.TestCase):
    def test_numero(self):
        self.assertEqual([numero("5.000,50"), numero(41.78), numero("x"), numero(None), numero(True)], [5000.5, 41.78, None, None, None])

    def test_mascara_cpf_e_cnpj(self):
        self.assertEqual(mascarar_documento("123.456.789-01"), "***.456.789-**")
        self.assertEqual(mascarar_documento("83039842000184"), "83.039.842/0001-84")

    def test_siconfi_extrai_indicador_so_do_anexo_01(self):
        d = siconfi.extrair(RGF_EXEC)
        self.assertEqual((d["dtpPct"], d["limiteMaximoPct"], d["limitePrudencialPct"], d["limiteAlertaPct"]), (41.78, 54, 51.3, 48.6))
        self.assertEqual(d["dtp"], 171234364.14)

    def test_siconfi_sem_dados_essenciais(self):
        self.assertIsNone(siconfi.extrair([{"anexo": "RGF-Anexo 01", "conta": "OUTRA", "coluna": "Valor", "valor": 1}]))

    def test_pncp_numero_de_controle(self):
        self.assertEqual(pncp._ano_seq("83039842000184-1-000003/2026"), ("2026", "3"))

    def test_pncp_link_individual_e_cpf_mascarado(self):
        c = pncp.resumir_contrato(contrato(7, ni="12345678901", tipo="PF"), "https://pncp.gov.br")
        self.assertEqual(c["url"], "https://pncp.gov.br/api/pncp/v1/orgaos/83039842000184/contratos/2025/7")
        self.assertEqual(c["fornecedorDoc"], "***.456.789-**")
        k = pncp.resumir_compra(compra(3), "https://pncp.gov.br")
        self.assertEqual(k["url"], "https://pncp.gov.br/api/consulta/v1/orgaos/83039842000184/compras/2026/3")

    def test_pessoal_nao_guarda_dados_sensiveis(self):
        r = pessoal.resumir(SERVIDORES[0])
        texto = json.dumps(r, ensure_ascii=False)
        for proibido in ("cpf", "matricula", "horario", "Afastado", "ESCOLA EXEMPLO"):
            self.assertNotIn(proibido, texto)
        self.assertEqual((r["salario"], r["desde"], r["horasMes"]), (5000.0, "03/2021", 200))

    def test_transferencias_mes_e_proxima_pagina(self):
        self.assertEqual([transferencias.mes_numero(x) for x in (1, "01", "JAN", "Março", "03/2025", "x", 13)],
                         [1, 1, 1, 3, 3, None, None])
        prox = transferencias.proxima_pagina({"next": {"$ref": "https://interno/ords?page=2"}}, "https://api/x?p_ano=1&page=1")
        self.assertEqual(prox, "https://api/x?p_ano=1&page=2")
        self.assertIsNone(transferencias.proxima_pagina({"items": []}, "https://api/x?a=1"))
        self.assertIsNone(transferencias.resumir({"CO_IBGE": 1234567, "MES": 1, "VALOR": 1, "TRANSFERENCIA": "FPM"}, 2025, "4219309"))

    def test_dca_separa_funcao_subfuncao_e_colunas(self):
        d = dca.extrair(DCA_2024)
        saude = d["funcoes"][1]
        self.assertEqual([f["codigo"] for f in d["funcoes"]], ["12", "10"])   # maior empenhado primeiro
        self.assertEqual(saude["valores"], {"empenhado": 100.0, "pago": 90.0})  # colunas separadas, nunca somadas
        self.assertEqual([s["codigo"] for s in saude["subfuncoes"]], ["10.301", "FU10"])
        self.assertEqual(d["totais"], {"exceto": {"empenhado": 300.0}, "intra": {"empenhado": 7.0}})
        self.assertEqual(d["funcoes"][0]["valores"], {"empenhado": 200.0})     # coluna desconhecida ignorada


class TestCoordenador(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), ServidorFalso)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.srv.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def rodar(self, pasta, quebrar_pncp=False, chaves=None):
        mun = {"nome": "Exemplo", "uf": "SC", "codigo_ibge": "4219309", "cnpj": "83039842000184",
               "portal_atende": self.base, "siconfi": self.base, "pncp": self.base + ("/quebrado" if quebrar_pncp else ""),
               "codigo_siope": "421930", "codigo_tesouro_transferencias": "8379", "codigo_uf_tesouro_transferencias": "24",
               "tesouro_transferencias": self.base, "siope": self.base,
               "cgu": self.base + "/cgu", "camara_api": self.base + "/web-aplicativo.php"}
        arq = Path(pasta) / "municipio.json"; arq.write_text(json.dumps(mun))
        return subprocess.run([sys.executable, str(RAIZ / "ferramentas" / "atualizar.py"), "--municipio", str(arq),
                               "--dados", str(Path(pasta) / "dados"), "--pausa", "0"], capture_output=True, text=True, timeout=180,
                              env=dict({k: v for k, v in os.environ.items() if k not in comum.NOMES_DAS_CHAVES}, **(chaves or {})))

    def test_sem_chave_a_fonte_e_pulada_sem_falhar(self):
        with tempfile.TemporaryDirectory() as pasta:
            r = self.rodar(pasta)
            self.assertEqual(r.returncode, 0, r.stdout)
            self.assertIn("[cgu] PULADO", r.stdout)
            self.assertFalse((Path(pasta) / "dados" / "cgu.js").exists())

    def test_cgu_e_camara_com_chave_e_sem_vazar_o_token(self):
        with tempfile.TemporaryDirectory() as pasta:
            r = self.rodar(pasta, chaves={"CGU_CHAVE": "chave-teste", "CAMARA_TOKEN": " token@teste\n"})  # espaço colado de propósito
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            dados = Path(pasta) / "dados"
            c = ler_js(dados / "cgu.js", "OBS_DADOS_CGU")
            self.assertEqual(len(c["convenios"]), 20)                   # as 2 páginas
            self.assertEqual(c["convenios"][0]["area"], "ATENÇÃO BÁSICA")
            self.assertTrue(all(x["numeroPortal"] == "5" + x["numero"][1:] for x in c["convenios"]))  # número do portal guardado
            self.assertTrue(all("cpf" not in json.dumps(x).lower() for x in c["convenios"]))
            self.assertEqual(sum(1 for b in c["beneficios"] if b["programa"] == "BPC"), 1)
            k = ler_js(dados / "camara.js", "OBS_DADOS_CAMARA")
            self.assertEqual((len(k["vereadores"]), len(k["pautas"])), (11, 60))
            for arq in dados.iterdir():                                   # o token NUNCA vai para os arquivos publicados
                texto = arq.read_text(encoding="utf-8")
                self.assertNotIn("token@teste", texto); self.assertNotIn("token%40teste", texto); self.assertNotIn("chave-teste", texto)
            # Chave errada: falha, e a mensagem gravada não mostra a chave.
            r2 = self.rodar(pasta, chaves={"CGU_CHAVE": "chave-teste", "CAMARA_TOKEN": "token@errado"})
            sit = (dados / "situacao.js").read_text(encoding="utf-8")
            self.assertEqual(r2.returncode, 1)
            self.assertNotIn("token%40errado", sit); self.assertNotIn("token@errado", sit + r2.stdout)

    def test_esconder_chaves(self):
        antigo = os.environ.get("CAMARA_TOKEN")
        os.environ["CAMARA_TOKEN"] = "abc@123456"
        try:
            self.assertEqual(comum.esconder_chaves("erro em https://x?keysoft=abc%40123456&call=y"), "erro em https://x?keysoft=***&call=y")
        finally:
            if antigo is None: del os.environ["CAMARA_TOKEN"]
            else: os.environ["CAMARA_TOKEN"] = antigo

    def test_espera_e_tenta_de_novo_depois_do_429(self):
        from comum import baixar_json
        self.assertEqual(baixar_json(self.base + "/calma"), {"ok": True})

    def test_tudo_certo_e_depois_uma_fonte_quebra(self):
        with tempfile.TemporaryDirectory() as pasta:
            r = self.rodar(pasta)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            dados = Path(pasta) / "dados"
            pes = ler_js(dados / "pessoal.js", "OBS_DADOS_PESSOAL")
            sic = ler_js(dados / "siconfi.js", "OBS_DADOS_SICONFI")
            pn = ler_js(dados / "pncp.js", "OBS_DADOS_PNCP")
            self.assertEqual(len(pes["servidores"]), 150)
            self.assertEqual(len(sic["poderes"]["E"]["periodos"]), 3)       # 3 quadrimestres do ano passado
            self.assertEqual(len(sic["poderes"]["L"]["periodos"]), 1)
            self.assertEqual(len(pn["compras"]), 63)                        # 60 + 3 (a repetida não conta 2 vezes)
            self.assertEqual(len(pn["contratos"]), 2)
            self.assertTrue(all(c["fornecedorDoc"] != "12345678901" for c in pn["contratos"]))
            tr = ler_js(dados / "transferencias.js", "OBS_DADOS_TRANSFERENCIAS")
            self.assertEqual(len(tr["registros"]), 25)                      # 3 páginas lidas pelo endereço certo
            self.assertEqual(sum(1 for r in tr["registros"] if r["valor"] < 0), 1)  # valor negativo é mantido
            dc = ler_js(dados / "dca.js", "OBS_DADOS_DCA")
            self.assertEqual([a["ano"] for a in dc["anos"]], [ANO - 2])
            en = ler_js(dados / "entregas.js", "OBS_DADOS_ENTREGAS")
            self.assertEqual(en["registros"][0]["entregavel"], "Relatório de Gestão Fiscal")  # mais recente primeiro
            si = ler_js(dados / "siope.js", "OBS_DADOS_SIOPE")
            self.assertEqual(si["periodos"][0]["indicadores"][0]["valor"], 28.08)
            sit0 = ler_js(dados / "situacao.js", "OBS_SITUACAO")
            self.assertEqual(sit0["pessoal"]["resumo"], {"registros": 150, "comissionados": 0})
            self.assertEqual(sit0["pncp"]["resumo"]["contratos"], 2)
            antes = (dados / "pncp.js").read_text()

            r2 = self.rodar(pasta, quebrar_pncp=True)                       # agora o PNCP falha
            self.assertEqual(r2.returncode, 1)
            self.assertEqual((dados / "pncp.js").read_text(), antes, "o arquivo válido anterior deve ser mantido")
            sit = ler_js(dados / "situacao.js", "OBS_SITUACAO")
            self.assertFalse(sit["pncp"]["ok"]); self.assertTrue(sit["pncp"]["ultimoSucesso"])
            self.assertTrue(sit["pessoal"]["ok"] and sit["siconfi"]["ok"], "as outras fontes continuam funcionando")


if __name__ == "__main__":
    unittest.main()
