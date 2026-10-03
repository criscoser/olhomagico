/* TELA DA ABA "SERVIDORES": a lista oficial de servidores (cópia diária), com resumo, gráficos,
   filtros e uma tabela em que cada nome abre a FICHA do registro.
   Os dados só são carregados na primeira vez que a aba é aberta (OBS.dados.pessoal). */
OBS.pessoalTela = (function () {
  const { $, el, moeda, qtd } = OBS;
  let lista = [];
  let tabela = null;
  let iniciado = null;   // guarda a promessa: se a aba for aberta duas vezes seguidas, carrega uma vez só

  // Cada item da lista oficial é um VÍNCULO (matrícula): quem tem dois cargos aparece duas vezes.
  const registros = (n) => `${qtd(n)} ${n === 1 ? 'registro' : 'registros'}`;
  const vinculoCurto = (v) => { const r = OBS.pessoal.explicarVinculo(v); return r ? r.curto : (v || 'Vínculo não informado'); };

  function estado(texto, erro = false) {
    const e = $('pessoalEstado'); e.textContent = texto; e.className = erro ? 'erro' : '';
  }

  /* Colunas da tabela de servidores (também usada no destaque dos cargos políticos). */
  function colunas() {
    return [
      { chave: 'nome', titulo: 'Nome', link: (s) => OBS.rotas.link.servidor(s) },
      { chave: 'cargo', titulo: 'Cargo' },
      { chave: 'lotacao', titulo: 'Setor' },
      { chave: 'vinculo', titulo: 'Vínculo', formatar: (v) => vinculoCurto(v) },
      { chave: 'salario', titulo: 'Salário-base', tipo: 'moeda' }
    ];
  }

  /* ---------- Resumo do topo ---------- */
  function desenharResumo(meta) {
    const data = new Date(meta.geradoEm);
    $('pessoalFrase').replaceChildren(el('span', 'valor', registros(lista.length)), ' na lista de pessoal do Município de Videira.');
    const entidades = [...new Set(lista.map((s) => s.entidade).filter(Boolean))];
    const inativos = lista.filter(OBS.pessoal.ehInativo).length;
    $('pessoalNota').textContent = 'Esta lista mostra a situação no dia da cópia: ela NÃO muda com o mês escolhido em “Gastos”, ' +
      'porque a fonte oficial não tem histórico por mês. Inclui quem está trabalhando ou afastado' +
      (inativos ? ` e também ${registros(inativos)} de aposentados e pensionistas` : '') + '. Cada registro é um vínculo (matrícula): ' +
      'quem tem dois cargos aparece duas vezes. ' + (entidades.length ? `Entidades: ${entidades.join('; ')}.` : '');
    const comissionados = lista.filter(OBS.pessoal.ehComissionado).length;
    OBS.numeros($('pessoalNumeros'), [
      { rotulo: 'Registros na lista', valor: qtd(lista.length) },
      { rotulo: 'Cargos de indicação (comissionados)', valor: qtd(comissionados),
        detalhe: lista.length ? `${Math.round((comissionados / lista.length) * 100)}% dos registros` : null },
      { rotulo: 'Soma dos salários-base, por mês', valor: OBS.graficos.moedaCurta(OBS.pessoal.somaSalarios(lista)),
        detalhe: 'Sem gratificações, adicionais, 13º e encargos: não é o custo da folha.' },
      { rotulo: 'Cópia feita em', valor: data.toLocaleDateString('pt-BR') }
    ]);
    $('origemPessoal').replaceChildren(OBS.origem({
      fonte: 'API de Pessoal, Portal da Transparência de Videira',
      url: OBS.config.PESSOAL.API, urlTexto: 'abrir a API de Pessoal',
      tipo: 'Cadastro de servidores: cargo, setor, vínculo, admissão e salário-base',
      periodo: `Situação na data da cópia: ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      metodo: 'Cópia diária feita por um robô, sem CPF, matrícula, horário, local de trabalho e situação de afastamento.',
      limitacao: 'A fonte não tem link individual por servidor e informa só o salário-base. Para conferir uma pessoa e ver ' +
        'a remuneração completa do mês, use a Relação Funcionário x Salário do portal oficial.'
    }));
  }

  /* ---------- Prefeito, vice e secretários (só se aparecerem na lista) ---------- */
  function desenharPoliticos() {
    const politicos = lista.filter(OBS.pessoal.ehCargoPolitico);
    $('secPoliticos').classList.toggle('oculto', politicos.length === 0);
    if (politicos.length) {
      const t = OBS.tabela({ colunas: colunas(), porPagina: 30, ordemInicial: { chave: 'salario', descendente: true }, legenda: 'Cargos políticos' });
      $('politicos').replaceChildren(t.elemento); t.mostrar(politicos);
    }
    return politicos.length;
  }

  /* ---------- Tipos de vínculo (barras), com atalho para filtrar a lista ---------- */
  function desenharVinculos(grupos) {
    const ul = $('vinculos'); ul.replaceChildren();
    const maximo = grupos.length ? grupos[0].pessoas.length : 0;
    grupos.forEach((g) => {
      const r = OBS.pessoal.explicarVinculo(g.nome);
      const li = el('li');
      const linha = el('div', 'linha');
      linha.append(el('span', 'nome', r ? r.curto : g.nome), el('span', 'v', registros(g.pessoas.length)));
      const pct = Math.round((g.pessoas.length / lista.length) * 100);
      const detalhe = [r ? `Na fonte: “${g.nome}”. ${r.texto}` : null, `${pct}% do total.`].filter(Boolean).join(' ');
      const ver = el('button', 'sec mini', 'Ver na lista'); ver.type = 'button';
      ver.addEventListener('click', () => { $('filtroVinculo').value = g.nome; atualizar(); $('sec-lista').scrollIntoView({ block: 'start' }); });
      const acoes = el('div', 'acoes-linha'); acoes.append(ver);
      li.append(linha, el('div', 'meta', detalhe), OBS.ui.barra(g.pessoas.length, maximo), acoes);
      ul.append(li);
    });
  }

  /* ---------- Faixas de salário-base (histograma) ---------- */
  function desenharFaixas() {
    const faixas = OBS.graficos.faixas(lista.map((s) => s.salario), 10);
    if (!faixas.length) { $('faixasSalario').replaceChildren(el('p', 'meta', 'A cópia não traz salários-base.')); return; }
    const curta = OBS.graficos.moedaCurta;
    const serie = faixas.map((f) => ({ rotulo: curta(f.de).replace(/^R\$\s/, ''), valor: f.quantidade, titulo: `De ${moeda(f.de)} até ${moeda(f.ate)}` }));
    const grafico = OBS.graficos.colunas(serie, { formatar: (n) => `${qtd(n)} registros`, descricao: 'Quantidade de registros por faixa de salário-base. Os números estão na tabela abaixo.' });
    const det = el('details'); det.append(el('summary', '', 'Ver os números exatos'));
    const t = OBS.tabela({ colunas: [
      { chave: 'de', titulo: 'Faixa', formatar: (v, f) => `${moeda(f.de)} a ${moeda(f.ate)}`, ordenavel: false },
      { chave: 'quantidade', titulo: 'Registros', tipo: 'numero', ordenavel: false }], porPagina: 30 });
    det.append(t.elemento); t.mostrar(faixas);
    const semSalario = lista.filter((s) => typeof s.salario !== 'number').length;
    $('faixasSalario').replaceChildren(grafico, el('p', 'meta', 'Cada coluna começa no valor escrito embaixo dela.' +
      (semSalario ? ` ${registros(semSalario)} sem salário-base informado ficaram de fora.` : '')), det);
  }

  /* ---------- Comissionados por setor (lista clicável) ---------- */
  function desenharComissionados() {
    const grupos = OBS.pessoal.comissionadosPorSetor(lista);
    const total = grupos.reduce((t, g) => t + g.pessoas.length, 0);
    const soma = grupos.reduce((t, g) => t + g.soma, 0);
    $('comissionadosResumo').textContent = total
      ? `São ${registros(total)} em cargos de indicação, com salários-base que somam ${moeda(soma)} por mês. ` +
        'Cargo em comissão é de livre nomeação e exoneração, sem concurso. Toque em um setor para ver os nomes.'
      : 'Nenhum cargo comissionado apareceu nesta cópia da lista.';
    const ul = $('comissionados'); ul.replaceChildren();
    const maximo = grupos.length ? grupos[0].soma : 0;
    grupos.forEach((g) => {
      ul.append(OBS.ui.linhaClicavel(g.nome, g.soma, maximo, `${registros(g.pessoas.length)}, salários-base somados`, (painel) => {
        const t = OBS.tabela({ colunas: colunas().filter((c) => c.chave !== 'lotacao' && c.chave !== 'vinculo'), porPagina: 50,
          ordemInicial: { chave: 'salario', descendente: true }, legenda: `Comissionados em ${g.nome}` });
        painel.append(t.elemento); t.mostrar(g.pessoas);
      }));
    });
  }

  /* ---------- Lista completa com filtros ---------- */
  function atualizar() {
    const filtros = { termo: $('buscaServidor').value, vinculo: $('filtroVinculo').value, setor: $('filtroSetor').value, cargo: $('filtroCargo').value };
    tabela.mostrar(OBS.pessoal.buscar(lista, filtros));
    OBS.chips($('chipsServidores'), [
      { rotulo: 'Texto', valor: filtros.termo.trim(), limpar: () => { $('buscaServidor').value = ''; atualizar(); } },
      { rotulo: 'Vínculo', valor: filtros.vinculo && vinculoCurto(filtros.vinculo), limpar: () => { $('filtroVinculo').value = ''; atualizar(); } },
      { rotulo: 'Setor', valor: filtros.setor, limpar: () => { $('filtroSetor').value = ''; atualizar(); } },
      { rotulo: 'Cargo', valor: filtros.cargo, limpar: () => { $('filtroCargo').value = ''; atualizar(); } }
    ]);
  }

  function prepararLista(grupos) {
    tabela = OBS.tabela({ colunas: colunas(), porPagina: OBS.config.PESSOAL.LINHAS_INICIAIS, ordemInicial: { chave: 'nome' },
      legenda: 'Lista de servidores', vazio: 'Ninguém encontrado. Tente só uma parte do nome, ou outro filtro.',
      dica: 'Toque no título de uma coluna para ordenar.' });
    $('listaServidores').replaceChildren(tabela.elemento);
    OBS.opcoes('filtroVinculo', grupos.map((g) => [g.nome, `${vinculoCurto(g.nome)} (${qtd(g.pessoas.length)})`]));
    OBS.opcoes('filtroSetor', OBS.pessoal.agrupar(lista, 'lotacao', '').filter((g) => g.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((g) => [g.nome, `${g.nome} (${qtd(g.pessoas.length)})`]));
    OBS.opcoes('filtroCargo', OBS.pessoal.agrupar(lista, 'cargo', '').filter((g) => g.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((g) => [g.nome, `${g.nome} (${qtd(g.pessoas.length)})`]));
    // A busca filtra enquanto a pessoa digita (com uma pequena espera) e também ao tocar em "Pesquisar".
    $('buscaServidor').addEventListener('input', OBS.comEspera(atualizar, 250));
    $('formServidor').addEventListener('submit', (ev) => { ev.preventDefault(); atualizar(); });
    ['filtroVinculo', 'filtroSetor', 'filtroCargo'].forEach((id) => $(id).addEventListener('change', atualizar));
    $('limparFiltros').addEventListener('click', () => {
      ['buscaServidor', 'filtroVinculo', 'filtroSetor', 'filtroCargo'].forEach((id) => { $(id).value = ''; }); atualizar();
    });
    atualizar();
  }

  /* ---------- Quem não está na lista ---------- */
  function desenharAusentes(qtdPoliticos) {
    const p = $('pessoalAusentes'); p.replaceChildren();
    if (!lista.some((s) => /c[aâ]mara/i.test(s.entidade || ''))) {
      p.append('Vereadores e servidores da Câmara não estão nesta lista: a Câmara publica a própria folha ',
        OBS.ui.link('no site da Câmara', OBS.config.CAMARA_FOLHAS), '. ');
    }
    if (!qtdPoliticos) p.append('Nesta cópia, nenhum cargo de prefeito, vice-prefeito ou secretário municipal apareceu na lista.');
  }

  /* Filtra a lista por um setor (usado por links de outras telas, como a ficha). */
  async function filtrarSetor(setor) {
    await abrir();
    $('filtroSetor').value = setor; atualizar();
  }

  /* Cartão "gasto com pessoal x limite da lei": o número que a PREFEITURA (Poder Executivo) declarou no Relatório de
     Gestão Fiscal. A lista abaixo é do Município inteiro, por isso o cartão diz de quem é o número. Leva à tela Limites. */
  async function desenharLimite() {
    const caixa = $('pessoalLimite');
    const d = await OBS.dados.siconfi();
    const p = d && d.poderes && d.poderes.E && OBS.contas.maisRecente(d.poderes.E.periodos);
    if (!p) { caixa.replaceChildren(); return; }
    const f = OBS.contas.faixa(p);
    const frase = el('p', 'frase-media');
    frase.append(`No ${p.rotulo}, a Prefeitura declarou um gasto com pessoal de `, el('span', 'valor', OBS.contas.pct(p.dtpPct)),
      ` da receita corrente líquida. O limite máximo da lei é ${OBS.contas.pct(p.limiteMaximoPct)}.` + (f ? ` Isso está ${f.texto}.` : ''));
    const link = el('a', '', 'Ver os limites da lei (Prefeitura e Câmara)'); link.href = '#limites/pessoal';
    const p2 = el('p', 'meta'); p2.append('Fonte: Relatório de Gestão Fiscal (SICONFI, Tesouro Nacional). ', link);
    caixa.replaceChildren(frase, p2);
  }

  async function carregar() {
    estado('Carregando a lista de servidores…');
    desenharLimite().catch((e) => console.error('Cartão de limite:', e));
    try {
      const d = await OBS.dados.pessoal();
      if (!d) {
        estado('A lista de servidores ainda não está disponível. Ela é atualizada uma vez por dia; tente mais tarde. ' +
          '(Para quem cuida do site: rode ferramentas/atualizar.py.)', true);
        return;
      }
      lista = d.lista;
      OBS.avisoDesatualizado($('pessoalDesatualizado'), 'pessoal');
      const grupos = OBS.pessoal.agrupar(lista, 'vinculo', '(não informado)');
      desenharResumo(d.meta);
      const qtdPoliticos = desenharPoliticos();
      desenharVinculos(grupos);
      desenharFaixas();
      desenharComissionados();
      prepararLista(grupos);
      desenharAusentes(qtdPoliticos);
      $('pessoalEstado').classList.add('oculto');
      $('pessoalConteudo').classList.remove('oculto');
    } catch (erro) {
      estado('Não foi possível mostrar a lista de servidores. Tente recarregar a página.', true);
      console.error('Erro na aba Pessoal:', erro);
    }
  }

  function abrir() { iniciado = iniciado || carregar(); return iniciado; }

  return { abrir, filtrarSetor };
})();
