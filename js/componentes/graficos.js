/* GRÁFICOS SIMPLES, feitos só com HTML e CSS (sem biblioteca externa).
   Por que não usar uma biblioteca? Menos peso, nada de código de terceiros, e funciona com a política de
   segurança (CSP) do site. As alturas e larguras são definidas por JavaScript (elemento.style), o que a CSP permite.

   Regra de acessibilidade: TODO gráfico vem com os números escritos (tabela ou legenda).
   Quem não enxerga o desenho não perde nenhuma informação. */
OBS.graficos = (function () {
  const { el, moeda } = OBS;

  /* Valor curto para rótulos: 3.622.769 -> "R$ 3,6 mi"; 980.000 -> "R$ 980 mil". */
  function moedaCurta(n) {
    if (typeof n !== 'number') return '—';
    const abs = Math.abs(n), sinal = n < 0 ? '-' : '';
    const fmt = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 });
    if (abs >= 1e9) return `${sinal}R$ ${fmt(abs / 1e9)} bi`;
    if (abs >= 1e6) return `${sinal}R$ ${fmt(abs / 1e6)} mi`;
    if (abs >= 1e3) return `${sinal}R$ ${fmt(abs / 1e3)} mil`;
    return moeda(n);
  }

  /* BARRAS HORIZONTAIS: [{rotulo, valor, detalhe?, href?}] -> lista com uma barra por item.
     A barra é proporcional ao MAIOR valor da lista. "formatar" muda como o número aparece. */
  function barras(itens, { formatar = moeda } = {}) {
    const ul = el('ul', 'lista barras');
    const maximo = Math.max(0, ...itens.map((i) => i.valor || 0));
    itens.forEach((i) => {
      const li = el('li');
      const linha = el('div', 'linha');
      let nome = el('span', 'nome', i.rotulo);
      if (i.href) { const a = el('a', 'nome', i.rotulo); a.href = i.href; nome = a; }
      linha.append(nome, el('span', 'v', formatar(i.valor)));
      li.append(linha);
      if (i.detalhe) li.append(el('div', 'meta', i.detalhe));
      li.append(OBS.ui.barra(Math.max(0, i.valor || 0), maximo));
      ul.append(li);
    });
    return ul;
  }

  /* Passo "redondo" para as linhas de referência: 1, 2, 2,5 ou 5 vezes uma potência de 10. */
  function passoRedondo(bruto) {
    if (!(bruto > 0)) return 1;
    const pot = 10 ** Math.floor(Math.log10(bruto));
    return [1, 2, 2.5, 5, 10].map((m) => m * pot).find((x) => x >= bruto);
  }

  /* Linhas de referência (eixo): de "base" até "topo", com uns 3 a 4 intervalos. Função sem tela, testada. */
  function eixo(valores) {
    const nums = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
    const max = Math.max(0, ...nums), min = Math.min(0, ...nums);
    const passo = passoRedondo((max - min) / 3 || 1);
    const topo = Math.ceil(max / passo) * passo || passo, base = Math.floor(min / passo) * passo;
    const marcas = [];
    for (let v = base; v <= topo + passo / 2; v += passo) marcas.push(Math.round(v * 1e6) / 1e6);
    return { base, topo, marcas };
  }

  /* Frase com o maior e o menor valor (fato, sem opinião). Devolve '' se não houver ao menos dois valores diferentes. */
  function extremos(serie, formatar) {
    const com = serie.filter((s) => typeof s.valor === 'number');
    if (com.length < 2) return '';
    const maior = com.reduce((a, b) => (b.valor > a.valor ? b : a)), menor = com.reduce((a, b) => (b.valor < a.valor ? b : a));
    if (maior.valor === menor.valor) return '';
    const nome = (s) => s.titulo || s.rotulo;
    return `Maior valor: ${nome(maior)}, ${formatar(maior.valor)}. Menor valor: ${nome(menor)}, ${formatar(menor.valor)}.`;
  }

  /* GRÁFICO DE COLUNAS com tudo escrito (a pessoa não precisa adivinhar):
       título, frase com o maior e o menor valor, legenda das cores, linhas de referência com valores, o valor em cima de
       cada barra e o nome de cada coluna embaixo. Em espaço estreito (celular, cartão), o MESMO gráfico vira barras
       deitadas, uma por linha: nome à esquerda, valor à direita (nada depende de passar o mouse).
     serie: [{ rotulo (curto, embaixo da coluna), titulo (nome completo, ex.: "setembro de 2026"), valor, parcial? }]
     opcoes: titulo, destaque (índice), legendaDestaque (ex.: "mês escolhido"), resumo (true = frase do maior e menor),
             formatar (valor por extenso), formatarCurto (valor em cima da coluna), descricao (texto para leitor de tela). */
  function colunas(serie, o = {}) {
    // Padrão: dinheiro no mesmo formato das frases ("R$ 46,2 milhões"); em cima da coluna e no eixo, curto ("46,2 mi").
    const formatar = o.formatar || ((n) => OBS.frases.reais(n));
    const curto = o.formatarCurto || ((n) => (n === 0 ? '0' : String(OBS.frases.reais(n)).replace(/\u00a0/g, ' ').replace(/^(−)?R\$ ?/, '$1')
      .replace(' milhões', ' mi').replace(' milhão', ' mi').replace(' bilhões', ' bi').replace(' bilhão', ' bi')));
    const destaque = typeof o.destaque === 'number' ? o.destaque : -1;
    const fig = el('figure', 'grafico');
    if (o.titulo) fig.append(el('figcaption', 'grafico-titulo', o.titulo));
    const resumo = o.resumo ? extremos(serie, o.formatarResumo || formatar) : '';
    if (resumo) fig.append(el('p', 'grafico-resumo', resumo));
    // Legenda das cores, junto do gráfico.
    const legenda = el('p', 'grafico-legenda');
    if (destaque >= 0 && o.legendaDestaque) {
      legenda.append(el('span', 'amostra amostra-destaque'), ` ${o.legendaDestaque}   `, el('span', 'amostra'), ` ${o.legendaOutros || 'outros'}`);
    }
    if (serie.some((s) => s.parcial)) legenda.append('   ', el('span', 'amostra amostra-parcial'), ' em andamento (parcial)');
    if (serie.some((s) => typeof s.valor === 'number' && s.valor < 0)) legenda.append('   ', el('span', 'amostra amostra-negativa'), ' negativo (ajuste ou devolução)');
    if (legenda.childNodes.length) fig.append(legenda);

    const { base, topo, marcas } = eixo(serie.map((s) => s.valor));
    const faixa = topo - base || 1;
    const pos = (v) => ((v - base) / faixa) * 100;          // % a partir de baixo
    const zero = pos(0);

    // ----- Colunas em pé (espaço largo). Escondidas do leitor de tela: a lista abaixo diz o mesmo em texto. -----
    const colunasEl = el('div', 'graf-colunas'); colunasEl.setAttribute('aria-hidden', 'true');
    const eixoEl = el('div', 'graf-eixo'), area = el('div', 'graf-area'), barras = el('div', 'graf-barras');
    marcas.forEach((v) => {
      const linha = el('div', 'graf-grade' + (v === 0 ? ' zero' : '')); linha.style.bottom = `${pos(v)}%`; area.append(linha);
      const r = el('span', 'graf-eixo-valor', curto(v)); r.style.bottom = `${pos(v)}%`; eixoEl.append(r);
    });
    const rotulos = el('div', 'graf-rotulos');
    serie.forEach((s, i) => {
      const classes = (i === destaque ? ' destaque' : '') + (s.parcial ? ' parcial' : '');
      const col = el('div', 'graf-col' + classes);
      col.title = `${s.titulo || s.rotulo}: ${formatar(s.valor)}`;
      if (typeof s.valor === 'number') {
        const b = el('div', 'graf-barra' + (s.valor < 0 ? ' negativa' : ''));
        const h = Math.abs(pos(s.valor) - zero);
        b.style.height = `${Math.max(s.valor === 0 ? 0 : 0.8, h)}%`;
        b.style.bottom = `${s.valor < 0 ? zero - h : zero}%`;
        const valor = el('span', 'graf-valor', curto(s.valor));
        valor.style.bottom = `calc(${s.valor < 0 ? zero : zero + h}% + 2px)`;
        col.append(b, valor);
      } else {
        const sem = el('span', 'graf-valor sem-dado', 'sem dado'); sem.style.bottom = `calc(${zero}% + 2px)`; col.append(sem);
      }
      barras.append(col);
      const r = el('span', 'graf-rotulo' + classes, s.rotulo);
      if (i === destaque && o.marcaDestaque !== false) r.append(el('small', '', o.marcaDestaque || 'escolhido'));
      rotulos.append(r);
    });
    area.append(barras);
    colunasEl.append(eixoEl, area, el('span', 'graf-canto'), rotulos);

    // ----- Barras deitadas (espaço estreito) e, sempre, o texto para leitores de tela. -----
    const lista = el('ul', 'graf-lista');
    lista.setAttribute('aria-label', o.titulo || o.descricao || 'Valores do gráfico');
    const maxAbs = Math.max(0, ...serie.map((s) => (typeof s.valor === 'number' ? Math.abs(s.valor) : 0))) || 1;
    serie.forEach((s, i) => {
      const li = el('li', (i === destaque ? 'destaque' : '') + (s.parcial ? ' parcial' : ''));
      const nome = el('span', 'graf-lista-nome', s.titulo || s.rotulo);
      if (i === destaque && o.legendaDestaque) nome.append(el('small', '', ` (${o.marcaDestaque || 'escolhido'})`));
      if (s.parcial) nome.append(el('small', '', ' (parcial)'));
      const trilho = el('span', 'graf-lista-trilho'); trilho.setAttribute('aria-hidden', 'true');
      const barra = el('i', typeof s.valor === 'number' && s.valor < 0 ? 'negativa' : '');
      barra.style.width = typeof s.valor === 'number' ? `${Math.max(s.valor === 0 ? 0 : 1, (Math.abs(s.valor) / maxAbs) * 100)}%` : '0%';
      trilho.append(barra);
      li.append(nome, trilho, el('span', 'graf-lista-valor', typeof s.valor === 'number' ? formatar(s.valor) : 'sem dado'));
      lista.append(li);
    });
    fig.append(colunasEl, lista);
    if (o.descricao) fig.setAttribute('aria-label', o.descricao);
    return fig;
  }

  /* HISTOGRAMA: conta quantos valores caem em cada faixa. Devolve [{de, ate, quantidade}].
     As faixas têm o mesmo tamanho, arredondado para um número "redondo" (500, 1.000, 2.000...). */
  function faixas(valores, quantasFaixas = 10) {
    const v = valores.filter((x) => typeof x === 'number' && Number.isFinite(x));
    if (!v.length) return [];
    const min = Math.min(...v), max = Math.max(...v);
    const bruto = (max - min) / quantasFaixas || 1;
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto);
    const inicio = Math.floor(min / passo) * passo;
    const n = Math.floor((max - inicio) / passo) + 1;   // a última faixa sempre contém o maior valor
    const lista = Array.from({ length: n }, (_, i) => ({ de: inicio + i * passo, ate: inicio + (i + 1) * passo, quantidade: 0 }));
    v.forEach((x) => { lista[Math.min(n - 1, Math.floor((x - inicio) / passo))].quantidade += 1; });
    return lista;
  }

  /* MEDIDOR da LRF: barra de 0 até um pouco além do limite máximo, com traços nos três limites.
     Os números vão escritos na legenda (as marcas ficam próximas e não caberiam como rótulo). */
  function medidor(p, pct) {
    const topo = p.limiteMaximoPct * 1.25;
    const pos = (v) => `${Math.min(100, (v / topo) * 100)}%`;
    const caixa = el('div', 'medidor');
    caixa.setAttribute('role', 'img');
    caixa.setAttribute('aria-label', `Gasto com pessoal: ${pct(p.dtpPct)}. Limites: alerta ${pct(p.limiteAlertaPct)}, prudencial ${pct(p.limitePrudencialPct)}, máximo ${pct(p.limiteMaximoPct)}.`);
    const trilho = el('div', 'medidor-trilho');
    const cheio = el('div', 'medidor-cheio'); cheio.style.width = pos(p.dtpPct);
    trilho.append(cheio);
    const legenda = [];
    [['alerta', p.limiteAlertaPct], ['prudencial', p.limitePrudencialPct], ['máximo', p.limiteMaximoPct]].forEach(([nome, v]) => {
      if (typeof v !== 'number') return;
      const marca = el('div', 'medidor-marca' + (nome === 'máximo' ? ' maximo' : '')); marca.style.left = pos(v);
      trilho.append(marca);
      legenda.push(`${nome} ${pct(v)}`);
    });
    caixa.append(trilho, el('p', 'meta medidor-legenda', `Barra: gasto com pessoal (${pct(p.dtpPct)}). Traços: limites de ${legenda.join(', ')} (o vermelho é o máximo).`));
    return caixa;
  }

  /* LINHA DO TEMPO de uma vigência (contratos): do início ao fim, com a marca de hoje. */
  function vigencia(inicioIso, fimIso, hoje = new Date()) {
    const ini = new Date(`${inicioIso}T00:00:00`), fim = new Date(`${fimIso}T00:00:00`);
    if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || fim <= ini) return null;
    const dia = 86400000;
    const fracao = Math.min(1, Math.max(0, (hoje - ini) / (fim - ini)));
    const caixa = el('div', 'medidor');
    const trilho = el('div', 'medidor-trilho');
    const cheio = el('div', 'medidor-cheio'); cheio.style.width = `${fracao * 100}%`;
    trilho.append(cheio);
    trilho.setAttribute('aria-hidden', 'true');
    let texto;
    if (hoje < ini) texto = `A vigência começa daqui a ${Math.ceil((ini - hoje) / dia)} dia(s).`;
    else if (hoje > fim) texto = `A vigência terminou há ${Math.floor((hoje - fim) / dia)} dia(s).`;
    else texto = `Passaram ${Math.round(fracao * 100)}% da vigência. Faltam ${Math.ceil((fim - hoje) / dia)} dia(s) para o fim.`;
    caixa.append(trilho, el('p', 'meta medidor-legenda', texto));
    return caixa;
  }

  return { barras, colunas, faixas, medidor, vigencia, moedaCurta, eixo, extremos, passoRedondo };
})();
