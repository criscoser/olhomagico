# Testes e validação local

## Resultado desta cópia

- JavaScript: `node testes/rodar_testes.js` — **193 testes aprovados**.
- Python: `python3 -m unittest discover -s testes -p "test_*.py" -v` — **32 testes aprovados**.
- Sintaxe Python: 22 arquivos analisados com `ast.parse`, sem erro.
- Sintaxe JavaScript: 43 arquivos verificados com `node --check`, sem erro.
- Referências locais do HTML: todos os scripts e folhas de estilo referenciados existem no ZIP.
- Arquivos candidatos a `.env`, chave privada ou certificado privado: nenhum encontrado pelo inventário de nomes.

## Como repetir

Na raiz do projeto:

```bash
node testes/rodar_testes.js
python -m unittest discover -s testes -p "test_*.py" -v
python testes/test_contraste.py
```

No Windows PowerShell, use `python` se esse for o comando configurado no ambiente.

## O que esses testes cobrem

Os testes Python usam um servidor HTTP local simulado e dados fictícios. Cobrem adaptadores, paginação, preservação de snapshots, credenciais de teste, detecção de CAPTCHA, mascaramento, cálculos, conversões e integridade do Pix. Os testes JavaScript cobrem regras e cálculos da interface, exportação CSV, rotas, filtros, dados ausentes, siglas e QR Pix.

## O que ainda exige teste humano/externo

- Atualizar fontes reais em ambiente controlado, sem imprimir tokens.
- Conferir amostras com os portais oficiais.
- Testar o site publicado e a CSP no navegador.
- Testar Firefox, Safari, celular e leitor de tela.
- Confirmar o Secret `PIX_SHA256` e os Secrets de API no GitHub.
- Validar os arquivos `dados/*.js` reais, que não vieram no ZIP.
