# Relatório: aplicação do "Guia técnico de UI/UX e implementação do front-end" (02/10/2026)

Backup feito antes das mudanças: `olhomagico_antes_guia_frontend.zip`.

## A e B: inspeção e mapeamento (seção visual → fonte real)

| Seção do guia | O que aparece | Fonte / campo real | Situação |
|---|---|---|---|
| Visão geral: total pago, empenhado, liquidado, credores | Cartões do mês escolhido | API de despesas (`valorPago`, `valorEmpenhado`, `valorLiquidado`, `cpfCnpjCredor`), consulta ao vivo | Integrado |
| Visão geral: servidores | Cartão | `dados/situacao.js` → `pessoal.resumo.registros` | Integrado |
| Visão geral: evolução das despesas | Gráfico de 12 meses (só depois de consultar) | API de despesas, uma consulta por mês | Integrado |
| Despesas: filtros | Órgão, unidade, origem, credor | `orgaoDescricao`, `unidadeDescricao`, `fonteRecursoDescricao`, `nomeCredor` / CNPJ | Integrado |
| Despesas: data, categoria, descrição | Não aparecem | A API devolve totais do mês, sem data nem descrição por linha | **Ausente na fonte** |
| Despesas: link oficial por registro | Link da consulta do mês | A API não tem endereço por registro | **Limitação declarada** |
| Servidores: busca e filtros | Nome/cargo/setor, cargo, vínculo, lotação | `nome`, `cargo`, `centroCusto`, `regime` | Integrado |
| Ficha: salário-base | Cartão | `salarioBase` | Integrado |
| Ficha: remuneração bruta, descontos, líquido | Mostrado como "Não publicado em formato aberto" | Só na tela "Funcionário x Salário" (com captcha) | **Não integrado** |
| Ficha: diárias | "Dados ainda não integrados" | Nenhuma fonte aberta validada | **Não integrado** |
| Ficha: histórico | Só a cópia atual | A fonte não tem histórico | **Limitação declarada** |
| Licitações e contratos | Tabelas, fornecedores, fichas | PNCP | Integrado |
| Transferências | Seção em "Contas e transferências" | Tesouro, transferências constitucionais | Integrado |
| Receitas públicas | Não aparece no menu | API de receitas da Prefeitura não validada | **Não integrado** (sem item de menu, para não haver seção vazia) |

## C a E: o que foi feito

- **Design system:** tokens em `:root` (cores do guia, espaçamentos, raios, sombra), modo escuro e borda de campos com contraste 3:1.
  O dourado (#D5A441) tem só 2,3:1 sobre branco, então é usado apenas em bordas e sobre o verde escuro.
- **Navegação:** menu lateral fixo acima de 1024 px; até 1024 px vira barra com botão "Menu" (`aria-expanded`, Esc fecha e devolve o foco, fecha ao escolher).
  Link "Pular para o conteúdo". Cabeçalho com contexto, pesquisa e data da última atualização (destacada se alguma fonte falhou ou a cópia tem mais de 3 dias).
- **Componentes novos:** `componentes/blocos.js` (StatusMessage, KpiCard, abas internas com teclado, competência, aviso de desatualizado), `componentes/menu.js`.
  A tabela (`componentes/tabela.js`) ganhou **paginação real** (Anterior / Página X de Y / Próxima).
- **Visão geral:** competência (mês/ano) para os cartões de despesa; cada cartão leva a `#gastos/AAAA-MM` (o mês fica no endereço).
  Falha do portal mostra erro, nunca zero. Respostas antigas que chegam atrasadas são ignoradas.
- **Despesas:** seção "Registros do mês" com filtros combináveis, chips de filtros ativos, tabela paginada e planilha que respeita os filtros (os filtros vão escritos no arquivo).
  A busca por números só procura **CNPJ**; CPF nunca é pesquisável.
- **Servidores:** "Pesquisar servidor" no topo, com filtro de cargo. Ficha com abas **Resumo, Remuneração, Diárias, Histórico e Origem dos dados**.
  Salário-base, remuneração bruta, descontos e líquido ficam em campos separados; os indisponíveis aparecem como aviso, nunca como "R$ —".
- **Segurança:** links só são criados para `http(s)://` ou `#...` (`OBS.urlSegura`); links externos com `rel="noopener noreferrer"`.
  A "Origem da informação" mostra o identificador original quando existe (ex.: número de controle do PNCP).

## F e G: testes executados

- `node testes/rodar_testes.js`: **117 testes aprovados** (paginação, link seguro, filtros combinados, CPF não pesquisável, homônimos separados, rota com mês, CSV com filtros, além dos anteriores).
- `python -m unittest discover -s testes -p "test_*.py"`: **11 testes aprovados** (robôs com servidor simulado, incluindo o erro 429).
- Navegador (Chromium, com dados FICTÍCIOS fora do projeto): 1366 px, 800 px, 640 px (equivale a zoom de 200%), 390 px e 320 px, claro e escuro.
  Sem rolagem horizontal em nenhuma tela; sem erros no console.
  Teclado: setas trocam as abas da ficha; o menu do celular abre, fecha com Esc (o foco volta ao botão) e fecha ao escolher uma seção.

## Não testado (pendente)

- Leitor de tela real (NVDA, TalkBack ou VoiceOver).
- Firefox e Safari, celulares reais e conexão lenta.
- Dados reais nas novas telas (o ambiente do Claude não alcança as APIs; os testes visuais usaram dados fictícios).

## Divergências entre o guia e o projeto (e a decisão)

- O guia pede "data" e "descrição" na tabela de despesas: a fonte não tem esses campos. **Não foram inventados.**
- O guia lista "Receitas públicas" no menu: a fonte não foi validada. **O item não foi criado.**
- O guia mostra o selo "Fonte verificada": o site não verifica cada registro, então o selo diz "Fonte: lista oficial de servidores, situação em DD/MM/AAAA".
