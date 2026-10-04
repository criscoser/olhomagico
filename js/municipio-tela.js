/* TELA "MUNICÍPIO" (#municipio): "Como é Videira?". Números do IBGE (cópia diária de dados/ibge.js):
   população (estimativa e Censo), área, densidade e PIB, cada um com o SEU ano e a SUA tabela.
   Também desenha a faixa "Videira em números" da página inicial (com a receita do ano, do RREO).
   PIB não é dinheiro da Prefeitura: o aviso fica junto do número. Indicador sem dado não aparece (nunca vira zero). */
OBS.municipioTela = (function () {
  const { $, el, qtd, moeda } = OBS;
  const R = OBS.receitas;
  let iniciado = null;
  const tabela = (i) => `IBGE, tabela ${i.tabela}`;

  function secao(titulo, ...filhos) {
    const s = el('section');
    s.append(el('h2', '', titulo), ...filhos);
    return s;
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
    partes.push(secao('Quantas pessoas moram aqui', pessoas,
      el('p', 'meta', 'São dois números diferentes e por isso não batem: o Censo é a contagem feita casa a casa; a estimativa é um cálculo que o IBGE faz todo ano a partir do Censo.')));

    // 2) Território.
    const territorio = el('div', 'numeros');
    OBS.numeros(territorio, [
      i.area && { rotulo: 'Área do município', valor: `${R.decimal(i.area.valor)} km²`, detalhe: `${tabela(i.area)}, ${i.area.ano}` },
      i.densidade && { rotulo: 'Densidade', valor: `${R.decimal(i.densidade.valor)} habitantes por km²`, detalhe: `Pelo Censo ${i.densidade.ano} (${tabela(i.densidade)})` }
    ].filter(Boolean));
    partes.push(secao('Tamanho do território', territorio));

    // 3) Economia: PIB, com o aviso de que não é dinheiro da Prefeitura.
    if (i.pib) {
      const economia = el('div', 'numeros');
      OBS.numeros(economia, [
        { rotulo: `PIB do município em ${i.pib.ano}`, valor: OBS.frases.reais(i.pib.valor), detalhe: `Valor exato: ${moeda(i.pib.valor)} (${tabela(i.pib)})` },
        i.participacaoPibEstado && { rotulo: `Parte do PIB de Santa Catarina em ${i.participacaoPibEstado.ano}`,
          valor: OBS.frases.pct(i.participacaoPibEstado.valor), detalhe: tabela(i.participacaoPibEstado) }
      ].filter(Boolean));
      const aviso = el('p', 'aviso-juridico');
      const link = el('a', '', 'De onde vem o dinheiro?'); link.href = '#entradas';
      aviso.append(el('strong', '', 'PIB não é dinheiro da Prefeitura. '),
        'É o valor de tudo o que foi produzido na cidade em um ano: indústrias, comércio, agricultura e serviços, inclusive os públicos. O que a Prefeitura recebe está em ', link, '.');
      const filhos = [aviso, economia];
      const setores = ['vaAgropecuaria', 'vaIndustria', 'vaServicos', 'vaAdministracao'].map((k) => i[k]).filter(Boolean);
      if (setores.length === 4 && i.valorAdicionado) {
        const total = i.valorAdicionado.valor;
        filhos.push(el('h3', '', `O que a cidade produz, por setor (${setores[0].ano})`),
          OBS.graficos.barras(setores.map((s) => ({ rotulo: s.nome, valor: s.valor,
            detalhe: `${OBS.frases.pct(Math.round((s.valor / total) * 1000) / 10)} do valor adicionado` }))),
          el('p', 'meta', `O IBGE divulga o detalhe por setor depois do total: os números mais recentes por setor são de ${setores[0].ano}. ` +
            'Valor adicionado é o PIB sem os impostos sobre produtos.'));
      }
      partes.push(secao('Quanto a cidade produz (PIB)', ...filhos));
    }

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
