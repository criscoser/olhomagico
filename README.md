# Olho Mágico

Portal independente de transparência de Videira/SC.

Site independente que mostra, em linguagem simples:
- **Gastos da Prefeitura**: quanto foi pago, a quem, por qual secretaria e de onde veio o dinheiro (busca ao vivo).
- **Servidores**: quem trabalha na Prefeitura, vínculo, cargo, setor e salário-base (cópia diária da API de Pessoal).
- **Contratos**: licitações, compras e contratos publicados no PNCP, com link para cada registro oficial (cópia diária).
- **Contas e limites**: gasto com pessoal × limites da Lei de Responsabilidade Fiscal, da Prefeitura e da Câmara (cópia diária do SICONFI).

Nada de banco de dados. Os gastos são buscados na hora. A lista de servidores é copiada uma vez por dia
por um robô e publicada junto com o site, sem guardar cópias antigas.

## Como abrir
Dê duplo clique em `index.html`. Para ter as abas Servidores, Contratos e Contas no seu computador, rode antes
`python ferramentas/atualizar.py` (atualiza todas as fontes; leva alguns minutos). Para publicar: `docs/COMO_PUBLICAR.md`.

## Pastas e arquivos
- `index.html` — textos e estrutura (abas Gastos e Servidores)
- `css/estilo.css` — cores e visual (paleta uva e vinho; mude as cores em `:root`)
- `js/config.js` — configurações (nome, APIs, Pix, privacidade, explicações, vínculos)
- `js/utilitarios.js` — funções pequenas (dinheiro, CPF mascarado, datas, endereço amigável)
- `js/fontes/` — `despesas.js` (API de despesas, ao vivo), `arquivos.js` (carrega `dados/*.js`), `pessoal.js`
- **Regras (sem tela, testadas):** `agregacao.js` (gastos), `pessoal-regras.js`, `contratos-regras.js`,
  `contas-regras.js` (LRF, despesa por área, educação, entregas), `transferencias-regras.js`,
  `busca-regras.js` (pesquisa geral), `historico.js` (vários meses de despesas, uma consulta por vez)
- `js/dados.js` — carrega e prepara cada conjunto de dados uma vez só, para todas as telas
- **Componentes:** `componentes/menu.js` (menu lateral e do celular), `componentes/blocos.js` (avisos de estado, cartões de indicador, abas da ficha), `componentes/graficos.js` (barras, colunas, histograma, medidor, vigência, sem biblioteca externa),
  `componentes/tabela.js` (tabela ordenável, com paginação e modo cartão no celular),
  `componentes/filtros.js` (chips de filtro e números-resumo), `origem.js` ("Origem da informação"), `exportar.js` (planilhas CSV)
- **Telas:** `inicio-tela.js` (painel), `interface.js` (Gastos do mês), `pessoal-tela.js`, `contratos-tela.js`,
  `contas-tela.js`, `camara-tela.js`, `busca-tela.js` (pesquisa geral), `fichas.js` (servidor, fornecedor, contrato), `situacao-tela.js`
- `js/rotas.js` — navegação pelo endereço: `#inicio`, abas, `#gastos/2026-09`, `#contas/transferencias`, `#busca/termo`,
  `#servidor/ID`, `#fornecedor/CNPJ`, `#contrato/ID`
- `js/apoio.js` — botão e caixa de doação por Pix
- `js/main.js` — liga tudo
- `ferramentas/atualizar.py` — coordenador dos robôs: atualiza cada fonte separadamente e grava `dados/situacao.js`
- `ferramentas/fontes/` — um adaptador por fonte: `pessoal.py`, `siconfi.py`, `pncp.py`, `transferencias.py`, `dca.py`, `entregas.py`, `siope.py`, `cgu.py` (chave `CGU_CHAVE`), `camara.py` (token `CAMARA_TOKEN`)
- `ferramentas/comum.py` — peças comuns (download com novas tentativas, detecção de captcha, gravação segura)
- `ferramentas/municipio.json` — identificação do município (IBGE, CNPJ, endereços): troque para usar em outra cidade
- `ferramentas/atualizar_pessoal.py` — atalho antigo (só a lista de servidores)
- `.github/workflows/publicar.yml` — roda testes + robô + publicação no GitHub, todo dia
- `dados/` — onde o robô grava um arquivo por fonte (veja `dados/LEIA-ME.txt`)
- `testes/` — `testes.html` (navegador), `rodar_testes.js` (`node testes/rodar_testes.js`) e `test_robos.py`
  (`python -m unittest discover -s testes -p "test_*.py"`, com servidor simulado)
- `docs/` — relatório do guia de front-end (`RELATORIO_GUIA_FRONTEND.md`), como publicar, relatório da auditoria (`AUDITORIA.md`), matriz de fontes oficiais (`FONTES.md`) e o pedido pela Lei de Acesso à Informação

## Fontes de dados
- Despesas: `https://videira.atende.net/api/WCPDadosAbertos/despesas` (API de Dados Abertos - Contabilidade)
- Servidores: `https://videira.atende.net/api/transparencia-pessoal-funcionarios` (API de Pessoal)
- Contratos: PNCP (`https://pncp.gov.br/api/consulta/v1/...`)
- Contas: SICONFI (`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`: `rgf`, `dca`, `extrato_entregas`)
- Repasses da União: Tesouro (`https://apiapex.tesouro.gov.br/aria/v1/transferencias_constitucionais/custom/`)
- Educação: SIOPE/FNDE (`https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata/`)
- Situação de todas as fontes investigadas: `docs/FONTES.md`

## Privacidade (decisões do projeto)
- Gastos: CPF de pessoa física aparece mascarado. Para esconder também o nome, use
  `MOSTRAR_NOME_PESSOA_FISICA: false` em `js/config.js`.
- Servidores: mostramos nome, cargo, função, setor, vínculo, forma de ingresso, mês/ano de admissão,
  horas por mês e salário-base. **Não** guardamos nem mostramos CPF, matrícula, horário,
  local de trabalho nem a situação "afastado" (poderia revelar licença de saúde).

## Trocar o nome do site
`NOME_SITE` em `js/config.js`, mais o `<title>` e as tags `og:` no `index.html`.

## Doações (Pix)
`PIX_CHAVE` em `js/config.js` está com a chave FALSA `123456789`. **Troque antes de divulgar.**
Se deixar vazio (''), o botão some. O site não guarda nenhum dado de quem doa.

## Explicações automáticas
`EXPLICACOES` (credores) e `PESSOAL.VINCULOS` (tipos de vínculo) em `js/config.js`.
Só acrescente regras que sejam certas pelo próprio nome.

## Próximas fontes
- Câmara (vereadores, projetos, pautas, folhas): API da Câmara, que exige token.
  O token nunca vai no site nem no GitHub; precisa de um intermediário (função serverless).
