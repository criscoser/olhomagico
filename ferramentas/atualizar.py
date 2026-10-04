#!/usr/bin/env python3
"""
COORDENADOR DOS ROBÔS: atualiza todas as fontes de dados, cada uma SEPARADAMENTE.

  - Se uma fonte falhar, as outras continuam, e o arquivo anterior da que falhou é MANTIDO
    (nada vazio ou incompleto substitui um dado válido).
  - Grava dados/situacao.js com a situação de CADA fonte: última tentativa, último sucesso e erro.
  - Se uma fonte pedir captcha, ela é parada e marcada como bloqueada (não contornamos).

Como rodar (dentro da pasta do projeto):
  python ferramentas/atualizar.py                 -> todas as fontes
  python ferramentas/atualizar.py --so pessoal    -> só uma (pessoal, despesas, siconfi, pncp, transferencias, dca, entregas, siope, cgu, camara, ibge, rreo)
"""
import argparse
import json
import sys
from pathlib import Path

PASTA = Path(__file__).resolve().parent
sys.path.insert(0, str(PASTA))  # para achar comum.py e a pasta fontes/

from comum import Bloqueado, SemChave, agora_iso, esconder_chaves, gravar_js, ler_js  # noqa: E402
from fontes import pessoal, despesas, siconfi, pncp, transferencias, dca, entregas, siope, cgu, camara, ibge, rreo  # noqa: E402

# Ordem de execução. Para incluir uma fonte nova: crie o adaptador em fontes/ e acrescente aqui.
FONTES = {"pessoal": pessoal, "despesas": despesas, "siconfi": siconfi, "pncp": pncp, "transferencias": transferencias,
          "dca": dca, "entregas": entregas, "siope": siope, "cgu": cgu, "camara": camara, "ibge": ibge, "rreo": rreo}
PASTA_DADOS = PASTA.parent / "dados"
VARIAVEL_SITUACAO = "OBS_SITUACAO"


def principal():
    parser = argparse.ArgumentParser(description="Atualiza as fontes de dados do Olho Mágico")
    parser.add_argument("--so", help="lista de fontes separadas por vírgula (padrão: todas)")
    parser.add_argument("--municipio", default=str(PASTA / "municipio.json"), help="arquivo de configuração do município")
    parser.add_argument("--dados", default=str(PASTA_DADOS), help="pasta onde gravar os arquivos")
    parser.add_argument("--pausa", type=float, default=None, help="segundos entre consultas (padrão: o de cada fonte)")
    args = parser.parse_args()

    municipio = json.loads(Path(args.municipio).read_text(encoding="utf-8"))
    escolhidas = args.so.split(",") if args.so else list(FONTES)
    desconhecidas = [f for f in escolhidas if f not in FONTES]
    if desconhecidas:
        print(f"Fonte desconhecida: {', '.join(desconhecidas)}. Opções: {', '.join(FONTES)}")
        return 2

    pasta = Path(args.dados)
    arq_situacao = pasta / "situacao.js"
    situacao = ler_js(arq_situacao, VARIAVEL_SITUACAO) or {}   # mantém o histórico de sucesso das outras fontes
    falhas = []

    for nome in escolhidas:
        modulo = FONTES[nome]
        print(f"[{nome}] {modulo.NOME}")
        registro = situacao.get(nome, {})
        registro.update(nome=modulo.NOME, arquivo=modulo.ARQUIVO, ultimaTentativa=agora_iso())
        try:
            opcoes = {} if args.pausa is None else {"pausa": args.pausa}
            conteudo = modulo.coletar(municipio, **opcoes)
            tamanho = gravar_js(pasta / modulo.ARQUIVO, modulo.VARIAVEL, conteudo)
            registro.update(ok=True, erro=None, ultimoSucesso=conteudo["meta"]["geradoEm"])
            # Números curtos (ex.: quantos registros) para o painel inicial, sem precisar carregar o arquivo inteiro.
            registro["resumo"] = modulo.resumo(conteudo) if hasattr(modulo, "resumo") else None
            print(f"[{nome}] OK: {modulo.ARQUIVO} gravado ({tamanho // 1024} KB)")
        except SemChave as erro:
            # Fonte que precisa de chave (CGU, Câmara) e a chave não foi informada: só pula, sem contar como falha.
            print(f"[{nome}] PULADO: {erro}. Veja docs/COMO_PUBLICAR.md (segredos do GitHub).")
            continue
        except Bloqueado as erro:
            registro.update(ok=False, erro=esconder_chaves(f"Fonte pediu verificação anti-robô; não contornamos. ({erro})"))
            falhas.append(nome)
            print(f"[{nome}] PARADO: {erro}. O arquivo anterior foi mantido.")
        except Exception as erro:  # qualquer outra falha: registra e segue para a próxima fonte
            registro.update(ok=False, erro=esconder_chaves(erro)[:300])   # a chave nunca aparece na mensagem
            falhas.append(nome)
            print(f"[{nome}] ERRO: {esconder_chaves(erro)}. O arquivo anterior foi mantido.")
        situacao[nome] = registro

    gravar_js(arq_situacao, VARIAVEL_SITUACAO, situacao)
    print(f"\nResumo: {len(escolhidas) - len(falhas)} de {len(escolhidas)} fonte(s) atualizada(s)."
          + (f" Com problema: {', '.join(falhas)}." if falhas else ""))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(principal())
