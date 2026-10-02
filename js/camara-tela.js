/* TELA DA ABA "CÂMARA DE VEREADORES": vereadores em exercício e pautas das sessões.
   Dados: dados/camara.js (cópia diária da API de dados abertos da Câmara, feita por ferramentas/fontes/camara.py).
   Os textos aparecem exatamente como a Câmara publica (nada é reescrito). */
OBS.camaraTela = (function () {
  const { $, el, qtd } = OBS;
  let iniciado = null;

  function desenharVereadores(lista) {
    const partidos = new Set(lista.map((v) => v.partido).filter(Boolean));
    $('vereadoresResumo').textContent = `${qtd(lista.length)} vereadores` + (partidos.size ? ` de ${qtd(partidos.size)} partidos.` : '.') +
      ' Tocar no nome abre a página do vereador no site da Câmara.';
    $('listaVereadores').replaceChildren(...lista.map((v) => {
      const li = el('li', 'cartao-pessoa');
      const nome = v.link ? OBS.ui.link(v.nome, v.link) : el('span', '', v.nome);
      nome.classList.add('cartao-nome');
      li.append(nome);
      if (v.partido) li.append(el('span', 'cartao-selo', v.partido));
      if (v.funcao) li.append(el('span', 'cartao-detalhe', v.funcao));
      return li;
    }));
  }

  function desenharPautas(pautas) {
    const preparadas = pautas.map((p) => Object.assign({}, p, { _busca: OBS.pessoal.normalizar(`${p.titulo} ${p.data}`) }));
    const t = OBS.tabela({ colunas: [
      { chave: 'data', titulo: 'Data', valor: (p) => dataOrdenavel(p.data), formatar: (v, p) => p.data || '—' },
      { chave: 'titulo', titulo: 'Pauta', link: (p) => p.link }
    ], porPagina: 15, ordemInicial: { chave: 'data', descendente: true }, legenda: 'Pautas das sessões',
    vazio: 'Nenhuma pauta encontrada.', dica: 'O título abre a pauta no site da Câmara.' });
    $('listaPautas').replaceChildren(t.elemento);
    const atualizar = () => {
      const palavras = OBS.pessoal.normalizar($('buscaPauta').value).split(/\s+/).filter(Boolean);
      t.mostrar(preparadas.filter((p) => palavras.every((w) => p._busca.includes(w))));
    };
    $('buscaPauta').addEventListener('input', OBS.comEspera(atualizar));
    $('limparPauta').addEventListener('click', () => { $('buscaPauta').value = ''; atualizar(); });
    atualizar();
  }

  /* "06/10/2026" -> "2026-10-06", só para ordenar por data (a tela mostra a data como a Câmara publicou). */
  function dataOrdenavel(texto) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(texto || ''));
    return m ? `${m[3]}-${m[2]}-${m[1]}` : (texto || null);
  }

  async function carregar() {
    const estado = $('camaraEstado');
    estado.replaceChildren(OBS.status('carregando', 'Carregando os dados da Câmara…'));
    const d = await OBS.dados.camara();
    if (!d || !Array.isArray(d.vereadores)) {
      estado.replaceChildren(OBS.status('nao-integrado', 'Os dados da Câmara ainda não foram copiados para este site.',
        'Eles dependem do token da API da Câmara, cadastrado no cofre do GitHub (CAMARA_TOKEN). Enquanto isso, consulte o site da Câmara.',
        ['Abrir os dados abertos da Câmara', 'https://www.camaravideira.sc.gov.br/dadosabertos']));
      return;
    }
    OBS.avisoDesatualizado($('camaraDesatualizado'), 'camara');
    const data = new Date(d.meta.geradoEm);
    $('origemCamara').replaceChildren(OBS.origem({
      fonte: 'API de dados abertos da Câmara Municipal de Videira', url: d.meta.pagina, urlTexto: 'abrir a página de dados abertos da Câmara',
      tipo: 'Vereadores em exercício e pautas das sessões', periodo: `Situação na cópia de ${data.toLocaleDateString('pt-BR')}`,
      metodo: 'Cópia diária feita por robô. Os textos aparecem como a Câmara publica.',
      limitacao: 'Mostra só o que a API da Câmara oferece. Projetos de lei e votações ainda não foram integrados.'
    }));
    $('lnkFolhaCamara').href = OBS.config.CAMARA_FOLHAS;
    desenharVereadores(d.vereadores);
    if (Array.isArray(d.pautas) && d.pautas.length) desenharPautas(d.pautas);
    else $('sec-pautas').classList.add('oculto');
    estado.replaceChildren();
    $('camaraConteudo').classList.remove('oculto');
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir };
})();
