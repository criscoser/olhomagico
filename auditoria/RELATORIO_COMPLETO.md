# Relatório técnico de auditoria — Olho Mágico

**Data da análise:** 04/10/2026  
**Base analisada:** ZIP `olhomagico-main.zip` fornecido nesta conversa  
**Escopo:** código-fonte, segurança, integridade de dados e capacidade de manutenção/expansão  
**Tipo de auditoria:** revisão estática + execução de testes locais; sem teste de penetração e sem validação das APIs reais.

## 1. Resumo executivo

O projeto tem uma base técnica organizada para um portal estático: separa regras de interface, adaptadores de fontes, configuração municipal e automações; preserva arquivos anteriores quando uma fonte falha; recupera dados publicados como JSON puro antes de republicá-los; e possui uma suíte automatizada significativa.

Foram identificadas e corrigidas quatro questões concretas nesta cópia:

1. **Exposição potencial de token em log:** o tratamento de CAPTCHA mascarava o token no arquivo de situação, mas imprimia a exceção original, que pode conter a URL com `CAMARA_TOKEN`.
2. **Retentativas HTTP:** o cliente respeitava `Retry-After` para HTTP 429, mas não para respostas 5xx. Agora respeita segundos ou data HTTP também em 5xx, com limite máximo de espera de 300 segundos.
3. **Números não finitos:** o conversor Python aceitava `NaN` e podia falhar com infinitos/inteiros muito grandes. Agora devolve `None` para esses valores.
4. **Resumo operacional impreciso:** fontes puladas por falta de chave eram contabilizadas como atualizadas no total final. Agora atualizadas, puladas e falhas aparecem separadamente.

Após as correções, os testes locais passaram: 193 testes JavaScript e 32 testes Python.

## 2. Pontos fortes confirmados no código

- O coordenador `ferramentas/atualizar.py` executa adaptadores separadamente e mantém a última cópia válida quando uma fonte falha.
- `ferramentas/recuperar.py` lê os arquivos publicados como dados e os regrava com `json.dumps`, evitando perpetuar código arbitrário que tenha sido inserido em um arquivo de dados.
- As chaves `CGU_CHAVE` e `CAMARA_TOKEN` são obtidas do ambiente; os adaptadores não gravam os tokens nos arquivos de dados.
- A lista de pessoal não armazena matrícula, CPF, horário ou local de trabalho nos registros gerados, conforme o adaptador e os testes existentes.
- O adaptador de despesas usa o documento apenas como chave transitória de agregação e não o grava no resumo gerado.
- CPF de fornecedores pessoa física é mascarado no adaptador PNCP e na exportação.
- A exportação CSV protege células iniciadas por `=`, `+`, `-`, `@`, tabulação ou retorno de carro.
- O DOM é construído principalmente por `textContent`/elementos criados; a busca estática não encontrou sinks executáveis como `innerHTML`, `eval`, `new Function` ou `document.write` (a única ocorrência de `innerHTML` é comentário explicativo).
- A CSP em meta tag limita scripts, estilos, fontes, conexões e frames a origens específicas. Scripts e CSS locais referenciados no HTML existem no ZIP.
- Os workflows fixam as actions por SHA e usam `persist-credentials: false`; permissões declaradas são limitadas ao necessário para cada job.
- O QR Pix tem verificações automatizadas de estrutura, CRC e correspondência entre código, chave e nome.

## 3. Achados e recomendações

### A-01 — Token da Câmara podia aparecer em log ao detectar CAPTCHA
**Classificação:** segurança / credencial — corrigido nesta cópia.

O token da Câmara faz parte da query string (`keysoft=`). Quando a resposta continha sinais de CAPTCHA, `baixar_json` lançava `Bloqueado` incluindo a URL. O `except Bloqueado` mascarava o texto gravado em `situacao.js`, mas imprimia o objeto de exceção original no log. Isso podia expor o token no log da execução.

**Correção:** mascarar a mensagem uma única vez antes de gravar e imprimir.  
**Regressão:** teste de integração simula resposta `403` com `challenge-platform` e verifica que token literal e token codificado não aparecem na saída nem no arquivo de situação.

### A-02 — `Retry-After` ignorado em respostas HTTP 5xx
**Classificação:** confiabilidade / respeito à fonte — corrigido nesta cópia.

O cliente já respeitava `Retry-After` em HTTP 429, mas ignorava o cabeçalho em HTTP 5xx. Isso poderia gerar espera desnecessária ou repetir a consulta em intervalo inadequado.

**Correção:** interpretar `Retry-After` como segundos ou data HTTP para 429 e 5xx; limitar a espera a 300 segundos. Quando o cabeçalho não existe, manter a espera progressiva atual. O limite não substitui as políticas específicas de cada fonte.

### A-03 — Conversor numérico aceitava `NaN` e valores não finitos
**Classificação:** integridade de dados — corrigido nesta cópia.

`float("NaN")` pode produzir um valor que não é um número finito; valores infinitos e inteiros muito grandes também podem causar resultados inválidos ou exceções. Em cálculos financeiros, um valor não finito não deve ser tratado como número válido.

**Correção:** verificar `math.isfinite` tanto para números já numéricos quanto para textos convertidos; valores inválidos retornam `None`. Testes cobrem `NaN`, `Infinity`, infinito numérico e inteiro excessivamente grande.

### A-04 — Resumo contava fontes sem chave como atualizadas
**Classificação:** transparência operacional — corrigido nesta cópia.

O fluxo `SemChave` era corretamente classificado como “PULADO” durante a execução, mas o resumo final calculava atualizadas como total menos falhas. Portanto, fontes puladas por falta de chave podiam entrar na contagem de fontes atualizadas.

**Correção:** contadores independentes para atualizadas, puladas e com falha. A ausência de chave continua sem ser tratada como falha fatal do conjunto.

### A-05 — Proteção de integridade do Pix depende de Secret externo
**Classificação:** segurança operacional — atenção/recomendação, não alterado.

`ferramentas/conferir_pix.py` retorna sucesso com aviso quando `PIX_SHA256` não está configurado. Nesse cenário, a etapa não verifica a impressão digital do código Pix. O monitor periódico também não consegue detectar divergência sem o Secret.

**Recomendação:** antes de considerar o fluxo de publicação endurecido, confirmar que `PIX_SHA256` está cadastrado em GitHub Actions Secrets e que o valor corresponde ao código aprovado. Não compartilhe o hash ou o conteúdo de secrets em prints, chats ou arquivos do projeto. Não alterei a regra para obrigatória porque isso poderia bloquear a publicação de uma instalação que ainda não configurou o Secret.

### A-06 — Token da Câmara enviado em query string
**Classificação:** risco inerente à integração — documentado, não alterado.

O endpoint da Câmara recebe `keysoft` na URL. Query strings podem ser registradas por infraestrutura intermediária e logs do servidor. O código evita gravar a URL com token nos dados públicos e mascara mensagens, mas não controla logs do provedor, proxy ou ambiente de execução.

**Recomendação:** manter o token com privilégio mínimo, rotacioná-lo se houver suspeita de exposição e nunca habilitar logs de URL completa. Se a Câmara oferecer autenticação por cabeçalho, avaliar migração documentada; não presumir que ofereça.

### A-07 — Nome de fornecedor pessoa física configurado para exibição
**Classificação:** privacidade / decisão editorial — atenção, não alterado.

`MOSTRAR_NOME_PESSOA_FISICA` está `true`. O CPF é mascarado, mas o nome do fornecedor pessoa física pode ser exibido. O README documenta que a opção pode ser desativada.

**Recomendação:** decidir conscientemente se o portal deve exibir nomes de pessoas físicas em listas e CSV. Avaliar necessidade, finalidade, contexto e risco de reidentificação; mascarar CPF não equivale a anonimização. Não alterei a escolha editorial do mantenedor.

### A-08 — Configuração de execução não equivale a configuração multi-município do portal
**Classificação:** arquitetura / escalabilidade — recomendação, não alterado.

Os adaptadores Python recebem `municipio.json`, mas HTML, CSP, textos, links, telas e parte da configuração JavaScript contêm referências diretas a Videira. Isso é coerente com a instância atual, mas trocar somente `municipio.json` não transforma o portal em uma plataforma multi-município.

**Recomendação:** antes de cadastrar dezenas de municípios, definir um contrato de configuração por município e separar:
- identidade e metadados locais;
- origens permitidas pela política de segurança;
- adaptadores disponíveis e requisitos de credenciais;
- textos e links de fontes locais;
- diferenças de cobertura e periodicidade.

Não substituir referências automaticamente: cada portal e endpoint precisa de validação própria.

### A-09 — Ausência dos snapshots `dados/*.js` no ZIP
**Classificação:** limite de evidência da auditoria.

O ZIP contém `dados/LEIA-ME.txt`, mas não contém os arquivos gerados de dados. Isso é compatível com o `.gitignore`, que exclui `dados/*.js`. Assim, foi possível revisar adaptadores e testes, mas não validar amostras reais publicadas, datas de atualização, completude, totais ou consistência entre fontes no snapshot atual.

**Recomendação:** para uma auditoria de dados publicada, fornecer separadamente uma cópia sanitizada dos arquivos de dados efetivamente publicados ou autorizar consulta ao site publicado. Nunca incluir credenciais.

### A-10 — Relatório anterior de auditoria ficou desatualizado
**Classificação:** documentação — sinalizado.

`docs/AUDITORIA.md` é datado de 02/10/2026 e contém afirmações que não descrevem mais exatamente o ZIP de 04/10/2026 (por exemplo, menção a Google Fonts e contagem antiga de testes). O arquivo foi preservado como histórico; foi acrescentado aviso para direcionar o leitor ao relatório atual nesta pasta `auditoria/`.

## 4. Escopo que não pôde ser comprovado

Não foi realizado:
- teste contra APIs oficiais reais durante esta execução;
- conferência de totais com os portais municipais, Tesouro, PNCP, CGU, FNDE ou IBGE;
- teste do site publicado via navegador;
- teste de Firefox, Safari, iOS ou leitor de tela real;
- análise dinâmica de rede, cabeçalhos HTTP recebidos do GitHub Pages ou teste de penetração;
- revisão jurídica individual de cada categoria de dado;
- auditoria dos arquivos de dados gerados, ausentes neste ZIP.

Portanto, “testes passaram” significa que os testes automatizados locais incluídos no projeto passaram, não que todos os dados públicos estejam corretos ou que a implantação esteja livre de riscos.

## 5. Parecer

A estrutura do projeto é promissora e tem controles úteis de segurança e integridade. As correções incluídas nesta cópia são pequenas, localizadas e cobertas por testes. Os maiores próximos riscos não exigem adicionar funcionalidades: exigem governança dos Secrets, decisão explícita sobre dados de pessoas físicas, validação periódica das fontes e planejamento da configuração multi-município.

**Nenhuma publicação ou alteração remota foi realizada.**
