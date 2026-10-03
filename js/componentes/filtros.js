/* CHIPS DE FILTRO: mostram, em forma de etiquetas, os filtros que estão ligados ("Setor: Saúde ✕").
   Tocar numa etiqueta desliga só aquele filtro. Ajuda a pessoa a entender por que a lista ficou menor.

   OBS.chips(caixa, [{ rotulo: 'Setor', valor: 'SAÚDE', limpar: () => {...} }, ...]) */
OBS.chips = function (caixa, filtros) {
  const { el } = OBS;
  const ativos = filtros.filter((f) => f.valor);
  caixa.replaceChildren(...ativos.map((f) => {
    const b = el('button', 'chip-filtro');
    b.type = 'button';
    b.append(el('span', '', `${f.rotulo}: ${f.valor}`), el('span', 'chip-x', '✕'));
    b.setAttribute('aria-label', `Remover o filtro ${f.rotulo}: ${f.valor}`);
    b.addEventListener('click', f.limpar);
    return b;
  }));
  caixa.classList.toggle('oculto', ativos.length === 0);
};

/* Preenche uma lista de seleção com pares [valor, rótulo] (mantém a primeira opção, "Todos"). */
OBS.opcoes = function (idOuSelect, pares) {
  const sel = typeof idOuSelect === 'string' ? OBS.$(idOuSelect) : idOuSelect;
  pares.forEach(([valor, rotulo]) => { const o = OBS.el('option', '', rotulo); o.value = valor; sel.append(o); });
};

/* Espera a pessoa parar de digitar (150 ms) antes de filtrar: a tela não "engasga" a cada letra. */
OBS.comEspera = function (fn, ms = 150) {
  let t = null;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

/* SELO "Dado parcial": vai junto do número de um período que ainda não terminou (o número ainda pode mudar). */
OBS.seloParcial = (texto) => OBS.el('span', 'selo-parcial', texto || 'Dado parcial');

/* NÚMEROS-RESUMO (os "cartões" de indicador): [{ rotulo, valor, detalhe, parcial }] -> lista de destaque.
   parcial: true (ou um texto) acrescenta o selo "Dado parcial". */
OBS.numeros = function (caixa, itens) {
  const { el } = OBS;
  caixa.replaceChildren(...itens.filter((i) => i.valor !== null && i.valor !== undefined).map((i) => {
    const d = el('div', 'numero');
    d.append(el('span', 'numero-rotulo', i.rotulo), el('strong', 'numero-valor', i.valor));
    if (i.parcial) d.append(OBS.seloParcial(typeof i.parcial === 'string' ? i.parcial : ''));
    if (i.detalhe) d.append(el('span', 'numero-detalhe', i.detalhe));
    return d;
  }));
};
