/* FICHAS DE DETALHE: uma página para cada servidor (registro), fornecedor e contrato.
   Princípios:
     - Cada informação vem com a fonte e o período.
     - O que NÃO existe em fonte aberta é dito com clareza, com o caminho para consultar no portal oficial.
     - Pessoas nunca são ligadas entre fontes pelo nome. Empresas são ligadas SÓ pelo CNPJ. */
OBS.fichas = (function () {
  const { $, el, moeda, qtd } = OBS;

  /* ---------- Peças comuns ---------- */
  function cabecalho(tipo, titulo, subtitulo, voltar) {
    const topo = el('div', 'ficha-topo');
    const v = el('a', 'voltar', voltar.texto); v.href = voltar.href;
    // Se a pessoa veio de outra tela do site, "Voltar" volta para ela (com os filtros como estavam).
    v.addEventListener('click', (ev) => { if (OBS.rotas.podeVoltar()) { ev.preventDefault(); history.back(); } });
    topo.append(v, el('p', 'ficha-tipo', tipo), el('h1', 'titulo-pagina', titulo));
    if (subtitulo) topo.append(el('p', 'sub', subtitulo));
    return topo;
  }

  /* Lista de "rótulo: valor" (só as linhas que têm valor). */
  function dados(pares) {
    const dl = el('dl', 'ficha-dados');
    pares.forEach(([rotulo, valor]) => {
      if (valor === null || valor === undefined || valor === '') return;
      const dd = el('dd'); dd.append(valor);
      dl.append(el('dt', '', rotulo), dd);
    });
    return dl;
  }

  // Explicação em letra pequena embaixo de cada seção das fichas (toda informação diz o que é).
  const EXPLICA = {
    'Contratos publicados no PNCP': 'Contratos assinados com este CNPJ que os órgãos do Município publicaram no Portal Nacional de Contratações Públicas.',
    'Pagamentos da Prefeitura': 'O que o Município pagou a este fornecedor, segundo o portal de transparência da Prefeitura.',
    'O que mais existe sobre este fornecedor': 'O que está nesta ficha, o que só pode ser consultado no portal oficial e o que não tem fonte aberta.',
    'Pagamentos do Município a este CNPJ': 'Quanto o Município pagou a este CNPJ em cada mês, buscado na hora no portal da Prefeitura.',
    'Objeto (o que foi contratado)': 'A descrição do que foi comprado ou contratado, como está no registro oficial.',
    'Dados do contrato': 'Número, valor previsto, órgão, fornecedor e datas, como publicados no PNCP. Valor previsto não é o que já foi pago.',
    'Vigência': 'O período em que o contrato vale, do início ao fim.',
    'Licitação ou compra de origem': 'O processo de compra que deu origem a este contrato e a forma como o fornecedor foi escolhido.',
    'O que mais existe sobre este contrato': 'O que está nesta ficha, o que só pode ser consultado no portal oficial e o que não tem fonte aberta.'
  };

  function secao(titulo, ...conteudo) {
    const s = el('section', 'ficha-secao');
    s.append(el('h3', '', titulo));
    if (EXPLICA[titulo]) s.append(el('p', 'nota-titulo', EXPLICA[titulo]));
    s.append(...conteudo.filter(Boolean));
    return s;
  }

  /* Tabela "o que existe e onde": deixa claro o que está aqui, o que está só no portal e o que não existe aberto. */
  function disponibilidade(itens) {
    const ul = el('ul', 'disponibilidade');
    itens.forEach(([assunto, situacao, texto, link]) => {
      const li = el('li', `disp-${situacao}`);
      li.append(el('strong', '', assunto), el('span', 'disp-selo', { aqui: 'Nesta ficha', portal: 'Só no portal oficial', falta: 'Sem fonte aberta' }[situacao]));
      const p = el('p', 'meta', texto);
      if (link) p.append(' ', OBS.ui.link(link[0], link[1]), '.');
      li.append(p);
      ul.append(li);
    });
    return ul;
  }

  function naoEncontrado(texto, voltar) {
    $('vista-ficha').replaceChildren(cabecalho('Ficha', 'Não encontrado', texto, voltar));
  }

  /* ================= SERVIDOR (um registro da lista oficial) ================= */
  async function servidor(id) {
    const voltar = { texto: 'Voltar para Pessoal', href: '#pessoal' };
    const d = await OBS.dados.pessoal();
    if (!d) return naoEncontrado('A lista de servidores ainda não está disponível neste site.', voltar);
    const s = d.lista.find((x) => x.id === id);
    if (!s) {
      return naoEncontrado('Este registro não está na cópia mais recente da lista oficial. A pessoa pode ter saído, mudado de cargo, ' +
        'ou o link pode ter vindo de uma cópia antiga. Procure o nome na lista de servidores.', voltar);
    }
    const vinc = OBS.pessoal.explicarVinculo(s.vinculo);
    const copia = new Date(d.meta.geradoEm).toLocaleDateString('pt-BR');
    const caixa = $('vista-ficha');
    caixa.replaceChildren(cabecalho('Ficha de servidor (registro)', s.nome, null, voltar));

    // CARTÃO DE IDENTIFICAÇÃO: cargo e lotação como estão no registro oficial.
    const cartao = el('div', 'ficha-id');
    cartao.append(el('p', '', `Cargo: ${s.cargo || 'não informado'}${s.funcao ? ` (função: ${s.funcao})` : ''}`),
      el('p', '', `Lotação: ${s.lotacao || 'não informada'}${s.entidade ? `, ${s.entidade}` : ''}`),
      el('p', 'selo-fonte', `Fonte: lista oficial de servidores, situação em ${copia}`));
    caixa.append(cartao);

    const setorLink = s.lotacao ? el('button', 'link-botao', s.lotacao) : null;
    if (setorLink) {
      setorLink.type = 'button';
      setorLink.addEventListener('click', async () => {
        await OBS.rotas.irPara('#pessoal');
        await OBS.pessoalTela.filtrarSetor(s.lotacao);
        $('sec-lista').scrollIntoView({ block: 'start' });
      });
    }
    const competencia = `situação em ${copia}`;

    caixa.append(OBS.abasInternas('ficha', [
      { id: 'resumo', titulo: 'Resumo', montar: (painel) => {
        painel.append(dados([
          ['Nome', s.nome], ['Cargo', s.cargo], ['Função', s.funcao], ['Setor (lotação)', setorLink], ['Entidade', s.entidade],
          ['Vínculo na fonte', s.vinculo ? `${s.vinculo}${vinc ? `. ${vinc.texto}` : ''}` : null],
          ['Forma de ingresso', s.ingresso], ['Admissão (mês/ano)', s.desde],
          ['Carga horária', s.horasMes ? `${s.horasMes} horas por mês` : null]
        ]), el('p', 'meta', `Procedência: API de Pessoal da Prefeitura, ${competencia}. Tocar no setor mostra os outros registros dele.`));
        // Comparação com o mesmo cargo (histograma), só se houver registros suficientes.
        const comp = OBS.pessoal.comparacaoCargo(d.lista, s);
        if (comp && comp.total >= 5) {
          const mesmos = d.lista.filter((x) => x.cargo === s.cargo && typeof x.salario === 'number').map((x) => x.salario);
          const faixas = OBS.graficos.faixas(mesmos, 8);
          const minha = faixas.findIndex((f, i) => s.salario >= f.de && (s.salario < f.ate || i === faixas.length - 1));
          const serie = faixas.map((f) => ({ rotulo: OBS.graficos.moedaCurta(f.de).replace(/^R\$\s/, ''), valor: f.quantidade, titulo: `De ${moeda(f.de)} até ${moeda(f.ate)}` }));
          painel.append(el('h3', '', `Salário-base de quem tem o cargo “${s.cargo}”`),
            el('p', '', `São ${qtd(comp.total)} registros com este cargo. ${qtd(comp.maiores)} têm salário-base maior que este, ` +
              `${qtd(comp.menores)} menor e ${qtd(comp.iguais - 1)} igual.`),
            OBS.graficos.colunas(serie, { destaque: minha, formatar: (n) => `${qtd(n)} ${n === 1 ? 'registro' : 'registros'}`, formatarCurto: (n) => qtd(n),
              titulo: `Quantos registros do cargo há em cada faixa de salário-base`, legendaDestaque: 'faixa deste registro',
              legendaOutros: 'outras faixas', marcaDestaque: 'este registro',
              descricao: `Distribuição do salário-base entre os ${comp.total} registros com o cargo ${s.cargo}.` }),
            el('p', 'meta', 'Cada coluna é uma faixa de salário-base (o número embaixo é onde a faixa começa, em reais). ' +
              'Diferenças podem vir de tempo de serviço, nível na carreira ou carga horária; não indicam irregularidade.'));
        }
        // O QUE ESTA FICHA NÃO TEM (antes eram duas abas que só diziam "não temos"): uma lista curta e direta.
        const falta = el('ul', 'disponibilidade');
        const item = (titulo, texto, link) => {
          const li = el('li', link ? 'disp-portal' : '');
          li.append(el('strong', '', titulo));
          const p = el('p', '', texto + ' ');
          if (link) p.append(OBS.ui.link(link[0], link[1]));
          li.append(p); falta.append(li);
        };
        item('Remuneração do mês (bruto, descontos e líquido)', 'Só no portal oficial, que protege a consulta contra acesso automático.',
          ['Abrir a Relação Funcionário x Salário', OBS.config.PORTAL_SALARIOS]);
        item('Diárias de viagem', 'Ainda não há uma fonte aberta de diárias integrada a este site. Quando houver, uma diária só aparecerá aqui se a fonte ' +
          'trouxer um identificador que comprove que é deste registro: nome parecido não é prova.');
        item('Histórico de cargos e salários', `A fonte mostra só a situação atual (cópia de ${copia}) e este site não guarda cópias antigas.` +
          (s.desde ? ` Admissão: ${s.desde}.` : ''));
        painel.append(el('h3', '', 'O que esta ficha não tem'), falta);
      } },
      { id: 'remuneracao', titulo: 'Remuneração', montar: (painel) => {
        // Cada valor no seu campo: salário-base NUNCA substitui remuneração bruta nem líquido.
        const indisponivel = 'Não publicado em formato aberto';
        const kpis = el('div', 'kpis');
        kpis.append(
          OBS.kpi({ rotulo: 'Salário-base', valor: typeof s.salario === 'number' ? moeda(s.salario) : 'não informado pela fonte',
            periodo: competencia, fonte: 'API de Pessoal da Prefeitura' }),
          OBS.kpi({ rotulo: 'Remuneração bruta', valor: indisponivel, indisponivel: true, detalhe: 'Consulte a Relação Funcionário x Salário no portal oficial.' }),
          OBS.kpi({ rotulo: 'Descontos', valor: indisponivel, indisponivel: true, detalhe: 'Consulte a Relação Funcionário x Salário no portal oficial.' }),
          OBS.kpi({ rotulo: 'Valor líquido', valor: indisponivel, indisponivel: true, detalhe: 'Consulte a Relação Funcionário x Salário no portal oficial.' }));
        painel.append(el('p', '', 'Salário-base é o valor-base do cargo. O que a pessoa recebe no mês pode ser maior (gratificações, adicionais) ou menor (descontos).'),
          kpis,
          OBS.status('indisponivel', 'Remuneração bruta, descontos e líquido de cada mês',
            'O portal oficial mostra esses valores, mas protege a consulta contra acesso automático. Este site respeita essa proteção e pediu, pela Lei de Acesso à Informação, que sejam publicados em formato aberto.',
            ['Abrir a Relação Funcionário x Salário', OBS.config.PORTAL_SALARIOS]));
      } },
      { id: 'origem', titulo: 'Origem dos dados', montar: (painel) => {
        const o = OBS.origem({
          fonte: 'API de Pessoal, Portal da Transparência de Videira (Prefeitura)', url: OBS.config.PESSOAL.API, urlTexto: 'abrir a API de Pessoal',
          tipo: 'Cadastro do registro: cargo, setor, vínculo, admissão e salário-base', periodo: `Situação na cópia de ${copia}`,
          metodo: 'Cópia diária feita por robô, sem CPF, matrícula, horário, local de trabalho e situação de afastamento. ' +
            'Esta ficha é de UM registro (vínculo): quem tem dois cargos tem duas fichas.',
          limitacao: 'A fonte não tem link individual por servidor. Nomes iguais podem ser de pessoas diferentes: o site nunca junta registros pelo nome.'
        });
        o.open = true;
        painel.append(o);
      } }
    ], 'Informações do registro'));
  }

  /* ================= FORNECEDOR (contratos no PNCP + pagamentos da Prefeitura, pelo CNPJ) ================= */
  async function fornecedor(chave) {
    const voltar = { texto: 'Voltar para Contratos', href: '#contratos' };
    const pn = await OBS.dados.pncp();
    const contratos = pn ? pn.contratos.filter((c) => c._chaveFornecedor === chave) : [];
    const ehCnpj = /^\d{14}$/.test(chave);
    if (!contratos.length && !ehCnpj) return naoEncontrado('Este fornecedor não aparece na cópia mais recente dos contratos.', voltar);
    const doc = ehCnpj ? OBS.tratarDocumento(chave).texto : (contratos[0] && contratos[0].fornecedorDoc);
    const nome = contratos.length ? contratos[0].fornecedor : `CNPJ ${doc}`;
    const caixa = $('vista-ficha');
    caixa.replaceChildren(cabecalho('Ficha de fornecedor', nome, doc && contratos.length ? `${ehCnpj ? 'CNPJ' : 'Documento'} ${doc}` : null, voltar));

    // Contratos no PNCP
    if (contratos.length) {
      const soma = contratos.reduce((t, c) => t + (c.valorGlobal || 0), 0);
      const orgaos = OBS.contratos.contar(contratos, 'orgao');
      OBS.numeros(caixa.appendChild(el('div', 'numeros')), [
        { rotulo: 'Contratos nos últimos 12 meses', valor: qtd(contratos.length) },
        { rotulo: 'Valor global somado', valor: moeda(soma), detalhe: 'Valor previsto nos contratos, não o pago.' },
        { rotulo: 'Órgãos contratantes', valor: qtd(orgaos.length) }
      ]);
      const t = OBS.tabela({ colunas: [
        { chave: 'objeto', titulo: 'Objeto', link: (c) => OBS.rotas.link.contrato(c), formatar: (v) => OBS.resumirTexto(v, 100) || '(sem descrição)' },
        { chave: 'orgao', titulo: 'Órgão' }, { chave: 'dataAssinatura', titulo: 'Assinatura', tipo: 'data' },
        { chave: 'vigenciaFim', titulo: 'Vigência até', tipo: 'data' }, { chave: 'valorGlobal', titulo: 'Valor global', tipo: 'moeda' }],
      porPagina: 20, ordemInicial: { chave: 'dataAssinatura', descendente: true }, legenda: 'Contratos do fornecedor' });
      t.mostrar(contratos);
      caixa.append(secao('Contratos publicados no PNCP', t.elemento,
        orgaos.length > 1 ? el('h4', '', 'Valor global por órgão contratante') : null,
        orgaos.length > 1 ? OBS.graficos.barras(orgaos.map(([o]) => ({ rotulo: o, valor: contratos.filter((c) => c.orgao === o).reduce((s, c) => s + (c.valorGlobal || 0), 0) }))) : null));
    } else {
      caixa.append(secao('Contratos publicados no PNCP', el('p', '', pn ? 'Nenhum contrato com este CNPJ nos últimos 12 meses da cópia do PNCP.'
        : 'A cópia do PNCP ainda não está disponível neste site.')));
    }

    // Pagamentos da Prefeitura (só para CNPJ; pessoa física fica de fora por privacidade e porque o CPF está mascarado).
    if (ehCnpj) caixa.append(secaoPagamentos(chave)); else {
      caixa.append(secao('Pagamentos da Prefeitura', el('p', 'meta', 'Para pessoas físicas, o site não procura pagamentos: o documento está mascarado ' +
        'e o site não liga pessoas pelo nome. Consulte o portal oficial.')));
    }

    caixa.append(secao('O que mais existe sobre este fornecedor', disponibilidade([
      ['Contratos e valores previstos', 'aqui', 'Do PNCP, com link para cada registro oficial.'],
      ['Pagamentos por mês (totais)', ehCnpj ? 'aqui' : 'portal', 'Da API de despesas da Prefeitura, juntando só pelo CNPJ.'],
      ['Cada pagamento (data, empenho, licitação)', 'portal', 'O portal mostra, mas protege a consulta contra acesso automático.', ['Abrir Pagamentos', OBS.config.PORTAL_PAGAMENTOS]],
      ['Dados cadastrais da empresa (sócios, endereço)', 'falta', 'Não fazem parte das fontes usadas por este site.']
    ])));
  }

  /* Seção de pagamentos: consulta os últimos 12 meses SÓ quando a pessoa pede (são 12 consultas ao portal). */
  function secaoPagamentos(cnpj) {
    const s = secao('Pagamentos do Município a este CNPJ');
    const ultimo = OBS.mesAnterior(new Date());
    const meses = OBS.historico.meses(ultimo, 12);
    const p = el('p', 'sub', `Totais por mês, de ${OBS.periodoDoMes(meses[0]).nome} a ${OBS.periodoDoMes(ultimo).nome}. São 12 consultas ao portal, feitas uma de cada vez (cerca de 10 MB de internet no total).`);
    const botao = el('button', '', 'Buscar os pagamentos'); botao.type = 'button';
    const estado = el('p', 'meta'); estado.setAttribute('role', 'status'); estado.setAttribute('aria-live', 'polite');
    const area = el('div');
    botao.addEventListener('click', async () => {
      botao.disabled = true;
      const resultado = await OBS.historico.varios(meses, (feitos, total) => { estado.textContent = `Consultando: ${feitos} de ${total} meses (o portal aceita 10 consultas por minuto: leva cerca de 1 minuto e meio)…`; });
      const porMes = OBS.historico.doCredor(resultado, cnpj);
      const erros = porMes.filter((m) => m.erro).length;
      const pago = porMes.reduce((t, m) => t + (m.pago || 0), 0);
      estado.textContent = (erros ? `${erros} mês(es) não responderam e ficaram em branco. ` : '') +
        (porMes.some((m) => m.pago || m.empenhado || m.liquidado) ? '' : 'Nenhum valor encontrado para este CNPJ nesses meses.');
      const frase = el('p', 'frase-media');
      frase.append('Pago nesses 12 meses: ', el('span', 'valor', moeda(pago)), '.');
      const t = OBS.tabela({ colunas: [
        { chave: 'anoMes', titulo: 'Mês', formatar: (v) => OBS.periodoDoMes(v).nome, ordenavel: false },
        { chave: 'empenhado', titulo: 'Empenhado', tipo: 'moeda', ordenavel: false },
        { chave: 'liquidado', titulo: 'Liquidado', tipo: 'moeda', ordenavel: false },
        { chave: 'pago', titulo: 'Pago', tipo: 'moeda', ordenavel: false }], porPagina: 12, legenda: 'Pagamentos por mês' });
      t.mostrar(porMes.slice().reverse());
      const orgaos = new Map();
      porMes.forEach((m) => m.orgaos.forEach(([o, v]) => orgaos.set(o, (orgaos.get(o) || 0) + v)));
      area.replaceChildren(...[frase,
        OBS.graficos.colunas(porMes.map((m) => ({ rotulo: OBS.historico.rotulo(m.anoMes), valor: m.pago, titulo: OBS.periodoDoMes(m.anoMes).nome })),
          { resumo: true, titulo: 'Valor pago a este CNPJ em cada mês', descricao: 'Valor pago a este CNPJ em cada mês. Os números estão na tabela abaixo.' }),
        el('p', 'meta', 'As colunas mostram o valor PAGO. Na tabela, as três etapas aparecem separadas: não some as colunas.'),
        t.elemento,
        orgaos.size ? el('h4', '', 'Quem pagou (órgãos do município), somando os 12 meses') : null,
        orgaos.size ? OBS.graficos.barras([...orgaos.entries()].sort((a, b) => b[1] - a[1]).map(([o, v]) => ({ rotulo: o, valor: v }))) : null,
        OBS.origem({ fonte: 'API de Dados Abertos (Contabilidade), Portal da Transparência de Videira',
          url: OBS.fontes.despesas.montarUrl(OBS.periodoDoMes(ultimo).ini, OBS.periodoDoMes(ultimo).fim), urlTexto: 'abrir os dados brutos do mês mais recente',
          tipo: 'Totais de despesa por credor, mês a mês', periodo: `${OBS.periodoDoMes(meses[0]).nome} a ${OBS.periodoDoMes(ultimo).nome}`,
          consultadoEm: new Date(), metodo: 'Consulta ao vivo, uma por mês. Só entram as linhas cujo CPF/CNPJ do credor é exatamente este CNPJ.',
          limitacao: 'A fonte traz totais, não cada pagamento. Uma empresa pode receber por mais de um CNPJ (filiais): cada um tem a sua ficha.' })
      ].filter(Boolean));   // tira as peças que não se aplicam (ex.: sem secretarias)
      botao.textContent = 'Consultar de novo'; botao.disabled = false;
    });
    s.append(p, botao, estado, area);
    return s;
  }

  /* ================= CONTRATO ================= */
  async function contrato(id) {
    const voltar = { texto: 'Voltar para Contratos', href: '#contratos' };
    const pn = await OBS.dados.pncp();
    const c = pn && pn.contratos.find((x) => x.id === id);
    if (!c) return naoEncontrado('Este contrato não está na cópia mais recente do PNCP (últimos 12 meses).', voltar);
    const caixa = $('vista-ficha');
    caixa.replaceChildren(cabecalho('Ficha de contrato', `Contrato com ${c.fornecedor || 'fornecedor não informado'}`, c.orgao, voltar));
    OBS.numeros(caixa.appendChild(el('div', 'numeros')), [
      { rotulo: 'Valor global', valor: typeof c.valorGlobal === 'number' ? moeda(c.valorGlobal) : 'não informado', detalhe: 'Valor total previsto, não o pago.' },
      { rotulo: 'Valor inicial', valor: typeof c.valorInicial === 'number' ? moeda(c.valorInicial) : null },
      { rotulo: 'Assinado em', valor: OBS.dataBR(c.dataAssinatura) || null }
    ]);
    caixa.append(secao('Objeto (o que foi contratado)', el('p', 'objeto', c.objeto || '(sem descrição)')));

    const linkForn = el('a', '', c.fornecedor || '(sem nome)'); linkForn.href = OBS.rotas.link.fornecedor(c._chaveFornecedor);
    const oficial = c.url ? OBS.ui.link('abrir o registro oficial no PNCP', c.url) : null;
    caixa.append(secao('Dados do contrato', dados([
      ['Órgão contratante', c.orgao], ['Fornecedor', linkForn], ['Documento do fornecedor', c.fornecedorDoc],
      ['Tipo', c.tipo], ['Categoria', c.categoria], ['Valor inicial', typeof c.valorInicial === 'number' ? moeda(c.valorInicial) : null],
      ['Valor global', typeof c.valorGlobal === 'number' ? moeda(c.valorGlobal) : null],
      ['Assinatura', OBS.dataBR(c.dataAssinatura)], ['Início da vigência', OBS.dataBR(c.vigenciaInicio)], ['Fim da vigência', OBS.dataBR(c.vigenciaFim)],
      ['Número de controle no PNCP', c.id], ['Registro oficial', oficial]
    ])));

    const linha = c.vigenciaInicio && c.vigenciaFim ? OBS.graficos.vigencia(c.vigenciaInicio.slice(0, 10), c.vigenciaFim.slice(0, 10)) : null;
    if (linha) caixa.append(secao('Vigência', el('p', 'meta', `De ${OBS.dataBR(c.vigenciaInicio)} a ${OBS.dataBR(c.vigenciaFim)}.`), linha));

    // Licitação de origem: o PNCP informa o número de controle da compra que gerou o contrato.
    const compra = c.compraId && pn.compras.find((k) => k.id === c.compraId);
    if (compra) {
      caixa.append(secao('Licitação ou compra de origem', dados([
        ['Modalidade', compra.modalidade], ['Objeto', compra.objeto], ['Situação', compra.situacao],
        ['Publicação', OBS.dataBR(compra.dataPublicacao)], ['Valor estimado', typeof compra.valorEstimado === 'number' ? moeda(compra.valorEstimado) : null],
        ['Valor homologado', typeof compra.valorHomologado === 'number' ? moeda(compra.valorHomologado) : null],
        ['Registro oficial', compra.url ? OBS.ui.link('abrir no PNCP', compra.url) : null]
      ])));
    } else if (c.compraId) {
      caixa.append(secao('Licitação ou compra de origem', el('p', 'meta', `Número de controle informado pelo PNCP: ${c.compraId}. ` +
        'Ela não está na cópia deste site (pode ter sido publicada há mais de 12 meses).')));
    }

    const outros = pn.contratos.filter((x) => x._chaveFornecedor === c._chaveFornecedor && x.id !== c.id).length;
    caixa.append(secao('O que mais existe sobre este contrato', disponibilidade([
      ['Valores, datas e partes', 'aqui', 'Do PNCP, copiado uma vez por dia.'],
      ['Outros contratos do mesmo fornecedor', 'aqui', outros ? `${qtd(outros)} outro(s) na ficha do fornecedor.` : 'Nenhum outro nos últimos 12 meses.'],
      ['Pagamentos feitos por este contrato', 'portal', 'A fonte aberta de despesas não liga o pagamento ao contrato. No portal, procure pelo nome do fornecedor.',
        ['Abrir Pagamentos', OBS.config.PORTAL_PAGAMENTOS]],
      ['Aditivos e documentos', 'portal', 'Ficam no registro oficial do PNCP.', c.url ? ['Abrir o registro', c.url] : null]
    ])));
    caixa.append(OBS.origem({
      fonte: 'PNCP: Portal Nacional de Contratações Públicas', url: c.url, urlTexto: 'abrir o registro oficial (formato técnico)',
      identificador: c.id, tipo: 'Contrato publicado pelo órgão', periodo: `Assinado em ${OBS.dataBR(c.dataAssinatura) || 'data não informada'}`,
      metodo: 'Cópia diária feita por robô.', limitacao: 'Mostra o que o órgão publicou no PNCP. O valor global é previsto, não pago.'
    }));
  }

  /* Abre a ficha pedida pelo endereço. */
  async function abrir(tipo, id) {
    $('vista-ficha').replaceChildren(el('p', 'meta', 'Carregando a ficha…'));
    try {
      if (tipo === 'servidor') await servidor(id);
      else if (tipo === 'fornecedor') await fornecedor(id);
      else if (tipo === 'contrato') await contrato(id);
    } catch (erro) {
      console.error('Erro na ficha:', erro);
      naoEncontrado('Não foi possível montar esta ficha. Tente recarregar a página.', { texto: 'Voltar ao início', href: '#inicio' });
    }
  }

  return { abrir };
})();
