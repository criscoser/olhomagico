/* PONTO DE PARTIDA: junta as peças e liga a página.
   Fluxo dos gastos: escolher mês -> buscar (ou pegar da memória) -> validar -> agregar -> desenhar. */

OBS.consultar = async function (anoMes) {
  const periodo = OBS.periodoDoMes(anoMes);
  OBS.ui.mostrarEstado(`Buscando os gastos de ${periodo.nome} no portal da Prefeitura (cerca de 800 KB de internet)… pode levar alguns segundos.`);
  try {
    // OBS.historico.mes busca na API e guarda na memória da página (se repetir o mês, não consulta de novo).
    const dados = await OBS.historico.mes(anoMes);
    if (dados.recebidas === 0) {
      OBS.ui.mostrarEstado(`A fonte não devolveu despesas para ${periodo.nome}. Talvez esse mês ainda não tenha sido publicado: tente um mês anterior.`);
      return;
    }
    OBS.ui.desenharResultado(periodo, OBS.agregar(dados.linhas), {
      descartadas: dados.descartadas, recebidas: dados.recebidas, consultadoEm: dados.consultadoEm, linhas: dados.linhas, anoMes
    });
  } catch (erro) {
    // Cada tipo de falha ganha uma explicação diferente, em linguagem simples.
    const demorou = erro.name === 'AbortError';
    const semAcesso = erro instanceof TypeError; // o navegador nem conseguiu falar com a fonte
    OBS.ui.mostrarEstado(
      demorou ? 'A fonte demorou demais para responder. Tente de novo em instantes.'
      : semAcesso ? 'Não consegui acessar a fonte. Pode ser internet ou instabilidade do portal. Tente novamente ou use o link do portal oficial.'
      : erro.message, true, { texto: 'Tentar de novo', fazer: () => OBS.consultar(anoMes) });
    console.error('Erro ao consultar despesas:', erro); // detalhe técnico, só para quem abre o console (F12)
  }
};

/* Ao abrir a página: aplica o nome do site, prepara o seletor de mês, liga os botões e mostra a tela do endereço. */
/* DENTRO DE OUTRO SITE (iframe): um site falso poderia mostrar o Olho Mágico "embrulhado" e pôr coisas por cima.
   O GitHub Pages não deixa proibir isso pelo servidor; então, nesse caso, o site NÃO é montado: só aparece um aviso
   com o endereço oficial (recomendação 4 da revisão independente de 04/10/2026). O Pix já tinha a mesma proteção. */
/* Aviso de celular no modo "Site para computador" (a regra fica em js/utilitarios.js, OBS.modoComputadorNoCelular). */
function avisarModoComputador() {
  const ligado = OBS.modoComputadorNoCelular({ larguraTela: Math.min(screen.width, screen.height), larguraPagina: window.innerWidth,
    toque: window.matchMedia('(pointer: coarse)').matches });
  if (!ligado) return;
  const aviso = OBS.el('div', 'aviso-modo-computador'); aviso.setAttribute('role', 'note');
  aviso.append(OBS.el('strong', '', 'Seu navegador está no modo “Site para computador”.'),
    ' Por isso o Olho Mágico aparece pequeno. Para ver do tamanho certo, abra o menu do navegador (⋮) e desmarque “Site para computador” (ou “Versão para PC”).');
  const fechar = OBS.el('button', 'sec', 'Entendi'); fechar.type = 'button';
  fechar.addEventListener('click', () => aviso.remove());
  aviso.append(' ', fechar);
  document.body.prepend(aviso);
}

function dentroDeOutroSite() {
  try { return window.top !== window.self; } catch (e) { return true; }   // o navegador bloqueou a comparação: trata como embrulhado
}

(function iniciar() {
  if (dentroDeOutroSite()) {
    const endereco = `https://${OBS.config.SITE_OFICIAL}/`;
    const aviso = OBS.el('div', 'aviso-moldura'); aviso.setAttribute('role', 'alert');
    const link = OBS.el('a', '', endereco); link.href = endereco; link.target = '_blank'; link.rel = 'noopener noreferrer';
    aviso.append(OBS.el('strong', '', 'Você está vendo o Olho Mágico dentro de outro site.'),
      OBS.el('p', '', 'Por segurança, ele só funciona aberto diretamente no endereço oficial:'), link);
    document.body.classList.add('dentro-de-outro-site');
    document.body.prepend(aviso);
    return;   // nada do site é montado dentro de outro site
  }
  avisarModoComputador();
  OBS.$('nomeSite').textContent = OBS.config.NOME_SITE;
  // Links dos atalhos para as telas oficiais (endereços ficam em config.js).
  OBS.$('lnkPagamentos').href = OBS.config.PORTAL_PAGAMENTOS;
  OBS.$('lnkSalarios').href = OBS.config.PORTAL_SALARIOS;
  OBS.$('lnkSalarios2').href = OBS.config.PORTAL_SALARIOS;
  document.title = `${OBS.config.NOME_SITE}: para onde vai o dinheiro público de Videira?`;

  // SELETOR DE MÊS E ANO: duas listas, que funcionam em qualquer navegador.
  const hoje = new Date();
  const esteMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  const [anoPadrao, mesPadrao] = OBS.mesAnterior(hoje).split('-'); // o mês atual costuma estar incompleto
  // No ano atual, só os meses que já começaram aparecem na lista (mês futuro não tem gasto).
  const escolherMes = OBS.preencherMesAno(OBS.$('selMes'), OBS.$('selAno'), `${anoPadrao}-${mesPadrao}`);
  // ATALHOS: os 6 meses completos mais recentes como abas ("set/26", "ago/26"...), do mais novo ao mais antigo.
  const atalhos = OBS.historico.meses(`${anoPadrao}-${mesPadrao}`, 6).reverse().map((am) => {
    const a = OBS.el('a', 'atalho-mes', OBS.historico.rotulo(am));
    a.href = `#gastos/${am}`; a.dataset.mes = am; a.setAttribute('aria-label', OBS.periodoDoMes(am).nome);
    return a;
  });
  OBS.$('atalhosMeses').replaceChildren(...atalhos);
  const marcarAtalho = (anoMes) => atalhos.forEach((a) => { if (a.dataset.mes === anoMes) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  OBS.$('form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const anoMes = `${OBS.$('selAno').value}-${OBS.$('selMes').value}`;
    if (anoMes > esteMes) { OBS.ui.mostrarEstado('Esse mês ainda não chegou. Escolha este mês ou um mês anterior.', true); return; }
    // O mês vai para o endereço (#gastos/AAAA-MM): assim o link pode ser compartilhado e o "Voltar" funciona.
    if (location.hash === `#gastos/${anoMes}`) OBS.consultar(anoMes); else location.hash = `#gastos/${anoMes}`;
  });
  /* Chamado pelas rotas para "#gastos/AAAA-MM": acerta as listas e consulta (se ainda não for o mês na tela). */
  OBS.abrirMes = async function (anoMes) {
    if (anoMes > esteMes) { OBS.ui.mostrarEstado('Esse mês ainda não chegou. Escolha este mês ou um mês anterior.', true); return; }
    const [a, m] = anoMes.split('-');
    escolherMes(`${a}-${m}`);
    marcarAtalho(anoMes);
    if (OBS.ui.mesNaTela() !== anoMes) await OBS.consultar(anoMes);
  };
  OBS.ui.ligarEventos();
  OBS.buscaTela.ligar();   // caixa de pesquisa do topo
  OBS.menu.iniciar();      // menu lateral / menu do celular
  OBS.impostometro.iniciar();   // botão Impostômetro no cabeçalho (o contador só carrega no toque)
  OBS.menu.mostrarAtualizacao();
  OBS.siglas.iniciar();    // siglas tocáveis em todas as telas (explicação num balão)
  // Botão "Ouvir" RETIRADO a pedido do mantenedor (04/10/2026). O código fica em js/ouvir.js (com testes), sem ser ligado.
  // Botões de compartilhar (WhatsApp, copiar link, outros apps) RETIRADOS de todas as telas a pedido do mantenedor
  // (04/10/2026). O código continua em js/compartilhar.js (com testes), sem ser ligado.
  OBS.rotas.iniciar();     // mostra a tela indicada no endereço (#inicio, #gastos, uma ficha...)
})();
