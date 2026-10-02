/* PONTO DE PARTIDA: junta as peças e liga a página.
   Fluxo dos gastos: escolher mês -> buscar (ou pegar da memória) -> validar -> agregar -> desenhar. */

OBS.consultar = async function (anoMes) {
  const periodo = OBS.periodoDoMes(anoMes);
  OBS.ui.mostrarEstado(`Buscando os dados de ${periodo.nome}… pode levar alguns segundos.`);
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
      : erro.message, true);
    console.error('Erro ao consultar despesas:', erro); // detalhe técnico, só para quem abre o console (F12)
  }
};

/* Ao abrir a página: aplica o nome do site, prepara o seletor de mês, liga os botões e mostra a tela do endereço. */
(function iniciar() {
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
  OBS.MESES.forEach((nome, i) => {
    const op = document.createElement('option');
    op.value = String(i + 1).padStart(2, '0'); op.textContent = nome; OBS.$('selMes').append(op);
  });
  for (let ano = hoje.getFullYear(); ano >= OBS.config.ANO_INICIAL; ano--) {
    const op = document.createElement('option');
    op.value = String(ano); op.textContent = String(ano); OBS.$('selAno').append(op);
  }
  OBS.$('selMes').value = mesPadrao;
  OBS.$('selAno').value = anoPadrao;
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
    OBS.$('selAno').value = a; OBS.$('selMes').value = m;
    if (OBS.ui.mesNaTela() !== anoMes) await OBS.consultar(anoMes);
  };
  OBS.ui.ligarEventos();
  OBS.buscaTela.ligar();   // caixa de pesquisa do topo
  OBS.menu.iniciar();      // menu lateral / menu do celular
  OBS.menu.mostrarAtualizacao();
  OBS.rotas.iniciar();     // mostra a tela indicada no endereço (#inicio, #gastos, uma ficha...)
})();
