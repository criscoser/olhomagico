/* INTERFACE: só desenha na tela o que já foi calculado. Não busca dados nem faz contas pesadas.

   Ideia principal: cada linha de secretaria e de credor é um BOTÃO. Ao tocar, abre um painel
   logo abaixo com os detalhes (quem recebeu, quem pagou, de onde veio o dinheiro). */
OBS.ui = (function () {
  const { $, el, moeda } = OBS;

  // ---- Estado da tela (só na memória) ----
  let res = null;                          // resultado completo da agregação
  let ultima = null;                       // última consulta (linhas, período, fonte), usada para baixar a planilha
  let limite = OBS.config.LINHAS_INICIAIS; // quantos credores mostrar agora
  let filtroOrgao = null;                  // secretaria escolhida para filtrar credores (ou null)
  let todasFontes = false;                 // mostrar todas as origens do dinheiro?

  /* Porcentagem amigável: 0,4% vira "menos de 1%", 37,2% vira "37%". */
  function pct(valor, total) {
    if (!total) return '';
    const p = (valor / total) * 100;
    if (p > 0 && p < 1) return 'menos de 1% do total';
    return `${Math.round(p)}% do total`;
  }

  /* Cria um link que abre em nova aba. */
  function link(texto, url) {
    // Só cria o link se o endereço for seguro (http/https); senão, mostra só o texto.
    const seguro = OBS.urlSegura(url);
    if (!seguro) return el('span', '', texto);
    const a = el('a', '', texto); a.href = seguro;
    if (/^https?:/.test(seguro)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }

  /* Mostra uma mensagem de estado (carregando, erro, sem dados). erro=true deixa a borda vermelha. */
  function mostrarEstado(texto, erro = false) {
    const e = $('estado');
    e.textContent = texto;
    e.className = erro ? 'erro' : '';
    $('resultado').classList.add('oculto');
  }

  /* Barrinha proporcional ao maior valor da lista (só visual, leitores de tela ignoram). */
  function barra(valor, maximo) {
    const b = el('div', 'barra'); b.setAttribute('aria-hidden', 'true');
    const i = el('i'); i.style.width = maximo > 0 ? `${Math.max(1, (valor / maximo) * 100)}%` : '0%';
    b.append(i); return b;
  }

  /* LINHA CLICÁVEL: nome + valor + detalhe + barra. Ao tocar, abre/fecha um painel.
     "montarPainel" só roda na primeira abertura (assim a página não monta detalhes à toa). */
  function linhaClicavel(nome, valor, maximo, detalhe, montarPainel) {
    const li = el('li', 'clicavel');
    const botao = el('button', 'item'); botao.type = 'button';
    botao.setAttribute('aria-expanded', 'false');
    const topo = el('span', 'linha');
    topo.append(el('span', 'nome', nome), el('span', 'v', moeda(valor)));
    botao.append(topo);
    if (detalhe) botao.append(el('span', 'meta', detalhe));
    botao.append(barra(valor, maximo));

    const painel = el('div', 'painel oculto');
    let montado = false;
    botao.addEventListener('click', () => {
      const abrir = botao.getAttribute('aria-expanded') !== 'true';
      if (abrir && !montado) { montarPainel(painel); montado = true; }
      botao.setAttribute('aria-expanded', String(abrir));
      painel.classList.toggle('oculto', !abrir);
    });
    li.append(botao, painel);
    return li;
  }

  /* LISTINHA dentro do painel: nome, valor e porcentagem em relação a "base". Mostra até "max" itens. */
  function miniLista(titulo, pares, base, max = 5) {
    const caixa = el('div', 'mini');
    caixa.append(el('h4', '', titulo));
    const ul = el('ul');
    pares.slice(0, max).forEach(([nome, valor]) => {
      const li = el('li');
      li.append(el('span', 'nome', nome), el('span', 'v', `${moeda(valor)}${base ? ' (' + Math.round((valor / base) * 100) + '%)' : ''}`));
      ul.append(li);
    });
    caixa.append(ul);
    if (pares.length > max) caixa.append(el('p', 'meta', `e mais ${pares.length - max}.`));
    return caixa;
  }

  /* Procura uma explicação automática para o nome do credor (regras em config.js). */
  function explicacaoDe(nome) {
    return OBS.config.EXPLICACOES.find((r) => r.padrao.test(nome || '')) || null;
  }

  /* Nome a exibir para um credor (respeita a escolha de esconder pessoas físicas). */
  function nomeExibido(c) {
    const doc = OBS.tratarDocumento(c.doc);
    return (doc.tipo === 'Pessoa física' && !OBS.config.MOSTRAR_NOME_PESSOA_FISICA) ? 'Pessoa física (nome não exibido)' : c.nome;
  }

  /* ================= SECRETARIAS ================= */
  function desenharOrgaos() {
    const ul = $('orgaos'); ul.replaceChildren();
    const maximo = res.orgaos.length ? res.orgaos[0].pago : 0;
    res.orgaos.forEach((o) => {
      const detalhe = `${pct(o.pago, res.total.pago)} · ${o.porCredor.size} ${o.porCredor.size === 1 ? 'credor' : 'credores'}`;
      ul.append(linhaClicavel(o.nome, o.pago, maximo, detalhe, (painel) => {
        // Quem mais recebeu desta secretaria (trocamos a chave do credor pelo nome).
        const quem = OBS.ordenar(o.porCredor).map(([chave, v]) => [nomeExibido(res.credoresPorChave.get(chave)), v]);
        painel.append(
          miniLista('Quem mais recebeu desta secretaria', quem, o.pago),
          miniLista('Por setor', OBS.ordenar(o.porUnidade), o.pago),
          miniLista('De onde veio o dinheiro', OBS.ordenar(o.porFonte), o.pago, 3));
        const ver = el('button', 'sec', 'Ver todos os credores desta secretaria'); ver.type = 'button';
        ver.addEventListener('click', () => filtrarPorOrgao(o.nome));
        painel.append(ver);
      }));
    });
  }

  /* ================= CREDORES ================= */
  function filtrarPorOrgao(nome) {
    filtroOrgao = nome; limite = OBS.config.LINHAS_INICIAIS;
    desenharCredores();
    $('secCredores').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function desenharCredores() {
    const termo = $('filtro').value.trim().toLowerCase();

    // Se há secretaria escolhida, o valor de cada credor passa a ser SÓ o que ela pagou.
    let lista = res.credores.map((c) => ({ c, valor: filtroOrgao ? (c.porOrgao.get(filtroOrgao) || 0) : c.pago }));
    if (filtroOrgao) lista = lista.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
    if (termo) lista = lista.filter((x) => x.c.nome.toLowerCase().includes(termo));

    $('chipOrgao').classList.toggle('oculto', !filtroOrgao);
    if (filtroOrgao) $('chipTexto').textContent = `Mostrando só o que foi pago por: ${filtroOrgao}.`;

    const maximo = lista.length ? lista[0].valor : 0;
    const ul = $('credores'); ul.replaceChildren();
    lista.slice(0, limite).forEach(({ c, valor }) => {
      const doc = OBS.tratarDocumento(c.doc);
      const exp = explicacaoDe(c.nome);
      const detalhe = [doc.tipo, doc.texto, pct(valor, filtroOrgao ? null : res.total.pago)].filter(Boolean).join(' · ');
      const li = linhaClicavel(nomeExibido(c), valor, maximo, detalhe, (painel) => montarPainelCredor(painel, c, exp));
      if (exp) li.querySelector('.meta').append(el('span', 'selo', 'o que é isto?'));
      ul.append(li);
    });
    if (!lista.length) ul.append(el('li', 'meta', 'Nenhum nome encontrado. Tente digitar só uma parte do nome.'));
    $('maisCredores').classList.toggle('oculto', lista.length <= limite);
  }

  /* Painel de detalhes de UM credor. */
  function montarPainelCredor(painel, c, exp) {
    if (exp) {
      const p = el('p', 'explica', exp.texto + ' ');
      if (exp.link === 'salarios') {
        // Leva para a aba Servidores deste site (lista com cargo e salário-base) e para o portal (valor completo).
        const interno = el('a', '', 'Servidores'); interno.href = '#servidores';
        p.append('Veja quem são, com cargo e salário-base, na aba ', interno,
          '. O valor completo de cada pessoa (com gratificações e descontos) está na ',
          link('Relação Funcionário x Salário do portal oficial', OBS.config.PORTAL_SALARIOS), '.');
      }
      painel.append(p);
    }
    // Empresa (CNPJ): atalho para a ficha, que junta contratos (PNCP) e pagamentos de 12 meses, SÓ pelo CNPJ.
    const digitos = String(c.doc || '').replace(/\D/g, '');
    if (digitos.length === 14) {
      const p = el('p', 'acoes');
      const a = el('a', 'botao-link', 'Abrir a ficha deste fornecedor'); a.href = OBS.rotas.link.fornecedor(digitos);
      p.append(a, el('span', 'meta', ' Contratos e pagamentos dos últimos 12 meses.'));
      painel.append(p);
    }
    // As 3 etapas só deste credor.
    const etapas = el('div', 'mini');
    etapas.append(el('h4', '', 'Os 3 passos deste credor no mês'));
    const ul = el('ul');
    [['Reservado (empenhado)', c.empenhado], ['Entregue e conferido (liquidado)', c.liquidado], ['Pago', c.pago]].forEach(([n, v]) => {
      const li = el('li'); li.append(el('span', 'nome', n), el('span', 'v', moeda(v))); ul.append(li);
    });
    etapas.append(ul);
    painel.append(etapas,
      miniLista('Quem pagou (secretarias)', OBS.ordenar(c.porOrgao), c.pago),
      miniLista('De onde veio o dinheiro', OBS.ordenar(c.porFonte), c.pago, 3));
    const p = el('p', 'meta', 'Quer ver cada pagamento (data, empenho, licitação)? ');
    p.append(link('Abra Pagamentos no portal oficial', OBS.config.PORTAL_PAGAMENTOS), ` e procure por “${c.nome}”.`);
    painel.append(p);
  }

  /* ================= ORIGEM DO DINHEIRO ================= */
  function desenharFontes() {
    const ul = $('fontes'); ul.replaceChildren();
    const maximo = res.fontes.length ? res.fontes[0][1] : 0;
    const max = todasFontes ? res.fontes.length : 6;
    res.fontes.slice(0, max).forEach(([nome, valor]) => {
      const li = el('li');
      const linha = el('div', 'linha'); linha.append(el('span', 'nome', nome), el('span', 'v', moeda(valor)));
      li.append(linha, el('div', 'meta', pct(valor, res.total.pago)), barra(valor, maximo));
      ul.append(li);
    });
    $('maisFontes').classList.toggle('oculto', todasFontes || res.fontes.length <= 6);
  }

  /* ================= 3 PASSOS + AJUSTES ================= */
  function desenharCartoes(idCaixa, itens) {
    const caixa = $(idCaixa); caixa.replaceChildren();
    itens.forEach(([nome, valor, texto]) => {
      const d = el('div', 'etapa');
      d.append(el('div', 'nome', nome), el('div', 'num', moeda(valor)), el('p', '', texto));
      caixa.append(d);
    });
  }

  /* ================= EVOLUÇÃO: 12 meses até o mês escolhido ================= */
  let evolucao = null;   // resultado da última busca de 12 meses (fica na memória para trocar a etapa sem consultar de novo)

  function desenharEvolucao() {
    if (!evolucao) return;
    const etapa = $('etapaEvolucao').value;
    const nomes = { pago: 'pago', liquidado: 'liquidado', empenhado: 'empenhado' };
    const totais = OBS.historico.totaisPorMes(evolucao);
    const serie = totais.map((m) => ({ rotulo: OBS.historico.rotulo(m.anoMes), valor: m[etapa], titulo: OBS.periodoDoMes(m.anoMes).nome + (m.erro ? ' (não respondeu)' : '') }));
    const t = OBS.tabela({ colunas: [
      { chave: 'anoMes', titulo: 'Mês', formatar: (v) => OBS.periodoDoMes(v).nome, ordenavel: false },
      { chave: 'empenhado', titulo: 'Empenhado', tipo: 'moeda', ordenavel: false },
      { chave: 'liquidado', titulo: 'Liquidado', tipo: 'moeda', ordenavel: false },
      { chave: 'pago', titulo: 'Pago', tipo: 'moeda', ordenavel: false }], porPagina: 12, legenda: 'Totais por mês' });
    t.mostrar(totais.slice().reverse());
    const det = el('details'); det.append(el('summary', '', 'Ver os números de cada mês'), t.elemento);
    const erros = totais.filter((m) => m.erro).length;
    $('evolucaoConteudo').replaceChildren(
      OBS.graficos.colunas(serie, { destaque: serie.length - 1, descricao: `Valor ${nomes[etapa]} em cada mês. Os números estão na tabela abaixo.` }),
      el('p', 'meta', `Colunas: valor ${nomes[etapa]} em cada mês; a última é o mês escolhido.` +
        (erros ? ` ${erros} mês(es) não responderam e ficaram em branco.` : '') +
        ' Pagamentos se concentram em alguns meses (13º salário, etapas de obras): compare com cuidado.'),
      det);
  }

  async function carregarEvolucao() {
    if (!ultima) return;
    const botao = $('btnEvolucao'); botao.disabled = true;
    const meses = OBS.historico.meses(ultima.anoMes, 12);
    evolucao = await OBS.historico.varios(meses, (feitos, total) => { $('evolucaoEstado').textContent = `Consultando: ${feitos} de ${total} meses…`; });
    $('evolucaoEstado').textContent = `${OBS.periodoDoMes(meses[0]).nome} a ${OBS.periodoDoMes(meses[11]).nome}.`;
    botao.disabled = false;
    desenharEvolucao();
  }

  /* ================= REGISTROS DO MÊS (filtros + tabela + planilha filtrada) ================= */
  let tReg = null;

  /* Aplica os filtros às linhas da última consulta (função pura sobre os dados da tela). */
  function registrosFiltrados() {
    if (!ultima) return [];
    const f = { orgao: $('regOrgao').value, unidade: $('regUnidade').value, fonte: $('regFonte').value, credor: $('regCredor').value };
    return OBS.filtrarDespesas(ultima.linhas, f);
  }

  function atualizarRegistros() {
    const linhas = registrosFiltrados();
    tReg.mostrar(linhas);
    OBS.chips($('regChips'), [
      { rotulo: 'Secretaria', valor: $('regOrgao').value, limpar: () => { $('regOrgao').value = ''; atualizarRegistros(); } },
      { rotulo: 'Setor', valor: $('regUnidade').value, limpar: () => { $('regUnidade').value = ''; atualizarRegistros(); } },
      { rotulo: 'Origem', valor: $('regFonte').value, limpar: () => { $('regFonte').value = ''; atualizarRegistros(); } },
      { rotulo: 'Credor', valor: $('regCredor').value.trim(), limpar: () => { $('regCredor').value = ''; atualizarRegistros(); } }
    ]);
  }

  function prepararRegistros(linhas) {
    if (!tReg) {
      tReg = OBS.tabela({ colunas: [
        { chave: 'orgaoDescricao', titulo: 'Secretaria' },
        { chave: 'unidadeDescricao', titulo: 'Setor' },
        { chave: 'fonteRecursoDescricao', titulo: 'Origem' },
        { chave: 'nomeCredor', titulo: 'Credor', formatar: (v, l) => nomeExibido({ nome: v || '(sem nome)', doc: l.cpfCnpjCredor }),
          link: (l) => { const d = String(l.cpfCnpjCredor || '').replace(/\D/g, ''); return d.length === 14 ? OBS.rotas.link.fornecedor(d) : null; } },
        { chave: 'cpfCnpjCredor', titulo: 'Documento', formatar: (v) => OBS.tratarDocumento(v).texto || '—' },
        { chave: 'empenhado', titulo: 'Empenhado', tipo: 'moeda', valor: (l) => OBS.numero(l.valorEmpenhado) },
        { chave: 'liquidado', titulo: 'Liquidado', tipo: 'moeda', valor: (l) => OBS.numero(l.valorLiquidado) },
        { chave: 'pago', titulo: 'Pago', tipo: 'moeda', valor: (l) => OBS.numero(l.valorPago) }
      ], porPagina: 25, ordemInicial: { chave: 'pago', descendente: true }, legenda: 'Registros de despesa do mês',
      vazio: 'Nenhum registro com esses filtros.', dica: 'Empresas com CNPJ têm link para a ficha do fornecedor.' });
      $('regTabela').replaceChildren(tReg.elemento);
      $('regCredor').addEventListener('input', OBS.comEspera(atualizarRegistros));
      ['regOrgao', 'regUnidade', 'regFonte'].forEach((id) => $(id).addEventListener('change', atualizarRegistros));
      $('regLimpar').addEventListener('click', () => { ['regOrgao', 'regUnidade', 'regFonte', 'regCredor'].forEach((id) => { $(id).value = ''; }); atualizarRegistros(); });
      $('regCsv').addEventListener('click', () => {
        if (!ultima) return;
        const ativos = [['secretaria', $('regOrgao').value], ['setor', $('regUnidade').value], ['origem', $('regFonte').value], ['credor', $('regCredor').value.trim()]]
          .filter(([, v]) => v).map(([k, v]) => `${k} = ${v}`).join('; ');
        const [, mes, ano] = ultima.periodo.ini.split('/');
        OBS.exportar.baixar(OBS.exportar.csvDespesas(tReg.linhasOrdenadas(), ultima.periodo, Object.assign({}, ultima.meta, { filtros: ativos || 'nenhum' })),
          `olho-magico-despesas-${ano}-${mes}${ativos ? '-filtrado' : ''}.csv`);
      });
    }
    // Opções das listas: só os valores que existem neste mês (filtros "conforme campos efetivos").
    const preencher = (id, campo, rotuloTodos) => {
      const sel = $(id); const atual = sel.value;
      sel.replaceChildren(el('option', '', rotuloTodos));
      sel.firstChild.value = '';
      OBS.opcoes(sel, [...new Set(linhas.map((l) => l[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => [v, v]));
      sel.value = [...sel.options].some((o) => o.value === atual) ? atual : '';
    };
    preencher('regOrgao', 'orgaoDescricao', 'Todas');
    preencher('regUnidade', 'unidadeDescricao', 'Todos');
    preencher('regFonte', 'fonteRecursoDescricao', 'Todas');
    atualizarRegistros();
  }

  /* ================= TELA COMPLETA ================= */
  /* "meta" traz: descartadas (linhas inválidas), recebidas (total de linhas) e consultadoEm (data/hora). */
  function desenharResultado(periodo, resultado, meta) {
    res = resultado;
    limite = OBS.config.LINHAS_INICIAIS; filtroOrgao = null; todasFontes = false;
    $('filtro').value = '';
    const t = res.total;

    // Frase principal. (O "valor por morador" foi removido por decisão do projeto: não reintroduzir.)
    $('frase').replaceChildren(`Em ${periodo.nome}, a Prefeitura pagou `, el('span', 'valor', moeda(t.pago)), '.');

    let nota = `${res.orgaos.length} secretarias pagaram ${res.credores.length.toLocaleString('pt-BR')} credores. Consultado em ${meta.consultadoEm.toLocaleString('pt-BR')}.`;
    if (meta.descartadas > 0) nota += ` Atenção: ${meta.descartadas} registro(s) com valores inválidos foram ignorados.`; // transparência sobre falhas
    $('notaFrase').textContent = nota;

    // Fonte: sempre a consulta EXATA deste período (nunca a página inicial genérica do portal).
    const urlBruta = OBS.fontes.despesas.montarUrl(periodo.ini, periodo.fim);
    ultima = { linhas: meta.linhas || [], periodo, anoMes: meta.anoMes, meta: { url: urlBruta, consultadoEm: meta.consultadoEm, descartadas: meta.descartadas } };
    // Ao trocar de mês, a evolução antiga some (ela era dos 12 meses até o mês anterior escolhido).
    evolucao = null; $('evolucaoConteudo').replaceChildren(); $('evolucaoEstado').textContent = '';
    $('fonteLinha').replaceChildren(`${meta.recebidas.toLocaleString('pt-BR')} registros recebidos da `, link('API oficial de despesas', urlBruta), '.');
    $('origemGastos').replaceChildren(OBS.origem({
      fonte: 'API de Dados Abertos (Contabilidade), Portal da Transparência de Videira',
      url: urlBruta, urlTexto: 'abrir os dados brutos deste período',
      tipo: 'Totais de despesa por órgão, unidade, fonte de recurso e credor',
      periodo: `${periodo.ini} a ${periodo.fim}`,
      consultadoEm: meta.consultadoEm,
      metodo: 'Consulta ao vivo, feita pelo seu navegador. Os totais são somas simples dos valores publicados.',
      limitacao: 'A API não traz cada pagamento nem um link individual por registro. Para ver pagamento por pagamento, use a consulta de Pagamentos do portal oficial.'
    }));
    $('fonte').replaceChildren(`Período: ${periodo.ini} a ${periodo.fim}. Origem: `,
      link('API de Dados Abertos (Contabilidade)', OBS.config.DOC_API_DESPESAS),
      ' do Portal da Transparência de Videira. Quer conferir? Abra ', link('os dados brutos deste período', urlBruta),
      '. Os valores aparecem como a fonte os publica.');

    desenharOrgaos();
    desenharCredores();
    prepararRegistros(ultima.linhas);
    desenharFontes();
    desenharCartoes('etapas', [
      ['1. Empenhado (reservado)', t.empenhado, 'A Prefeitura reservou o dinheiro para um gasto.'],
      ['2. Liquidado (conferido)', t.liquidado, 'O serviço ou produto foi entregue e conferido.'],
      ['3. Pago', t.pago, 'O dinheiro saiu da conta da Prefeitura.']]);
    desenharCartoes('ajustes', [
      ['Anulado', t.anulado, 'Reserva de dinheiro que foi cancelada.'],
      ['Retido', t.retido, 'Parte do valor liquidado que ficou retida (por exemplo, para recolher impostos).']]);

    $('estado').className = 'oculto';
    $('resultado').classList.remove('oculto');
  }

  /* Ligações dos botões (chamado uma vez, ao iniciar). */
  function ligarEventos() {
    $('filtro').addEventListener('input', () => { limite = OBS.config.LINHAS_INICIAIS; desenharCredores(); });
    $('maisCredores').addEventListener('click', () => { limite += OBS.config.LINHAS_POR_CLIQUE; desenharCredores(); });
    $('limparOrgao').addEventListener('click', () => { filtroOrgao = null; limite = OBS.config.LINHAS_INICIAIS; desenharCredores(); });
    $('maisFontes').addEventListener('click', () => { todasFontes = true; desenharFontes(); });
    $('btnEvolucao').addEventListener('click', carregarEvolucao);
    $('etapaEvolucao').addEventListener('change', desenharEvolucao);
    // Planilha: monta o CSV com as linhas da última consulta (fonte e período vão dentro do arquivo).
    $('baixarCsv').addEventListener('click', () => {
      if (!ultima) return;
      const [, mes, ano] = ultima.periodo.ini.split('/');
      OBS.exportar.baixar(OBS.exportar.csvDespesas(ultima.linhas, ultima.periodo, ultima.meta), `olho-magico-despesas-${ano}-${mes}.csv`);
    });
  }

  // Os ajudantes linhaClicavel, barra e link também são usados pela aba Servidores (pessoal-tela.js).
  /* Mês que está na tela agora ("AAAA-MM"), ou null. */
  const mesNaTela = () => (ultima ? ultima.anoMes : null);

  return { mostrarEstado, desenharResultado, ligarEventos, linhaClicavel, barra, link, mesNaTela };
})();
