/* SIGLAS E TERMOS: a lista de explicações do site e o que faz as siglas virarem "tocáveis".
   - OBS.siglas.LISTA: cada sigla com o nome completo e uma explicação simples.
   - OBS.siglas.TERMOS: palavras técnicas que não são siglas (empenhado, inexigibilidade...).
   - Em cada tela, a PRIMEIRA vez que uma sigla aparece ela ganha o sinal ⓘ; ao tocar, abre um balão com o significado.
     (Marcar todas as vezes poluía a leitura: "FPM, FUNDEB e ITR" virava três sublinhados seguidos.)
   - Palavras técnicas (Empenhado, Liquidado...) ganham o ⓘ onde a tela pedir, com OBS.siglas.termoTocavel().
   IMPORTANTE: o texto dos dados oficiais NUNCA é alterado. A sigla continua igual; só ganha a explicação ao lado.
   Só entra aqui significado CONFIRMADO (em lei, na própria fonte ou no órgão oficial). Na dúvida, fica de fora.

   Campos de cada sigla:
     sigla   como aparece no site
     nome    o que a sigla quer dizer
     texto   explicação em linguagem simples
     auto    false = NÃO marcar sozinha em todo o site (siglas curtas que se confundem com nomes de empresas,
             como "PL" ou "DF"); elas só são marcadas onde a tela pedir, e sempre aparecem na aba "Siglas e termos".
     padrao  (opcional) como reconhecer a sigla no texto, quando ela aparece de um jeito especial. */
OBS.siglas = (function () {
  const LISTA = [
    { sigla: 'ADO 25', padrao: 'ADO ?25', nome: 'Ação Direta de Inconstitucionalidade por Omissão nº 25',
      texto: 'Processo no Supremo Tribunal Federal sobre a compensação a estados e municípios pelas perdas com a Lei Kandir (que tirou o imposto estadual sobre mercadorias das exportações). O acordo feito nesse processo deu origem à Lei Complementar 176/2020, que define esses repasses.' },
    { sigla: 'API', nome: 'Interface de Programação de Aplicações (do inglês "Application Programming Interface")',
      texto: 'Endereço que entrega dados num formato feito para programas lerem. É assim que este site busca as informações nas fontes oficiais.' },
    { sigla: 'BPC', nome: 'Benefício de Prestação Continuada',
      texto: 'Pagamento de um salário mínimo por mês a idosos com 65 anos ou mais e a pessoas com deficiência de família de baixa renda. É pago pelo Governo Federal.' },
    { sigla: 'CF', auto: false, nome: 'Constituição Federal', texto: 'A Constituição da República Federativa do Brasil, de 1988: a lei mais importante do país.' },
    { sigla: 'CGU', nome: 'Controladoria-Geral da União',
      texto: 'Órgão federal de controle e de combate à corrupção. Mantém o Portal da Transparência do Governo Federal, de onde vêm os convênios e benefícios deste site.' },
    { sigla: 'CIDE', nome: 'Contribuição de Intervenção no Domínio Econômico',
      texto: 'Tributo federal cobrado sobre combustíveis (por isso "CIDE-Combustíveis"). Parte do que é arrecadado é repassada a estados e municípios, para programas de infraestrutura de transportes.' },
    { sigla: 'CNPJ', nome: 'Cadastro Nacional da Pessoa Jurídica',
      texto: 'Número que identifica empresas, entidades e órgãos públicos. É uma informação pública.' },
    { sigla: 'CPF', nome: 'Cadastro de Pessoas Físicas',
      texto: 'Número que identifica cada pessoa. Por privacidade, este site nunca mostra nem pesquisa CPF.' },
    { sigla: 'CSV', nome: 'Valores separados por vírgula (do inglês "comma-separated values")',
      texto: 'Formato de planilha simples, que abre no Excel, no LibreOffice ou no Google Planilhas.' },
    { sigla: 'DCA', nome: 'Declaração de Contas Anuais',
      texto: 'Prestação de contas anual que o município entrega ao Tesouro Nacional, com as receitas, as despesas e o patrimônio do ano.' },
    { sigla: 'DF', auto: false, nome: 'Distrito Federal', texto: 'Unidade da Federação onde fica Brasília.' },
    { sigla: 'FNDE', nome: 'Fundo Nacional de Desenvolvimento da Educação',
      texto: 'Órgão do Ministério da Educação que repassa dinheiro para a educação (merenda, transporte escolar, programas) e acompanha esses gastos.' },
    { sigla: 'FPM', nome: 'Fundo de Participação dos Municípios',
      texto: 'Parte do Imposto de Renda e do Imposto sobre Produtos Industrializados que a União divide com as prefeituras, conforme a população de cada cidade. Além das parcelas normais, a Constituição prevê parcelas extras de 1% em alguns meses do ano (é o "FPM 1%").' },
    { sigla: 'FUNDEB', nome: 'Fundo de Manutenção e Desenvolvimento da Educação Básica e de Valorização dos Profissionais da Educação',
      texto: 'Fundo que junta parte dos impostos de estados e municípios, com uma complementação da União, e redistribui o dinheiro conforme o número de alunos da rede pública. O "ajuste" é uma correção de valores já repassados, por isso pode ser negativo.' },
    { sigla: 'IBGE', nome: 'Instituto Brasileiro de Geografia e Estatística',
      texto: 'Faz o censo e outras pesquisas oficiais. Dá a cada município um código de identificação, usado pelas fontes oficiais.' },
    { sigla: 'IEI', nome: 'Indicador para Educação Infantil',
      texto: 'Indicador do FUNDEB sobre o percentual mínimo da complementação VAAT que deve ir para a educação infantil (creches e pré-escolas).' },
    { sigla: 'ITR', nome: 'Imposto sobre a Propriedade Territorial Rural',
      texto: 'Imposto federal sobre terras rurais. Metade do que é arrecadado no município vai para a prefeitura, ou tudo, se a prefeitura assumir a fiscalização por convênio com a Receita Federal.' },
    { sigla: 'LC', padrao: 'LC(?= ?\\d)', nome: 'Lei Complementar',
      texto: 'Tipo de lei que trata de assuntos que a Constituição manda regular com uma aprovação mais difícil (maioria absoluta).' },
    { sigla: 'LRF', nome: 'Lei de Responsabilidade Fiscal (Lei Complementar 101/2000)',
      texto: 'Define regras para os gastos públicos, como os limites de gasto com pessoal e de dívida, e obriga a publicar relatórios como o RGF e o RREO.' },
    { sigla: 'MDB', auto: false, nome: 'Movimento Democrático Brasileiro', texto: 'Partido político.' },
    { sigla: 'MDE', nome: 'Manutenção e Desenvolvimento do Ensino',
      texto: 'Gastos que contam para o mínimo que a Constituição exige em educação: o município deve aplicar pelo menos 25% das receitas de impostos (art. 212).' },
    { sigla: 'MF', padrao: 'MF(?=/)', nome: 'Ministério da Fazenda', texto: 'Ministério do Governo Federal responsável pela economia e pelas contas públicas.' },
    { sigla: 'MGI', nome: 'Ministério da Gestão e da Inovação em Serviços Públicos', texto: 'Ministério do Governo Federal responsável pela gestão do serviço público.' },
    { sigla: 'MSC', nome: 'Matriz de Saldos Contábeis',
      texto: 'Arquivo mensal com os saldos da contabilidade do município, entregue ao Tesouro Nacional pelo SICONFI.' },
    { sigla: 'PDDE', nome: 'Programa Dinheiro Direto na Escola',
      texto: 'Programa do FNDE que repassa dinheiro diretamente às escolas, para manutenção e pequenas despesas.' },
    { sigla: 'PDT', auto: false, nome: 'Partido Democrático Trabalhista', texto: 'Partido político.' },
    { sigla: 'PIB', nome: 'Produto Interno Bruto',
      texto: 'Soma de tudo o que é produzido na economia. "PIB per capita" é esse valor dividido pelo número de habitantes.' },
    { sigla: 'PL', auto: false, nome: 'Partido Liberal', texto: 'Partido político.' },
    { sigla: 'PNCP', nome: 'Portal Nacional de Contratações Públicas',
      texto: 'Site oficial onde os órgãos públicos de todo o país são obrigados a publicar licitações, compras e contratos (Lei 14.133/2021).' },
    { sigla: 'PSD', auto: false, nome: 'Partido Social Democrático', texto: 'Partido político.' },
    { sigla: 'RCL', nome: 'Receita Corrente Líquida',
      texto: 'Soma das receitas do município em 12 meses, descontadas algumas deduções previstas em lei. É a base para calcular os limites da LRF.' },
    { sigla: 'RGF', nome: 'Relatório de Gestão Fiscal',
      texto: 'Relatório que a Prefeitura e a Câmara publicam a cada quatro meses (ou seis, em municípios pequenos que escolhem essa opção), com o gasto com pessoal, a dívida e outros limites da LRF.' },
    { sigla: 'RREO', nome: 'Relatório Resumido da Execução Orçamentária',
      texto: 'Relatório publicado a cada dois meses que mostra quanto foi arrecadado e gasto em comparação com o previsto no orçamento.' },
    { sigla: 'SICONFI', nome: 'Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro',
      texto: 'Sistema do Tesouro Nacional onde estados e municípios entregam os relatórios fiscais e contábeis (RGF, RREO, DCA e MSC).' },
    { sigla: 'SIOPE', nome: 'Sistema de Informações sobre Orçamentos Públicos em Educação',
      texto: 'Sistema do FNDE onde estados e municípios informam quanto arrecadam e aplicam em educação.' },
    { sigla: 'VAAT', nome: 'Valor Anual Total por Aluno',
      texto: 'Indicador do FUNDEB usado para decidir quais redes de ensino recebem uma complementação extra da União, chamada "complementação VAAT".' }
  ];

  /* Cada termo: texto (1 frase), e quando ajudar: exemplo (concreto) e cuidado (o erro de leitura mais comum).
     Só entra significado confirmado (lei, Constituição, ou o que foi conferido nos próprios dados do site). */
  const TERMOS = [
    // ----- As etapas da despesa -----
    { termo: 'Empenhado', texto: 'Primeira etapa da despesa: o órgão público reserva o dinheiro do orçamento para um gasto. É um compromisso, ainda não é pagamento.',
      exemplo: 'A Prefeitura decide reformar uma escola e reserva R$ 200 mil para isso.',
      cuidado: 'Reservar não é pagar. O mesmo gasto aparece depois como liquidado e como pago: não some as etapas. No total do mês, o empenhado já vem com as reservas canceladas descontadas, por isso pode até ficar negativo.' },
    { termo: 'Liquidado', texto: 'Segunda etapa da despesa: o órgão confere que o produto foi entregue ou o serviço foi feito e reconhece que deve pagar.',
      exemplo: 'A reforma ficou pronta e foi conferida.',
      cuidado: 'Num mês, o liquidado pode ser maior que o empenhado: o gasto pode ter sido reservado num mês anterior.' },
    { termo: 'Pago', texto: 'Terceira etapa da despesa: o dinheiro sai de fato para quem tem a receber.',
      exemplo: 'A empresa da reforma recebeu o valor.',
      cuidado: 'Empenhado, liquidado e pago são etapas da mesma despesa: não se somam. Nesta fonte, o pago é das despesas do orçamento do próprio ano; pagamentos de despesas de anos anteriores (restos a pagar) não entram.' },
    { termo: 'Anulado', texto: 'Parte de um empenho que foi cancelada e voltou para o orçamento.',
      cuidado: 'O valor anulado já vem descontado do empenhado mostrado no site.' },
    { termo: 'Retido', texto: 'Valor descontado no momento do pagamento e enviado a outro destino, como impostos e contribuições retidos na fonte.',
      exemplo: 'Do pagamento a uma empresa, uma parte fica separada para o imposto que ela deve.' },
    { termo: 'Credor', texto: 'Quem recebe um pagamento do poder público: uma empresa, uma pessoa, uma entidade ou outro órgão público.',
      cuidado: 'Estar entre os que mais receberam não indica irregularidade: folhas de pagamento e hospitais custam muito por natureza.' },
    { termo: 'Restos a pagar', texto: 'Despesas reservadas (empenhadas) num ano e pagas só nos anos seguintes.',
      cuidado: 'O valor pago de cada mês, neste site, não inclui os pagamentos de restos a pagar.' },
    { termo: 'Despesa intraorçamentária', texto: 'Pagamento de um órgão do município para outro órgão do próprio município.',
      exemplo: 'A contribuição que uma secretaria paga ao instituto de previdência dos servidores.',
      cuidado: 'Ela entra no total pago do mês, mas fica fora do total por área do ano.' },
    // ----- Quem gasta -----
    { termo: 'Órgão', texto: 'Cada parte da administração que tem orçamento próprio e registra gastos: as secretarias da Prefeitura, a Câmara, os fundos municipais, as autarquias e a fundação.',
      exemplo: 'Secretaria Municipal de Educação; Fundo Municipal de Saúde.' },
    { termo: 'Unidade (setor)', texto: 'Divisão interna de um órgão que registra o gasto.',
      exemplo: 'Dentro da Secretaria de Gabinete, a unidade “Assessoria de Gabinete”.' },
    { termo: 'Autarquia', texto: 'Entidade pública criada por lei, com administração e orçamento próprios, para cuidar de um serviço específico.',
      exemplo: 'Em Videira aparecem o SAMAE (água e esgoto) e o instituto de previdência dos servidores.' },
    { termo: 'Fundação municipal', texto: 'Entidade criada pelo município para atuar numa área específica, com orçamento próprio.',
      exemplo: 'Fundação Municipal de Esportes de Videira.' },
    { termo: 'Fundo municipal', texto: 'Conta separada do orçamento, criada por lei, que reúne o dinheiro de uma finalidade específica.',
      exemplo: 'Fundo Municipal de Saúde; Fundo Municipal de Assistência Social.',
      cuidado: 'Boa parte dos gastos com saúde aparece no Fundo Municipal de Saúde, e não numa secretaria.' },
    { termo: 'Consórcio intermunicipal', texto: 'Associação de vários municípios para prestar um serviço em conjunto. É uma entidade separada de cada município.',
      exemplo: 'O CISAMARP, consórcio de saúde do Alto Vale do Rio do Peixe, com sede em Videira.',
      cuidado: 'Os contratos do consórcio não são contratos do Município de Videira; por isso ficam fora dos totais do site.' },
    { termo: 'Poder Executivo e Poder Legislativo', texto: 'No município, o Executivo é a Prefeitura (prefeito, secretarias e entidades ligadas) e o Legislativo é a Câmara de Vereadores.',
      cuidado: 'A Lei de Responsabilidade Fiscal tem limites de gasto com pessoal separados para cada poder.' },
    // ----- Dinheiro e orçamento -----
    { termo: 'Exercício', texto: 'O ano do orçamento público, de 1º de janeiro a 31 de dezembro.' },
    { termo: 'Bimestre, quadrimestre e semestre', texto: 'Períodos de 2, 4 e 6 meses do ano. Os relatórios fiscais usam esses períodos: o RREO é bimestral e o RGF é quadrimestral ou semestral.' },
    { termo: 'Fonte de recurso', texto: 'A “caixa” de onde sai o dinheiro de cada gasto: impostos da cidade, repasses para saúde ou educação, convênios e outras.',
      cuidado: 'Algumas fontes só podem ser usadas para fins específicos.' },
    { termo: 'Dotação', texto: 'Valor que o orçamento aprovado reserva para cada tipo de gasto no ano.',
      cuidado: 'Este site ainda não mostra as dotações.' },
    { termo: 'Função e subfunção', texto: 'Função é a grande área do gasto (saúde, educação, urbanismo). Subfunção é a divisão dentro dela.',
      exemplo: 'Atenção básica é uma subfunção da função Saúde.' },
    { termo: 'Receita corrente líquida', texto: 'Soma das receitas regulares do município (impostos, repasses e outras), descontados alguns valores definidos em lei. É a base para calcular os limites da LRF.' },
    { termo: 'Decêndio', texto: 'Período de 10 dias. Alguns repasses da União, como o FPM, são feitos a cada decêndio.',
      cuidado: 'Por isso o mês mais recente dos repasses pode estar incompleto.' },
    { termo: 'Transferências constitucionais', texto: 'Repasses que a Constituição obriga a fazer a estados e municípios, como o FPM e o ITR. O FUNDEB aparece junto porque é publicado na mesma fonte do Tesouro Nacional.',
      cuidado: 'O FUNDEB é formado principalmente por impostos do estado e dos municípios, mais uma complementação da União.' },
    { termo: 'Royalties', texto: 'Compensação paga pela exploração de recursos naturais, como petróleo, gás e energia de usinas hidrelétricas. Parte desse dinheiro é repassada a estados e municípios.' },
    // ----- Limites da lei -----
    { termo: 'Limites de gasto com pessoal', texto: 'Limites da LRF. No Executivo municipal, o máximo é 54% da receita corrente líquida. Acima de 95% desse máximo (51,3%) vale o limite prudencial, com restrições; acima de 90% (48,6%), o Tribunal de Contas emite um alerta.' },
    { termo: 'Mínimo constitucional da educação', texto: 'A Constituição obriga o município a aplicar pelo menos 25% das receitas de impostos (incluindo as transferências de impostos) em manutenção e desenvolvimento do ensino (art. 212).',
      cuidado: 'O mínimo vale para o ano inteiro: com dado parcial, ainda não dá para dizer se será cumprido.' },
    { termo: 'Dado parcial', texto: 'Número de um período que ainda não terminou: pode mudar até o fim do período.',
      exemplo: 'Os gastos com educação até o 4º bimestre do ano.' },
    { termo: 'Autodeclaração', texto: 'Informação que o próprio município envia a um órgão federal, como o Tesouro Nacional ou o FNDE. O site mostra os números como foram declarados.',
      cuidado: 'A declaração pode ser corrigida (retificada) depois.' },
    // ----- Pessoas -----
    { termo: 'Vínculo (matrícula)', texto: 'Cada registro da lista de pessoal é um vínculo de trabalho com o município.',
      cuidado: 'Quem tem dois cargos aparece duas vezes. O site nunca junta registros pelo nome.' },
    { termo: 'Salário-base', texto: 'Valor fixo do cargo, antes de gratificações, adicionais e descontos.',
      cuidado: 'Não é o que a pessoa recebe no mês. A remuneração do mês está no portal oficial.' },
    { termo: 'Remuneração bruta e líquida', texto: 'Bruta é o total do mês antes dos descontos (salário-base mais gratificações e adicionais). Líquida é o que sobra depois dos descontos.',
      cuidado: 'Este site mostra só o salário-base; a remuneração de cada mês está no portal oficial.' },
    { termo: 'Cargo em comissão (comissionado)', texto: 'Cargo de livre nomeação e exoneração, sem concurso público (Constituição, art. 37).' },
    { termo: 'Servidor efetivo', texto: 'Servidor que entrou por concurso público.' },
    { termo: 'Contrato por prazo determinado', texto: 'Contratação por tempo limitado, para atender necessidade temporária de excepcional interesse público (Constituição, art. 37, IX).' },
    { termo: 'Estagiário', texto: 'Estudante que trabalha por tempo limitado para aprender na prática, com bolsa de estágio.' },
    { termo: 'Agente político', texto: 'Quem ocupa cargo político por eleição ou nomeação, como prefeito, vice-prefeito e vereadores.' },
    { termo: 'Aposentado e pensionista', texto: 'Aposentado é o servidor que deixou de trabalhar e recebe aposentadoria. Pensionista recebe pensão pela morte de um servidor. No município, são pagos pelo instituto de previdência.',
      cuidado: 'Eles aparecem na lista de pessoal do Município, mas não estão trabalhando.' },
    { termo: 'CPF mascarado', texto: 'Para proteger dados pessoais, o site mostra só os números do meio do CPF de pessoas físicas (***.456.789-**). O número completo está no portal oficial.' },
    // ----- Contratos e convênios -----
    { termo: 'Licitação', texto: 'Disputa pública que o poder público é obrigado a fazer, em regra, para escolher quem vai vender ou prestar um serviço, buscando a proposta mais vantajosa. As regras estão na Lei 14.133/2021.' },
    { termo: 'Pregão', texto: 'Modalidade de licitação para comprar bens e serviços comuns. Vence o menor preço ou o maior desconto. O pregão eletrônico é feito pela internet.' },
    { termo: 'Concorrência', texto: 'Modalidade de licitação usada principalmente para obras, serviços de engenharia e bens e serviços especiais.' },
    { termo: 'Dispensa de licitação', texto: 'Contratação sem licitação que a lei permite em casos específicos, mesmo havendo possibilidade de disputa, como compras de pequeno valor ou situações de emergência (Lei 14.133/2021, art. 75).' },
    { termo: 'Inexigibilidade', texto: 'Contratação sem licitação quando a disputa é inviável, por exemplo quando só existe um fornecedor possível ou para contratar um artista consagrado (Lei 14.133/2021, art. 74).' },
    { termo: 'Credenciamento', texto: 'Chamada pública em que todos os interessados que cumprem os requisitos podem ser contratados, sem disputa entre eles (Lei 14.133/2021, art. 79).' },
    { termo: 'Valor estimado e valor homologado', texto: 'Estimado é quanto o órgão previu gastar antes da disputa. Homologado é o valor final aprovado depois dela.' },
    { termo: 'Valor global', texto: 'Valor total previsto de um contrato, somando todo o período de vigência.',
      cuidado: 'É o valor previsto, não o que já foi pago.' },
    { termo: 'Termo aditivo', texto: 'Documento que altera um contrato já assinado, por exemplo para mudar o prazo ou o valor.' },
    { termo: 'Vigência', texto: 'O período em que um contrato ou convênio vale, do início ao fim.' },
    { termo: 'Convênio', texto: 'Acordo em que um órgão público (por exemplo, um ministério) repassa dinheiro para outro órgão ou entidade realizar um projeto de interesse comum.' },
    { termo: 'Contrato de repasse', texto: 'Parecido com o convênio, mas o dinheiro passa por um banco federal (normalmente a Caixa), que acompanha a execução da obra ou do projeto.' },
    { termo: 'Contrapartida', texto: 'Parte do valor de um convênio que o próprio município paga.' },
    { termo: 'Valor liberado', texto: 'Parte do valor combinado de um convênio que já foi transferida de fato.',
      cuidado: 'Não se soma ao valor combinado: é uma parte dele.' },
    // ----- Câmara -----
    { termo: 'Pauta', texto: 'Lista dos assuntos que serão discutidos e votados numa sessão da Câmara.' }
  ];

  /* "Inexigibilidade" -> "inexigibilidade"; "ADO 25" -> "ado-25": vira parte do endereço (#glossario/sigla-ado-25). */
  const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  /* Monta o reconhecedor de siglas. A sigla só vale como palavra inteira: "FPM" sim, "FPMX" não.
     Siglas mais longas primeiro, para "SIOPE" não ser lido como outra coisa. */
  function montar(todas) {
    const itens = LISTA.filter((s) => todas || s.auto !== false)
      .slice().sort((a, b) => b.sigla.length - a.sigla.length);
    const partes = itens.map((s) => s.padrao || s.sigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    try {
      return { itens, regex: new RegExp(`(^|[^\\p{L}\\p{N}_])(${partes.map((p) => `(${p})`).join('|')})(?![\\p{L}\\p{N}_])`, 'gu') };
    } catch (e) {
      return null;   // navegador muito antigo: as siglas só não ficam tocáveis (a aba "Siglas e termos" continua funcionando)
    }
  }
  const RECONHECEDOR = { auto: montar(false), todas: montar(true) };

  /* Procura siglas num texto. Devolve [{ inicio, fim, item }]. Função sem tela: é testada em testes/testes.html. */
  function encontrar(texto, opcoes) {
    const r = RECONHECEDOR[opcoes && opcoes.todas ? 'todas' : 'auto'];
    if (!r || !texto) return [];
    const achados = [];
    r.regex.lastIndex = 0;
    let m;
    while ((m = r.regex.exec(texto))) {
      const qual = m.slice(3).findIndex((g) => g !== undefined);   // qual das siglas bateu
      const inicio = m.index + m[1].length;
      achados.push({ inicio, fim: inicio + m[2].length, item: r.itens[qual] });
      if (m[0].length === 0) r.regex.lastIndex += 1;
    }
    return achados;
  }

  /* Procura na lista da aba "Siglas e termos" (sigla, nome ou explicação; sem diferenciar acento e maiúscula). */
  function filtrar(lista, busca) {
    const palavras = normalizar(busca).split(/\s+/).filter(Boolean);
    return lista.filter((x) => {
      const alvo = normalizar([x.sigla, x.nome, x.termo, x.texto, x.exemplo, x.cuidado].join(' '));
      return palavras.every((p) => alvo.includes(p));
    });
  }

  /* ---------------- Daqui para baixo: só o que mexe na tela ---------------- */

  // Lugares onde a sigla NÃO vira tocável: links e botões (já têm um clique), campos, a própria aba de siglas...
  const PULAR = 'a, button, select, option, textarea, input, label, script, style, svg, abbr, [data-sem-siglas], .balao-sigla';
  let balao = null;
  let aberto = null;   // a sigla cujo balão está aberto
  const marcadas = new Map();   // "tela|sigla" -> elemento já marcado (só a 1ª ocorrência de cada sigla em cada tela)
  const telaDe = (no) => { const v = no.parentElement && no.parentElement.closest('#conteudo > div'); return v ? v.id : 'outro'; };

  /* Troca cada sigla encontrada dentro de "raiz" por <abbr class="sigla">, sem mudar o texto. */
  function marcar(raiz, opcoes) {
    if (!raiz || !RECONHECEDOR.auto) return;
    const textos = [];
    const caminhar = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && !n.parentElement.closest(PULAR) && /[A-Z]{2}/.test(n.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (caminhar.nextNode()) textos.push(caminhar.currentNode);
    textos.forEach((no) => {
      const tela = telaDe(no);
      const achados = encontrar(no.nodeValue, opcoes).filter(({ item }) => {
        const ja = marcadas.get(`${tela}|${item.sigla}`);
        return !(ja && ja.isConnected);          // já marcada nesta tela (e ainda na página): não marca de novo
      });
      if (!achados.length) return;
      const pedacos = document.createDocumentFragment();
      let pos = 0;
      achados.forEach(({ inicio, fim, item }) => {
        if (inicio > pos) pedacos.append(no.nodeValue.slice(pos, inicio));
        const abbr = OBS.el('abbr', 'sigla', no.nodeValue.slice(inicio, fim));
        abbr.title = item.nome;
        abbr.tabIndex = 0;
        abbr.setAttribute('role', 'button');
        abbr.setAttribute('aria-haspopup', 'dialog');
        abbr.dataset.sigla = item.sigla;
        marcadas.set(`${tela}|${item.sigla}`, abbr);
        pedacos.append(abbr);
        pos = fim;
      });
      if (pos < no.nodeValue.length) pedacos.append(no.nodeValue.slice(pos));
      no.replaceWith(pedacos);
    });
  }

  /* Palavra técnica tocável, para as telas usarem onde quiserem: mostra o texto e o ⓘ; ao tocar, abre o balão do termo. */
  function termoTocavel(texto, termo) {
    const item = TERMOS.find((x) => x.termo === termo);
    if (!item) return document.createTextNode(texto);
    const a = OBS.el('abbr', 'sigla', texto);
    a.title = item.texto;
    a.tabIndex = 0;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-haspopup', 'dialog');
    a.dataset.termo = termo;
    return a;
  }

  function fecharBalao(devolverFoco) {
    if (!balao || balao.hidden) return;
    balao.hidden = true;
    if (devolverFoco && aberto) aberto.focus();
    if (aberto) aberto.setAttribute('aria-expanded', 'false');
    aberto = null;
  }

  function abrirBalao(alvo) {
    const termo = alvo.dataset.termo ? TERMOS.find((x) => x.termo === alvo.dataset.termo) : null;
    const item = termo || LISTA.find((s) => s.sigla === alvo.dataset.sigla);
    if (!item) return;
    if (aberto === alvo) { fecharBalao(true); return; }
    fecharBalao(false);
    const titulo = OBS.el('p', 'balao-titulo');
    if (termo) titulo.append(OBS.el('strong', '', termo.termo)); else titulo.append(OBS.el('strong', '', item.sigla), `: ${item.nome}`);
    const fechar = OBS.el('button', 'balao-fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar explicação');
    fechar.addEventListener('click', () => fecharBalao(true));
    const ver = OBS.el('a', '', 'Ver todas as palavras e siglas');
    ver.href = termo ? `#glossario/termo-${slug(termo.termo)}` : `#glossario/sigla-${slug(item.sigla)}`;
    ver.addEventListener('click', () => fecharBalao(false));
    const extras = [];
    if (item.exemplo) { const e = OBS.el('p', ''); e.append(OBS.el('strong', '', 'Exemplo: '), item.exemplo); extras.push(e); }
    if (item.cuidado) { const c = OBS.el('p', ''); c.append(OBS.el('strong', '', 'Cuidado: '), item.cuidado); extras.push(c); }
    balao.replaceChildren(fechar, titulo, OBS.el('p', '', item.texto), ...extras, ver);
    balao.setAttribute('aria-label', `Significado de ${termo ? termo.termo : item.sigla}`);
    balao.hidden = false;
    // Posição: logo abaixo da sigla, sem passar da borda da tela (element.style é permitido pela política de segurança).
    const r = alvo.getBoundingClientRect();
    const largura = balao.offsetWidth;
    const esquerda = Math.max(8, Math.min(r.left, document.documentElement.clientWidth - largura - 8));
    balao.style.left = `${esquerda + window.scrollX}px`;
    balao.style.top = `${r.bottom + window.scrollY + 6}px`;
    alvo.setAttribute('aria-expanded', 'true');
    aberto = alvo;
    fechar.focus({ preventScroll: true });
  }

  /* Liga tudo: cria o balão, marca o que já está na tela e observa o que as telas desenharem depois. */
  function iniciar() {
    if (!RECONHECEDOR.auto) return;
    balao = OBS.el('div', 'balao-sigla');
    balao.setAttribute('role', 'dialog');
    balao.hidden = true;
    document.body.append(balao);

    document.addEventListener('click', (ev) => {
      const alvo = ev.target.closest && ev.target.closest('abbr.sigla');
      if (alvo) { ev.preventDefault(); ev.stopPropagation(); abrirBalao(alvo); return; }
      if (!balao.contains(ev.target)) fecharBalao(false);
    }, true);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { fecharBalao(true); return; }
      const alvo = ev.target.closest && ev.target.closest('abbr.sigla');
      if (alvo && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abrirBalao(alvo); }
    });
    window.addEventListener('hashchange', () => fecharBalao(false));
    window.addEventListener('resize', () => fecharBalao(false));

    const areas = [OBS.$('conteudo')].filter(Boolean);
    areas.forEach((a) => marcar(a));
    // As telas desenham aos poucos (dados chegam depois): marcamos o que for aparecendo.
    let pendentes = new Set();
    let agendado = false;
    const observador = new MutationObserver((mudancas) => {
      mudancas.forEach((m) => m.addedNodes.forEach((n) => {
        const el = n.nodeType === 1 ? n : n.parentElement;
        if (el && !el.closest('abbr.sigla')) pendentes.add(el);
      }));
      if (!agendado && pendentes.size) {
        agendado = true;
        requestAnimationFrame(() => {
          const lote = pendentes; pendentes = new Set(); agendado = false;
          lote.forEach((el) => { if (el.isConnected) marcar(el); });
        });
      }
    });
    areas.forEach((a) => observador.observe(a, { childList: true, subtree: true }));
  }

  /* ---------------- Aba "Palavras e siglas" (#glossario) ---------------- */
  const tela = (function () {
    let pronto = false;

    function cartao(id, titulo, nome, texto, exemplo, cuidado) {
      const art = OBS.el('article', 'glossario-item');
      art.id = id;
      art.append(OBS.el('h3', '', titulo));
      if (nome) art.append(OBS.el('p', 'glossario-nome', nome));
      art.append(OBS.el('p', '', texto));
      if (exemplo) { const e = OBS.el('p', 'glossario-exemplo'); e.append(OBS.el('strong', '', 'Exemplo: '), exemplo); art.append(e); }
      if (cuidado) { const c = OBS.el('p', 'glossario-cuidado'); c.append(OBS.el('strong', '', 'Cuidado: '), cuidado); art.append(c); }
      return art;
    }

    function desenhar() {
      const busca = OBS.$('buscaSigla').value;
      const siglas = filtrar(LISTA.slice().sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR')), busca);
      const termos = filtrar(TERMOS.slice().sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR')), busca);
      OBS.$('listaSiglas').replaceChildren(...siglas.map((s) => cartao(`sec-sigla-${slug(s.sigla)}`, s.sigla, s.nome, s.texto)));
      OBS.$('listaTermos').replaceChildren(...termos.map((t) => cartao(`sec-termo-${slug(t.termo)}`, t.termo, '', t.texto, t.exemplo, t.cuidado)));
      OBS.$('sec-lista-siglas').classList.toggle('oculto', !siglas.length);
      OBS.$('sec-lista-termos').classList.toggle('oculto', !termos.length);
      OBS.$('siglasResumo').textContent = busca.trim()
        ? (siglas.length + termos.length ? `${siglas.length} sigla(s) e ${termos.length} termo(s) encontrados.` : 'Nada encontrado. Tente outra palavra.')
        : `${LISTA.length} siglas e ${TERMOS.length} termos.`;
    }

    function abrir() {
      if (!pronto) {
        pronto = true;
        OBS.$('buscaSigla').addEventListener('input', desenhar);
        OBS.$('limparSigla').addEventListener('click', () => { OBS.$('buscaSigla').value = ''; desenhar(); });
      }
      // Chegou por um link de uma sigla (#glossario/sigla-fpm): limpa a busca para a sigla com certeza aparecer.
      if (location.hash.includes('/')) OBS.$('buscaSigla').value = '';
      desenhar();
    }
    return { abrir };
  })();

  return { LISTA, TERMOS, encontrar, filtrar, slug, marcar, iniciar, tela, termoTocavel };
})();
OBS.siglasTela = OBS.siglas.tela;
