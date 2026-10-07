# Fontes oficiais: matriz de disponibilidade e arquitetura proposta (02/10/2026)

Fase 1 da "Missão de engenharia". Nada aqui foi inventado: cada linha diz **como** foi verificada.

## Identificação de Videira (confirmada em duas fontes)

| Identificador | Valor | Onde foi confirmado |
|---|---|---|
| Código IBGE | **4219309** | SICONFI (`/tt/entes`) |
| Código TCE-SC | **421930** (IBGE sem o dígito final) | TCE-SC (`municipios.php`) |
| CNPJ do Município | **83.039.842/0001-84** | SICONFI e PNCP (`/v1/orgaos`) |

A API do IBGE não respondeu (tempo esgotado), então o código foi confirmado pelo Tesouro.

## Situação de cada fonte

Legenda: **Integrada** = já usada no site · **Validada** = testada com dados reais · **Parcial** = respondeu, mas falta confirmar parte · **Pendente** = não testada · **Bloqueada** = só para humanos.

| Fonte (órgão) | Acesso | Chave? | Filtro por Videira | Situação | O que traz | Limitações |
|---|---|---|---|---|---|---|
| Despesas, Contabilidade (Prefeitura) | API JSON | Não | domínio `videira.atende.net` | **Integrada** (teste real do usuário em 01/10) | Totais por órgão, unidade, fonte e credor | Agregado; sem link individual; paginação não documentada |
| Pessoal (Prefeitura) | API JSON, 31 páginas de 100 | Não | domínio | **Validada** (3.049 registros, 18 campos) · robô testado só em simulação | Cargo, setor, vínculo, admissão, salário-base | Só salário-base; sem Câmara |
| Receitas, orçadas, restos (Prefeitura) | API JSON | Não | domínio | **Pendente** (só os nomes estão documentados) | — | Parâmetros não confirmados |
| Pagamentos / Funcionário x Salário (Prefeitura) | Telas do portal | — | — | **Bloqueada** (captcha Turnstile) | Pagamento a pagamento; remuneração completa | Não integrável; só link. Pedido pela LAI |
| Câmara (vereadores, projetos, pautas, publicações) | API JSON | **Sim** (token do usuário) | domínio da Câmara | **Pendente** (documentação vista; sem teste) | Vereadores, proposições, pautas, folhas (PDF) | Token não pode ir para o site |
| **SICONFI, RGF** (Tesouro) | API JSON | Não | `id_ente=4219309` | **Validada** (206 itens, anexos 01 e 02) · **Integrada** (aba Contas e limites; robô testado em simulação, falta a 1ª execução real) | Gasto com pessoal × limites da LRF: **41,78% da RCL ajustada** no 3º quadrimestre de 2025 (limite máximo 54%, prudencial 51,3%, alerta 48,6%) | Quadrimestral; valores lidos por ferramenta de resumo, a reconferir no robô |
| **SICONFI, RREO** (Tesouro) | API JSON | Não | `id_ente=4219309` | **Parcial** (92 itens, só o Anexo 01) | Receitas previstas × realizadas | Confirmar paginação e o filtro de anexos (despesa por função) |
| **PNCP, contratações** | API JSON | Não | `codigoMunicipioIbge=4219309` | **Validada** (171 pregões eletrônicos de jan a set/2026; aceita 50 por página) · **Integrada** (aba Contratos; robô testado em simulação) | Objeto, valor estimado e homologado, situação, órgão (Prefeitura, Fundo de Saúde, SAAE, Fundação de Esportes) | Exige uma consulta por modalidade |
| **PNCP, contratos** | API JSON | Não | `cnpjOrgao=83039842000184` | **Validada** (47 contratos na 1ª página) · **Integrada** (aba Contratos) | Objeto, valor, fornecedor, vigência, campo "emenda parlamentar", número de controle | Paginação a confirmar |
| Portal da Transparência (CGU) | API JSON | **Sim** (cadastro por e-mail) | `codigoIbge` nos benefícios | **Pendente** (só a documentação foi lida) | Benefícios por município, emendas, convênios, recursos recebidos, viagens | Os servidores ali são **federais**, não municipais. Limite de 400 consultas/min. Confirmar o nome do cabeçalho da chave com a chave em mãos |
| Transferegov | Dados abertos | ? | ? | **Pendente** (endereço técnico não confirmado: leitura bloqueada) | Transferências especiais, convênios | — |
| TCE-SC | API só de cadastro; painéis | Não | `421930` | **Investigada**: sem API de despesas ou pessoal | Farol: painéis de empenhos | Painel não é API; e-Sfinge não tem consulta pública por API |
| Diário Oficial (DOM/SC via CIGA) | Arquivos ZIP por período | Não | texto | **Parcial** (arquivos existem; conteúdo não aberto) | Atos: nomeações, portarias, extratos | Processamento em lote |

## Onde discordo da missão (e o que proponho)

1. **"Ficha completa do servidor" com remuneração bruta, líquida e diárias.** Hoje não existe fonte aberta para isso em Videira: a remuneração completa e os pagamentos estão atrás de captcha, e os servidores da CGU são federais. Construir essa ficha agora seria uma tela vazia. **Proposta:** a ficha mostra o que existe (dados funcionais e salário-base) e declara o que falta. O resto depende do pedido pela LAI.
2. **Associação de pessoas entre fontes.** Nome igual não é identidade (homônimos), e um cruzamento errado vira acusação injusta. **Proposta:** cruzar pessoas **só por CPF**, e só quando as duas fontes oficiais trouxerem o documento (hoje a API de despesas traz o CPF completo dos credores pessoa física, e a base de servidores de Videira traz o CPF **mascarado**, só os 6 dígitos do meio, como `***.456.789-**`; o quadro societário da Receita usa a mesma máscara). Seis dígitos não identificam uma pessoa com certeza (há só 1 milhão de combinações, então coincidências ao acaso acontecem), por isso uma coincidência parcial **não é ligação**: serve apenas para revisão interna, nunca para publicação. Para ligação forte é preciso CPF completo nas duas fontes (por exemplo, via pedido pela LAI). O cruzamento roda no robô, com HMAC-SHA256 do CPF (Secret `CPF_SALT`), e só o resultado é publicado, com CPF mascarado e links das fontes. Sem CPF nas duas fontes, não há ligação. **Órgãos e empresas** continuam sendo cruzados por **CNPJ** (Prefeitura × PNCP × despesas).
3. **Arquivo grande de servidores.** O arquivo atual (estimado em menos de 1 MB, que o servidor compacta) é aceitável. Se crescer, divido por letra inicial.

## Arquitetura proposta (simples, sem banco de dados)

```
municipio.json                ← nome, UF, IBGE 4219309, TCE 421930, CNPJ, endereços dos portais
ferramentas/
  atualizar.py                ← roda cada fonte SEPARADAMENTE; uma falha não derruba as outras
  fontes/
    prefeitura_pessoal.py     ← (já existe, vira um "adaptador")
    siconfi.py                ← RGF/RREO
    pncp.py                   ← contratações e contratos
    cgu.py                    ← quando houver a chave (guardada como "segredo" do GitHub)
dados/
  pessoal.js, siconfi.js, pncp.js ...   ← um arquivo por fonte, com o bloco "fonte" em cada registro
  situacao.js                 ← última tentativa, último sucesso e erro, POR FONTE
```

- **Cada registro guarda a origem:** fonte, URL, identificador original, data da coleta e método.
- **A última versão válida fica preservada:** antes de coletar, o robô baixa os arquivos que estão publicados no próprio site. Se uma fonte falhar, publica de novo a versão anterior dela. Nada vazio substitui dado válido.
- **Outros municípios no futuro:** basta outro `municipio.json`.
- **Front-end:** uma aba por assunto **com dado real**. Por exemplo, "Contratos" (PNCP, com link para cada contrato) e "Contas da Prefeitura" (o indicador da LRF). Nada de abas vazias.

## Ordem sugerida (ajustada pelas evidências)

1. **SICONFI:** indicador de gasto com pessoal × limite da LRF. É público, pequeno, validado e de alto valor.
2. **PNCP:** contratos e licitações de Videira, cada um com link oficial individual.
3. **CGU:** benefícios, emendas e convênios, quando a chave chegar.
4. **Câmara:** vereadores, quando chegar o token.
5. **Transferegov e Diário Oficial**, depois de confirmar o acesso.

## Fase 2 (feita em 02/10/2026)

- **Adaptadores:** `ferramentas/fontes/pessoal.py`, `siconfi.py` e `pncp.py`, com um coordenador (`ferramentas/atualizar.py`) que roda cada fonte separadamente e grava `dados/situacao.js`.
- **Município em configuração:** `ferramentas/municipio.json` (IBGE, TCE-SC, CNPJ e endereços).
- **Links individuais confirmados com dados reais (02/10/2026):**
  - compra: `https://pncp.gov.br/api/consulta/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}`
  - contrato: `https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}`
  - O endereço antigo da compra (`/api/pncp/v1/...compras`) foi movido; o novo foi confirmado.
  - **Atualizado em 03/10/2026:** os endereços acima devolvem JSON (servem para programas). O site agora
    leva para as páginas do PNCP feitas para pessoas, confirmadas no navegador:
    compra `https://pncp.gov.br/app/editais/{cnpj}/{ano}/{sequencial}` e
    contrato `https://pncp.gov.br/app/contratos/{cnpj}/{ano}/{sequencial}`.
- **Robôs testados só com servidor simulado.** A primeira execução real deve acontecer no seu computador ou no GitHub.
- **Ainda não confirmado:** se a API de contratos do PNCP aceita mais de uma página (o robô percorre as páginas até vir vazia) e se o intervalo de 12 meses é aceito em todas as modalidades.

## Validação das APIs do Tesouro e do FNDE (02/10/2026, testes reais)

| Fonte | Endereço testado | Resultado para Videira |
|---|---|---|
| SICONFI, DCA (contas anuais) | `/ords/siconfi/tt/dca?an_exercicio=2024&no_anexo=DCA-Anexo I-E&id_ente=4219309` | **Validada**: 240 linhas; despesa por função (ex.: Saúde R$ 60,8 mi e Educação R$ 102,4 mi empenhados em 2024) |
| SICONFI, extrato de entregas | `/ords/siconfi/tt/extrato_entregas?id_ente=4219309&an_referencia=2025` | **Validada**: 39 registros (Prefeitura e Câmara; RGF, RREO, DCA, MSC; situação e data) |
| SIOPE, indicadores | `Indicadores_Siope(Ano_Consulta=2024,Num_Peri=6,Sig_UF='SC')?$filter=COD_MUNI eq 421930` | **Validada pelo usuário no navegador**: ex.: 28,08% das receitas aplicadas em educação (mínimo 25%) |
| SIOPE, remuneração | `Remuneracao_Siope(Ano_Declaracao=2024,Num_Peri=6,Mes_Exercicio=12,Sig_UF='SC')?$filter=COD_MUNI eq 421930` | **Validada pelo usuário**: remuneração **nominal** de profissionais da educação (nome, escola, categoria, vínculo, carga horária, salário, parcelas do FUNDEB). Envolve dados pessoais: decidir antes de publicar |
| Transferências constitucionais | `.../custom/por_estado_municipio?p_estado=24&p_municipio=8379&p_ano=2025` | **Validada pelo usuário**: valores mensais por tipo (FPM, FUNDEB, ajuste FUNDEB, CIDE, ITR, royalties, LC 176/2020). Paginada (10 por página, com link `next`). A resposta traz `CO_IBGE` 4219309, o que confirma que o código 8379 é Videira. Ex.: FPM de janeiro/2025: R$ 3.622.769,83 |

Observações: no SIOPE o município usa o código IBGE **sem o dígito final** (421930); o filtro `$filter` funciona no navegador, mas não pela ferramenta de leitura do Claude.

### Códigos de Videira em cada sistema (todos confirmados com resposta real)

| Sistema | Código |
|---|---|
| IBGE (SICONFI, PNCP) | 4219309 |
| TCE-SC e SIOPE | 421930 |
| Tesouro, transferências constitucionais | município 8379, estado (SC) 24 |
| CNPJ do Município | 83.039.842/0001-84 |

## Fase 5 (feita em 02/10/2026): novo front-end e fontes integradas

**Fontes que passaram de "validada" para "integrada"** (robô + tela; testadas só com servidor simulado, falta a 1ª execução real):

| Fonte | Robô | Arquivo | Onde aparece |
|---|---|---|---|
| Transferências constitucionais | `fontes/transferencias.py` (segue o link `next` reaproveitando só o número da página, porque o link aponta para um endereço interno do Tesouro) | `transferencias.js` | Início e Contas públicas |
| SICONFI, DCA Anexo I-E | `fontes/dca.py` (funções e subfunções; colunas separadas) | `dca.js` | Início e Contas públicas |
| SICONFI, extrato de entregas | `fontes/entregas.py` | `entregas.js` | Início e Contas públicas |
| SIOPE, indicadores | `fontes/siope.py` (do 6º bimestre para trás, fica o mais recente) | `siope.js` | Início e Contas públicas |

**Ainda NÃO integrada:** SIOPE, remuneração nominal (precisa de decisão sobre publicar nomes; e não pode ser ligada às fichas de servidor, porque a fonte de remuneração não traz um identificador que ligue com segurança: sem CPF completo nem matrícula comum às duas fontes, só sobraria o nome).

**Telas novas:** Início (quadros com período e fonte), pesquisa geral, fichas de servidor (registro), fornecedor (contratos + pagamentos de 12 meses pelo CNPJ) e contrato (vigência e licitação de origem), tabelas ordenáveis, filtros com chips, gráficos de colunas e histograma, evolução de 12 meses nos gastos.

**Pontos a conferir na primeira execução real:**
- Transferências: se o campo `MES` vem como número ou nome (o robô aceita os dois) e se o link `next` traz `page` ou `offset`.
- SIOPE: se os nomes dos indicadores contêm "Percentual" e "MDE"/"FUNDEB", para os mínimos legais aparecerem.
- Extrato: o significado de outros códigos de `status_relatorio` além de `HO` (mostrado como "Homologado").

## CGU e Câmara (integradas em 02/10/2026, com as chaves do projeto)

| Fonte | Robô | Arquivo | Chave | O que traz |
|---|---|---|---|---|
| Portal da Transparência (CGU) | `fontes/cgu.py` | `cgu.js` | `CGU_CHAVE`, no cabeçalho `chave-api-dados` | Convênios com Videira (`/convenios?codigoIBGE=`), Bolsa Família e BPC por mês (`/novo-bolsa-familia-por-municipio`, `/bpc-por-municipio`) |
| Câmara de Videira | `fontes/camara.py` | `camara.js` | `CAMARA_TOKEN`, no endereço (`keysoft=`) | Vereadores e pautas |

- Estrutura conferida pelo usuário com `ferramentas/investigar_chaves.py` (só nomes de campos, sem valores).
- **Emendas da CGU ficaram de fora:** `/emendas` não filtra por município.
- **Proposições da Câmara ficaram de fora:** o formato ainda não foi conferido.
- As chaves vêm só do ambiente (PowerShell ou segredos do GitHub). Sem chave, a fonte é pulada.
  Qualquer chave que aparecer numa mensagem de erro é trocada por `***` antes de gravar `situacao.js`. Testado.
