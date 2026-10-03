/* TELA "INÍCIO": painel com os principais números, um QUADRO por assunto.
   Regras: cada quadro diz o período e a fonte; quadro sem dado NÃO aparece (nada de quadro vazio);
   cada quadro leva à tela com o detalhe. Os arquivos grandes (lista de servidores, contratos) não são
   carregados aqui: os totais deles vêm do resumo gravado pelo robô em dados/situacao.js. */
OBS.inicioTela = (function () {
  const { $, el, moeda, qtd } = OBS;
  const curta = (n) => OBS.graficos.moedaCurta(n);
  const pct = OBS.contas.pct;
  let iniciado = null;

  /* Monta um quadro. o = { titulo, numero, frase, extra (elemento), fonte, link, linkTexto, grande } */
  function quadro(o) {
    const a = el('article', 'quadro' + (o.grande ? ' grande' : ''));
    a.append(el('h3', 'quadro-titulo', o.titulo));
    if (o.numero) a.append(el('p', 'quadro-numero', o.numero));
    if (o.frase) a.append(el('p', 'quadro-frase', o.frase));
    if (o.extra) a.append(o.extra);
    const pe = el('div', 'quadro-pe');
    pe.append(el('p', 'quadro-fonte', `Fonte: ${o.fonte}`));
    const link = el('a', 'quadro-link', o.linkTexto); link.href = o.link;
    pe.append(link);
    a.append(pe);
    return a;
  }

  /* ---------- Indicadores de despesa do mês escolhido ----------
     Vêm do RESUMO DIÁRIO do robô (dados/despesas-resumo.js, poucos KB), com as mesmas contas do site: assim a página
     inicial não baixa ~800 KB da API a cada visita. Mês fora da cópia: leva à aba Gastos (consulta ao vivo).
     Total pago, empenhado e liquidado aparecem SEPARADOS (são etapas da mesma despesa: nunca somar). */
  let pedido = 0;   // número da consulta mais recente: respostas antigas que chegarem atrasadas são ignoradas

  async function desenharKpis(anoMes) {
    const meu = ++pedido;
    const periodo = OBS.periodoDoMes(anoMes);
    const estado = $('kpiEstado'), caixa = $('kpis');
    estado.replaceChildren(OBS.status('carregando', `Buscando os totais de ${periodo.nome}…`));
    caixa.replaceChildren();
    const [servidores, resumo] = await Promise.all([kpiServidores(), OBS.dados.despesasResumo()]);
    if (meu !== pedido) return;                       // a pessoa já escolheu outro mês
    const m = (OBS.historico.doResumo(resumo, [anoMes]) || [])[0];
    const href = `#gastos/${anoMes}`;
    if (!m) {
      estado.replaceChildren(OBS.status('indisponivel', `Os totais de ${periodo.nome} não estão na cópia diária (que guarda os últimos 13 meses).`,
        'Na aba Gastos o site consulta o portal da Prefeitura na hora (cerca de 800 KB de internet).', ['Ver os gastos deste mês', href]));
      caixa.replaceChildren(...[servidores].filter(Boolean));
      return;
    }
    if (m.vazio) {
      estado.replaceChildren(OBS.status('vazio', `A fonte ainda não publicou despesas de ${periodo.nome}.`, 'Escolha um mês anterior.'));
      caixa.replaceChildren(...[servidores].filter(Boolean));
      return;
    }
    const copia = new Date(resumo.meta.geradoEm).toLocaleDateString('pt-BR');
    const fonte = `API de despesas da Prefeitura (cópia de ${copia})`;
    const nomePeriodo = m.parcial ? `${periodo.nome} (mês em andamento: até ${copia})` : periodo.nome;
    estado.replaceChildren();
    caixa.replaceChildren(...[
      OBS.kpi({ rotulo: 'Total pago', valor: moeda(m.pago), periodo: nomePeriodo, fonte, href }),
      OBS.kpi({ rotulo: 'Total empenhado (reservado)', valor: moeda(m.empenhado), periodo: nomePeriodo, fonte, href }),
      OBS.kpi({ rotulo: 'Total liquidado (conferido)', valor: moeda(m.liquidado), periodo: nomePeriodo, fonte, href }),
      OBS.kpi({ rotulo: 'Credores que receberam', valor: qtd(m.credoresQueReceberam), periodo: nomePeriodo, fonte, href }),
      servidores
    ].filter(Boolean));
  }

  /* Cartão de servidores: total da cópia diária (resumo gravado pelo robô em dados/situacao.js). */
  async function kpiServidores() {
    const s = await OBS.dados.situacao();
    const f = s && s.pessoal;
    if (!f || !f.resumo || !f.resumo.registros) return null;
    return OBS.kpi({ rotulo: 'Servidores (registros)', valor: qtd(f.resumo.registros),
      detalhe: `${qtd(f.resumo.comissionados)} em cargos de indicação`,
      periodo: `situação em ${new Date(f.ultimoSucesso).toLocaleDateString('pt-BR')}`, fonte: 'API de Pessoal da Prefeitura', href: '#servidores' });
  }

  /* Evolução: 12 meses até o mês escolhido. Do resumo diário (instantâneo); se faltar mês, consulta ao vivo, um por vez. */
  async function carregarEvolucao() {
    const anoMes = `${$('anoVisao').value}-${$('mesVisao').value}`;
    const botao = $('btnEvolVisao'); botao.disabled = true;
    const meses = OBS.historico.meses(anoMes, 12);
    const resumo = await OBS.dados.despesasResumo();
    let totais = OBS.historico.doResumo(resumo, meses);
    const doResumo = Boolean(totais);
    if (!totais) {
      const resultado = await OBS.historico.varios(meses, (f, t) => { $('evolVisaoEstado').textContent = `Consultando o portal: ${f} de ${t} meses (cerca de 800 KB cada)…`; });
      totais = OBS.historico.totaisPorMes(resultado);
    }
    const erros = totais.filter((m) => m.erro).length;
    botao.disabled = false;
    if (erros === totais.length) {
      $('evolVisaoEstado').textContent = '';
      $('evolVisao').replaceChildren(OBS.status('erro', 'Nenhum mês respondeu.', 'Tente de novo em instantes.'));
      return;
    }
    const parcial = totais.some((m) => m.parcial);
    $('evolVisaoEstado').textContent = `${OBS.periodoDoMes(meses[0]).nome} a ${OBS.periodoDoMes(meses[11]).nome}.` +
      (erros ? ` ${erros} mês(es) não responderam e ficaram sem coluna.` : '') +
      (parcial ? ' O último mês ainda está em andamento (valor parcial).' : '');
    const t = OBS.tabela({ colunas: [
      { chave: 'anoMes', titulo: 'Mês', formatar: (v, l) => OBS.periodoDoMes(v).nome + (l.parcial ? ' (parcial)' : ''), ordenavel: false },
      { chave: 'pago', titulo: 'Pago', tipo: 'moeda', ordenavel: false }], porPagina: 12, legenda: 'Valor pago por mês' });
    t.mostrar(totais.slice().reverse());
    const det = el('details'); det.append(el('summary', '', 'Ver os números (tabela)'), t.elemento);
    $('evolVisao').replaceChildren(
      OBS.graficos.colunas(totais.map((m) => ({ rotulo: OBS.historico.rotulo(m.anoMes), valor: m.pago, titulo: OBS.periodoDoMes(m.anoMes).nome + (m.parcial ? ' (parcial)' : '') })),
        { destaque: 11, descricao: 'Valor pago pelo Município em cada mês. Os números estão na tabela abaixo do gráfico.' }),
      el('p', 'meta', 'Unidade: reais (valor pago). A coluna em destaque é o mês escolhido. Fonte: API de despesas da Prefeitura' +
        (doResumo ? `, cópia diária de ${new Date(resumo.meta.geradoEm).toLocaleDateString('pt-BR')}.` : ', consulta ao vivo.')),
      det);
  }

  /* ---------- Gasto com pessoal (LRF) da Prefeitura ---------- */
  function quadroLrf(d) {
    const poder = d && d.poderes && d.poderes.E;
    const p = poder && OBS.contas.maisRecente(poder.periodos);
    if (!p) return null;
    const f = OBS.contas.faixa(p);
    return quadro({ titulo: 'Gasto com pessoal da Prefeitura', numero: pct(p.dtpPct),
      frase: `da receita corrente líquida, no ${p.rotulo}. ${f ? `Está ${f.texto}.` : ''}`,
      extra: OBS.graficos.medidor(p, pct), fonte: 'Relatório de Gestão Fiscal (SICONFI, Tesouro Nacional).',
      link: '#contas/pessoal', linkTexto: 'Ver Prefeitura e Câmara' });
  }

  /* ---------- Repasses da União no ano ---------- */
  function quadroTransferencias(d) {
    if (!d || !Array.isArray(d.registros) || !d.registros.length) return null;
    const T = OBS.transferencias, regs = d.registros;
    const ano = T.anos(regs)[0], ultimo = T.ultimoMes(regs, ano);
    const total = T.acumulado(regs, ano, ultimo);
    const anterior = T.anos(regs).includes(ano - 1) ? T.acumulado(regs, ano - 1, ultimo) : null;
    const variacao = anterior !== null ? T.variacao(total, anterior) : null;
    const serie = T.porMes(regs, ano).map((v, i) => ({ rotulo: OBS.mesCurto(i + 1).charAt(0).toUpperCase(), valor: v, titulo: OBS.MESES[i] }));
    return quadro({ titulo: `Repasses da União em ${ano}`, numero: moeda(total),
      frase: `recebidos de janeiro a ${OBS.MESES[ultimo - 1].toLowerCase()} (FPM, FUNDEB e outros; o último mês pode estar incompleto).` +
        (variacao !== null ? ` No mesmo período de ${ano - 1}: ${curta(anterior)} (${variacao >= 0 ? 'alta' : 'queda'} de ${pct(Math.abs(Math.round(variacao * 10) / 10))}).` : ''),
      extra: OBS.graficos.colunas(serie, { destaque: ultimo - 1, descricao: `Repasses por mês em ${ano}.` }),
      fonte: 'Transferências constitucionais (Tesouro Nacional).', link: '#contas/transferencias', linkTexto: 'Ver mês a mês e por tipo' });
  }

  /* ---------- Áreas com mais despesa (contas anuais) ---------- */
  function quadroDca(d) {
    if (!d || !Array.isArray(d.anos) || !d.anos.length) return null;
    const a = d.anos[0];
    const funcoes = OBS.contas.funcoes(a, 'empenhado');
    if (!funcoes.length) return null;
    return quadro({ titulo: `Onde o dinheiro foi gasto em ${a.ano}`, frase: 'Despesa empenhada (reservada) por área, as cinco maiores:',
      extra: OBS.graficos.barras(funcoes.slice(0, 5).map((f) => ({ rotulo: f.nome, valor: f.valor, detalhe: `${pct(Math.round(f.fatia * 10) / 10)} do total` })), { formatar: curta }),
      fonte: 'Contas anuais (DCA, SICONFI, Tesouro Nacional).', link: '#contas/areas', linkTexto: 'Ver todas as áreas' });
  }

  /* ---------- Educação (mínimo constitucional) ---------- */
  function quadroSiope(d) {
    if (!d || !Array.isArray(d.periodos) || !d.periodos.length) return null;
    const p = d.periodos[0];
    const achado = p.indicadores.map((ind) => ({ ind, min: OBS.contas.minimoEducacao(ind) })).find((x) => x.min && x.min.minimo === 25);
    if (!achado) return null;
    // O mínimo de 25% vale para o ANO INTEIRO: com dado parcial, o site não diz se está acima ou abaixo.
    const parcial = !OBS.contas.anoFechado(p);
    return quadro({ titulo: parcial ? `Educação em ${p.ano} (até o ${p.bimestre}º bimestre)` : `Educação em ${p.ano}`, numero: pct(achado.ind.valor),
      frase: `das receitas de impostos foram aplicadas no ensino (mínimo da Constituição: ${pct(25)} no ano). ` +
        (parcial ? OBS.contas.AVISO_PARCIAL : achado.min.cumpre ? 'Está acima do mínimo.' : 'Está abaixo do mínimo.'),
      fonte: 'SIOPE (FNDE, Ministério da Educação).', link: '#contas/educacao', linkTexto: 'Ver os indicadores' });
  }

  /* ---------- Contratos: totais do resumo do robô (o arquivo grande não é carregado aqui) ---------- */
  function quadroContratos(s) {
    const r = s && s.pncp && s.pncp.resumo;
    if (!r || !r.contratos) return null;
    return quadro({ titulo: 'Contratos nos últimos 12 meses', numero: `${qtd(r.contratos)} contratos`,
      frase: `com valor previsto somado de ${curta(r.valorGlobal)}, e ${qtd(r.compras)} licitações e compras publicadas.`,
      fonte: 'PNCP (Portal Nacional de Contratações Públicas).', link: '#contratos', linkTexto: 'Ver contratos e fornecedores' });
  }

  /* ---------- Último relatório enviado ao Tesouro ---------- */
  function quadroEntregas(d) {
    if (!d || !Array.isArray(d.registros) || !d.registros.length) return null;
    const ultimas = OBS.contas.ultimasEntregas(d.registros).filter((r) => /prefeitura/i.test(r.instituicao));
    const r = ultimas[0];
    if (!r) return null;
    return quadro({ titulo: 'Prestação de contas ao Tesouro', numero: OBS.dataBR(r.data),
      frase: `foi o último envio da Prefeitura: ${r.entregavel} (${OBS.contas.rotuloPeriodo(r)} de ${r.exercicio}).`,
      fonte: 'Extrato de entregas (SICONFI, Tesouro Nacional).', link: '#contas/entregas', linkTexto: 'Ver todos os relatórios' });
  }

  async function carregar() {
    const caixa = $('quadros');
    caixa.replaceChildren();
    // Competência padrão: o mês anterior (o mês atual costuma estar incompleto).
    const padrao = OBS.mesAnterior(new Date());
    OBS.preencherMesAno($('mesVisao'), $('anoVisao'), padrao);
    $('formCompetencia').addEventListener('submit', (ev) => {
      ev.preventDefault();
      $('evolVisao').replaceChildren(); $('evolVisaoEstado').textContent = '';
      desenharKpis(`${$('anoVisao').value}-${$('mesVisao').value}`);
      carregarEvolucao();
    });
    $('btnEvolVisao').addEventListener('click', carregarEvolucao);
    desenharKpis(padrao);
    carregarEvolucao();
    const [sic, tr, dc, si, en, sit] = await Promise.all([OBS.dados.siconfi(), OBS.dados.transferencias(), OBS.dados.dca(),
      OBS.dados.siope(), OBS.dados.entregas(), OBS.dados.situacao()]);
    const quadros = [
      () => quadroLrf(sic), () => quadroTransferencias(tr), () => quadroDca(dc),
      () => quadroContratos(sit), () => quadroSiope(si), () => quadroEntregas(en)
    ].map((f) => { try { return f(); } catch (e) { console.error('Quadro do início:', e); return null; } }).filter(Boolean);
    caixa.append(...quadros);
    $('inicioEstado').replaceChildren(...(quadros.length ? [] : [OBS.status('indisponivel', 'As cópias diárias das fontes oficiais ainda não foram feitas neste site.',
      'Os indicadores de despesa acima são consultados ao vivo e continuam funcionando.')]));
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir };
})();
