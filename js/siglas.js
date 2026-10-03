/* SIGLAS E TERMOS: a lista de explicações do site e o que faz as siglas virarem "tocáveis".
   - OBS.siglas.LISTA: cada sigla com o nome completo e uma explicação simples.
   - OBS.siglas.TERMOS: palavras técnicas que não são siglas (empenhado, inexigibilidade...).
   - Em qualquer tela, a sigla ganha um sublinhado pontilhado; ao tocar, abre um balão com o significado.
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

  const TERMOS = [
    { termo: 'Empenhado', texto: 'Primeira etapa da despesa: a Prefeitura reserva o dinheiro do orçamento para um gasto. É um compromisso, ainda não é pagamento.' },
    { termo: 'Liquidado', texto: 'Segunda etapa da despesa: a Prefeitura confere que o produto foi entregue ou o serviço foi feito e reconhece que deve pagar.' },
    { termo: 'Pago', texto: 'Terceira etapa da despesa: o dinheiro sai de fato para quem tem a receber. Empenhado, liquidado e pago são etapas da mesma despesa, por isso não se somam.' },
    { termo: 'Anulado', texto: 'Parte de um empenho que foi cancelada e voltou para o orçamento.' },
    { termo: 'Retido', texto: 'Valor descontado no momento do pagamento e enviado a outro destino, como impostos e contribuições retidos na fonte.' },
    { termo: 'Credor', texto: 'Quem recebe um pagamento do poder público: uma empresa, uma pessoa, uma entidade ou outro órgão público.' },
    { termo: 'Exercício', texto: 'O ano do orçamento público, de 1º de janeiro a 31 de dezembro.' },
    { termo: 'Bimestre, quadrimestre e semestre', texto: 'Períodos de 2, 4 e 6 meses do ano. Os relatórios fiscais usam esses períodos: o RREO é bimestral e o RGF é quadrimestral ou semestral.' },
    { termo: 'Licitação', texto: 'Disputa pública que o poder público é obrigado a fazer, em regra, para escolher quem vai vender ou prestar um serviço, buscando a proposta mais vantajosa. As regras estão na Lei 14.133/2021.' },
    { termo: 'Pregão', texto: 'Modalidade de licitação para comprar bens e serviços comuns. Vence o menor preço ou o maior desconto. O pregão eletrônico é feito pela internet.' },
    { termo: 'Concorrência', texto: 'Modalidade de licitação usada principalmente para obras, serviços de engenharia e bens e serviços especiais.' },
    { termo: 'Dispensa de licitação', texto: 'Contratação sem licitação que a lei permite em casos específicos, mesmo havendo possibilidade de disputa, como compras de valor baixo ou situações de emergência (Lei 14.133/2021, art. 75).' },
    { termo: 'Inexigibilidade', texto: 'Contratação sem licitação quando a disputa é inviável, por exemplo quando só existe um fornecedor possível ou para contratar um artista consagrado (Lei 14.133/2021, art. 74).' },
    { termo: 'Credenciamento', texto: 'Chamada pública em que todos os interessados que cumprem os requisitos podem ser contratados, sem disputa entre eles (Lei 14.133/2021, art. 79).' },
    { termo: 'Valor estimado e valor homologado', texto: 'Estimado é quanto o órgão previu gastar antes da disputa. Homologado é o valor final aprovado depois dela.' },
    { termo: 'Vigência', texto: 'O período em que um contrato ou convênio vale, do início ao fim.' },
    { termo: 'Convênio', texto: 'Acordo em que um órgão público (por exemplo, um ministério) repassa dinheiro para outro órgão ou entidade realizar um projeto de interesse comum.' },
    { termo: 'Contrato de repasse', texto: 'Parecido com o convênio, mas o dinheiro passa por um banco federal (normalmente a Caixa), que acompanha a execução da obra ou do projeto.' },
    { termo: 'Contrapartida', texto: 'Parte do valor de um convênio que o próprio município paga.' },
    { termo: 'Valor liberado', texto: 'Parte do valor combinado de um convênio que já foi transferida de fato. Não se soma ao valor combinado.' },
    { termo: 'Transferências constitucionais', texto: 'Repasses que a Constituição obriga a União a fazer a estados e municípios, como o FPM, o ITR e o FUNDEB.' },
    { termo: 'Royalties', texto: 'Compensação paga pela exploração de recursos naturais, como petróleo, gás e energia de usinas hidrelétricas. Parte desse dinheiro é repassada a estados e municípios.' },
    { termo: 'Limites de gasto com pessoal', texto: 'Limites da LRF. No Executivo municipal, o máximo é 54% da RCL. Acima de 95% desse máximo (51,3%) vale o limite prudencial, com restrições; acima de 90% (48,6%), o Tribunal de Contas emite um alerta.' },
    { termo: 'Cargo em comissão (comissionado)', texto: 'Cargo de livre nomeação e exoneração, sem concurso público (Constituição, art. 37).' },
    { termo: 'Servidor efetivo', texto: 'Servidor que entrou por concurso público.' },
    { termo: 'Salário-base', texto: 'Valor fixo do cargo, antes de gratificações, adicionais e descontos. Não é o que a pessoa recebe no mês.' }
  ];

  /* "Inexigibilidade" -> "inexigibilidade"; "ADO 25" -> "ado-25": vira parte do endereço (#siglas/sigla-ado-25). */
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
      const alvo = normalizar([x.sigla, x.nome, x.termo, x.texto].join(' '));
      return palavras.every((p) => alvo.includes(p));
    });
  }

  /* ---------------- Daqui para baixo: só o que mexe na tela ---------------- */

  // Lugares onde a sigla NÃO vira tocável: links e botões (já têm um clique), campos, a própria aba de siglas...
  const PULAR = 'a, button, select, option, textarea, input, label, script, style, svg, abbr, [data-sem-siglas], .balao-sigla';
  let balao = null;
  let aberto = null;   // a sigla cujo balão está aberto

  /* Troca cada sigla encontrada dentro de "raiz" por <abbr class="sigla">, sem mudar o texto. */
  function marcar(raiz, opcoes) {
    if (!raiz || !RECONHECEDOR.auto) return;
    const textos = [];
    const caminhar = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && !n.parentElement.closest(PULAR) && /[A-Z]{2}/.test(n.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (caminhar.nextNode()) textos.push(caminhar.currentNode);
    textos.forEach((no) => {
      const achados = encontrar(no.nodeValue, opcoes);
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
        pedacos.append(abbr);
        pos = fim;
      });
      if (pos < no.nodeValue.length) pedacos.append(no.nodeValue.slice(pos));
      no.replaceWith(pedacos);
    });
  }

  function fecharBalao(devolverFoco) {
    if (!balao || balao.hidden) return;
    balao.hidden = true;
    if (devolverFoco && aberto) aberto.focus();
    if (aberto) aberto.setAttribute('aria-expanded', 'false');
    aberto = null;
  }

  function abrirBalao(alvo) {
    const item = LISTA.find((s) => s.sigla === alvo.dataset.sigla);
    if (!item) return;
    if (aberto === alvo) { fecharBalao(true); return; }
    fecharBalao(false);
    const titulo = OBS.el('p', 'balao-titulo');
    titulo.append(OBS.el('strong', '', item.sigla), `: ${item.nome}`);
    const fechar = OBS.el('button', 'balao-fechar', '×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar explicação');
    fechar.addEventListener('click', () => fecharBalao(true));
    const ver = OBS.el('a', '', 'Ver todas as siglas e termos');
    ver.href = `#siglas/sigla-${slug(item.sigla)}`;
    ver.addEventListener('click', () => fecharBalao(false));
    balao.replaceChildren(fechar, titulo, OBS.el('p', '', item.texto), ver);
    balao.setAttribute('aria-label', `Significado de ${item.sigla}`);
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

  /* ---------------- Aba "Siglas e termos" (#siglas) ---------------- */
  const tela = (function () {
    let pronto = false;

    function cartao(id, titulo, nome, texto) {
      const art = OBS.el('article', 'glossario-item');
      art.id = id;
      art.append(OBS.el('h3', '', titulo));
      if (nome) art.append(OBS.el('p', 'glossario-nome', nome));
      art.append(OBS.el('p', '', texto));
      return art;
    }

    function desenhar() {
      const busca = OBS.$('buscaSigla').value;
      const siglas = filtrar(LISTA.slice().sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR')), busca);
      const termos = filtrar(TERMOS.slice().sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR')), busca);
      OBS.$('listaSiglas').replaceChildren(...siglas.map((s) => cartao(`sec-sigla-${slug(s.sigla)}`, s.sigla, s.nome, s.texto)));
      OBS.$('listaTermos').replaceChildren(...termos.map((t) => cartao(`sec-termo-${slug(t.termo)}`, t.termo, '', t.texto)));
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
      // Chegou por um link de uma sigla (#siglas/sigla-fpm): limpa a busca para a sigla com certeza aparecer.
      if (location.hash.includes('/')) OBS.$('buscaSigla').value = '';
      desenhar();
    }
    return { abrir };
  })();

  return { LISTA, TERMOS, encontrar, filtrar, slug, marcar, iniciar, tela };
})();
OBS.siglasTela = OBS.siglas.tela;
