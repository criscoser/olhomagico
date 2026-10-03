/* TELA DA ABA "CONTRATOS E LICITAÇÕES" (dados do PNCP, cópia diária feita por ferramentas/fontes/pncp.py).
   Tabelas ordenáveis; cada contrato abre a sua ficha, cada fornecedor a ficha do fornecedor,
   e cada licitação leva ao registro oficial no PNCP. */
OBS.contratosTela = (function () {
  const { $, el, moeda, qtd } = OBS;
  const R = OBS.contratos;
  let d = null, tContratos = null, tCompras = null, iniciado = null;

  /* ---------- Colunas das tabelas (as mesmas servem para a planilha CSV) ---------- */
  const COL_CONTRATOS = [
    { chave: 'objeto', titulo: 'Objeto', link: (c) => OBS.rotas.link.contrato(c), formatar: (v) => OBS.resumirTexto(v, 110) || '(sem descrição)' },
    { chave: 'fornecedor', titulo: 'Fornecedor', link: (c) => OBS.rotas.link.fornecedor(c._chaveFornecedor) },
    { chave: 'orgao', titulo: 'Órgão' },
    { chave: 'dataAssinatura', titulo: 'Assinatura', tipo: 'data' },
    { chave: 'valorGlobal', titulo: 'Valor global', tipo: 'moeda' }
  ];
  const COL_COMPRAS = [
    { chave: 'objeto', titulo: 'Objeto', link: (c) => c.url, formatar: (v) => OBS.resumirTexto(v, 110) || '(sem descrição)' },
    { chave: 'modalidade', titulo: 'Modalidade' },
    { chave: 'orgao', titulo: 'Órgão' },
    { chave: 'situacao', titulo: 'Situação' },
    { chave: 'dataPublicacao', titulo: 'Publicação', tipo: 'data' },
    { chave: 'valorEstimado', titulo: 'Estimado', tipo: 'moeda' },
    { chave: 'valorHomologado', titulo: 'Homologado', tipo: 'moeda' }
  ];

  const dataAAAAMMDD = (t) => OBS.dataBR(`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`);

  /* ---------- Contratos ---------- */
  function atualizarContratos() {
    const filtros = { termo: $('buscaContrato').value, orgao: $('filtroOrgaoContrato').value };
    tContratos.mostrar(R.buscar(d.contratos, filtros, 'valorGlobal', 'dataAssinatura'));
    OBS.chips($('chipsContratos'), [
      { rotulo: 'Texto', valor: filtros.termo.trim(), limpar: () => { $('buscaContrato').value = ''; atualizarContratos(); } },
      { rotulo: 'Órgão', valor: filtros.orgao, limpar: () => { $('filtroOrgaoContrato').value = ''; atualizarContratos(); } }
    ]);
  }

  /* ---------- Licitações e compras ---------- */
  function atualizarCompras() {
    const filtros = { termo: $('buscaCompra').value, modalidade: $('filtroModalidade').value, orgao: $('filtroOrgaoCompra').value };
    tCompras.mostrar(R.buscar(d.compras, filtros, 'valorEstimado', 'dataPublicacao'));
    OBS.chips($('chipsCompras'), [
      { rotulo: 'Texto', valor: filtros.termo.trim(), limpar: () => { $('buscaCompra').value = ''; atualizarCompras(); } },
      { rotulo: 'Modalidade', valor: filtros.modalidade, limpar: () => { $('filtroModalidade').value = ''; atualizarCompras(); } },
      { rotulo: 'Órgão', valor: filtros.orgao, limpar: () => { $('filtroOrgaoCompra').value = ''; atualizarCompras(); } }
    ]);
  }

  /* ---------- Maiores fornecedores (tabela com link para a ficha) ---------- */
  function desenharFornecedores() {
    const t = OBS.tabela({ colunas: [
      { chave: 'nome', titulo: 'Fornecedor', link: (f) => OBS.rotas.link.fornecedor(f.chave) },
      { chave: 'contratos', titulo: 'Contratos', tipo: 'numero' },
      { chave: 'soma', titulo: 'Valor global somado', tipo: 'moeda' }
    ], porPagina: 10, ordemInicial: { chave: 'soma', descendente: true }, legenda: 'Maiores fornecedores' });
    $('listaFornecedores').replaceChildren(t.elemento);
    t.mostrar(d.fornecedores);
  }

  /* ---------- Modalidades (barras com a quantidade; o valor estimado vai no detalhe) ---------- */
  function desenharModalidades() {
    const grupos = new Map();
    d.compras.forEach((c) => {
      const k = c.modalidade || '(não informada)';
      const g = grupos.get(k) || { n: 0, estimado: 0 };
      g.n += 1; g.estimado += typeof c.valorEstimado === 'number' ? c.valorEstimado : 0;
      grupos.set(k, g);
    });
    const itens = [...grupos.entries()].sort((a, b) => b[1].n - a[1].n)
      .map(([nome, g]) => ({ rotulo: nome, valor: g.n, detalhe: `Valor estimado somado: ${moeda(g.estimado)}` }));
    $('graficoModalidades').replaceChildren(OBS.graficos.barras(itens, { formatar: (n) => `${qtd(n)} ${n === 1 ? 'processo' : 'processos'}` }));
  }

  /* ---------- Planilhas (só o que está filtrado na tela) ---------- */
  function baixar(tabela, colunas, titulo, arquivo) {
    const periodo = `${dataAAAAMMDD(d.meta.periodo.inicio)} a ${dataAAAAMMDD(d.meta.periodo.fim)}`;
    const cols = colunas.map((c) => ({ titulo: c.titulo, tipo: c.tipo, valor: (l) => (c.tipo === 'data' ? OBS.dataBR(l[c.chave]) : l[c.chave]) }))
      .concat([{ titulo: 'Registro oficial (PNCP)', valor: (l) => l.url }]);
    OBS.exportar.baixar(OBS.exportar.csvTabela({ titulo, fonte: 'PNCP: Portal Nacional de Contratações Públicas', periodo,
      observacao: 'Valor global é o valor previsto, não o pago. CPF de pessoa física mascarado.' }, cols, tabela.linhasOrdenadas()), arquivo);
  }

  function ligar() {
    $('buscaContrato').addEventListener('input', OBS.comEspera(atualizarContratos));
    $('filtroOrgaoContrato').addEventListener('change', atualizarContratos);
    $('limparContratos').addEventListener('click', () => { $('buscaContrato').value = ''; $('filtroOrgaoContrato').value = ''; atualizarContratos(); });
    $('buscaCompra').addEventListener('input', OBS.comEspera(atualizarCompras));
    ['filtroModalidade', 'filtroOrgaoCompra'].forEach((id) => $(id).addEventListener('change', atualizarCompras));
    $('limparCompras').addEventListener('click', () => { ['buscaCompra', 'filtroModalidade', 'filtroOrgaoCompra'].forEach((id) => { $(id).value = ''; }); atualizarCompras(); });
    $('csvContratos').addEventListener('click', () => baixar(tContratos, COL_CONTRATOS, 'Contratos publicados no PNCP por órgãos com sede em Videira (a coluna Órgão identifica cada um)', 'olho-magico-contratos.csv'));
    $('csvCompras').addEventListener('click', () => baixar(tCompras, COL_COMPRAS, 'Licitações e compras publicadas no PNCP por órgãos com sede em Videira (a coluna Órgão identifica cada um)', 'olho-magico-licitacoes.csv'));
  }

  async function carregar() {
    const estado = $('contratosEstado');
    estado.textContent = 'Carregando…';
    d = await OBS.dados.pncp();
    if (!d) {
      estado.textContent = 'Os dados do PNCP ainda não estão disponíveis. Eles são atualizados uma vez por dia. ' +
        '(Para quem cuida do site: rode ferramentas/atualizar.py.)';
      estado.className = 'erro';
      return;
    }
    OBS.avisoDesatualizado($('contratosDesatualizado'), 'pncp');
    const ini = dataAAAAMMDD(d.meta.periodo.inicio), fim = dataAAAAMMDD(d.meta.periodo.fim);
    const proprios = d.contratos.filter((c) => !R.ehConsorcio(c)), comprasProprias = d.compras.filter((c) => !R.ehConsorcio(c));
    const deConsorcio = d.contratos.length - proprios.length;
    const soma = (lista) => lista.reduce((t, c) => t + (c.valorGlobal || 0), 0);
    $('contratosFrase').replaceChildren(`De ${ini} a ${fim}, os órgãos do Município de Videira publicaram no PNCP `,
      el('span', 'valor', `${qtd(comprasProprias.length)} licitações e compras`), ' e ', el('span', 'valor', `${qtd(proprios.length)} contratos`), '.');
    $('contratosNota').textContent = 'Este período é fixo (últimos 12 meses) e não muda com o mês escolhido em “Gastos do mês”.' +
      (deConsorcio ? ` As listas abaixo também mostram ${qtd(deConsorcio)} contratos (${OBS.graficos.moedaCurta(soma(d.contratos) - soma(proprios))}) ` +
        'de consórcio intermunicipal com sede em Videira. O consórcio é outra entidade e atende vários municípios, por isso ' +
        'esses contratos não entram nos totais nem no ranking de fornecedores.' : '');
    OBS.numeros($('contratosNumeros'), [
      { rotulo: 'Contratos', valor: qtd(proprios.length) },
      { rotulo: 'Valor global somado', valor: OBS.graficos.moedaCurta(soma(proprios)), detalhe: 'Valor previsto, não o pago.' },
      { rotulo: 'Fornecedores diferentes', valor: qtd(d.fornecedores.length) },
      { rotulo: 'Licitações e compras', valor: qtd(comprasProprias.length) }
    ]);
    $('origemContratos').replaceChildren(OBS.origem({
      fonte: 'PNCP: Portal Nacional de Contratações Públicas (Governo Federal)',
      url: `${d.meta.fonte}/api/consulta/v1/contratos?dataInicial=${d.meta.periodo.inicio}&dataFinal=${d.meta.periodo.fim}&cnpjOrgao=${d.meta.orgaosConsultados[0]}&pagina=1`,
      urlTexto: 'abrir a consulta oficial de contratos (primeira página, formato técnico)',
      tipo: 'Licitações, compras diretas e contratos publicados pelos órgãos do município (e por consórcio com sede em Videira, mostrado à parte)',
      periodo: `${ini} a ${fim} (últimos 12 meses)`,
      metodo: `Cópia diária feita por robô, consultando o código IBGE do município e o CNPJ de cada órgão (${d.meta.orgaosConsultados.length} órgão(s)). Cada item tem link para o registro oficial.`,
      limitacao: 'Só aparece o que os órgãos publicaram no PNCP. “Valor global” é o valor previsto no contrato, não o que já foi pago. Os links levam ao registro oficial de cada item no PNCP.'
    }));
    OBS.opcoes('filtroOrgaoContrato', R.contar(d.contratos, 'orgao').map(([o, n]) => [o, `${o} (${qtd(n)})`]));
    OBS.opcoes('filtroOrgaoCompra', R.contar(d.compras, 'orgao').map(([o, n]) => [o, `${o} (${qtd(n)})`]));
    OBS.opcoes('filtroModalidade', R.contar(d.compras, 'modalidade').map(([m, n]) => [m, `${m} (${qtd(n)})`]));
    tContratos = OBS.tabela({ colunas: COL_CONTRATOS, porPagina: 20, ordemInicial: { chave: 'dataAssinatura', descendente: true },
      legenda: 'Contratos', vazio: 'Nenhum contrato encontrado com esses filtros.', dica: 'Toque no objeto para abrir a ficha do contrato.' });
    tCompras = OBS.tabela({ colunas: COL_COMPRAS, porPagina: 20, ordemInicial: { chave: 'dataPublicacao', descendente: true },
      legenda: 'Licitações e compras', vazio: 'Nenhuma licitação ou compra encontrada com esses filtros.', dica: 'O objeto abre o registro oficial no PNCP.' });
    $('listaContratos').replaceChildren(tContratos.elemento);
    $('listaCompras').replaceChildren(tCompras.elemento);
    desenharFornecedores();
    desenharModalidades();
    ligar();
    atualizarContratos();
    atualizarCompras();
    estado.textContent = ''; estado.className = '';
    $('contratosConteudo').classList.remove('oculto');
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir };
})();
