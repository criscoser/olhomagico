/* TELA "METAS DO PROJETO" (#metas): as fases do Olho Mágico (municipal, regional, estadual, nacional, mundial),
   o que cada uma precisa e o valor aproximado. Meta alcançada ganha ✓ verde. A lista fica em js/metas-lista.js.
   A fase atual é a primeira que ainda tem meta pendente. */
OBS.metasTela = (function () {
  const { $, el } = OBS;
  let iniciado = null;

  /* Situação de cada fase: concluída, atual (a primeira com pendência) ou próxima. Função sem tela, testada. */
  function situacoes(metas) {
    let achouAtual = false;
    return metas.map((f) => {
      const feitas = f.itens.filter((i) => i.alcancado).length;
      let situacao = 'proxima';
      if (feitas === f.itens.length) situacao = 'concluida';
      else if (!achouAtual) { situacao = 'atual'; achouAtual = true; }
      return { fase: f.fase, feitas, total: f.itens.length, situacao };
    });
  }

  const ROTULO = { concluida: 'Concluída', atual: 'Fase atual', proxima: 'Próxima' };

  function desenhar() {
    const metas = OBS.METAS || [];
    const sit = situacoes(metas);
    const lista = $('metasLista');
    lista.replaceChildren(...metas.map((f, k) => {
      const s = sit[k];
      const sec = el('section', `meta-fase meta-${s.situacao}`);
      const topo = el('div', 'meta-fase-topo');
      topo.append(el('h2', '', `Fase ${f.fase}: ${f.nome}`), el('span', `meta-selo meta-selo-${s.situacao}`, ROTULO[s.situacao]));
      const barra = el('div', 'meta-barra'); barra.setAttribute('aria-hidden', 'true');
      const cheio = el('i'); cheio.style.width = `${s.total ? (s.feitas / s.total) * 100 : 0}%`; barra.append(cheio);
      const itens = el('ul', 'meta-itens');
      f.itens.forEach((i) => {
        const li = el('li', i.alcancado ? 'meta-ok' : 'meta-pendente');
        const marca = el('span', 'meta-marca', i.alcancado ? '✓' : ''); marca.setAttribute('aria-hidden', 'true');
        const texto = el('div', 'meta-texto');
        texto.append(el('span', 'meta-nome', i.nome), el('span', 'meta-valor', i.valor),
          el('span', 'visualmente-oculto', i.alcancado ? ' (alcançada)' : ' (pendente)'));
        li.append(marca, texto);
        itens.append(li);
      });
      sec.append(topo, el('p', 'meta-resumo', f.resumo), barra, el('p', 'meta', `${s.feitas} de ${s.total} metas alcançadas`), itens);
      return sec;
    }));
  }

  function abrir() { iniciado = iniciado || Promise.resolve(desenhar()); return iniciado; }

  return { abrir, situacoes };
})();
