/* TELA "MUNICÍPIO" (#municipio): "Como é Videira?". Números do IBGE (cópia diária de dados/ibge.js):
   população (estimativa e Censo), área, densidade e PIB, cada um com o SEU ano e a SUA tabela.
   Também desenha a faixa "Videira em números" da página inicial (com a receita do ano, do RREO).
   PIB não é dinheiro da Prefeitura: o aviso fica junto do número. Indicador sem dado não aparece (nunca vira zero). */
OBS.municipioTela = (function () {
  const { $, el, qtd, moeda } = OBS;
  const R = OBS.receitas;
  let iniciado = null;
  const tabela = (i) => `IBGE, tabela ${i.tabela}`;

  /* Seção com título e, logo embaixo, a explicação em letra pequena do que é aquela informação. */
  function secao(titulo, explica, ...filhos) {
    const s = el('section');
    s.append(el('h2', '', titulo), el('p', 'nota-titulo', explica), ...filhos);
    return s;
  }

  // O que entra em cada setor do PIB (definições do IBGE, em palavras simples).
  const SETORES = [
    ['vaAgropecuaria', 'Agropecuária', 'Lavouras, frutas, criação de animais, leite e madeira de reflorestamento.'],
    ['vaIndustria', 'Indústria', 'Fábricas (inclusive as que processam alimentos), construção civil, energia, água e esgoto.'],
    ['vaServicos', 'Serviços (sem administração pública)', 'Comércio, transporte, bancos, oficinas, restaurantes, escolas e hospitais particulares e outros serviços privados.'],
    ['vaAdministracao', 'Administração, educação, saúde e seguridade públicas', 'Serviços dos governos na cidade (Prefeitura, escolas e postos de saúde públicos, órgãos estaduais e federais), medidos principalmente pelos salários pagos.']
  ];

  /* PIB COM SELETOR DE ANO: a série inteira do IBGE (2002 em diante). Setores só nos anos em que o IBGE publicou. */
  function secaoPib(d) {
    const serie = Array.isArray(d.pibAnual) ? d.pibAnual.filter((s) => typeof s.pib === 'number') : [];
    if (!serie.length) return null;
    const aviso = el('p', 'aviso-juridico');
    const link = el('a', '', 'De onde vem o dinheiro?'); link.href = '#entradas';
    aviso.append(el('strong', '', 'PIB não é dinheiro da Prefeitura. '),
      'É o valor de tudo o que foi produzido na cidade em um ano: indústrias, comércio, agricultura e serviços, inclusive os públicos. O que a Prefeitura recebe está em ', link, '.');

    const escolha = el('div', 'filtros');
    const rotulo = el('label', '', 'Ano'); rotulo.htmlFor = 'municipioAnoPib';
    const sel = el('select'); sel.id = 'municipioAnoPib';
    serie.slice().reverse().forEach((s) => { const o = el('option', '', String(s.ano)); o.value = String(s.ano); sel.append(o); });
    const caixaAno = el('div'); caixaAno.append(rotulo, sel); escolha.append(caixaAno);
    const doAno = el('div'), grafico = el('div');

    function mostrar(ano) {
      const k = serie.findIndex((s) => s.ano === ano);
      const s = serie[k];
      const numeros = el('div', 'numeros');
      OBS.numeros(numeros, [
        { rotulo: `PIB do município em ${s.ano}`, valor: OBS.frases.reais(s.pib), detalhe: `Valor exato: ${moeda(s.pib)} (IBGE, tabela 5938)` },
        typeof s.participacaoEstado === 'number' && { rotulo: `Parte do PIB de Santa Catarina em ${s.ano}`,
          valor: OBS.frases.pct(s.participacaoEstado), detalhe: 'Quanto Videira representa de tudo o que foi produzido no estado' }
      ].filter(Boolean));
      // Setores: os do ano escolhido; se o IBGE ainda não publicou os desse ano, os do ano mais recente que tem
      // (com aviso). Assim a divisão por setor nunca some da tela.
      const sv = s.setores ? s : serie.filter((x) => x.setores).pop();
      const partes = [numeros];
      if (sv) {
        partes.push(el('h3', '', `O que a cidade produz, por setor (${sv.ano})`),
          el('p', 'nota-titulo', 'É a riqueza gerada por cada setor, chamada de valor adicionado: o que o setor produziu menos o que comprou de outros (matéria-prima, energia, embalagens). Não são os impostos pagos pelo setor.'));
        if (sv !== s) {
          partes.push(el('p', 'aviso-juridico', `O IBGE ainda não publicou a divisão por setor de ${s.ano}. Abaixo está a de ${sv.ano}, a mais recente.`));
        }
        const total = sv.valorAdicionado;
        partes.push(OBS.graficos.barras(SETORES.map(([chave, nome, oque]) => ({ rotulo: nome, valor: sv.setores[chave],
          detalhe: `${OBS.frases.pct(Math.round((sv.setores[chave] / total) * 1000) / 10)} da riqueza gerada · ${oque}` }))));
        if (typeof sv.impostosProdutos === 'number') {
          partes.push(el('p', 'meta', `A conta do IBGE: ${OBS.frases.reais(total)} (soma dos 4 setores) + ${OBS.frases.reais(sv.impostosProdutos)} ` +
            `(impostos embutidos nos preços, como ICMS e IPI, que vão para a União, o Estado e o Município) = ${OBS.frases.reais(sv.pib)} de PIB em ${sv.ano}.`));
        }
      }
      doAno.replaceChildren(...partes);
      grafico.replaceChildren(OBS.graficos.colunas(serie.map((x) => ({ rotulo: String(x.ano), valor: x.pib, titulo: String(x.ano) })), {
        destaque: k, resumo: true, titulo: `PIB de Videira em cada ano (${serie[0].ano} a ${serie[serie.length - 1].ano})`,
        legendaDestaque: `ano escolhido (${s.ano})`, legendaOutros: 'outros anos', marcaDestaque: 'escolhido',
        formatarResumo: OBS.frases.reais, formatar: OBS.frases.reais,
        formatarCurto: (n) => `${(n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`,   // curto: 22 colunas
        descricao: 'PIB de Videira em cada ano, em valores da época.' }),
        el('p', 'meta', 'Valores da época, sem correção da inflação: R$ 1 milhão em 2002 comprava bem mais do que hoje. Por isso o gráfico exagera o crescimento real.'));
    }
    sel.addEventListener('change', () => mostrar(Number(sel.value)));
    mostrar(serie[serie.length - 1].ano);
    return secao('Quanto a cidade produz (PIB)',
      'PIB (Produto Interno Bruto) é o valor de tudo o que foi produzido na cidade em um ano. Escolha o ano para ver o valor e, quando o IBGE já tiver publicado, a divisão por setor.',
      aviso, escolha, doAno, grafico);
  }

  function desenhar(d) {
    const i = d && d.indicadores;
    if (!i || !i.populacaoCenso) return false;
    const partes = [];

    // 1) Pessoas: dois números diferentes, cada um explicado.
    const pessoas = el('div', 'numeros');
    OBS.numeros(pessoas, [
      i.populacaoEstimada && { rotulo: `População estimada em ${i.populacaoEstimada.ano}`, valor: `${qtd(i.populacaoEstimada.valor)} pessoas`,
        detalhe: `Cálculo anual (${tabela(i.populacaoEstimada)})` },
      { rotulo: `População no Censo ${i.populacaoCenso.ano}`, valor: `${qtd(i.populacaoCenso.valor)} pessoas`,
        detalhe: `Contagem feita casa a casa (${tabela(i.populacaoCenso)})` }
    ].filter(Boolean));
    partes.push(secao('Quantas pessoas moram aqui',
      'Número de moradores do município. O IBGE tem dois números diferentes, e por isso eles não batem: o do Censo, uma contagem feita casa a casa, e a estimativa, um cálculo que o IBGE faz todo ano a partir do Censo.',
      pessoas));

    // 2) Território.
    const territorio = el('div', 'numeros');
    OBS.numeros(territorio, [
      i.area && { rotulo: 'Área do município', valor: `${R.decimal(i.area.valor)} km²`, detalhe: `${tabela(i.area)}, ${i.area.ano}` },
      i.densidade && { rotulo: 'Densidade', valor: `${R.decimal(i.densidade.valor)} habitantes por km²`, detalhe: `Pelo Censo ${i.densidade.ano} (${tabela(i.densidade)})` }
    ].filter(Boolean));
    partes.push(secao('Tamanho do território',
      'Área é o tamanho do município em quilômetros quadrados (km²). Densidade é quantas pessoas moram, em média, em cada km²: a população do Censo dividida pela área.',
      territorio));

    // 3) Economia: PIB com seletor de ano.
    const pib = secaoPib(d);
    if (pib) partes.push(pib);

    const conteudo = $('municipioConteudo');
    conteudo.replaceChildren(...partes, OBS.origem({
      fonte: d.meta.fonte, url: d.meta.portal, urlTexto: 'abrir o SIDRA (IBGE)',
      tipo: 'Indicadores do município: população, área, densidade e PIB',
      periodo: 'Cada número mostra o seu ano',
      metodo: 'Cópia diária feita por robô, das tabelas 4714 (Censo 2022), 6579 (estimativa da população) e 5938 (PIB dos Municípios), no nível municipal.',
      limitacao: 'O PIB sai com cerca de 2 anos de atraso e o detalhe por setor ainda depois. O IBGE não publica taxa de desemprego por município.'
    }));
    return true;
  }

  async function carregar() {
    const estado = $('municipioEstado');
    estado.textContent = 'Carregando…';
    const d = await OBS.dados.ibge();
    let ok = false;
    try { ok = desenhar(d); } catch (erro) { console.error('Tela Município:', erro); }
    if (ok) { estado.textContent = ''; estado.className = ''; } else {
      estado.textContent = 'Os números do IBGE ainda não estão disponíveis neste site. Eles são atualizados uma vez por dia.';
      estado.className = 'erro';
    }
    OBS.avisoDesatualizado($('municipioDesatualizado'), 'ibge');
  }

  /* Faixa "Videira em números" da página inicial: 4 números, cada um com o ano. */
  async function faixaInicio(caixa) {
    const [d, rr] = await Promise.all([OBS.dados.ibge(), OBS.dados.rreo()]);
    const i = (d && d.indicadores) || {};
    const r = rr && rr.receitas;
    const itens = [
      i.populacaoEstimada && { rotulo: 'Pessoas', valor: qtd(i.populacaoEstimada.valor), detalhe: `estimativa do IBGE, ${i.populacaoEstimada.ano}` },
      i.area && { rotulo: 'Área', valor: `${R.decimal(i.area.valor)} km²`, detalhe: `IBGE, ${i.area.ano}` },
      i.pib && { rotulo: 'PIB da cidade', valor: OBS.frases.reais(i.pib.valor), detalhe: `IBGE, ${i.pib.ano} (não é dinheiro da Prefeitura)` },
      r && r.total && { rotulo: 'Receita do Município', valor: OBS.frases.reais(r.total.realizado), detalhe: `${r.periodo} (Tesouro, RREO)` }
    ].filter(Boolean);
    if (!itens.length) { caixa.classList.add('oculto'); return; }
    const numeros = el('div', 'numeros');
    OBS.numeros(numeros, itens);
    const link = el('a', '', 'Mais sobre o município'); link.href = '#municipio';
    caixa.replaceChildren(el('h2', '', 'Videira em números'), numeros, link);
    caixa.classList.remove('oculto');
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir, faixaInicio };
})();
