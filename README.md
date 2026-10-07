# Olho Mágico

> Portal Independente de Transparência Fiscal e Administrativa (Videira/SC)

[![Site no ar](https://img.shields.io/badge/site-no%20ar-2ea44f)](https://criscoser.github.io/olhomagico/)
[![Atualizar e publicar o site](https://github.com/criscoser/olhomagico/actions/workflows/publicar.yml/badge.svg)](https://github.com/criscoser/olhomagico/actions/workflows/publicar.yml)
[![Python](https://img.shields.io/badge/Python-biblioteca%20padr%C3%A3o-3776AB?logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-puro-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Arquitetura: sem servidor](https://img.shields.io/badge/arquitetura-sem%20servidor-555)](#arquitetura-e-fluxo-de-dados)

**Acesse o site:** https://criscoser.github.io/olhomagico/

O **Olho Mágico** é uma plataforma independente desenvolvida para auditar, consolidar e apresentar dados públicos do município de Videira/SC de forma simplificada e auditável. O sistema processa informações financeiras, contratuais e de recursos humanos, eliminando a complexidade dos portais oficiais de transparência.

---

## Recursos Principais

- **Módulo Financeiro (Gastos)**: Consulta direta, no navegador, das despesas do Município por mês, por credor e por órgão, nas etapas empenhado, liquidado e pago; despesa anual por área de governo (DCA, via SICONFI).
- **Módulo de Receitas (Entradas)**: Receita prevista e realizada do ano (RREO, via SICONFI), origem do dinheiro nos últimos 12 meses e repasses da União (transferências constitucionais).
- **Módulo de Recursos Humanos (Servidores)**: Consolidação de vínculos, cargos, lotações e salário-base, estruturados em árvore organizacional.
- **Módulo de Suprimentos (Contratos)**: Integração e indexação automatizada de licitações e contratos publicados no PNCP (Portal Nacional de Contratações Públicas).
- **Módulo de Responsabilidade Fiscal (Limites da lei)**: Gasto com pessoal e limites da LRF (RGF, via SICONFI), indicadores da educação (SIOPE) e relatórios entregues ao Tesouro.
- **Módulo Legislativo (Câmara)**: Vereadores e pautas das sessões, pela API de dados abertos da Câmara Municipal.
- **Módulo Município**: População, área, densidade e PIB ano a ano (IBGE, SIDRA), com a divisão por setor.
- **Glossário e Leis**: Siglas e termos explicados em linguagem simples, e o resumo das leis de transparência.

---

## Arquitetura e Fluxo de Dados

A engenharia do projeto adota uma abordagem **Zero-Database (Client-Driven)** combinada com pipelines estáticos para garantir escalabilidade e custo zero de infraestrutura:

1. **Camada Operacional (Gastos)**: Consumo direto e síncrono das APIs da contabilidade pública municipal no navegador do usuário, eliminando armazenamento intermediário.
2. **Camada Estática (Servidores/Contratos/Contas)**: Pipelines automatizados realizam a extração diária (_data scraping_), normalizam os payloads e geram artefatos JSON/JS estáticos incorporados diretamente à build de distribuição.

---

## Instruções de Execução Local e Deploy

### Inicialização em Ambiente de Desenvolvimento

Para visualizar a interface em ambiente local:

1. Abra o arquivo `index.html` em qualquer navegador moderno.

### Sincronização e Carga de Dados

Para reconstruir os artefatos de dados locais, execute o script de ingestão:

```bash
python ferramentas/atualizar.py
```

_Nota: Este comando aciona o ecossistema de robôs em Python para atualizar as bases locais de Servidores, Contratos e LRF._

### Pipeline de Produção

O fluxo de deploy está documentado em diretrizes estritas no arquivo `docs/COMO_PUBLICAR.md`.

### Use na sua cidade

Quer montar um portal como este para o seu município? O passo a passo (códigos a trocar, como conferir cada
um, fontes nacionais × locais e as regras de privacidade) está em
[`docs/ADAPTAR_PARA_SUA_CIDADE.md`](docs/ADAPTAR_PARA_SUA_CIDADE.md).

---

## Estrutura Arquitetural do Repositório

| Componente / Diretório | Nível             | Responsabilidade Técnica                                                                                                               |
| :--------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`           | Apresentação      | Ponto de entrada da aplicação, contendo a estrutura semântica global e abas principais.                                                |
| `css/estilo.css`       | Design System     | Definições estéticas e tokens de design (paleta em tons de azul, com verde, amarelo e vermelho de apoio, em tema escuro e claro) centralizados no escopo `:root`.                |
| `js/config.js`         | Configuração      | Configuração client-side: endereços institucionais, flags de privacidade e dados de apoio (nenhuma chave de API fica no site).                                     |
| `js/utilitarios.js`    | Core              | Helpers globais de manipulação de dados (sanitização de strings, máscaras de segurança de CPF e formatação monetária).                 |
| `js/fontes/`           | Integração        | Handlers responsáveis pelo consumo de dados em runtime (`despesas.js`, `pessoal.js`, `arquivos.js`).                                   |
| `js/*-regras.js`       | Domínio           | Camada puramente lógica contendo motores de cálculo da LRF, agregação de despesas e algoritmos de busca (cobertos por testes).         |
| `js/dados.js`          | Persistência      | Gerenciador de estado local responsável pela inicialização única e cache de datasets na memória do cliente.                            |
| `js/componentes/`      | UI Kit            | Componentes modulares reutilizáveis (gráficos nativos sem dependências externas, tabelas ordenáveis com paginação, filtros por chips). |
| `js/*-tela.js`         | Controllers       | Controladores de visualização responsáveis por acoplar os dados de domínio aos componentes de interface correspondentes.               |
| `js/rotas.js`          | Roteamento        | Motor de roteamento client-side baseado em hashes de URL para controle de estado da aplicação (`#inicio`, `#servidor/ID`).             |
| `js/apoio.js`          | Módulo Financeiro | Controlador do componente de fomento financeiro e integração do ecossistema Pix.                                                       |
| `js/main.js`           | Orquestração      | Script de bootstrap que inicializa o ciclo de vida da aplicação e acopla os subsistemas.                                               |
| `ferramentas/`         | Automação         | Scripts backend em Python (`atualizar.py`, adaptadores individuais de API em `fontes/` e utilitários em `comum.py`).                   |
| `.github/workflows/`   | CI/CD             | Pipeline automatizado que executa a suite de testes, dispara a rotina diária de extração de dados e realiza o deploy no GitHub Pages.  |
| `dados/`               | Data Lake (Local) | Repositório de arquivos gerados pelos robôs automatizados em formato plano.                                                            |
| `testes/`              | Qualidade         | Suite de testes automatizados abrangendo ambiente navegador (`testes.html`), Node.js e testes de integração Python.                    |
| `docs/`                | Documentação      | Relatórios de guias de front-end, matriz de conformidade legal (`FONTES.md`), auditorias e registros da LAI.                           |

---

## Matriz de Integração (Fontes Oficiais)

- **Contabilidade (Despesas)**: `https://atende.net`
- **Recursos Humanos (Pessoal)**: `https://atende.net`
- **Contratações (PNCP)**: `https://pncp.gov.br...`
- **Tesouro Nacional (SICONFI)**: `https://tesouro.gov.br` (Endpoints: `rgf`, `dca`, `extrato_entregas`)
- **Tesouro Nacional (SICONFI, RREO)**: receitas previstas e realizadas
- **Transferências Federais**: API Apex de Transferências Constitucionais
- **Financiamento da Educação**: OData Service SIOPE/FNDE
- **IBGE (SIDRA)**: `https://apisidra.ibge.gov.br` (população, área, densidade e PIB)
- **Portal da Transparência (CGU)**: `https://api.portaldatransparencia.gov.br` (convênios com a União; exige a chave `CGU_CHAVE`)
- **Câmara Municipal**: API de dados abertos da Câmara de Videira (exige o token `CAMARA_TOKEN`)
- _Mapeamento Legal Concluso_: A matriz completa de governança de dados está disponível em `docs/FONTES.md`.

---

## Governança de Dados e Conformidade (LGPD)

O projeto adota critérios estritos de anonimização e minimização de dados em conformidade com as boas práticas de privacidade:

- **Fluxo de Fornecedores**: CPFs de pessoas físicas sofrem processo de mascaramento dinâmico em tela. Para anonimização total na camada de apresentação, configure `MOSTRAR_NOME_PESSOA_FISICA: false` em `js/config.js`.
- **Fluxo de Pessoal**: Limita-se à exibição de dados estritamente institucionais (Nome, Cargo, Lotação, Vínculo e Salário-Base). Informações sensíveis como número de matrícula, CPF, horários específicos de ponto eletrônico ou históricos de afastamentos por motivos de saúde **não são capturados ou armazenados**.
- **Cruzamento de dados (auditoria)**: o cruzamento de pessoas entre fontes oficiais é feito **só por CPF**, dentro do robô Python (nunca no navegador). A chave de ligação é um HMAC-SHA256 do CPF com segredo guardado no Secret `CPF_SALT`; o CPF puro nunca é gravado em arquivo, log, `dados/` ou git. Só o resultado é publicado, com CPF mascarado (`***.456.789-**`) e links para as fontes oficiais. O CPF não é pesquisável pelo público. **Nunca** se liga pessoas só pelo nome (homônimos). Coincidência é um fato registrado, não uma acusação: sem adjetivos e sem ranking. Detalhes em `REGRAS_INVIOLAVEIS.md`.

---

## Customização e Adaptação Multi-Instância

### Alteração do Escopo Institucional

Modifique a constante `NOME_SITE` em `js/config.js` e atualize as tags semânticas `<title>` e metadados Open Graph (`og:`) no arquivo `index.html`.

### Gateway de Doações (Pix)

Configure a propriedade `PIX_CHAVE` no arquivo `js/config.js`. Caso a string permaneça vazia (`''`), o componente visual de apoio financeiro é omitido do DOM via lógica condicional.

### Dicionários de Regras de Negócio

Regras de categorização e normalização de vínculos de RH devem ser expandidas estritamente nos objetos `EXPLICACOES` e `PESSOAL.VINCULOS` em `js/config.js`.

---

## Roadmap e Próximos Passos

- O que ainda não está no site (remuneração mensal completa, diárias, restos a pagar, obras, emendas, projetos de lei e votações da Câmara) está listado na aba "Sobre e fontes" e nas metas do projeto (aba "Metas").
- **Câmara Municipal (já integrada)**: o token privado da API da Câmara nunca vai para o navegador. Ele fica nos Secrets do GitHub (`CAMARA_TOKEN`) e é usado só pelo robô que roda no GitHub Actions; nenhum endereço com o token é gravado nos dados publicados.

## Licença

Código-fonte sob licença MIT (veja `LICENSE`). A licença vale só para o código: dados, documentos e imagens das fontes oficiais seguem as regras de cada fonte. Fundamento jurídico do projeto: `docs/FUNDAMENTO_JURIDICO.md`.
