"""
PEÇAS COMUNS DOS ROBÔS (adaptadores de fontes).
Tudo aqui usa só a biblioteca padrão do Python: não precisa instalar nada.
"""
import json
import math
import os
import re
import time
import urllib.error
import urllib.request
from urllib.parse import quote
from email.utils import parsedate_to_datetime
from datetime import datetime, timedelta, timezone
from pathlib import Path

USER_AGENT = "OlhoMagico-robo/0.2 (copia de dados publicos)"  # identificação honesta
FUSO_BRASILIA = timezone(timedelta(hours=-3))
TENTATIVAS = 5
ESPERA_429 = 30   # segundos: base da espera quando a fonte diz "muitas consultas" (HTTP 429)
ESPERA_MAXIMA = 300               # segundos: nenhuma espera isolada passa de 5 minutos, peça a fonte o que pedir
ESPERA_TOTAL_POR_FONTE = 900      # segundos: somando todas as esperas de UMA fonte, no máximo 15 minutos.
                                  # Passou disso, a fonte é deixada para amanhã (a cópia anterior fica no ar)
                                  # e a publicação segue com as outras: um dia ruim de uma fonte não trava o site.
_esperado_na_fonte = 0.0


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
        try:
            numero_convertido = float(valor)
            return numero_convertido if math.isfinite(numero_convertido) else None
        except OverflowError:
            return None
    texto = str(valor).strip()
    if not texto:
        return None
    if "," in texto:  # formato brasileiro: ponto separa milhar, vírgula separa centavos
        texto = texto.replace(".", "").replace(",", ".")
    try:
        numero_convertido = float(texto)
        return round(numero_convertido, 2) if math.isfinite(numero_convertido) else None
    except (ValueError, OverflowError):
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


def nova_fonte():
    """Zera a conta de espera: o coordenador (atualizar.py) chama antes de cada fonte."""
    global _esperado_na_fonte
    _esperado_na_fonte = 0.0


def segundos_de_espera(cabecalho, agora=None):
    """Lê o cabeçalho Retry-After: "30" -> 30; uma data HTTP -> segundos até ela; data passada -> 0;
    ausente ou inválido -> None (quem chamou usa a espera padrão). Não aplica limite: isso é com esperar()."""
    if not cabecalho:
        return None
    texto = str(cabecalho).strip()
    if texto.isdigit():
        return int(texto)
    try:
        data = parsedate_to_datetime(texto)
    except (TypeError, ValueError, IndexError, OverflowError):
        return None
    if data is None:
        return None
    if data.tzinfo is None:                      # data HTTP sem fuso: por norma, é GMT
        data = data.replace(tzinfo=timezone.utc)
    agora = agora or datetime.now(timezone.utc)
    return max(0, int((data - agora).total_seconds()))


def esperar(segundos):
    """Espera antes de tentar de novo, com dois limites: 5 min por espera e 15 min somados na mesma fonte."""
    global _esperado_na_fonte
    s = max(0, min(segundos, ESPERA_MAXIMA))
    if _esperado_na_fonte + s > ESPERA_TOTAL_POR_FONTE:
        raise RuntimeError(f"a fonte pediu mais de {ESPERA_TOTAL_POR_FONTE // 60} minutos de espera somados; "
                           "fica para a próxima atualização (a cópia anterior foi mantida)")
    _esperado_na_fonte += s
    time.sleep(s)


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

            # Respeita Retry-After tanto para 429 quanto para 5xx (segundos ou data HTTP). Os limites ficam em esperar().
            espera = segundos_de_espera(erro.headers.get("Retry-After") if erro.headers else None)

            if erro.code == 429:
                # A fonte pediu para irmos mais devagar: respeitamos Retry-After ou
                # usamos 30, 60, 90... segundos quando o cabeçalho não existe.
                espera = ESPERA_429 * tentativa if espera is None else espera
                print(f"    fonte pediu calma (HTTP 429): esperando {min(espera, ESPERA_MAXIMA)} s antes de tentar de novo")
            else:
                # Erros temporários 5xx também podem informar Retry-After. Sem ele,
                # mantemos a espera progressiva curta já usada pelo robô.
                espera = 5 * tentativa if espera is None else espera
                print(f"    servidor respondeu HTTP {erro.code}: nova tentativa em {min(espera, ESPERA_MAXIMA)} s")
            esperar(espera)
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
        esperar(5 * tentativa)  # espera um pouco mais a cada nova tentativa (conta no limite da fonte)


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
