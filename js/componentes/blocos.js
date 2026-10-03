/* BLOCOS VISUAIS REUTILIZÁVEIS (camada visual: recebem dados prontos, não fazem contas nem buscas).
     OBS.status(...)      StatusMessage: carregando, erro, indisponível, vazio, desatualizado, não integrado
     OBS.kpi(...)         KpiCard: rótulo, valor, período, fonte e ação
     OBS.abasInternas()   abas dentro de uma ficha (Resumo, Remuneração...), com teclado
     OBS.preencherMesAno  listas de mês e ano (competência) */

/* STATUS: uma caixa de mensagem com o tipo escrito por extenso (não depende só da cor).
   tipo: 'carregando' | 'erro' | 'indisponivel' | 'vazio' | 'desatualizado' | 'nao-integrado'
   link (opcional): [texto, endereço] para onde a pessoa pode consultar. */
OBS.status = function (tipo, titulo, texto, link) {
  const { el } = OBS;
  const rotulos = { carregando: 'Carregando', erro: 'Erro', indisponivel: 'Indisponível', vazio: 'Sem resultados',
    desatualizado: 'Pode estar desatualizado', 'nao-integrado': 'Dados ainda não integrados', parcial: 'Dado parcial' };
  const caixa = el('div', `status status-${tipo}`);
  caixa.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  caixa.append(el('strong', 'status-tipo', rotulos[tipo] || tipo));
  if (titulo) caixa.append(el('span', 'status-titulo', titulo));
  if (texto) caixa.append(el('p', '', texto));
  if (link) { const p = el('p', ''); p.append(OBS.ui.link(link[0], link[1])); caixa.append(p); }
  return caixa;
};

/* KPI: cartão de indicador. Se tiver "href", o cartão inteiro é um link (leva à consulta correspondente).
   o = { rotulo, valor, periodo, fonte, href, detalhe, indisponivel } */
OBS.kpi = function (o) {
  const { el } = OBS;
  const seguro = o.href ? OBS.urlSegura(o.href) : null;
  // indisponivel: true -> o valor é um aviso (ex.: "Não publicado"), mostrado discreto e nunca como número.
  const caixa = el(seguro ? 'a' : 'div', o.indisponivel ? 'kpi indisponivel' : 'kpi');
  if (seguro) caixa.href = seguro;
  caixa.append(el('span', 'kpi-rotulo', o.rotulo), el('strong', 'kpi-valor', o.valor));
  if (o.detalhe) caixa.append(el('span', 'kpi-detalhe', o.detalhe));
  if (o.periodo) caixa.append(el('span', 'kpi-meta', `Período: ${o.periodo}`));
  if (o.fonte) caixa.append(el('span', 'kpi-meta', `Fonte: ${o.fonte}`));
  return caixa;
};

/* CARTÃO-PERGUNTA (página inicial): a pergunta, a frase-resposta (camada 1), o valor exato, um extra opcional
   (gráfico pequeno), o período e a fonte, e o link "Ver os detalhes".
   O LINK é só o texto "Ver os detalhes" (com nome completo para leitores de tela), mas a área de toque é o cartão
   inteiro (via CSS). Sem dado: o cartão continua, com um aviso, para a pergunta não sumir.
   o = { pergunta, frase, exato, extra, periodo, fonte, href, indisponivel } */
OBS.cartaoPergunta = function (o) {
  const { el } = OBS;
  const art = el('article', 'cartao-pergunta' + (o.indisponivel ? ' indisponivel' : ''));
  art.append(el('h2', 'cartao-pergunta-titulo', o.pergunta));
  if (o.frase) art.append(el('p', 'frase-resposta', o.frase));
  if (o.exato) art.append(el('p', 'valor-exato', o.exato));
  if (o.extra) art.append(o.extra);
  const meta = [o.periodo && `Período: ${o.periodo}`, o.fonte && `Fonte: ${o.fonte}`].filter(Boolean).join(' · ');
  if (meta) art.append(el('p', 'cartao-pergunta-meta', meta));
  const seguro = OBS.urlSegura(o.href);
  if (seguro) {
    const a = el('a', 'cartao-pergunta-link', 'Ver os detalhes');
    a.href = seguro;
    a.setAttribute('aria-label', `Ver os detalhes: ${o.pergunta}`);
    art.append(a);
  }
  return art;
};

/* ABAS INTERNAS (padrão "tablist" do WAI-ARIA): setas esquerda/direita trocam de aba, Home/End vão às pontas.
   abas = [{ id, titulo, montar: (painel) => {...} }]. Cada painel é montado só quando aberto pela 1ª vez. */
OBS.abasInternas = function (prefixo, abas, rotulo) {
  const { el } = OBS;
  const caixa = el('div', 'abas-internas');
  const lista = el('div', 'abas-lista'); lista.setAttribute('role', 'tablist'); lista.setAttribute('aria-label', rotulo);
  const botoes = [], paineis = [], montados = new Set();

  function escolher(i, focar) {
    botoes.forEach((b, j) => {
      const ativa = i === j;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
      paineis[j].hidden = !ativa;
    });
    if (!montados.has(i)) { abas[i].montar(paineis[i]); montados.add(i); }
    if (focar) botoes[i].focus();
  }

  abas.forEach((a, i) => {
    const b = el('button', 'aba-interna', a.titulo);
    b.type = 'button'; b.id = `${prefixo}-aba-${a.id}`;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', `${prefixo}-painel-${a.id}`);
    b.addEventListener('click', () => escolher(i, false));
    b.addEventListener('keydown', (ev) => {
      const n = abas.length;
      const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[ev.key];
      if (destino !== undefined) { ev.preventDefault(); escolher(destino, true); }
    });
    const painel = el('div', 'aba-painel');
    painel.id = `${prefixo}-painel-${a.id}`;
    painel.setAttribute('role', 'tabpanel'); painel.setAttribute('aria-labelledby', b.id); painel.tabIndex = 0;
    botoes.push(b); paineis.push(painel); lista.append(b);
  });
  caixa.append(lista, ...paineis);
  escolher(0, false);
  return caixa;
};

/* Quantos meses de um ano podem ser escolhidos: o ano atual só até o mês de hoje (mês futuro não tem gasto);
   anos passados, os 12. (Função sem tela, testada.) */
OBS.mesesDisponiveis = (ano, hoje = new Date()) => (Number(ano) === hoje.getFullYear() ? hoje.getMonth() + 1 : 12);

/* Listas de MÊS e ANO (competência): anos do atual até OBS.config.ANO_INICIAL; no ano atual, só os meses que já
   começaram. Ao trocar o ano, a lista de meses se ajusta. Devolve uma função para escolher um "AAAA-MM". */
OBS.preencherMesAno = function (selMes, selAno, anoMes) {
  const hoje = new Date();
  for (let ano = hoje.getFullYear(); ano >= OBS.config.ANO_INICIAL; ano--) { const o = OBS.el('option', '', String(ano)); o.value = String(ano); selAno.append(o); }
  function meses() {
    const atual = selMes.value;
    const max = OBS.mesesDisponiveis(selAno.value, hoje);
    selMes.replaceChildren(...OBS.MESES.slice(0, max).map((nome, i) => { const o = OBS.el('option', '', nome); o.value = String(i + 1).padStart(2, '0'); return o; }));
    selMes.value = atual && Number(atual) <= max ? atual : String(max).padStart(2, '0');
  }
  selAno.addEventListener('change', meses);
  const escolher = (valor) => { const [a, m] = valor.split('-'); selAno.value = a; meses(); selMes.value = m; };
  escolher(anoMes);
  return escolher;
};

/* Aviso de "pode estar desatualizado" para uma fonte da cópia diária (lê dados/situacao.js).
   Aparece se a última tentativa falhou ou se a última cópia válida tem mais de 3 dias. */
OBS.avisoDesatualizado = async function (caixa, chaveFonte) {
  const s = await OBS.dados.situacao();
  const f = s && s[chaveFonte];
  caixa.replaceChildren();
  if (!f || !f.ultimoSucesso) return;
  const quando = new Date(f.ultimoSucesso);
  const dias = Math.floor((Date.now() - quando.getTime()) / 86400000);
  if (f.ok === false || dias > 3) {
    caixa.append(OBS.status('desatualizado', `Última cópia válida: ${quando.toLocaleDateString('pt-BR')}.`,
      f.ok === false ? 'A última tentativa de atualizar esta fonte falhou; o site mostra a cópia anterior.' : `A cópia tem ${dias} dias.`));
  }
};
