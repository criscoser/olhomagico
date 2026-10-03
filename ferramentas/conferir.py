"""
CONFERÊNCIA ANTES DE PUBLICAR (passos 1 e 2 da lista de produção).

O que faz, lendo SÓ os arquivos da pasta dados/ (não consulta nenhuma fonte):
  1. Confere se cada arquivo existe, quando foi gerado e se tem o formato esperado.
  2. Sorteia alguns números para VOCÊ comparar com o portal oficial (o link de cada um vem junto).

Não imprime CPF nem matrícula (esses dados nem são guardados). Imprime nomes de servidores,
que já são públicos na lista oficial, só para você localizá-los no portal.

Como rodar (dentro da pasta OBS):
  python ferramentas\\conferir.py
"""
import random
import sys
from pathlib import Path

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA))
from comum import ler_js  # noqa: E402

DADOS = PASTA.parent / "dados"

# arquivo, variável, nome amigável, função que diz "quantos itens" (e falha se o formato estiver errado)
ARQUIVOS = [
    ("pessoal.js", "OBS_DADOS_PESSOAL", "Servidores", lambda d: f"{len(d['servidores'])} registros"),
    ("despesas-resumo.js", "OBS_DADOS_DESPESAS", "Resumo das despesas (13 meses)", lambda d: f"{len(d['meses'])} meses"),
    ("siconfi.js", "OBS_DADOS_SICONFI", "Gasto com pessoal (LRF)", lambda d: f"{sum(len(p['periodos']) for p in d['poderes'].values())} períodos"),
    ("pncp.js", "OBS_DADOS_PNCP", "Licitações e contratos", lambda d: f"{len(d['compras'])} licitações, {len(d['contratos'])} contratos"),
    ("transferencias.js", "OBS_DADOS_TRANSFERENCIAS", "Repasses da União", lambda d: f"{len(d['registros'])} registros"),
    ("dca.js", "OBS_DADOS_DCA", "Despesa por área", lambda d: f"anos {', '.join(str(a['ano']) for a in d['anos'])}"),
    ("entregas.js", "OBS_DADOS_ENTREGAS", "Relatórios ao Tesouro", lambda d: f"{len(d['registros'])} registros"),
    ("siope.js", "OBS_DADOS_SIOPE", "Educação (SIOPE)", lambda d: f"{sum(len(p['indicadores']) for p in d['periodos'])} indicadores"),
    ("cgu.js", "OBS_DADOS_CGU", "Convênios e benefícios (CGU)", lambda d: f"{len(d['convenios'])} convênios, {len(d['beneficios'])} benefícios"),
    ("camara.js", "OBS_DADOS_CAMARA", "Câmara", lambda d: f"{len(d['vereadores'])} vereadores, {len(d['pautas'])} pautas"),
]


def moeda(v):
    return "—" if v is None else f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main():
    print("=" * 72)
    print("1) ARQUIVOS DA CÓPIA DIÁRIA")
    carregados, faltando = {}, []
    for arquivo, variavel, nome, contar in ARQUIVOS:
        d = ler_js(DADOS / arquivo, variavel)
        if not d:
            faltando.append(nome)
            print(f"  [FALTA]  {nome:32} ({arquivo} não existe ou está ilegível)")
            continue
        try:
            print(f"  [OK]     {nome:32} {contar(d)} | gerado em {d['meta']['geradoEm']}")
            carregados[arquivo] = d
        except (KeyError, TypeError) as erro:
            print(f"  [ERRO]   {nome:32} formato inesperado (campo {erro}) -> mande este print para o Claude")

    print("=" * 72)
    print("2) NÚMEROS PARA CONFERIR NO PORTAL OFICIAL (anote se algum não bater)")
    random.seed()
    p = carregados.get("pessoal.js")
    if p:
        com_salario = [s for s in p["servidores"] if isinstance(s.get("salario"), (int, float))]
        print("\n  Servidores: procure cada nome na 'Relação Funcionário x Salário' ou na lista de pessoal do portal:")
        print("  https://videira.atende.net/transparencia/item/relacao-funcionario-x-salario")
        for s in random.sample(com_salario, min(4, len(com_salario))):
            print(f"   - {s['nome']} | {s.get('cargo')} | salário-base {moeda(s['salario'])}")
    sic = carregados.get("siconfi.js")
    if sic:
        e = sic["poderes"].get("E", {}).get("periodos") or []
        if e:
            u = sorted(e, key=lambda x: (x["ano"], x["periodo"]))[-1]
            print(f"\n  Gasto com pessoal da Prefeitura ({u['rotulo']}): {u['dtpPct']}% da RCL ajustada")
            print(f"   Conferir no RGF, Anexo 1: {u['url']}")
    tr = carregados.get("transferencias.js")
    if tr and tr["registros"]:
        r = sorted(tr["registros"], key=lambda x: (x["ano"], x["mes"]))[-1]
        print(f"\n  Repasse {r['tipo']} de {r['mes']:02d}/{r['ano']}: {moeda(r['valor'])}")
        print("   Conferir no Tesouro Transparente (transferências constitucionais, Videira/SC)")
    cg = carregados.get("cgu.js")
    if cg and cg["convenios"]:
        # Sorteia entre os 10 mais recentes: convênios antigos são difíceis de achar na busca do portal.
        recentes = sorted(cg["convenios"], key=lambda x: x.get("publicacao") or "", reverse=True)[:10]
        c = random.choice(recentes)
        numero = c.get("numeroPortal") or c.get("numero")
        print(f"\n  Convênio nº {numero} ({(c.get('objeto') or '')[:60]}): valor {moeda(c.get('valor'))}, liberado {moeda(c.get('valorLiberado'))}")
        print("   Conferir em https://portaldatransparencia.gov.br/convenios (pesquisar pelo número;")
        print("   antes, tire o filtro 'Período da última liberação', que o portal coloca sozinho)")
    print("\n  Gastos do mês: abra a aba 'Despesas públicas' do site e compare o total pago com o portal da Prefeitura.")
    print("=" * 72)
    if faltando:
        print(f"Faltam: {', '.join(faltando)}. Rode: python ferramentas\\atualizar.py")
    else:
        print("Todos os arquivos estão presentes.")


if __name__ == "__main__":
    main()
