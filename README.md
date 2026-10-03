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

- **Módulo Financeiro (Gastos)**: Rastreamento em tempo real de liquidações e pagamentos por credor, secretaria e dotação orçamentária.
- **Módulo de Recursos Humanos (Servidores)**: Consolidação de vínculos, cargos, lotações e remunerações base estruturadas em árvore organizacional.
- **Módulo de Suprimentos (Contratos)**: Integração e indexação automatizada de licitações e contratos publicados no PNCP (Portal Nacional de Contratações Públicas).
- **Módulo de Responsabilidade Fiscal (Contas)**: Monitoramento de limites da LRF (Lei de Responsabilidade Fiscal) e despesas por funções de governo (Saúde/Educação) via SICONFI.

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

---

## Estrutura Arquitetural do Repositório

| Componente / Diretório | Nível             | Responsabilidade Técnica                                                                                                               |
| :--------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`           | Apresentação      | Ponto de entrada da aplicação, contendo a estrutura semântica global e abas principais.                                                |
| `css/estilo.css`       | Design System     | Definições estéticas e tokens de design (paleta corporativa baseada em tons uva/vinho) centralizados no escopo `:root`.                |
| `js/config.js`         | Configuração      | Variáveis de ambiente client-side, chaves de API, endpoints institucionais e flags de privacidade.                                     |
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
- **Transferências Federais**: API Apex de Transferências Constitucionais
- **Financiamento da Educação**: OData Service SIOPE/FNDE
- _Mapeamento Legal Concluso_: A matriz completa de governança de dados está disponível em `docs/FONTES.md`.

---

## Governança de Dados e Conformidade (LGPD)

O projeto adota critérios estritos de anonimização e minimização de dados em conformidade com as boas práticas de privacidade:

- **Fluxo de Fornecedores**: CPFs de pessoas físicas sofrem processo de mascaramento dinâmico em tela. Para anonimização total na camada de apresentação, configure `MOSTRAR_NOME_PESSOA_FISICA: false` em `js/config.js`.
- **Fluxo de Pessoal**: Limita-se à exibição de dados estritamente institucionais (Nome, Cargo, Lotação, Vínculo e Salário-Base). Informações sensíveis como número de matrícula, CPF, horários específicos de ponto eletrônico ou históricos de afastamentos por motivos de saúde **não são capturados ou armazenados**.

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

- **Integração do Poder Legislativo (Câmara Municipal)**: Planejamento para consumo de pautas, subsídios e folha de pagamento via API interna da Câmara.
  - _Premissa de Segurança_: Devido à exigência de tokens de autenticação privados, a arquitetura proíbe o tráfego dessas credenciais no client-side. A integração exige o desenvolvimento de uma camada proxy intermediária (_Serverless Function_), garantindo que chaves privadas permaneçam inacessíveis ao usuário final.
