# Alterações desta cópia

## Correções aplicadas

- [Segurança] Mascarar token da Câmara também na mensagem impressa quando a fonte é bloqueada por CAPTCHA.
- [Confiabilidade] Respeitar `Retry-After` em respostas HTTP 429 e 5xx, aceitando segundos ou data HTTP e limitando a espera a 300 segundos.
- [Integridade] Rejeitar `NaN`, infinitos e inteiros grandes demais no conversor numérico Python.
- [Operação] Separar no resumo final fontes atualizadas, puladas por falta de chave e fontes com falha.
- [Testes] Adicionar regressões para os comportamentos acima.
- [Documentação] Acrescentar auditoria técnica atual e sinalizar o relatório anterior como histórico.

## Arquivos de código alterados

- `ferramentas/atualizar.py`
- `ferramentas/comum.py`
- `testes/test_robos.py`
- `docs/AUDITORIA.md` (aviso histórico no topo)

Nenhuma configuração de município, endpoint, valor Pix ou identidade de beneficiário foi alterada.
