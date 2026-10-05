/* TELA "INÍCIO": "Videira em 6 perguntas". Um CARTÃO-PERGUNTA por tela do site, na ordem do menu.
   Cada cartão: a pergunta, UMA frase-resposta (js/frases.js), o valor exato quando houver, o período e a fonte,
   e o link para os detalhes. Só usa as CÓPIAS DIÁRIAS (arquivos pequenos): nada de consulta de ~800 KB aqui.
   Sem dado, o cartão continua, com um aviso (a pergunta não some). */
OBS.inicioTela = (function () {
  const { $, moeda } = OBS;
  const F = OBS.frases;
  let iniciado = null;

  const copiaDe = (iso) => new Date(iso).toLocaleDateString('pt-BR');
  const semDado = (pergunta, href, texto) => OBS.cartaoPergunta({ pergunta, href, indisponivel: true,
    frase: texto || 'Os dados desta pergunta ainda não estão disponíveis neste site. Eles são atualizados uma vez por dia.' });

  /* 1) Para onde vai o dinheiro? Último mês COMPLETO do resumo diário das despesas, com gráfico dos 12 meses. */
  function cartaoGastos(resumo) {
    const pergunta = 'Para onde vai o dinheiro?';
    const meses = resumo && Array.isArray(resumo.meses) ? resumo.meses : [];
    const fechados = meses.filter((m) => !m.parcial && m.registros > 0);
    const ultimo = fechados[fechados.length - 1];
    if (!ultimo) return semDado(pergunta, '#gastos');
    const seis = OBS.historico.doResumo(resumo, OBS.historico.meses(ultimo.anoMes, 6)) || [];
    const grafico = seis.length === 6 ? OBS.graficos.colunas(seis.map((m) => ({ rotulo: OBS.historico.rotulo(m.anoMes), valor: m.pago,
      titulo: OBS.periodoDoMes(m.anoMes).nome })), { destaque: 5, titulo: 'Valor pago em cada um dos últimos 6 meses completos',
      legendaDestaque: 'mês mais recente', legendaOutros: 'meses anteriores', marcaDestaque: 'mais recente',
      descricao: 'Valor pago pelo Município em cada um dos últimos 6 meses completos.' }) : null;
    return OBS.cartaoPergunta({ pergunta, frase: F.gastoDoMes({ anoMes: ultimo.anoMes, pago: ultimo.total.pago }),
      exato: `Valor exato: ${moeda(ultimo.total.pago)}. Inclui Prefeitura, Câmara, autarquias, fundação e fundos.`,
      extra: grafico, periodo: OBS.periodoDoMes(ultimo.anoMes).nome,
      fonte: `Portal da Transparência de Videira (API de despesas), cópia de ${copiaDe(resumo.meta.geradoEm)}`, href: `#gastos/${ultimo.anoMes}` });
  }

  /* 2) De onde vem o dinheiro? Transferências constitucionais do ano, até o último mês com dado. */
  function cartaoEntradas(d) {
    const pergunta = 'De onde vem o dinheiro?';
    if (!d || !Array.isArray(d.registros) || !d.registros.length) return semDado(pergunta, '#entradas');
    const T = OBS.transferencias, regs = d.registros;
    const ano = T.anos(regs)[0], ultimo = T.ultimoMes(regs, ano), total = T.acumulado(regs, ano, ultimo);
    return OBS.cartaoPergunta({ pergunta, frase: F.transferencias(ano, ultimo, total), exato: `Valor exato: ${moeda(total)}.`,
      periodo: `janeiro a ${OBS.MESES[ultimo - 1].toLowerCase()} de ${ano}`,
      fonte: `Tesouro Nacional (transferências constitucionais), cópia de ${copiaDe(d.meta.geradoEm)}`, href: '#entradas' });
  }

  /* 3) Quem trabalha para o município? Totais do resumo do robô (o arquivo grande da lista não é carregado aqui). */
  function cartaoPessoal(s) {
    const pergunta = 'Quem trabalha para o município?';
    const f = s && s.pessoal;
    if (!f || !f.resumo || !f.resumo.registros) return semDado(pergunta, '#pessoal');
    return OBS.cartaoPergunta({ pergunta, frase: F.pessoal(f.resumo), periodo: `situação em ${copiaDe(f.ultimoSucesso)}`,
      fonte: 'API de Pessoal da Prefeitura (cada registro é um vínculo; quem tem dois cargos aparece duas vezes)', href: '#pessoal' });
  }

  /* 4) O que foi comprado e contratado? Totais do PNCP (sem consórcio intermunicipal), do resumo do robô. */
  function cartaoContratos(s) {
    const pergunta = 'O que foi comprado e contratado?';
    const f = s && s.pncp;
    if (!f || !f.resumo || !f.resumo.contratos) return semDado(pergunta, '#contratos');
    return OBS.cartaoPergunta({ pergunta, frase: F.contratos(f.resumo), exato: `Valor exato: ${moeda(f.resumo.valorGlobal)}.`,
      periodo: 'últimos 12 meses', fonte: `PNCP (Portal Nacional de Contratações Públicas), cópia de ${copiaDe(f.ultimoSucesso)}`, href: '#contratos' });
  }

  /* 5) O que a lei exige, e onde o município está? Gasto com pessoal declarado pela Prefeitura x limites da LRF. */
  function cartaoLimites(d) {
    const pergunta = 'O que a lei exige, e onde o município está?';
    const poder = d && d.poderes && d.poderes.E;
    const p = poder && OBS.contas.maisRecente(poder.periodos);
    if (!p) return semDado(pergunta, '#limites');
    const faixa = OBS.contas.faixa(p);
    return OBS.cartaoPergunta({ pergunta, frase: F.limitePessoal(p) + (faixa ? ` Isso está ${faixa.texto}.` : ''),
      extra: OBS.graficos.medidor(p, F.pct), periodo: p.rotulo,
      fonte: 'Relatório de Gestão Fiscal (SICONFI, Tesouro Nacional)', href: '#limites' });
  }

  /* 6) O que faz a Câmara de Vereadores? A pauta mais recente publicada pela própria Câmara. */
  function cartaoCamara(d) {
    const pergunta = 'O que faz a Câmara de Vereadores?';
    const pautas = d && Array.isArray(d.pautas) ? d.pautas.filter((p) => p.titulo) : [];
    if (!pautas.length) return semDado(pergunta, '#camara');
    const recente = pautas.slice().sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))[0];
    return OBS.cartaoPergunta({ pergunta, frase: F.pautaCamara(recente), periodo: `situação em ${copiaDe(d.meta.geradoEm)}`,
      fonte: 'Dados abertos da Câmara Municipal de Videira', href: '#camara' });
  }

  async function carregar() {
    const caixa = $('cartoesPergunta');
    caixa.replaceChildren(OBS.status('carregando', 'Buscando as respostas…'));
    const [resumo, tr, sit, sic, cam] = await Promise.all([OBS.dados.despesasResumo(), OBS.dados.transferencias(),
      OBS.dados.situacao(), OBS.dados.siconfi(), OBS.dados.camara()]);
    const cartoes = [() => cartaoGastos(resumo), () => cartaoEntradas(tr), () => cartaoPessoal(sit),
      () => cartaoContratos(sit), () => cartaoLimites(sic), () => cartaoCamara(cam)]
      .map((f) => { try { return f(); } catch (e) { console.error('Cartão do início:', e); return null; } }).filter(Boolean);
    caixa.replaceChildren(...cartoes);
    OBS.municipioTela.faixaInicio($('faixaNumeros')).catch((e) => console.error('Faixa de números:', e));
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir };
})();
