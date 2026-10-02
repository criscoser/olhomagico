/* TELA DA ABA "CONTAS PÚBLICAS": relatórios que o município envia ao Governo Federal.
   Cada seção tem a sua fonte e o seu arquivo de cópia diária, e só aparece se houver dado:
     - Gasto com pessoal x limites da LRF ......... dados/siconfi.js        (SICONFI, RGF)
     - Transferências constitucionais da União .... dados/transferencias.js (Tesouro Nacional)
     - Despesa por área (função) no ano ........... dados/dca.js            (SICONFI, DCA)
     - Indicadores de educação ..................... dados/siope.js          (SIOPE, FNDE)
     - Relatórios enviados ao Tesouro .............. dados/entregas.js       (SICONFI, extrato)
     - Convênios federais e benefícios .............. dados/cgu.js            (Portal da Transparência, CGU) */
OBS.contasTela = (function () {
  const { $, el, moeda, qtd } = OBS;
  const pct = OBS.contas.pct;
  const T = OBS.transferencias;
  let iniciado = null;

  /* ================= 1) LRF: um bloco por poder (Prefeitura ou Câmara) ================= */
  function blocoPoder(poder) {
    const caixa = el('div', 'conta-poder');
    caixa.append(el('h3', '', poder.nome));
    const ultimo = OBS.contas.maisRecente(poder.periodos);
    if (!ultimo) {
      caixa.append(el('p', 'meta', 'O relatório deste poder não foi encontrado no SICONFI nos últimos anos.'));
      return caixa;
    }
    const f = OBS.contas.faixa(ultimo);
    const frase = el('p', 'frase-media');
    frase.append(`No ${ultimo.rotulo}, o gasto com pessoal foi de `, el('span', 'valor', pct(ultimo.dtpPct)), ' da receita corrente líquida (ajustada).');
    caixa.append(frase);
    if (f) caixa.append(el('p', `faixa faixa-${f.nivel}`, `Isso está ${f.texto}.`));
    caixa.append(OBS.graficos.medidor(ultimo, pct));
    const ul = el('ul', 'lista');
    [['Gasto total com pessoal no período', ultimo.dtp], ['Receita corrente líquida ajustada', ultimo.rclAjustada],
     [`Limite máximo (${pct(ultimo.limiteMaximoPct)})`, ultimo.limiteMaximo]].forEach(([nome, v]) => {
      if (typeof v !== 'number') return;
      const li = el('li'); const linha = el('div', 'linha');
      linha.append(el('span', 'nome', nome), el('span', 'v', moeda(v))); li.append(linha); ul.append(li);
    });
    caixa.append(ul);
    if (poder.periodos.length > 1) {
      // Evolução: uma coluna por período (o mais antigo à esquerda).
      const ordem = poder.periodos.slice().sort((a, b) => (a.ano - b.ano) || (a.periodo - b.periodo));
      const det = el('details'); det.append(el('summary', '', 'Períodos anteriores'));
      det.append(OBS.graficos.colunas(ordem.map((p) => ({ rotulo: `${p.periodo}${p.periodicidade}/${String(p.ano).slice(2)}`, valor: p.dtpPct, titulo: p.rotulo })),
        { destaque: ordem.length - 1, formatar: pct, descricao: 'Gasto com pessoal em cada período. Os números estão na tabela abaixo.' }));
      const t = OBS.tabela({ colunas: [{ chave: 'rotulo', titulo: 'Período', ordenavel: false }, { chave: 'dtpPct', titulo: 'Gasto com pessoal', tipo: 'pct', ordenavel: false }], porPagina: 20 });
      det.append(el('p', 'meta', 'Q = quadrimestre, S = semestre.'), t.elemento); t.mostrar(ordem.slice().reverse());
      caixa.append(det);
    }
    caixa.append(OBS.origem({
      fonte: 'SICONFI (Tesouro Nacional): Relatório de Gestão Fiscal, Anexo 01',
      url: ultimo.url, urlTexto: 'abrir os dados oficiais deste relatório',
      tipo: 'Despesa total com pessoal e limites da Lei de Responsabilidade Fiscal',
      periodo: ultimo.rotulo,
      metodo: 'Cópia diária feita por robô. Os percentuais e limites são os publicados no próprio relatório; o site não recalcula.',
      limitacao: 'É o relatório que o município declara ao Tesouro. Pode ser retificado depois.'
    }));
    return caixa;
  }

  function desenharLrf(d) {
    if (!d || !d.poderes) return false;
    $('contasConteudo').replaceChildren(...['E', 'L'].filter((k) => d.poderes[k]).map((k) => blocoPoder(d.poderes[k])));
    return true;
  }

  /* ================= 2) Transferências da União ================= */
  function desenharTransferencias(d) {
    if (!d || !Array.isArray(d.registros) || !d.registros.length) return false;
    const regs = d.registros;
    const anos = T.anos(regs);
    OBS.opcoes('anoTransf', anos.map((a) => [String(a), String(a)]));
    const tipos = [...new Set(regs.map((r) => r.tipo))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    OBS.opcoes('tipoTransf', tipos.map((t) => [t, t]));
    const tabela = OBS.tabela({ colunas: [
      { chave: 'tipo', titulo: 'Transferência' }, { chave: 'valor', titulo: 'Valor no ano', tipo: 'moeda' }],
      porPagina: 20, ordemInicial: { chave: 'valor', descendente: true }, legenda: 'Transferências por tipo' });
    $('transfTabela').replaceChildren(tabela.elemento);

    function atualizar() {
      const ano = Number($('anoTransf').value), tipo = $('tipoTransf').value;
      const ultimo = T.ultimoMes(regs, ano);
      const meses = T.porMes(regs, ano, tipo);
      const total = T.acumulado(regs, ano, 12, tipo);
      // Comparação justa: mesmos meses do ano anterior (janeiro até o último mês com dado).
      const anterior = anos.includes(ano - 1) ? T.acumulado(regs, ano - 1, ultimo, tipo) : null;
      const variacao = anterior !== null ? T.variacao(total, anterior) : null;
      const quem = tipo ? `da transferência “${tipo}”` : 'de transferências constitucionais';
      const frase = $('transfFrase'); frase.replaceChildren();
      frase.append(`De janeiro a ${OBS.MESES[ultimo - 1].toLowerCase()} de ${ano}, Videira recebeu `, el('span', 'valor', moeda(total)), ` ${quem}.`);
      if (variacao !== null) {
        frase.append(` No mesmo período de ${ano - 1}, foram ${moeda(anterior)} (${variacao >= 0 ? 'alta' : 'queda'} de ${pct(Math.abs(Math.round(variacao * 10) / 10))}).`);
      }
      const serie = meses.map((v, i) => ({ rotulo: OBS.mesCurto(i + 1), valor: v, titulo: `${OBS.MESES[i]} de ${ano}${v === null ? ' (sem dado)' : ''}` }));
      $('transfGrafico').replaceChildren(OBS.graficos.colunas(serie, { destaque: ultimo - 1,
        descricao: `Valor recebido em cada mês de ${ano}. Os valores por tipo estão na tabela abaixo.` }),
        el('p', 'meta', 'Meses sem coluna ainda não têm dado na fonte. Valores negativos são ajustes e devoluções, como a fonte publica.'));
      tabela.mostrar(T.porTipo(regs, ano).filter((x) => !tipo || x.tipo === tipo));
    }
    $('anoTransf').addEventListener('change', atualizar);
    $('tipoTransf').addEventListener('change', atualizar);
    $('csvTransf').addEventListener('click', () => {
      const ano = Number($('anoTransf').value);
      const linhas = regs.filter((r) => r.ano === ano);
      OBS.exportar.baixar(OBS.exportar.csvTabela({ titulo: `Transferências constitucionais da União para Videira em ${ano}`,
        fonte: 'Tesouro Nacional: Transferências Constitucionais', url: (d.meta.anos.find((a) => a.ano === ano) || {}).url, periodo: String(ano),
        observacao: 'Valores como publicados pela fonte; negativos são ajustes e devoluções.' },
      [{ titulo: 'Ano', valor: (r) => r.ano }, { titulo: 'Mês', valor: (r) => r.mes }, { titulo: 'Transferência', valor: (r) => r.tipo },
        { titulo: 'Valor', tipo: 'moeda', valor: (r) => r.valor }], linhas), `olho-magico-transferencias-${ano}.csv`);
    });
    $('anoTransf').value = String(anos[0]);
    atualizar();
    const urlAno = (d.meta.anos[d.meta.anos.length - 1] || {}).url;
    $('transfOrigem').replaceChildren(OBS.origem({
      fonte: 'Tesouro Nacional: Transferências Constitucionais (API aberta)',
      url: urlAno, urlTexto: 'abrir os dados oficiais do ano mais recente (formato técnico)',
      tipo: 'Valor repassado pela União a Videira, por mês e por tipo de transferência',
      periodo: `Anos ${anos.slice().reverse().join(', ')}`,
      metodo: 'Cópia diária feita por robô. Os totais são somas simples dos valores publicados.' +
        (d.meta.descartados ? ` ${qtd(d.meta.descartados)} registro(s) incompletos foram ignorados.` : ''),
      limitacao: 'Mostra só as transferências obrigatórias pela Constituição. Convênios, emendas e transferências voluntárias não estão aqui.'
    }));
    return true;
  }

  /* ================= 3) Despesa por área (DCA) ================= */
  function desenharDca(d) {
    if (!d || !Array.isArray(d.anos) || !d.anos.length) return false;
    OBS.opcoes('anoDca', d.anos.map((a) => [String(a.ano), String(a.ano)]));
    const nomesEtapa = { empenhado: 'empenhados (reservados)', liquidado: 'liquidados (conferidos)', pago: 'pagos' };

    function atualizar() {
      const anoDca = d.anos.find((a) => String(a.ano) === $('anoDca').value) || d.anos[0];
      const etapa = $('etapaDca').value;
      const funcoes = OBS.contas.funcoes(anoDca, etapa);
      const total = funcoes.reduce((t, f) => t + f.valor, 0);
      $('dcaFrase').replaceChildren(`Em ${anoDca.ano}, foram `, el('span', 'valor', moeda(total)), ` ${nomesEtapa[etapa]} em ${funcoes.length} áreas.`);
      const ul = $('dcaLista'); ul.replaceChildren();
      const maximo = funcoes.length ? funcoes[0].valor : 0;
      funcoes.forEach((f) => {
        const detalhe = `${pct(Math.round(f.fatia * 10) / 10)} do total desta etapa`;
        ul.append(OBS.ui.linhaClicavel(f.nome, f.valor, maximo, detalhe, (painel) => {
          const subs = (f.subfuncoes || []).map((s) => ({ rotulo: s.nome, valor: s.valores[etapa] })).filter((s) => typeof s.valor === 'number');
          if (!subs.length) { painel.append(el('p', 'meta', 'A fonte não detalha esta área.')); return; }
          painel.append(el('h4', '', 'Como esta área se divide (subfunções)'), OBS.graficos.barras(subs.sort((a, b) => b.valor - a.valor)));
        }));
      });
    }
    $('anoDca').addEventListener('change', atualizar);
    $('etapaDca').addEventListener('change', atualizar);
    $('csvDca').addEventListener('click', () => {
      const anoDca = d.anos.find((a) => String(a.ano) === $('anoDca').value) || d.anos[0];
      const linhas = [];
      anoDca.funcoes.forEach((f) => {
        linhas.push({ nivel: 'Função', codigo: f.codigo, nome: f.nome, v: f.valores });
        (f.subfuncoes || []).forEach((s) => linhas.push({ nivel: 'Subfunção', codigo: s.codigo, nome: s.nome, v: s.valores }));
      });
      OBS.exportar.baixar(OBS.exportar.csvTabela({ titulo: `Despesa por função de Videira em ${anoDca.ano}`, fonte: 'SICONFI (Tesouro Nacional): DCA, Anexo I-E',
        url: anoDca.url, periodo: String(anoDca.ano), observacao: 'Empenhado, liquidado e pago são etapas da MESMA despesa: não some as colunas.' },
      [{ titulo: 'Nível', valor: (l) => l.nivel }, { titulo: 'Código', valor: (l) => l.codigo }, { titulo: 'Nome', valor: (l) => l.nome },
        { titulo: 'Empenhado', tipo: 'moeda', valor: (l) => l.v.empenhado }, { titulo: 'Liquidado', tipo: 'moeda', valor: (l) => l.v.liquidado },
        { titulo: 'Pago', tipo: 'moeda', valor: (l) => l.v.pago }], linhas), `olho-magico-despesa-por-area-${anoDca.ano}.csv`);
    });
    atualizar();
    const recente = d.anos[0];
    $('dcaOrigem').replaceChildren(OBS.origem({
      fonte: 'SICONFI (Tesouro Nacional): Declaração de Contas Anuais (DCA), Anexo I-E',
      url: recente.url, urlTexto: `abrir os dados oficiais de ${recente.ano} (formato técnico)`,
      tipo: 'Despesa por função e subfunção, nas etapas empenhado, liquidado e pago',
      periodo: `Anos ${d.anos.map((a) => a.ano).join(', ')}`,
      metodo: 'Cópia diária feita por robô. As porcentagens são sobre a soma das áreas na etapa escolhida (as despesas intraorçamentárias, entre órgãos do próprio município, não entram).',
      limitacao: 'É a declaração que o município envia ao Tesouro depois que o ano fecha. O ano corrente só aparece no ano seguinte.'
    }));
    return true;
  }

  /* ================= 4) Educação (SIOPE) ================= */
  function formatarIndicador(ind) {
    const tipo = OBS.contas.tipoIndicador(ind.nome);
    return tipo === 'pct' ? pct(ind.valor) : tipo === 'moeda' ? moeda(ind.valor) : ind.valor.toLocaleString('pt-BR');
  }

  function desenharSiope(d) {
    if (!d || !Array.isArray(d.periodos) || !d.periodos.length) return false;
    const p = d.periodos[0];   // o mais recente
    const destaques = p.indicadores.map((ind) => ({ ind, min: OBS.contas.minimoEducacao(ind) })).filter((x) => x.min);
    OBS.numeros($('siopeDestaques'), destaques.map(({ ind, min }) => ({
      rotulo: ind.nome, valor: formatarIndicador(ind),
      detalhe: `Mínimo exigido: ${pct(min.minimo)} (${min.base}). ${min.cumpre ? 'Está acima do mínimo.' : 'Está abaixo do mínimo.'}`
    })));
    $('siopeDestaques').classList.toggle('oculto', !destaques.length);
    const t = OBS.tabela({ colunas: [
      { chave: 'codigo', titulo: 'Código' }, { chave: 'nome', titulo: 'Indicador' }, { chave: 'grupo', titulo: 'Grupo' },
      { chave: 'valor', titulo: 'Valor', tipo: 'numero', formatar: (v, ind) => formatarIndicador(ind) }],
      porPagina: 50, legenda: 'Indicadores do SIOPE' });
    $('siopeTabela').replaceChildren(t.elemento); t.mostrar(p.indicadores);
    $('siopeOrigem').replaceChildren(OBS.origem({
      fonte: 'SIOPE: Sistema de Informações sobre Orçamentos Públicos em Educação (FNDE)',
      url: p.url, urlTexto: 'abrir os dados oficiais (formato técnico)',
      tipo: 'Indicadores de aplicação de recursos em educação, declarados pelo município',
      periodo: `${p.bimestre === 6 ? 'Ano completo' : `${p.bimestre}º bimestre`} de ${p.ano}`,
      metodo: 'Cópia diária feita por robô. Os valores são os declarados; o site não recalcula. O mínimo legal só é mostrado quando o nome do indicador deixa claro qual é.',
      limitacao: 'Declaração do próprio município, que pode ser retificada. O SIOPE também publica a remuneração nominal dos profissionais da educação, que este site ainda não mostra.'
    }));
    return true;
  }

  /* ================= 5) Entregas ao Tesouro ================= */
  function desenharEntregas(d) {
    if (!d || !Array.isArray(d.registros) || !d.registros.length) return false;
    const t = OBS.tabela({ colunas: [
      { chave: 'instituicao', titulo: 'Quem enviou' }, { chave: 'entregavel', titulo: 'Relatório' },
      { chave: 'exercicio', titulo: 'Ano', tipo: 'numero', formatar: (v) => String(v || '—') },
      { chave: 'periodo', titulo: 'Período', formatar: (v, r) => OBS.contas.rotuloPeriodo(r) },
      { chave: 'data', titulo: 'Enviado em', tipo: 'data' },
      { chave: 'status', titulo: 'Situação na fonte', formatar: (v) => (v === 'HO' ? 'Homologado' : v || 'não informada') }],
      porPagina: 12, ordemInicial: { chave: 'data', descendente: true }, legenda: 'Última entrega de cada relatório' });
    $('entregasTabela').replaceChildren(el('p', 'meta', 'A última entrega de cada relatório, por instituição.'), t.elemento);
    t.mostrar(OBS.contas.ultimasEntregas(d.registros));
    $('entregasOrigem').replaceChildren(OBS.origem({
      fonte: 'SICONFI (Tesouro Nacional): extrato de entregas',
      url: (d.meta.anos[0] || {}).url, urlTexto: 'abrir o extrato oficial (formato técnico)',
      tipo: 'Relatórios fiscais e contábeis enviados pela Prefeitura e pela Câmara',
      periodo: `Exercícios ${d.meta.anos.map((a) => a.ano).join(' e ')}`,
      metodo: 'Cópia diária feita por robô.',
      limitacao: 'A fonte informa a data e a situação do envio. Os prazos variam por relatório, então o site não diz se houve atraso.'
    }));
    return true;
  }

  /* ================= 6) Convênios federais (CGU) ================= */
  // Datas da CGU podem vir como "2025-01-10" ou "10/01/2025": mostramos no formato brasileiro sem alterar o valor.
  const dataCgu = (v) => OBS.dataBR(v) || v || '—';
  const dataOrdem = (v) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(v || '')); return m ? `${m[3]}-${m[2]}-${m[1]}` : (v || null); };

  function desenharConvenios(d) {
    if (!d || !Array.isArray(d.convenios) || !d.convenios.length) return false;
    const lista = d.convenios.map((c) => Object.assign({}, c, { _busca: OBS.pessoal.normalizar([c.objeto, c.orgao, c.orgaoSigla, c.convenente, c.numero].join(' ')) }));
    const soma = (campo) => lista.reduce((t, c) => t + (typeof c[campo] === 'number' ? c[campo] : 0), 0);
    OBS.numeros($('conveniosNumeros'), [
      { rotulo: 'Convênios', valor: qtd(lista.length) },
      { rotulo: 'Valor combinado (soma)', valor: OBS.graficos.moedaCurta(soma('valor')), detalhe: 'Total previsto nos convênios.' },
      { rotulo: 'Já liberado (soma)', valor: OBS.graficos.moedaCurta(soma('valorLiberado')), detalhe: 'Parte do valor combinado que já saiu. Não somar com o anterior.' }
    ]);
    OBS.opcoes('situacaoConvenio', OBS.contratos.contar(lista, 'situacao').map(([v, n]) => [v, `${v} (${qtd(n)})`]));
    const COLS = [
      { chave: 'objeto', titulo: 'Objeto', formatar: (v) => OBS.resumirTexto(v, 110) || '(sem descrição)' },
      { chave: 'orgao', titulo: 'Órgão federal' },
      { chave: 'situacao', titulo: 'Situação' },
      { chave: 'fimVigencia', titulo: 'Vigência até', valor: (c) => dataOrdem(c.fimVigencia), formatar: (v, c) => dataCgu(c.fimVigencia) },
      { chave: 'valor', titulo: 'Valor', tipo: 'moeda' },
      { chave: 'valorLiberado', titulo: 'Liberado', tipo: 'moeda' }
    ];
    const t = OBS.tabela({ colunas: COLS, porPagina: 15, ordemInicial: { chave: 'valor', descendente: true }, legenda: 'Convênios federais',
      vazio: 'Nenhum convênio com esses filtros.' });
    $('conveniosTabela').replaceChildren(t.elemento);
    const atualizar = () => {
      const palavras = OBS.pessoal.normalizar($('buscaConvenio').value).split(/\s+/).filter(Boolean);
      const sit = $('situacaoConvenio').value;
      t.mostrar(lista.filter((c) => (!sit || c.situacao === sit) && palavras.every((p) => c._busca.includes(p))));
      OBS.chips($('chipsConvenios'), [
        { rotulo: 'Texto', valor: $('buscaConvenio').value.trim(), limpar: () => { $('buscaConvenio').value = ''; atualizar(); } },
        { rotulo: 'Situação', valor: sit, limpar: () => { $('situacaoConvenio').value = ''; atualizar(); } }
      ]);
    };
    $('buscaConvenio').addEventListener('input', OBS.comEspera(atualizar));
    $('situacaoConvenio').addEventListener('change', atualizar);
    $('csvConvenios').addEventListener('click', () => {
      OBS.exportar.baixar(OBS.exportar.csvTabela({ titulo: 'Convênios do Governo Federal com Videira', fonte: d.meta.fonte, url: d.meta.consultaConvenios,
        observacao: '"Valor" é o total combinado e "Liberado" é o que já saiu: não somar as duas colunas.' },
      [{ titulo: 'Número', valor: (c) => c.numero }, { titulo: 'Objeto', valor: (c) => c.objeto }, { titulo: 'Órgão federal', valor: (c) => c.orgao },
        { titulo: 'Convenente', valor: (c) => c.convenente }, { titulo: 'CNPJ do convenente', valor: (c) => c.convenenteCnpj },
        { titulo: 'Situação', valor: (c) => c.situacao }, { titulo: 'Início da vigência', valor: (c) => dataCgu(c.inicioVigencia) },
        { titulo: 'Fim da vigência', valor: (c) => dataCgu(c.fimVigencia) }, { titulo: 'Valor', tipo: 'moeda', valor: (c) => c.valor },
        { titulo: 'Liberado', tipo: 'moeda', valor: (c) => c.valorLiberado }, { titulo: 'Contrapartida', tipo: 'moeda', valor: (c) => c.valorContrapartida }],
      t.linhasOrdenadas()), 'olho-magico-convenios-federais.csv');
    });
    atualizar();
    $('conveniosOrigem').replaceChildren(OBS.origem({
      fonte: 'Portal da Transparência do Governo Federal (CGU), API de dados', url: d.meta.portal, urlTexto: 'abrir o Portal da Transparência federal',
      tipo: 'Convênios e outros acordos entre órgãos federais e Videira', periodo: `Situação na cópia de ${new Date(d.meta.geradoEm).toLocaleDateString('pt-BR')}`,
      metodo: 'Cópia diária feita por robô, consultando pelo código IBGE de Videira (4219309).',
      limitacao: 'Mostra o que a CGU publica. Emendas parlamentares ainda não estão aqui: a consulta da CGU não separa as emendas por município.'
    }));
    return true;
  }

  /* ================= 7) Benefícios federais (Bolsa Família e BPC) ================= */
  function desenharBeneficios(d) {
    if (!d || !Array.isArray(d.beneficios) || !d.beneficios.length) return false;
    const programas = [...new Set(d.beneficios.map((b) => b.programa))];
    OBS.opcoes('programaBeneficio', programas.map((p) => [p, p]));
    const mesNome = (aaaamm) => OBS.periodoDoMes(`${aaaamm.slice(0, 4)}-${aaaamm.slice(4, 6)}`).nome;
    const t = OBS.tabela({ colunas: [
      { chave: 'mes', titulo: 'Mês', formatar: (v) => mesNome(v), ordenavel: false },
      { chave: 'beneficiados', titulo: 'Beneficiados', tipo: 'numero', ordenavel: false },
      { chave: 'valor', titulo: 'Valor pago', tipo: 'moeda', ordenavel: false }], porPagina: 13, legenda: 'Benefícios por mês' });
    $('beneficioTabela').replaceChildren(t.elemento);
    const atualizar = () => {
      const prog = $('programaBeneficio').value;
      const linhas = d.beneficios.filter((b) => b.programa === prog).sort((a, b) => a.mes.localeCompare(b.mes));
      const ultimo = linhas[linhas.length - 1];
      const frase = $('beneficioFrase'); frase.replaceChildren();
      if (ultimo) {
        frase.append(`Em ${mesNome(ultimo.mes)}, o ${prog} pagou `, el('span', 'valor', OBS.moeda(ultimo.valor || 0)),
          typeof ultimo.beneficiados === 'number' ? ` a ${qtd(ultimo.beneficiados)} beneficiários em Videira.` : ' em Videira.');
      }
      $('beneficioGrafico').replaceChildren(
        OBS.graficos.colunas(linhas.map((b) => ({ rotulo: OBS.historico.rotulo(`${b.mes.slice(0, 4)}-${b.mes.slice(4, 6)}`), valor: b.valor, titulo: mesNome(b.mes) })),
          { destaque: linhas.length - 1, descricao: `Valor pago pelo ${prog} em Videira em cada mês. Os números estão na tabela abaixo.` }),
        el('p', 'meta', 'Unidade: reais pagos no mês. Meses sem coluna ainda não foram publicados pela CGU.'));
      t.mostrar(linhas.slice().reverse());
    };
    $('programaBeneficio').addEventListener('change', atualizar);
    atualizar();
    $('beneficiosOrigem').replaceChildren(OBS.origem({
      fonte: 'Portal da Transparência do Governo Federal (CGU), API de dados', url: d.meta.portal, urlTexto: 'abrir o Portal da Transparência federal',
      tipo: 'Totais mensais por município (Bolsa Família e BPC)', periodo: 'Últimos 13 meses',
      metodo: 'Cópia diária feita por robô. Totais do município: nenhum beneficiário é identificado.',
      limitacao: 'A CGU publica os meses com algum atraso.'
    }));
    return true;
  }

  async function carregar() {
    const estado = $('contasEstado');
    estado.textContent = 'Carregando…';
    const [sic, tr, dc, si, en, cg] = await Promise.all([OBS.dados.siconfi(), OBS.dados.transferencias(), OBS.dados.dca(), OBS.dados.siope(), OBS.dados.entregas(), OBS.dados.cgu()]);
    const secoes = [
      ['sec-pessoal', 'Gasto com pessoal', () => desenharLrf(sic)],
      ['sec-transferencias', 'Repasses da União', () => desenharTransferencias(tr)],
      ['sec-convenios', 'Convênios federais', () => desenharConvenios(cg)],
      ['sec-beneficios', 'Benefícios federais', () => desenharBeneficios(cg)],
      ['sec-areas', 'Despesa por área', () => desenharDca(dc)],
      ['sec-educacao', 'Educação', () => desenharSiope(si)],
      ['sec-entregas', 'Relatórios enviados', () => desenharEntregas(en)]
    ];
    const visiveis = [];
    secoes.forEach(([id, rotulo, desenhar]) => {
      let ok = false;
      try { ok = desenhar(); } catch (erro) { console.error(`Erro em ${id}:`, erro); }
      $(id).classList.toggle('oculto', !ok);    // seção sem dado não aparece (nada de seção vazia)
      if (ok) visiveis.push([id, rotulo]);
    });
    // Aviso de cópia desatualizada, uma linha por fonte com problema.
    const avisos = $('contasDesatualizado'); avisos.replaceChildren();
    ['siconfi', 'transferencias', 'dca', 'siope', 'entregas', 'cgu'].forEach((f) => { const c = el('div'); avisos.append(c); OBS.avisoDesatualizado(c, f); });
    // Sumário com atalhos para cada seção que apareceu.
    const sumario = $('contasSumario');
    sumario.replaceChildren(...visiveis.map(([id, rotulo]) => { const a = el('a', '', rotulo); a.href = `#contas/${id.slice(4)}`; return a; }));
    sumario.classList.toggle('oculto', visiveis.length < 2);
    if (visiveis.length) { estado.textContent = ''; estado.className = ''; } else {
      estado.textContent = 'Os dados do Tesouro e do FNDE ainda não estão disponíveis. Eles são atualizados uma vez por dia. ' +
        '(Para quem cuida do site: rode ferramentas/atualizar.py.)';
      estado.className = 'erro';
    }
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir };
})();
