"""
PEÇAS COMUNS DOS ROBÔS (adaptadores de fontes).
Tudo aqui usa só a biblioteca padrão do Python: não precisa instalar nada.
"""
import json
import os
import re
import time
import urllib.error
import urllib.request
from urllib.parse import quote
from datetime import datetime, timedelta, timezone
from pathlib import Path

USER_AGENT = "OlhoMagico-robo/0.2 (copia de dados publicos)"  # identificação honesta
FUSO_BRASILIA = timezone(timedelta(hours=-3))
TENTATIVAS = 5
ESPERA_429 = 30   # segundos: base da espera quando a fonte diz "muitas consultas" (HTTP 429)


class Bloqueado(Exception):
    """A fonte respondeu com verificação anti-robô. Não contornamos: paramos."""


def agora_iso():
    """Data e hora de agora, em Brasília, no formato 2026-10-02T08:15-03:00."""
    return datetime.now(FUSO_BRASILIA).isoformat(timespec="minutes")


def parece_bloqueio(texto):
    """Procura sinais de captcha/verificação na resposta."""
    t = (texto or "").lower()
    return any(p in t for p in ("turnstile", "captcha", "cf-challenge", "challenge-platform"))


def numero(valor):
    """Converte para número. Aceita 5000.5, "5000.50" e "5.000,50". Inválido -> None."""
    if valor is None or isinstance(valor, bool):
        return None
    if isinstance(valor, (int, float)):
        return float(valor)
    texto = str(valor).strip()
    if not texto:
        return None
    if "," in texto:  # formato brasileiro: ponto separa milhar, vírgula separa centavos
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return round(float(texto), 2)
    except ValueError:
        return None


def limpar(valor):
    """Texto sem espaços sobrando. Vazio ou 'null' vira None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return None if texto == "" or texto.lower() == "null" else texto


def mascarar_documento(doc):
    """CPF (11 dígitos) vira ***.456.789-**; CNPJ (14) aparece formatado; outros, None."""
    d = re.sub(r"\D", "", str(doc or ""))
    if len(d) == 11:
        return f"***.{d[3:6]}.{d[6:9]}-**"
    if len(d) == 14:
        return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"
    return None


def baixar_json(url, timeout=60, cabecalhos=None):
    """Baixa um JSON com até 5 tentativas (HTTP 429 "muitas consultas" espera mais). Resposta vazia (HTTP 204) devolve None.
    Captcha -> Bloqueado (para tudo). Outros erros -> RuntimeError depois das tentativas.
    "cabecalhos" serve para fontes que pedem chave no cabeçalho (ex.: CGU, "chave-api-dados")."""
    pedido = urllib.request.Request(url, headers=dict({"User-Agent": USER_AGENT, "Accept": "application/json"}, **(cabecalhos or {})))
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
                texto = resposta.read().decode("utf-8")
        except urllib.error.HTTPError as erro:
            corpo = erro.read().decode("utf-8", "replace")
            if parece_bloqueio(corpo):
                raise Bloqueado(f"verificação anti-robô (HTTP {erro.code}) em {url}")
            if 400 <= erro.code < 500 and erro.code != 429:
                raise RuntimeError(f"HTTP {erro.code} em {url}: {corpo[:200]}")  # erro do pedido: repetir não adianta
            if tentativa == TENTATIVAS:
                raise RuntimeError(f"HTTP {erro.code} em {url}")
            if erro.code == 429:
                # "Muitas consultas": a fonte pede para irmos mais devagar. Respeitamos o tempo que ela indicar
                # (cabeçalho Retry-After) ou esperamos 30, 60, 90... segundos.
                pedido_espera = erro.headers.get("Retry-After") if erro.headers else None
                espera = int(pedido_espera) if str(pedido_espera or "").isdigit() else ESPERA_429 * tentativa
                print(f"    fonte pediu calma (HTTP 429): esperando {espera} s antes de tentar de novo")
                time.sleep(min(espera, 300))
                continue
        except (urllib.error.URLError, TimeoutError, ConnectionError) as erro:
            # ConnectionError inclui "conexão cancelada pelo host remoto" (WinError 10054):
            # a internet caiu ou o servidor fechou a conexão no meio. Vale tentar de novo.
            if tentativa == TENTATIVAS:
                raise RuntimeError(f"falha de conexão em {url} ({erro})")
            print(f"    conexão falhou (tentativa {tentativa} de {TENTATIVAS}): tentando de novo em {5 * tentativa} s")
        else:
            if parece_bloqueio(texto):
                raise Bloqueado(f"verificação anti-robô em {url}")
            if not texto.strip():
                return None
            return json.loads(texto)
        time.sleep(5 * tentativa)  # espera um pouco mais a cada nova tentativa


def gravar_js(caminho, variavel, conteudo):
    """Grava 'window.VARIAVEL = {...};' de forma segura: arquivo temporário e depois troca.
    (Arquivo .js, e não .json, porque funciona até abrindo o site direto do computador.)"""
    caminho = Path(caminho)
    js = (f"/* Arquivo GERADO AUTOMATICAMENTE pelos robôs de ferramentas/. Não edite à mão. */\n"
          f"window.{variavel} = " + json.dumps(conteudo, ensure_ascii=False, separators=(",", ":")) + ";\n")
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_suffix(".tmp")
    temporario.write_text(js, encoding="utf-8")
    temporario.replace(caminho)
    return len(js)


def ler_js(caminho, variavel):
    """Lê de volta um arquivo gravado por gravar_js. Se não existir ou estiver estranho, devolve None."""
    try:
        texto = Path(caminho).read_text(encoding="utf-8")
        m = re.search(r"window\." + re.escape(variavel) + r" = (.*);\s*$", texto, re.S)
        return json.loads(m.group(1)) if m else None
    except (OSError, ValueError):
        return None


# ---------------- Chaves de acesso (tokens) ----------------
# As chaves NUNCA ficam no código: vêm do ambiente (PowerShell: $env:NOME = "..."; GitHub: Secrets).
NOMES_DAS_CHAVES = ("CGU_CHAVE", "CAMARA_TOKEN")


class SemChave(Exception):
    """A fonte precisa de uma chave que não foi informada. Não é erro: a fonte é só pulada."""


def chave(nome):
    """Lê uma chave do ambiente, sem espaços ou quebras de linha coladas sem querer. Sem chave -> SemChave."""
    valor = re.sub(r"\s+", "", os.environ.get(nome) or "")
    if not valor:
        raise SemChave(f"a chave {nome} não foi informada")
    return valor


def esconder_chaves(texto):
    """Troca qualquer chave que apareça num texto (ex.: endereço numa mensagem de erro) por ***.
    Assim a chave nunca vai parar no arquivo de situação publicado no site nem no registro do GitHub."""
    texto = str(texto)
    for nome in NOMES_DAS_CHAVES:
        valor = re.sub(r"\s+", "", os.environ.get(nome) or "")
        if len(valor) >= 6:
            for forma in {valor, quote(valor, safe="")}:
                texto = texto.replace(forma, "***")
    return texto
