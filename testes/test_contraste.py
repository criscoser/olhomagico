"""
TESTE DE CONTRASTE DAS CORES (WCAG 2.2, nível AA). Rodar: python -m unittest discover -s testes -p "test_*.py"

Lê os "tokens" de cor direto do css/estilo.css, nos temas claro e escuro, e confere cada par usado no site:
  - texto sobre fundo: pelo menos 4,5:1;
  - bordas de campos/botões, barras de gráfico e contorno de foco: pelo menos 3:1.
Também confere que os dois blocos do tema escuro (preferência do sistema e escolha no botão) são IGUAIS.
"""
import re
import unittest
from pathlib import Path

CSS = (Path(__file__).resolve().parent.parent / "css" / "estilo.css").read_text(encoding="utf-8")

TEXTO = [  # (cor do texto, cor do fundo)
    ("texto", "fundo"), ("texto", "cartao"), ("texto", "cartao-2"), ("texto", "marca-suave"), ("texto", "aviso-fundo"),
    ("texto-2", "fundo"), ("texto-2", "cartao"), ("texto-2", "cartao-2"), ("texto-2", "marca-suave"), ("texto-2", "aviso-fundo"),
    ("marca", "fundo"), ("marca", "cartao"), ("marca", "cartao-2"), ("marca", "marca-suave"),
    ("sobre-marca", "marca"), ("sobre-destaque", "destaque"),
    ("destaque-texto", "fundo"), ("destaque-texto", "cartao"), ("destaque-texto", "aviso-fundo"),
    ("erro", "fundo"), ("erro", "cartao"),
    ("menu-texto", "menu-fundo"), ("menu-texto-2", "menu-fundo"), ("menu-texto", "menu-ativo/menu-fundo"),
]
NAO_TEXTO = [  # bordas, gráficos e foco
    ("borda-forte", "cartao"), ("borda-forte", "fundo"),
    ("grafico", "cartao"), ("grafico", "fundo"), ("grafico", "marca-suave"), ("grafico-destaque", "cartao"),
    ("destaque-borda", "fundo"), ("foco", "fundo"), ("foco", "cartao"), ("menu-marcador", "menu-fundo"),
]


def bloco(seletor_regex):
    m = re.search(seletor_regex + r"\s*\{(.*?)\}", CSS, re.S)
    if not m:
        raise AssertionError(f"bloco não encontrado: {seletor_regex}")
    return {k: v.strip() for k, v in re.findall(r"--([\w-]+)\s*:\s*([^;]+);", m.group(1))}


# Tema claro: o primeiro bloco ":root {" do arquivo (é o padrão).
CLARO = {k: v.strip() for k, v in re.findall(r"--([\w-]+)\s*:\s*([^;]+);", re.search(r"\n:root \{(.*?)\n\}", CSS, re.S).group(1))}
ESCURO_SISTEMA = bloco(r':root:not\(\[data-tema="claro"\]\)')
ESCURO_BOTAO = bloco(r':root\[data-tema="escuro"\]')
ESCURO = dict(CLARO, **ESCURO_BOTAO)   # o escuro herda do claro o que não redefine (ex.: cores do menu)


def rgb(valor):
    """'#AABBCC' -> (r, g, b, 1); 'rgba(r, g, b, a)' -> (r, g, b, a)."""
    valor = valor.strip()
    m = re.fullmatch(r"#([0-9a-fA-F]{6})", valor)
    if m:
        h = m.group(1)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (1.0,)
    m = re.fullmatch(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)", valor)
    if m:
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4)))
    raise ValueError(f"cor não reconhecida: {valor}")


def cor(tema, nome):
    """Cor final (sem transparência). "a/b" = cor "a" (transparente) pintada sobre "b"."""
    if "/" in nome:
        frente, fundo = nome.split("/")
        f, b = rgb(tema[frente]), cor(tema, fundo)
        a = f[3]
        return tuple(round(f[i] * a + b[i] * (1 - a)) for i in range(3))
    r = rgb(tema[nome])
    assert r[3] == 1.0, f"{nome} tem transparência; use 'cor/fundo'"
    return r[:3]


def luminancia(c):
    canais = [x / 255 for x in c]
    canais = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in canais]
    return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2]


def contraste(a, b):
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


class TestContraste(unittest.TestCase):
    def conferir(self, tema, nome_tema):
        for pares, minimo in ((TEXTO, 4.5), (NAO_TEXTO, 3.0)):
            for frente, fundo in pares:
                with self.subTest(tema=nome_tema, par=f"{frente} sobre {fundo}"):
                    valor = contraste(cor(tema, frente), cor(tema, fundo))
                    self.assertGreaterEqual(valor, minimo, f"{nome_tema}: {frente} sobre {fundo} = {valor:.2f}:1 (mínimo {minimo})")

    def test_tema_claro(self):
        self.conferir(CLARO, "claro")

    def test_tema_escuro(self):
        self.conferir(ESCURO, "escuro")

    def test_dois_blocos_do_escuro_iguais(self):
        self.assertEqual(ESCURO_SISTEMA, ESCURO_BOTAO)

    def test_nao_usa_o_azul_da_prefeitura(self):
        self.assertNotIn("#1358a4", CSS.lower().replace("(#1358a4)", ""))   # só a menção no comentário


if __name__ == "__main__":
    unittest.main()
