#!/usr/bin/env python3
"""Atalho antigo, mantido por compatibilidade: atualiza só a lista de servidores.
O comando novo, que atualiza todas as fontes, é: python ferramentas/atualizar.py"""
import sys
from pathlib import Path

sys.argv = [sys.argv[0], "--so", "pessoal"] + sys.argv[1:]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from atualizar import principal  # noqa: E402

if __name__ == "__main__":
    sys.exit(principal())
