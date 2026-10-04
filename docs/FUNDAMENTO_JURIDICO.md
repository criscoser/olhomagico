# Olho Mágico — Fundamento jurídico da transparência pública e por que é tão difícil acessar os dados

**Documento de referência jurídico-técnica para o projeto Olho Mágico**
**Data de elaboração:** 03/10/2026
**Escopo do projeto:** inicialmente, os 295 municípios de Santa Catarina, considerando Prefeitura (Executivo) e Câmara Municipal (Legislativo).
**Finalidade:** fornecer aos responsáveis e colaboradores do projeto uma base de análise sobre o direito de acesso à informação, transparência fiscal, dados abertos, proteção de dados pessoais, contratações públicas e os obstáculos concretos que dificultam localizar, obter, compreender, automatizar e cruzar informações públicas.

> **Nota importante:** este documento é material de pesquisa e orientação técnica, não parecer jurídico. A aplicação de cada dispositivo depende do ente, do órgão, da natureza da informação, da legislação local, da data dos fatos e das circunstâncias concretas. Antes de formular acusações ou conclusões de ilegalidade, é necessária análise jurídica específica e validação documental.

O resumo para o público está na tela **Leis e direitos** do site (`#direitos`).

---

## 1. A pergunta central do Olho Mágico

O Brasil possui um conjunto relevante de normas que estabelece publicidade administrativa, acesso à informação, transparência fiscal e divulgação de contratações públicas. Mesmo assim, localizar uma informação pública específica pode exigir navegar por vários portais, sistemas, fornecedores, filtros, documentos e bases de dados.

O problema que o Olho Mágico pretende investigar não é apenas: **"O órgão publicou alguma coisa?"**

As perguntas relevantes são também:

- A informação que a lei exige está efetivamente publicada?
- Está no local indicado pelo próprio órgão?
- É possível encontrá-la sem conhecer previamente o nome do sistema ou do fornecedor?
- O cidadão consegue compreender o conteúdo?
- É possível baixar os dados em formato reutilizável?
- Sistemas externos conseguem acessá-los de forma automatizada, quando a norma exige essa possibilidade?
- Os dados estão completos, atualizados, íntegros e acompanhados de explicação suficiente?
- É possível relacionar uma despesa ao empenho, à liquidação, ao pagamento, ao contrato, à licitação e ao fornecedor?
- O histórico permanece acessível?
- Quando há restrição, ela está fundamentada e limitada aos campos que realmente precisam de proteção?

A existência de um portal não significa, por si só, que todas essas condições estejam atendidas. Da mesma forma, uma dificuldade técnica isolada não prova automaticamente descumprimento legal.

O projeto deve documentar fatos observáveis e confrontá-los com a norma aplicável, sem antecipar conclusões.

## 2. Fundamentos constitucionais

### 2.1 Artigo 5º, inciso XXXIII
Garante a todos o direito de receber dos órgãos públicos informações de interesse particular, coletivo ou geral, ressalvadas aquelas cujo sigilo seja imprescindível à segurança da sociedade e do Estado, nos termos da lei.

### 2.2 Artigo 37, caput
Inclui a publicidade entre os princípios que regem a Administração Pública, ao lado da legalidade, impessoalidade, moralidade e eficiência.

### 2.3 Artigo 37, § 3º, inciso II
Prevê disciplina legal para o acesso dos usuários a registros administrativos e a informações sobre atos de governo.

### 2.4 Artigo 216, § 2º
Atribui à Administração Pública a gestão da documentação governamental e as providências para franquear sua consulta a quantos dela necessitem, na forma da lei.

**Leitura para o projeto:** a publicidade não é uma gentileza do gestor. É princípio constitucional e o acesso à informação é um direito juridicamente protegido. Contudo, o conteúdo, os procedimentos, os prazos e as exceções devem ser examinados nas leis específicas.

Fonte: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm

---

## 3. Lei nº 12.527/2011 — Lei de Acesso à Informação (LAI)

Texto oficial: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm

A LAI é uma das bases jurídicas centrais do Olho Mágico. Ela se aplica à União, aos Estados, ao Distrito Federal e aos Municípios, alcançando os órgãos e entidades indicados em seu artigo 1º.

### 3.1 Transparência ativa — artigo 8º
O artigo 8º estabelece o dever de divulgar, independentemente de requerimentos, informações de interesse coletivo ou geral produzidas ou custodiadas pelo órgão.

O § 1º apresenta um conteúdo mínimo que inclui, entre outros:

- estrutura organizacional e contatos;
- registros de repasses ou transferências de recursos financeiros;
- registros das despesas;
- informações sobre procedimentos licitatórios, editais, resultados e contratos;
- dados gerais sobre programas, ações, projetos e obras;
- respostas a perguntas frequentes.

O § 2º prevê divulgação obrigatória em sítios oficiais na internet, ressalvada a regra específica para municípios com até 10 mil habitantes prevista no § 4º. Essa exceção da LAI não elimina a obrigação de transparência em tempo real da execução orçamentária e financeira prevista na Lei de Responsabilidade Fiscal.

### 3.2 A parte especialmente importante: artigo 8º, § 3º
A LAI não trata somente da existência de uma página na internet. O § 3º estabelece requisitos para os sítios oficiais, incluindo:

1. ferramenta de pesquisa de conteúdo;
2. possibilidade de gravação de relatórios em diversos formatos eletrônicos, inclusive abertos e não proprietários;
3. possibilidade de acesso automatizado por sistemas externos em formatos abertos, estruturados e legíveis por máquina;
4. descrição dos formatos utilizados;
5. autenticidade e integridade das informações;
6. atualização das informações;
7. indicação de canais de contato;
8. acessibilidade para pessoas com deficiência.

Esse dispositivo é central para o problema técnico investigado pelo Olho Mágico.

**Interpretação cuidadosa:** a lei fala em requisitos dos sítios oficiais e em acesso automatizado por sistemas externos. Isso não significa que cada órgão seja obrigado a manter uma API REST pública, com Swagger, endpoint estável e documentação no padrão que um desenvolvedor preferiria. O requisito legal deve ser analisado em relação ao modo de disponibilização, aos formatos, à estrutura e à possibilidade efetiva de acesso automatizado. Um arquivo CSV ou outro formato aberto e estruturado pode atender a determinadas necessidades sem existir uma API REST.

Também não se deve concluir que um portal descumpre a lei apenas porque o robô do projeto não conseguiu acessá-lo em um teste. É preciso investigar o caminho oficial de acesso, formatos alternativos, documentação, autenticação, limitações e condições técnicas.

### 3.3 Transparência passiva — artigos 10 e 11
Quando a informação não está disponível de forma adequada, qualquer interessado pode apresentar pedido de acesso.

O artigo 10 permite solicitar informação sem apresentar os motivos determinantes do pedido. O artigo 11 prevê acesso imediato quando disponível ou resposta em até 20 dias, prorrogáveis por mais 10 dias mediante justificativa expressa, nas condições legais.

A LAI também prevê que o órgão informe quando não possui a informação e, se souber, indique quem a detém ou encaminhe o pedido conforme o caso.

**Uso pelo Olho Mágico:** pedidos LAI podem ser usados para solicitar documentos existentes, manuais, contratos, formatos de exportação, dicionários de dados, informações sobre sistemas, critérios de atualização, justificativas de restrições e indicação do setor responsável.

**Limite:** a LAI não deve ser apresentada como obrigação automática de criar uma API, desenvolver software novo, realizar auditoria inédita ou produzir estudo que não exista. O pedido deve buscar informação existente ou solicitar esclarecimentos que possam ser prestados a partir dos registros existentes, observadas as regras aplicáveis.

### 3.4 Informação pessoal — artigo 31
A LAI determina que o tratamento de informações pessoais respeite intimidade, vida privada, honra, imagem e garantias individuais.

Isso exige análise concreta. Não se deve presumir que qualquer dado relacionado a servidor público seja automaticamente sigiloso, nem que todo campo de uma base funcional deva ser publicado sem restrição.

É necessário distinguir:

- informação funcional relacionada ao exercício de cargo público;
- remuneração custeada por recursos públicos;
- identificadores pessoais;
- dados de contato privados;
- dados sensíveis;
- informações sobre saúde, afastamentos ou vida privada;
- campos que não sejam necessários ao controle social.

A análise deve ser feita por campo e finalidade, observando a LAI, a LGPD e as normas específicas.

### 3.5 Restrições e negativas
Uma restrição legítima precisa ter fundamento jurídico aplicável ao caso. O projeto deve registrar o texto da resposta, o dispositivo citado, a informação efetivamente restringida, a possibilidade de acesso parcial e a via de recurso.

Não tratar toda negativa como ilegal. Não aceitar, por outro lado, a simples menção genérica à LGPD como explicação suficiente para ocultar integralmente uma base que possa conter dados públicos e dados pessoais separáveis.

---

## 4. Lei Complementar nº 101/2000 — Lei de Responsabilidade Fiscal (LRF)

Texto oficial: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm

A LRF disciplina a responsabilidade na gestão fiscal e contém instrumentos específicos de transparência.

### 4.1 Artigo 48
Prevê ampla divulgação, inclusive por meios eletrônicos de acesso público, de instrumentos como:

- planos e orçamentos;
- leis de diretrizes orçamentárias;
- prestações de contas e parecer prévio;
- Relatório Resumido da Execução Orçamentária (RREO);
- Relatório de Gestão Fiscal (RGF);
- versões simplificadas desses documentos.

O artigo também prevê participação popular, audiências públicas e disponibilização de informações fiscais em meio eletrônico.

### 4.2 Artigo 48-A
É especialmente relevante para despesas e receitas.

Quanto às despesas, exige acesso a informações sobre atos praticados pelas unidades gestoras durante a execução da despesa, no momento de sua realização, com disponibilização mínima de dados como número do processo, bem ou serviço, beneficiário do pagamento e, quando houver, procedimento licitatório.

Quanto às receitas, trata do lançamento e recebimento de toda a receita das unidades gestoras, inclusive recursos extraordinários.

### 4.3 O que isso significa para o Olho Mágico
A investigação deve examinar se as informações de execução orçamentária e financeira estão disponíveis de modo que permitam acompanhamento público.

Não basta observar apenas um total anual ou um gráfico agregado quando a norma aplicável exige informações pormenorizadas. Por outro lado, a análise precisa considerar a granularidade e os campos mínimos previstos na legislação, a etapa da despesa e as regras de proteção de dados.

É essencial distinguir: dotação; empenho; liquidação; pagamento; receita lançada; receita arrecadada/recebida.

Esses conceitos não são intercambiáveis. Um valor empenhado não deve ser apresentado como se já tivesse sido pago.

### 4.4 Sistemas fiscais nacionais não substituem os registros transacionais locais
Bases como SICONFI são fundamentais para demonstrativos e informações fiscais padronizadas, mas não necessariamente substituem o detalhamento de cada operação existente no sistema contábil municipal.

O projeto deve deixar claro quando apresenta demonstrativos agregados e quando apresenta registros de execução detalhados.

---

## 5. Lei Complementar nº 131/2009 — Transparência em tempo real

A LC nº 131/2009 alterou a LRF e ficou conhecida por reforçar a transparência da gestão fiscal. Texto consolidado da LRF: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm

Os artigos 48 e 48-A, na redação aplicável, tratam da divulgação em meios eletrônicos de informações pormenorizadas sobre a execução orçamentária e financeira em tempo real.

A lei também estabeleceu prazos de implantação escalonados por porte populacional, que já se encerraram há muitos anos. Esses prazos históricos não devem ser apresentados como se fossem prazos atuais de adaptação ainda em curso.

**Ponto de investigação:** verificar a disponibilidade atual, a atualização e o nível de detalhamento dos registros, em vez de presumir que a obrigação ainda depende de um prazo futuro.

---

## 6. Lei nº 14.129/2021 — Lei do Governo Digital

Texto oficial: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm

A Lei do Governo Digital trata de desburocratização, transformação digital, interoperabilidade, dados abertos e participação do cidadão.

### 6.1 Atenção ao alcance federativo
O artigo 2º prevê aplicação direta à Administração Pública federal e estabelece, para as administrações dos demais entes federativos, a adoção dos comandos da lei por meio de atos normativos próprios.

Portanto, ao analisar um município de Santa Catarina, o projeto não deve presumir automaticamente que cada dispositivo da Lei nº 14.129/2021 se aplica a ele exatamente da mesma maneira que à Administração federal. Deve pesquisar a legislação estadual ou municipal de adoção, quando pertinente.

### 6.2 Artigo 29 — abertura de dados
O artigo 29 determina requisitos importantes para a promoção da transparência ativa de dados, entre eles:

- publicidade de bases de dados não pessoais como regra, e sigilo como exceção;
- acesso irrestrito, legibilidade por máquina e formato aberto, respeitadas LAI e LGPD;
- descrição da estrutura e semântica das bases, inclusive qualidade e integridade;
- possibilidade de uso das bases abertas;
- completude e disponibilização dos dados primários com a maior granularidade possível, ou referência às bases primárias quando houver agregação;
- atualização periódica e manutenção de histórico;
- respeito à privacidade.

**Importância:** a Lei do Governo Digital explicita características de qualidade e reutilização de dados que ajudam a avaliar se a transparência é efetivamente útil. Mas a aplicabilidade federativa deve ser verificada antes de usar o artigo como fundamento direto contra um município específico.

---

## 7. Lei nº 13.709/2018 — Lei Geral de Proteção de Dados (LGPD)

Texto oficial: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

A LGPD protege dados pessoais e se aplica ao tratamento realizado por pessoas naturais e jurídicas, públicas ou privadas, observadas as regras próprias do poder público.

A LGPD não revoga a LAI nem transforma toda informação administrativa em informação sigilosa. As duas leis precisam ser interpretadas em conjunto.

### 7.1 O que o projeto deve fazer
- identificar quais campos são dados pessoais;
- avaliar se o campo é necessário à finalidade de transparência e controle social;
- separar dados públicos de dados protegidos;
- avaliar anonimização, agregação, ocultação parcial ou disponibilização de versão reduzida;
- documentar a justificativa de cada tratamento;
- limitar acesso interno e retenção de dados desnecessários;
- evitar replicar CPF, matrícula, endereço privado, telefone pessoal, dados de saúde ou outros identificadores sem necessidade e fundamento;
- proteger tokens e credenciais de integração.

### 7.2 A LGPD não deve ser usada como resposta genérica
Se uma base contém 20 campos e apenas 2 apresentam restrição legítima, é necessário examinar a possibilidade de fornecer os demais campos, em vez de presumir que a base inteira precisa ser ocultada.

O artigo 7º, inciso II, e o artigo 23 são relevantes para o tratamento de dados pelo poder público, mas a base legal e a finalidade precisam ser analisadas no caso concreto.

O Olho Mágico deve aplicar minimização desde a coleta. Não basta baixar uma base inteira com dados pessoais e só depois pensar no que será exibido.

---

## 8. Lei nº 14.133/2021 — Licitações e Contratos Administrativos

Texto oficial: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm

A Lei nº 14.133/2021 estabelece normas gerais de licitação e contratação para a Administração direta, autárquica e fundacional da União, Estados, Distrito Federal e Municípios, incluindo órgãos do Legislativo municipal quando desempenham função administrativa.

### 8.1 Publicidade e PNCP
O artigo 13 estabelece a publicidade dos atos do processo licitatório, ressalvadas hipóteses legais de sigilo.

O artigo 54 trata da divulgação do edital e anexos no PNCP.

O artigo 94 estabelece a divulgação no PNCP como condição indispensável à eficácia do contrato e de seus aditamentos, com prazos legais próprios.

O artigo 174 cria o Portal Nacional de Contratações Públicas como sítio oficial destinado à divulgação centralizada e obrigatória dos atos exigidos pela lei. O § 4º prevê formato de dados abertos.

### 8.2 Como usar isso na investigação
Para licitações e contratos, o Olho Mágico deve verificar: existência do registro no PNCP; identificação do órgão e unidade; edital e anexos; modalidade e fundamento da contratação; resultado e fornecedor; contrato e aditivos; datas e valores; documentos relacionados; consistência entre PNCP e portal local.

A ausência de um registro em uma busca isolada não basta para afirmar descumprimento. É necessário conferir CNPJ, unidade, ano, sequencial, modalidade, datas, filtros e possíveis registros em sistemas complementares.

O PNCP centraliza informações de contratações, mas não substitui necessariamente todos os documentos e registros de execução financeira existentes no sistema local.

---

## 9. Por que é tão difícil encontrar as informações na prática?

A legislação estabelece deveres de publicidade e acesso, mas a realidade tecnológica e administrativa é fragmentada. Os obstáculos abaixo são hipóteses e padrões de investigação — não acusações automáticas contra qualquer órgão.

### 9.1 Fragmentação de sistemas
Um mesmo município pode usar um sistema para contabilidade, outro para folha de pagamento, outro para licitações, um portal de transparência fornecido por terceiro, um sistema de protocolo, um portal legislativo, bases nacionais para remessas fiscais e arquivos PDF publicados em páginas distintas. Não existe garantia de que todos esses sistemas compartilhem identificadores, formatos ou mecanismos de consulta.

**Efeito:** para reconstruir um fato, o cidadão pode precisar consultar diversas fontes e descobrir como os registros se relacionam.

### 9.2 Dependência de fornecedores privados
Muitos órgãos contratam empresas para fornecer sistemas de gestão, contabilidade, folha, compras e portais de transparência. O fornecedor pode controlar software e versão, estrutura do banco de dados, interface pública, formato de exportação, documentação técnica, disponibilidade de API, autenticação e limites, e calendário de atualização.

Isso pode gerar dependência tecnológica e dificultar a portabilidade. Mas a existência de um fornecedor privado não significa, por si só, que haja ilegalidade ou que o fornecedor seja responsável pelo dever jurídico do órgão.

A investigação deve identificar o contrato, o escopo, as obrigações de exportação, a titularidade dos dados, a documentação, os níveis de serviço e as condições de encerramento.

### 9.3 Dados publicados em PDF ou imagem
Um PDF pode ser adequado para leitura humana, mas difícil de pesquisar, extrair, comparar e atualizar automaticamente. Quando é uma imagem digitalizada, a extração exige OCR e pode introduzir erros.

A orientação oficial da CGU recomenda formatos reutilizáveis, como CSV, XML e JSON, e alerta contra a divulgação que cria obstáculos à reutilização automatizada.

O projeto deve registrar: se existe apenas PDF; se existe planilha; se o arquivo é texto pesquisável ou imagem; se há versão estruturada; se há dicionário de dados; se os dados podem ser baixados em lote.

### 9.4 Portais que funcionam apenas pelo navegador
Alguns portais carregam dados por JavaScript e fazem chamadas internas a serviços web. O navegador mostra a informação, mas o usuário não encontra um link direto para o conjunto de dados.

Pode haver endpoints internos não documentados, parâmetros codificados, paginação escondida, filtros enviados por requisições, tokens temporários, cookies de sessão, respostas encapsuladas, respostas HTML em vez de JSON e serviços de terceiros.

É necessário diferenciar: 1. API oficial documentada; 2. endpoint público observado, mas não documentado; 3. endpoint que depende de sessão ou token; 4. serviço acessível somente por interface; 5. arquivo público para download; 6. acesso não confirmado.

Não contornar mecanismos de autenticação, CAPTCHA, WAF, limites de uso ou controles de segurança.

### 9.5 Falta de padronização entre municípios
Mesmo quando dois municípios usam o mesmo fornecedor, podem ter versões diferentes, módulos contratados diferentes, parametrizações distintas, campos com nomes diferentes, regras diferentes de publicação, períodos de histórico diferentes e estruturas de unidades gestoras diferentes.

Assim, não é correto assumir que um endpoint encontrado em um município funcionará nos outros 294.

### 9.6 Dados sem contexto ou dicionário
Uma tabela pode conter códigos, siglas, classificações e valores sem explicar o significado dos campos. Sem dicionário, é difícil saber se o valor é empenhado, liquidado ou pago; se a data é de competência, emissão ou pagamento; se o registro representa uma pessoa, vínculo ou folha mensal; se o valor é bruto, líquido ou uma parcela; se um código identifica órgão, unidade, função ou fonte de recurso.

A ausência de metadados pode tornar a informação tecnicamente disponível, mas pouco compreensível e difícil de reutilizar.

### 9.7 Histórico incompleto
Alguns portais mostram apenas o exercício atual, eliminam consultas antigas ou alteram a estrutura dos registros.

A ausência de dados antigos no portal não prova automaticamente que os documentos foram destruídos ou que o órgão descumpriu obrigação de guarda. É necessário consultar políticas de arquivo, tabelas de temporalidade, sistemas de origem, prestações de contas e pedidos formais.

O projeto deseja preservar histórico de até cinco anos quando disponível, sem transformar esse objetivo técnico em afirmação de que toda categoria possui obrigação legal uniforme de retenção por cinco anos.

### 9.8 Atualização e defasagem
Uma informação pode aparecer em diferentes momentos: no sistema contábil, no portal local, na remessa ao Tribunal de Contas, no demonstrativo fiscal, no PNCP, em uma base federal. Essas datas podem não coincidir. A comparação precisa registrar data de competência, data de publicação, data de coleta e data de atualização.

### 9.9 Proteções técnicas e bloqueios automatizados
CAPTCHA, rate limits, WAF, autenticação e bloqueios podem existir por segurança, prevenção de abuso, proteção de infraestrutura ou configuração do fornecedor.

A presença de um bloqueio não prova, isoladamente, intenção de ocultar informação. Também não elimina a necessidade de investigar se existe um meio oficial alternativo de acesso, download ou pedido LAI.

O projeto não deve tentar burlar esses controles. Deve registrar a condição observada e solicitar orientação ou acesso por canal oficial.

### 9.10 Falta de conhecimento sobre onde procurar
O cidadão pode não saber qual secretaria administra o dado, qual unidade gestora é responsável, qual CNPJ pesquisar, qual sistema é usado, se o documento está no portal da Prefeitura, da Câmara, do fornecedor ou em base nacional, ou qual nome técnico corresponde à informação desejada.

A própria LAI reconhece o direito de receber orientação sobre procedimentos e sobre o local onde a informação pode ser encontrada.

---

## 10. Transparência jurídica, informacional e tecnológica: três dimensões distintas

O Olho Mágico deve evitar reduzir transparência a uma única pergunta binária.

### 10.1 Transparência jurídica
Investiga o que a norma aplicável exige, para qual órgão, em que prazo, com quais exceções e sob qual procedimento.

### 10.2 Acessibilidade informacional
Investiga se uma pessoa consegue encontrar, entender, contextualizar e conferir a informação. Exemplos de obstáculos: navegação confusa; filtros pouco claros; ausência de explicação; siglas sem glossário; documentos sem contexto; falta de histórico; divergência entre páginas.

### 10.3 Acessibilidade tecnológica
Investiga se os dados podem ser baixados, lidos por máquina, processados, preservados e cruzados por sistemas externos, conforme as exigências legais aplicáveis. Exemplos: PDF escaneado sem versão estruturada; ausência de CSV ou JSON; falta de paginação documentada; endpoint instável; esquema de dados não explicado; exportação limitada; barreiras técnicas sem canal alternativo claro.

Essas três dimensões podem produzir resultados diferentes. Um documento pode estar publicado e cumprir parte da obrigação de publicidade, mas ainda ser difícil de localizar ou reutilizar. A conclusão jurídica deve considerar o dispositivo específico, não apenas a experiência do pesquisador.

---

## 11. Como o Olho Mágico deve avaliar cada informação

Para cada categoria de dado e cada órgão, criar uma ficha individual contendo:

**Identificação:** ente federativo; município; órgão (Prefeitura, Câmara, autarquia ou outro); unidade gestora; CNPJ institucional, quando necessário e obtido de fonte oficial; fornecedor e plataforma, quando identificados.

**Obrigação e base jurídica:** lei e artigo potencialmente aplicáveis; alcance federativo; norma local de regulamentação ou adoção; conteúdo que a norma exige; periodicidade ou prazo, se previsto; exceções e limites relevantes.

**Localização e acesso:** URL pública; página de origem; forma de navegação; formato disponível; possibilidade de download; possibilidade de acesso automatizado; necessidade de autenticação; existência de documentação; existência de canal alternativo.

**Qualidade e integridade:** data de atualização informada; data e hora da coleta; período coberto; granularidade; dicionário/schema; campos ausentes; consistência entre fontes; histórico disponível.

**Evidências:** captura de tela sanitizada; arquivo original, quando permitido; hash SHA-256; resposta HTTP e metadados técnicos; protocolo de pedido LAI; resposta do órgão; revisão independente.

**Conclusão técnica e jurídica:** separar claramente fato observado; norma potencialmente aplicável; interpretação; limitações; pontos ainda não confirmados.

Não classificar um município como "corrupto", "transparente", "escondendo dados" ou atribuir nota geral com base em um teste técnico.

---

## 12. Metodologia para pedidos de acesso à informação

Quando a informação não for localizada, o projeto poderá formular pedidos objetivos. Exemplos de informações que podem ser solicitadas, conforme existam e sejam pertinentes:

- endereço oficial do portal e da página em que os dados são publicados;
- manuais e documentação dos sistemas;
- dicionário de dados e descrição dos campos;
- arquivos ou relatórios em formato digital reutilizável;
- existência de API, serviço web, exportação ou download em lote;
- documentação de autenticação e limites de uso, se houver;
- contrato e termos aditivos do fornecedor do sistema;
- cláusulas sobre propriedade, portabilidade, exportação e acesso aos dados;
- periodicidade de atualização;
- período histórico disponível;
- identificação da unidade responsável pela publicação;
- justificativa e fundamento legal de eventual restrição;
- possibilidade de fornecer versão parcial com ocultação apenas dos campos protegidos.

**Cuidados na redação:**

- Especificar o período e a categoria de informação.
- Pedir registros existentes, documentos, arquivos e manuais.
- Não exigir que o órgão desenvolva uma API nova.
- Não exigir estudo ou análise inédita como se já existisse.
- Não solicitar dados pessoais excessivos.
- Pedir, quando possível, fornecimento digital no formato em que a informação estiver armazenada.
- Guardar protocolo, prazo, resposta e eventual recurso.

A CGU disponibiliza orientações para Estados e Municípios e ferramentas de apoio à implementação da LAI: https://www.gov.br/acessoainformacao/pt-br/lai-para-estados-e-municipios/lai_estados_municipios

---

## 13. O que não se pode concluir sem investigação adicional

| Observação | O que não prova, isoladamente |
|---|---|
| Não foi encontrada API | Não prova que a informação não exista ou que haja ilegalidade |
| Endpoint retornou erro 403, 404 ou 500 | Não prova inexistência definitiva do serviço ou descumprimento legal |
| Portal usa CAPTCHA | Não prova intenção de ocultar dados; exige análise do acesso alternativo e da obrigação aplicável |
| Dados aparecem em PDF | Não prova automaticamente descumprimento; é preciso avaliar os requisitos legais e se há outros formatos disponíveis |
| O fornecedor é privado | Não prova irregularidade nem transfere automaticamente a ele o dever legal do órgão |
| Há campos pessoais na base | Não torna automaticamente toda a base sigilosa |
| O dado não aparece no PNCP | Não prova, sem conferir filtros e contexto, que a contratação não foi publicada |
| Há divergência entre duas bases | Não prova fraude; pode haver diferença de competência, estágio contábil, atualização ou conceito |
| Um órgão respondeu que não possui a informação | Não prova que outro órgão ou sistema não a possua |
| O site está fora do ar durante um teste | Não prova indisponibilidade permanente |

A linguagem pública deve ser proporcional à evidência: "não localizado na consulta realizada", "acesso automatizado não confirmado", "resposta parcial", "documentação não encontrada" ou "divergência identificada".

---

## 14. Como investigar fornecedores e contratos de tecnologia

A dificuldade de acesso pode estar ligada à arquitetura e à contratação de sistemas. O projeto deve investigar fatos documentais, sem presumir irregularidade.

Para cada fornecedor identificado, procurar: razão social e CNPJ; contrato e processo de contratação; objeto e módulos adquiridos; vigência, valores e aditivos; níveis de serviço e disponibilidade; obrigações de segurança e proteção de dados; exportação e portabilidade; acesso do órgão aos próprios dados; documentação técnica; condições para encerramento do contrato; custos de migração; propriedade intelectual e direitos sobre customizações; responsabilidades de suporte e publicação.

A Lei nº 14.133/2021 contém regras sobre planejamento, publicidade e contratação. O contrato concreto e seus anexos são essenciais para determinar as obrigações específicas do fornecedor e do órgão.

**Princípio:** o dever público de transparência não deve ser confundido com a responsabilidade técnica contratual de uma empresa. O órgão continua sendo o ponto institucional a ser questionado sobre o cumprimento de suas obrigações legais, sem prejuízo de investigar as obrigações do fornecedor.

---

## 15. Regras de segurança e ética para a coleta do Olho Mágico

1. Consultar fontes públicas e documentações oficiais.
2. Respeitar autenticação, CAPTCHA, WAF, rate limits e controles de acesso.
3. Não explorar vulnerabilidades nem tentar acessar áreas privadas.
4. Não reutilizar tokens, cookies ou credenciais de terceiros.
5. Nunca publicar segredos ou dados pessoais desnecessários.
6. Aplicar minimização de dados desde a ingestão.
7. Guardar amostras sanitizadas e metadados suficientes para reproduzir o teste.
8. Não alterar a fonte oficial nem interferir no funcionamento do portal.
9. Não realizar carga excessiva; controlar frequência, concorrência e volume.
10. Identificar claramente coleta automatizada e manter contato institucional quando apropriado.
11. Permitir manifestação do órgão ou fornecedor antes de publicar conclusões potencialmente controversas, com prazo editorial de 30 dias corridos definido pela metodologia do projeto — sem apresentar esse prazo como imposição legal geral.
12. Manter histórico público de correções e revisões.

---

## 16. Diretrizes editoriais e de governança

O Olho Mágico é independente, comunitário e aberto à contribuição pública, mas suas descobertas devem passar por revisão.

- Duas revisões independentes antes de publicar uma descoberta como verificada.
- Evidências públicas sanitizadas.
- Histórico público de correções.
- Preservação histórica permanente, respeitadas obrigações legais, privacidade e segurança.
- Correções versionadas.
- Revalidação periódica de endpoints.
- Fontes oficiais identificadas e citadas.
- Direito de manifestação do órgão ou fornecedor, conforme metodologia editorial.
- Separação entre observação técnica, interpretação jurídica e opinião.
- Nenhuma acusação sem evidência verificável.
- Nenhuma pontuação ou ranking geral de municípios, órgãos, partidos ou agentes públicos.

O projeto pode apresentar fichas individuais, inventários de fontes, dados descritivos, cobertura observada, datas de atualização e status técnico. Não deve converter esses dados em classificação moral ou política.

---

## 17. Orientações para quem for revisar o projeto

Este documento é base jurídico-técnica para revisar o projeto, não autorização para alterar o repositório.

1. Inspecionar o site e o repositório existentes.
2. Identificar as categorias de informação que o projeto já apresenta.
3. Relacionar cada categoria com as normas potencialmente aplicáveis.
4. Separar deveres gerais da LAI, deveres fiscais da LRF, regras de contratações e requisitos de dados abertos.
5. Verificar se há regulamentação municipal ou estadual relevante para cada ente analisado.
6. Identificar quando a Lei nº 14.129/2021 foi adotada pelo ente, antes de usá-la como fundamento direto.
7. Examinar como o site atual lida com dados pessoais e campos desnecessários.
8. Avaliar se a metodologia distingue transparência jurídica, informacional e tecnológica.
9. Identificar afirmações do site que precisem de ressalvas ou fontes.
10. Apresentar correções sugeridas, sem implementá-las.

Não modificar arquivos, código, banco de dados, configurações ou site até receber autorização explícita do responsável.

---

## 18. Fontes oficiais e referências

### Legislação federal
- Constituição Federal: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
- Lei nº 12.527/2011 — LAI: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm
- Lei Complementar nº 101/2000 — LRF: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm
- Lei Complementar nº 131/2009: consultar redação incorporada à LRF no link acima.
- Lei nº 13.709/2018 — LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Lei nº 14.129/2021 — Governo Digital: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm
- Lei nº 14.133/2021 — Licitações e Contratos: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm

### Orientações oficiais
- CGU — LAI para Estados e Municípios: https://www.gov.br/acessoainformacao/pt-br/lai-para-estados-e-municipios/lai_estados_municipios
- CGU — Requisitos de transparência ativa de dados: https://www.gov.br/acessoainformacao/pt-br/lai-para-sic/transparencia-ativa/copy_of_guia-de-transparencia-ativa/textos-complementares/requisitos-transparencia-ativa-de-dados
- CGU — Requisitos de sítios oficiais: https://www.gov.br/acessoainformacao/pt-br/lai-para-sic/transparencia-ativa/copy_of_guia-de-transparencia-ativa/textos-complementares/requisitos-sitios-oficiais-do-governo-federal
- CGU — O que são dados abertos: https://www.gov.br/acessoainformacao/pt-br/lai-para-sic/transparencia-ativa/copy_of_guia-de-transparencia-ativa/textos-complementares/formato-aberto
- CGU — Orientações sobre conteúdo a ser divulgado: https://www.gov.br/acessoainformacao/pt-br/lai-para-sic/transparencia-ativa/copy_of_guia-de-transparencia-ativa/orientacoes-1/2-orientacoes-sobre-conteudo-a-ser-proativamente-disponibilizado
- CGU — Informações obrigatórias: https://www.gov.br/acessoainformacao/pt-br/assuntos/transparencia-ativa/informacoes-obrigatorias/informacoes-obrigatorias
- CGU — Dados abertos: https://www.gov.br/cgu/pt-br/acesso-a-informacao/dados-abertos

---

## 19. Conclusão

O fundamento do Olho Mágico é tornar verificável a distância entre a informação pública que deveria ser acessível e a informação que o cidadão efetivamente consegue localizar, compreender, obter e reutilizar.

A legislação brasileira contém instrumentos importantes para transparência ativa, acesso mediante pedido, divulgação fiscal, publicidade de contratações e abertura de dados. Porém, a aplicação de cada norma depende do seu alcance, do ente federativo, do tipo de informação e das exceções legais.

A dificuldade de encontrar dados pode decorrer de fragmentação institucional, dependência de fornecedores, falta de padronização, formatos inadequados, ausência de metadados, histórico limitado, problemas de atualização ou barreiras técnicas. Cada hipótese precisa ser demonstrada por evidências.

O Olho Mágico não deve partir da conclusão de que um órgão está escondendo informações. Deve fazer perguntas precisas, localizar as fontes, testar os meios de acesso permitidos, documentar os resultados, solicitar esclarecimentos quando necessário e publicar conclusões proporcionais às provas.

**A missão é transformar transparência formal em informação localizável, compreensível, verificável e reutilizável — dentro da lei, com respeito à privacidade e sem acusações sem prova.**
