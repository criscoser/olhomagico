# 👁️ Olho Mágico

> Portal independente de transparência de Videira/SC.

![GitHub Repo Size](https://shields.io)
![Python](https://shields.io)
![JavaScript](https://shields.io)
![HTML5](https://shields.io)
![CSS3](https://shields.io)

Site independente que mostra, em linguagem simples e acessível à população, dados cruciais da administração pública local.

- **Gastos da Prefeitura**: Quanto foi pago, a quem, por qual secretaria e de onde veio o dinheiro (busca ao vivo).
- **Servidores**: Quem trabalha na Prefeitura, vínculo, cargo, setor e salário-base (cópia diária da API de Pessoal).
- **Contratos**: Licitações, compras e contratos publicados no PNCP, com link para cada registro oficial (cópia diária).
- **Contas e limites**: Gasto com pessoal × limites da Lei de Responsabilidade Fiscal, da Prefeitura e da Câmara (cópia diária do SICONFI).

🚀 **Arquitetura Sem Banco de Dados:** Os gastos são buscados em tempo real diretamente das APIs oficiais. A lista de servidores é extraída uma vez por dia por uma automação de raspagem (robô) e disponibilizada estaticamente junto com o site, sem armazenamento de históricos passados.

---

## 🛠️ Como Abrir e Executar

1. **Visualização Local Básica:** Dê um duplo clique no arquivo `index.html`.
2. **Atualizar Fontes Locais:** Para popular as abas de _Servidores_, _Contratos_ e _Contas_ no seu ambiente local, execute o script de sincronização no seu terminal:
   ```bash
   python ferramentas/atualizar.py
   ```
   _(Este processo consolida todas as fontes externas e pode levar alguns minutos)._
3. **Guia de Deploy:** Para instruções detalhadas de publicação, consulte o documento `docs/COMO_PUBLICAR.md`.

---

## 📁 Estrutura de Pastas e Arquivos

| Arquivo / Diretório     | Descrição e Responsabilidade Técnica                                                                                                                                                                                                          |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📄 `index.html`         | Textos base, casca da aplicação e estrutura de abas (_Gastos_ e _Servidores_).                                                                                                                                                                |
| 🎨 `css/estilo.css`     | Identidade visual do projeto. Paleta em tons **Uva e Vinho** configurada nas variáveis `:root`.                                                                                                                                               |
| ⚙️ `js/config.js`       | Configurações globais (Nome do site, Endereços de APIs, Chave Pix, Chaves de privacidade).                                                                                                                                                    |
| 🧰 `js/utilitarios.js`  | Funções utilitárias globais (Formatação de moeda, Máscaras de CPF, Datas e slugs de URL).                                                                                                                                                     |
| 🔌 `js/fontes/`         | Scripts de ingestão de dados da camada client-side (`despesas.js`, `arquivos.js`, `pessoal.js`).                                                                                                                                              |
| 🧠 `js/...-regras.js`   | Motores de regras de negócio sem interface física, totalmente validados por testes unitários (`agregacao.js`, `pessoal-regras.js`, `contratos-regras.js`, `contas-regras.js`, `transferencias-regras.js`, `busca-regras.js`, `historico.js`). |
| 📦 `js/dados.js`        | Inicializa, faz o cache e prepara cada dataset uma única vez na memória para compartilhamento entre telas.                                                                                                                                    |
| 🧩 `js/componentes/`    | Blocos modulares reutilizáveis de interface (`menu.js`, `blocos.js`, `graficos.js` nativos, `tabela.js` paginada/ordenável, `filtros.js`, `origem.js`, `exportar.js` para planilhas CSV).                                                     |
| 📺 `js/...-tela.js`     | Controladores de renderização e comportamento visual das visões da aplicação (`inicio-tela.js`, `interface.js`, `fichas.js`, `situacao-tela.js`, etc.).                                                                                       |
| 🗺️ `js/rotas.js`        | Mecanismo de roteamento client-side baseado em hashes de URL (`#inicio`, `#servidor/ID`, etc.).                                                                                                                                               |
| 🤝 `js/apoio.js`        | Gerenciador do componente de arrecadação financeira e exibição do QR Code Pix.                                                                                                                                                                |
| 🎬 `js/main.js`         | Ponto de entrada (Bootstrap) que inicializa e orquestra todo o ecossistema do front-end.                                                                                                                                                      |
| 🤖 `ferramentas/`       | Scripts de automação em Python (`atualizar.py`, adaptadores em `fontes/`, utilitários comuns em `comum.py` e metadados geográficos em `municipio.json`).                                                                                      |
| 🚀 `.github/workflows/` | Pipeline de Integração Contínua (CI) que roda os testes unitários, dispara os robôs de atualização e publica a build estável de forma automatizada e diária no GitHub Pages.                                                                  |
| 💾 `dados/`             | Diretório de destino onde os robôs persistem os outputs consolidados em formatos estáticos de dados.                                                                                                                                          |
| 🧪 `testes/`            | Suite de testes automatizados web (`testes.html`), de runtime Node.js (`rodar_testes.js`) e testes Python de integração com servidores simulados (`test_robos.py`).                                                                           |
| 📚 `docs/`              | Documentação arquitetural, guias de front-end, relatórios de auditoria, matriz de fontes legais de dados e registros da LAI.                                                                                                                  |

---

## 📡 Fontes de Dados Utilizadas

- **Despesas Públicas:** API de Dados Abertos de Contabilidade (`https://videira.atende.net/api/WCPDadosAbertos/despesas`)
- **Quadro de Servidores:** API de Gestão de Pessoal (`https://videira.atende.net/api/transparencia-pessoal-funcionarios`)
- **Contratos e Licitações:** API Oficial do Portal Nacional de Contratações Públicas (`https://pncp.gov.br/api/consulta/v1/...`)
- **Contabilidade Fiscal:** API Data Lake do SICONFI/Tesouro Nacional (`rgf`, `dca`, `extrato_entregas`)
- **Transferências da União:** API Apex de Transferências Constitucionais do Tesouro
- **Recursos da Educação:** OData Service do SIOPE/FNDE
- _Mapeamento Técnico Detalhado:_ Acesse o arquivo interno em `docs/FONTES.md`.

---

## 🔒 Diretrizes de Privacidade e LGPD

O projeto adota premissas rígidas para proteger informações sensíveis de cidadãos e servidores:

- **Fluxo Financeiro:** CPFs de pessoas físicas passam por processos de mascaramento em tela. Para anonimização completa de nomes civis de CPFs, altere a flag `MOSTRAR_NOME_PESSOA_FISICA: false` em `js/config.js`.
- **Recursos Humanos:** São públicos os dados corporativos: Nome, Cargo, Função, Setor, Vínculo, Tipo de Ingresso, Data de Admissão, Carga Horária e Salário-Base. **Não são armazenados ou exibidos** CPFs, Matrículas internas, Registros de Ponto Eletrônico ou Status de Afastamentos Médicos/Licenças.

---

## ✏️ Customização e Deploy em Outras Cidades

### 1. Alteração do Nome da Aplicação

Modifique a constante `NOME_SITE` no arquivo `js/config.js` e atualize as tags estáticas estruturais `<title>` e os metadados de compartilhamento Open Graph (`og:`) diretamente no `index.html`.

### 2. Configuração de Chave Pix (Arrecadação)

Preencha a propriedade `PIX_CHAVE` em `js/config.js`. Caso a string permaneça vazia (`''`), o componente visual de doação será completamente ocultado da interface final automaticamente.

### 3. Dicionários e Regras de Negócio

Para expandir ou refinar termos legais, utilize os dicionários estruturados `EXPLICACOES` (para indexação de credores) e `PESSOAL.VINCULOS` (mapeamento de tipos de contratação de RH) contidos em `js/config.js`.

---

## 🔮 Futuras Implementações e Extensões

- **Câmara Municipal:** Integração de folhas de pagamento, projetos de lei e dados de vereadores via API do legislativo.
  - _Nota de Segurança:_ Como a API da Câmara requer autenticação via Token privado, a credencial **nunca** deve trafegar no client-side ou ser exposta publicamente no repositório. O fluxo necessitará do desenvolvimento de uma camada intermediária segura usando funções assíncronas _Serverless_.
