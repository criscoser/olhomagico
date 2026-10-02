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

  /* COLUNAS (gráfico de barras em pé), bom para meses: [{rotulo, valor, titulo?}].
     Aceita valores negativos: a linha do zero sobe e a coluna desce a partir dela.
     opcoes: destaque (índice da coluna em destaque), formatar, descricao (texto para leitor de tela). */
  function colunas(serie, { destaque = -1, formatar = moedaCurta, descricao = '' } = {}) {
    const caixa = el('figure', 'colunas');
    const valores = serie.map((s) => (typeof s.valor === 'number' ? s.valor : 0));
    const max = Math.max(0, ...valores), min = Math.min(0, ...valores);
    const faixa = max - min || 1;
    const zero = (-min / faixa) * 100;                  // altura da linha do zero, em %
    const area = el('div', 'colunas-area');
    area.setAttribute('role', 'img');
    area.setAttribute('aria-label', descricao || 'Gráfico de colunas. Os números estão na tabela logo abaixo.');
    serie.forEach((s, i) => {
      const col = el('div', 'coluna' + (i === destaque ? ' destaque' : ''));
      col.title = `${s.titulo || s.rotulo}: ${moeda(valores[i])}`;   // aparece ao passar o mouse
      const barra = el('div', 'coluna-barra' + (valores[i] < 0 ? ' negativa' : ''));
      const altura = (Math.abs(valores[i]) / faixa) * 100;
      barra.style.height = `${Math.max(valores[i] === 0 ? 0 : 0.8, altura)}%`;
      barra.style.bottom = valores[i] < 0 ? `${zero - altura}%` : `${zero}%`;
      const trilho = el('div', 'coluna-trilho'); trilho.append(barra);
      col.append(trilho, el('span', 'coluna-rotulo', s.rotulo));
      area.append(col);
    });
    const linhaZero = el('div', 'colunas-zero'); linhaZero.style.bottom = `calc(var(--alt-rotulo) + ${zero / 100} * var(--alt-colunas))`;
    area.append(linhaZero);
    // Escala: o maior valor aparece escrito no topo, para dar noção de grandeza.
    caixa.append(el('div', 'colunas-escala meta', `Maior valor: ${formatar(max)}`), area);
    return caixa;
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
      const marca = el('div', 'medidor-marca'); marca.style.left = pos(v);
      trilho.append(marca);
      legenda.push(`${nome} ${pct(v)}`);
    });
    caixa.append(trilho, el('p', 'meta medidor-legenda', `Barra: gasto com pessoal (${pct(p.dtpPct)}). Traços: limites de ${legenda.join(', ')}.`));
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

  return { barras, colunas, faixas, medidor, vigencia, moedaCurta };
})();
