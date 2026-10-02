/* TABELA REUTILIZÁVEL (DataTable): ordena ao clicar no título da coluna, tem PAGINAÇÃO (Anterior / Próxima)
   e, no celular, vira uma pilha de cartões (cada célula mostra o nome da coluna antes do valor).

   Uso:
     const t = OBS.tabela({
       colunas: [{ chave: 'nome', titulo: 'Nome', tipo: 'texto', link: (linha) => '#servidor/...' }, ...],
       porPagina: 20,
       ordemInicial: { chave: 'valor', descendente: true },
       vazio: 'Nada encontrado.'
     });
     caixa.append(t.elemento);
     t.mostrar(linhas);     // pode ser chamado de novo a cada mudança de filtro

   Tipos de coluna: 'texto', 'moeda', 'numero', 'data' (AAAA-MM-DD) ou 'pct'.
   Cada coluna pode ter "valor: (linha) => ..." (o que ordena) e "formatar: (valor, linha) => texto". */
OBS.tabela = function (opcoes) {
  const { el, moeda } = OBS;
  const colunas = opcoes.colunas;
  const porPagina = opcoes.porPagina || 20;
  let ordem = Object.assign({ chave: null, descendente: false }, opcoes.ordemInicial || {});
  let linhas = [], pagina = 1;

  const valorDe = (c, l) => (c.valor ? c.valor(l) : l[c.chave]);
  const formatos = {
    moeda: (v) => (typeof v === 'number' ? moeda(v) : '—'),
    numero: (v) => (typeof v === 'number' ? v.toLocaleString('pt-BR') : '—'),
    pct: (v) => (typeof v === 'number' ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—'),
    data: (v) => OBS.dataBR(v) || '—',
    texto: (v) => (v === null || v === undefined || v === '' ? '—' : String(v))
  };
  const formatar = (c, l) => (c.formatar ? c.formatar(valorDe(c, l), l) : formatos[c.tipo || 'texto'](valorDe(c, l)));

  /* Compara duas linhas pela coluna escolhida. Valores vazios sempre vão para o fim. */
  function comparar(a, b) {
    const c = colunas.find((x) => x.chave === ordem.chave);
    if (!c) return 0;
    const va = valorDe(c, a), vb = valorDe(c, b);
    const vazioA = va === null || va === undefined || va === '', vazioB = vb === null || vb === undefined || vb === '';
    if (vazioA || vazioB) return vazioA === vazioB ? 0 : vazioA ? 1 : -1;
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR');
    return ordem.descendente ? -r : r;
  }

  // ---- Estrutura: tabela com rolagem lateral (se precisar) + resumo + botão "Mostrar mais" ----
  const caixa = el('div', 'tabela-caixa');
  const rolagem = el('div', 'tabela-rolagem');
  const tabela = el('table', 'tabela');
  if (opcoes.legenda) tabela.append(el('caption', 'visualmente-oculto', opcoes.legenda));
  const cabeca = el('thead'), corpo = el('tbody'), trCab = el('tr');
  colunas.forEach((c) => {
    const th = el('th'); th.scope = 'col';
    if (['moeda', 'numero', 'pct'].includes(c.tipo)) th.className = 'num';
    if (c.ordenavel === false) { th.textContent = c.titulo; } else {
      // O título é um botão: clicar ordena; clicar de novo inverte a ordem.
      const b = el('button', 'ordenar', c.titulo); b.type = 'button';
      b.addEventListener('click', () => {
        ordem = ordem.chave === c.chave ? { chave: c.chave, descendente: !ordem.descendente }
          : { chave: c.chave, descendente: ['moeda', 'numero', 'pct', 'data'].includes(c.tipo) };
        pagina = 1; desenhar();
      });
      th.append(b);
    }
    trCab.append(th);
  });
  cabeca.append(trCab); tabela.append(cabeca, corpo); rolagem.append(tabela);
  const resumo = el('p', 'meta tabela-resumo'); resumo.setAttribute('aria-live', 'polite');
  // PAGINAÇÃO: botões Anterior e Próxima, com "Página X de Y" no meio.
  const rodape = el('nav', 'paginacao'); rodape.setAttribute('aria-label', `Páginas da tabela${opcoes.legenda ? ': ' + opcoes.legenda : ''}`);
  const anterior = el('button', 'sec', 'Anterior'); anterior.type = 'button';
  const proxima = el('button', 'sec', 'Próxima'); proxima.type = 'button';
  const qual = el('span', 'meta');
  anterior.addEventListener('click', () => { pagina -= 1; desenhar(); rolagem.scrollIntoView({ block: 'nearest' }); });
  proxima.addEventListener('click', () => { pagina += 1; desenhar(); rolagem.scrollIntoView({ block: 'nearest' }); });
  rodape.append(anterior, qual, proxima);
  caixa.append(resumo, rolagem, rodape);

  function desenhar() {
    // Indica a ordem atual para leitores de tela (aria-sort) e visualmente (setinha via CSS).
    [...trCab.children].forEach((th, i) => {
      const ativa = colunas[i].chave === ordem.chave;
      if (ativa) th.setAttribute('aria-sort', ordem.descendente ? 'descending' : 'ascending');
      else th.removeAttribute('aria-sort');
    });
    const ordenadas = ordem.chave ? linhas.slice().sort(comparar) : linhas;
    const p = OBS.paginar(linhas.length, pagina, porPagina);
    pagina = p.pagina;
    corpo.replaceChildren(...ordenadas.slice(p.inicio, p.fim).map((l) => {
      const tr = el('tr');
      colunas.forEach((c, i) => {
        const td = el(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        td.dataset.rotulo = c.titulo;   // usado no celular: "Cargo: Professor"
        if (['moeda', 'numero', 'pct'].includes(c.tipo)) td.classList.add('num');
        const texto = formatar(c, l);
        const destino = c.link ? c.link(l) : null;
        const seguro = destino ? OBS.urlSegura(destino) : null;   // só aceita http(s) ou "#..." (nada de "javascript:")
        if (seguro) { const a = el('a', '', texto); a.href = seguro; if (/^https?:/.test(seguro)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } td.append(a); } else td.textContent = texto;
        tr.append(td);
      });
      return tr;
    }));
    const qtd = (n) => n.toLocaleString('pt-BR');
    resumo.textContent = linhas.length
      ? `Mostrando ${qtd(p.inicio + 1)} a ${qtd(p.fim)} de ${qtd(linhas.length)}.${opcoes.dica ? ' ' + opcoes.dica : ''}`
      : (opcoes.vazio || 'Nada encontrado.');
    qual.textContent = `Página ${qtd(p.pagina)} de ${qtd(p.paginas)}`;
    anterior.disabled = p.pagina <= 1;
    proxima.disabled = p.pagina >= p.paginas;
    rolagem.classList.toggle('oculto', !linhas.length);
    rodape.classList.toggle('oculto', p.paginas <= 1);
  }

  return {
    elemento: caixa,
    /* Troca as linhas mostradas (por exemplo, depois de um filtro) e volta para o começo. */
    mostrar(novas) { linhas = novas || []; pagina = 1; desenhar(); },
    /* As linhas na ordem atual (usado para baixar a planilha do que está na tela). */
    linhasOrdenadas() { return ordem.chave ? linhas.slice().sort(comparar) : linhas.slice(); }
  };
};
