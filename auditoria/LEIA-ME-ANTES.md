# Auditoria do Olho Mágico — pacote de revisão

Este pacote contém uma cópia de trabalho do projeto e um conjunto de correções pontuais para revisão local.

## O que foi alterado nesta cópia

- `ferramentas/atualizar.py`: mensagens de bloqueio/CAPTCHA agora mascaram o token antes de imprimir ou gravar o erro.
- `ferramentas/comum.py`: o cliente HTTP respeita `Retry-After` em respostas HTTP 429 e 5xx, aceitando segundos ou data HTTP e limitando a espera a 300 segundos.
- `ferramentas/comum.py`: números `NaN`, infinitos e inteiros grandes demais são rejeitados como inválidos.
- `ferramentas/atualizar.py`: resumo distingue fontes atualizadas, puladas por falta de chave e fontes com falha.
- `testes/test_robos.py`: testes de regressão para vazamento de token em CAPTCHA, espera `Retry-After`, rejeição de números não finitos e contagem de fontes puladas.

## O que NÃO foi feito

- Nenhum commit, push, publicação ou acesso à conta GitHub.
- Nenhuma alteração nos valores Pix, titular/beneficiário, endpoints ou configurações de município.
- Nenhuma nova funcionalidade do portal.
- Nenhuma tentativa de contornar CAPTCHA, autenticação, WAF ou limites de consulta.
- Nenhuma consulta a APIs externas durante esta auditoria.

## Como revisar

1. Compare esta cópia com a sua versão local usando o diff do Git.
2. Leia `RELATORIO_COMPLETO.md`, `MATRIZ_SEGURANCA.md`, `INTEGRIDADE_DADOS.md` e `ESCALABILIDADE.md`.
3. Rode os comandos de `TESTES_E_VALIDACAO.md` no seu computador.
4. Confira especialmente as configurações Pix e as variáveis secretas no GitHub, sem enviar seus valores a ninguém.
5. Só depois decida quais alterações deseja aproveitar e faça seus próprios commits.

Os testes usam dados fictícios e servidor HTTP local simulado. Eles não provam que as fontes oficiais continuam respondendo nem que os valores publicados estão corretos.
