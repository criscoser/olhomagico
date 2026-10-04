# Olho Mágico — regras do projeto

Portal de transparência **independente** de Videira/SC. Site estático (GitHub Pages), JavaScript puro
(namespace `window.OBS`), sem framework e sem build. Dados em `dados/*.js`, gerados uma vez por dia pelos robôs
Python de `ferramentas/` (só biblioteca padrão). Os gastos do mês vêm ao vivo da API de despesas da Prefeitura.

Público prioritário: cidadãos com pouca familiaridade com tecnologia e com termos de orçamento, em celulares
Android de entrada e internet 3G/4G instável. O mantenedor é estudante: explique em português simples, com rigor.

## Regras invioláveis

1. **Nunca mostrar informação falsa.** O design muda a APRESENTAÇÃO, nunca o DADO. Não alterar, arredondar de
   forma enganosa, reinterpretar ou omitir dados sobre servidores e sobre a Prefeitura. Toda simplificação mantém
   o caminho (no máximo um toque) até o valor exato e a fonte oficial.
2. **Nunca exibir CPF, matrícula, horário, local de trabalho ou afastamento.** CPF não é pesquisável. A API de
   despesas entrega o CPF completo: ele fica só na memória, sempre mascarado na tela, em links e no CSV.
3. **Não cruzar pessoas entre fontes pelo nome.** Fornecedor só por CNPJ. Não usar "reais por habitante".
4. **O site não pode parecer oficial:** sem brasão, sem as cores da Prefeitura (o portal oficial usa azul
   `#1358a4`; o brasão tem amarelo, vermelho, verde e cachos de uva realistas) e com o aviso de independência visível.
5. **Manter:** a CSP atual (sem script ou estilo embutido), nenhuma dependência pesada ou externa, o site funcionando
   sem os arquivos de dados (com mensagem de estado) e todos os testes passando.

## Lições da auditoria de veracidade (out/2026) — não repetir os erros

- **Sujeito certo para cada fonte.** API de despesas, PNCP e lista de pessoal cobrem o **Município** inteiro
  (Prefeitura, Câmara, IPREV, SAMAE, Fundação de Esportes e fundos): escrever "o Município", nunca "a Prefeitura".
  RGF do Executivo = "a Prefeitura"; RGF do Legislativo e API da Câmara = "a Câmara".
- **Dado parcial nunca vira conclusão.** Ex.: SIOPE antes do 6º bimestre não é comparado com o mínimo anual de 25%.
- **Arredondar nunca muda a conclusão.** Percentual comparado a limite legal aparece com as casas da fonte.
- **Consórcio intermunicipal (CISAMARP) não é órgão do município:** fica fora dos totais e do ranking.
- **"Credores que receberam" conta só pago > 0.** Mesmo CNPJ com vários nomes: mostrar todos os nomes.
- A lista de pessoal inclui aposentados e pensionistas do IPREV; "pago" da API não inclui restos a pagar;
  a soma do mês inclui pagamentos entre órgãos do próprio município (intraorçamentários).
- Bolsa Família e BPC são pagos direto às famílias: nunca apresentar como receita da Prefeitura.
- Relatórios ao Tesouro e ao FNDE são **declarados** pelo município (usar "declarou").
- Antes de afirmar um número novo, conferir na fonte oficial (a API de despesas de 2025 bate ao centavo com a DCA).
- **Mínimo legal só onde a lei diz.** SIOPE: mínimo de 25% só no indicador 1.1 (MDE) e de 70% só no 1.2 (FUNDEB na
  remuneração), conferindo código E nome. Indicador que só *cita* MDE não tem mínimo; o 1.3 é um MÁXIMO.
- **Tipo do número pelo começo do nome:** "Valor exigido ... (Mínimo de 25%)" é dinheiro, não percentual.
- **Valor exato inteiro:** ao extrair "R$ 46.165.401,23" de um texto, o ponto de milhar faz parte do número.
- **A API de despesas aceita no máximo 10 consultas por minuto** (HTTP 429 acima disso): o site espera 6,5 s entre
  consultas seguidas e o robô, 7 s. A página inicial e o gráfico de 12 meses usam o resumo diário (sem consulta ao vivo).

## Redação (linguagem simples)

- Frase gerada a partir dos dados, ordem direta, até ~20 palavras, período primeiro e por extenso.
- **Sem adjetivos e sem opinião:** proibido "alto, baixo, apenas, só, muito, gastou demais, desperdiçou,
  irregular, disparou". Usar "pagou, reservou, contratou, declarou, repassou".
- Sigla só depois do nome completo. "R$ 1,5 milhão" (singular de 1 a <2), "R$ 2 milhões".
- Vermelho só para erro do site, nunca para dado.

## Segurança

- **Pix:** `PIX_CHAVE`, `PIX_COPIA_E_COLA`, `PIX_RECEBEDOR` (em `js/config.js`) precisam combinar; `js/pix-regras.js`
  confere CRC16 e campos e, se falhar, nada de Pix aparece (falha fechada). O QR é desenhado a partir do próprio
  código (`js/vendor/qrcodegen.js`, adaptado de Nayuki, MIT, conferido bit a bit). **Nunca alterar valores do Pix sem
  pedido explícito do mantenedor**, e nunca mostrar segredos (tokens, hash do Secret `PIX_SHA256`) em código, log ou chat.
- Nada de `innerHTML`, `eval` ou estilos/scripts embutidos: usar `OBS.el` (textContent) e `OBS.urlSegura` para links.
- Dados recuperados do site publicado passam por `ferramentas/recuperar.py` (regravados como dado puro).
- Chaves das fontes (`CGU_CHAVE`, `CAMARA_TOKEN`) só vêm do ambiente/Secrets e são escondidas nas mensagens.

## Como trabalhar neste projeto

- **Modo conversa:** quando o mantenedor pedir só análise ou proposta, não criar nem alterar arquivos. Só implementar
  após "AUTORIZADO" seguido dos números dos itens aprovados.
- **Um commit por item**, com mensagem em português explicando o porquê. **Nunca fazer push sem autorização explícita.**
- Comentários no código em português simples e didático, no estilo dos arquivos existentes.
- Testes antes de cada commit:
  - `node testes/rodar_testes.js` (também em `testes/testes.html` no navegador)
  - `python -m unittest discover -s testes -p "test_*.py"`
- Mudança visual: conferir em 320px, com teclado e leitor de tela, nos temas claro e escuro.

## Decisões de design aprovadas (Etapas 2 a 7, out/2026) — implementadas

- Arquitetura por perguntas: Gastos, Entradas, Pessoal, Contratos, Limites, Câmara (+ Buscar, Palavras e siglas,
  Leis e direitos, Sobre e fontes, Apoie). Barra inferior até 1024 px (Início, Gastos, Pessoal, Buscar, Mais). Acima de
  1024 px, CABEÇALHO no topo em duas linhas (marca e ações; seções), que some ao tirar o mouse depois de rolar e volta
  ao levar o mouse ao topo ou com o Tab; no celular some ao rolar para baixo e volta ao rolar para cima
  (decisão do mantenedor, 03/10/2026; substitui o menu lateral).
- Robô gera `dados/despesas-resumo.js` (13 meses × órgão × 3 etapas) para a página inicial não baixar ~800 KB.
- Paleta **azul, branco, verde, amarelo e vermelho** (decisão do mantenedor, 03/10/2026; substitui Uva e Ouro): azul
  para estrutura e links, branco de fundo, verde nos botões de ação, amarelo para destaque e vermelho só para erro e
  limite máximo da lei. O azul é mais escuro que o do portal oficial (#1358a4). Tema claro padrão, escuro opcional; só a fonte Atkinson Hyperlegible,
  hospedada no site; alvos de toque de 48px. Letras (decisão do mantenedor, 03/10/2026): títulos principais, frases
  principais e números em destaque com 16 px; todo o resto com 11 px. O controle "Tamanho da letra" (até 150%) fica.
- Modelo de 3 camadas (frase → gráfico → números exatos e fonte); glossário único com ⓘ na primeira ocorrência.
- Inclusão: botão Ouvir (só frase e título do gráfico; escondido sem voz pt-BR), tamanho da letra em 4 passos,
  compartilhar (WhatsApp, copiar link, outros apps; ficha de servidor compartilhada sem nome e sem salário).
- Identidade: nome "Olho Mágico", sem slogan por enquanto, logo V3 (cacho em pontos, hoje azul-céu, com um olho mágico amarelo),
  com versão própria para 16/32 px e versão com uvas lilás no tema escuro.
- Plano numerado completo (itens 1–33) na conversa da Etapa 8: todos feitos em 03/10/2026.
- Tela **Leis e direitos** (`#direitos`): resumo para o público do documento `docs/FUNDAMENTO_JURIDICO.md`
  (material de orientação, não parecer jurídico). Sem acusação, sem ranking, linguagem proporcional à evidência.
- Licença MIT (`LICENSE`) só para o código; dados e documentos das fontes seguem as regras de cada fonte.
- Diagnóstico de 03/10/2026: fontes marcadas como "documentada" ou "observada" (Sobre e fontes). As propostas de que o
  diagnóstico discordou do briefing (histórico em repositório separado, piloto, revisão em níveis, letra, coleta de
  gastos por robô, ligação só por código) estão PARADAS até nova decisão do mantenedor.
