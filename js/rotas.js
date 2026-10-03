/* NAVEGAÇÃO (rotas): decide o que mostrar a partir do fim do endereço (o "#...").
   Assim cada tela e cada ficha tem um link próprio, que pode ser compartilhado, e o botão Voltar funciona.

     #inicio                  painel com os principais números
     #gastos/2026-09          despesas de um mês (o período fica no endereço)
     #gastos, #servidores, #contratos, #contas, #camara, #siglas, #sobre      abas
     #siglas/sigla-fpm        aba de siglas, já na explicação de uma sigla
     #contas/transferencias   aba + seção (rola até a seção "sec-transferencias")
     #busca/termo             resultado da pesquisa geral
     #servidor/ID, #fornecedor/CHAVE, #contrato/ID           fichas de detalhe */
OBS.rotas = (function () {
  const ABAS = ['inicio', 'gastos', 'servidores', 'contratos', 'contas', 'camara', 'siglas', 'sobre'];
  const FICHAS = { servidor: 'servidores', fornecedor: 'contratos', contrato: 'contratos' };  // ficha -> aba "mãe" no menu
  const VISTAS = [...ABAS.map((a) => `aba-${a}`), 'vista-busca', 'vista-ficha'];
  let primeira = true;
  let trocas = 0;   // quantas vezes a pessoa navegou DENTRO do site (para o botão Voltar das fichas)

  /* Lê o endereço: "#fornecedor/123" -> { nome: 'fornecedor', resto: '123' }. */
  function ler(hash) {
    const texto = (hash || '').replace(/^#/, '');
    const i = texto.indexOf('/');
    const nome = (i < 0 ? texto : texto.slice(0, i)) || 'inicio';
    let resto = i < 0 ? '' : texto.slice(i + 1);
    try { resto = decodeURIComponent(resto); } catch (e) { resto = ''; }   // endereço malformado: ignora o resto
    return { nome, resto };
  }

  /* Mostra só uma vista e marca no menu a aba correspondente. */
  function exibir(idVista, abaDoMenu) {
    VISTAS.forEach((v) => OBS.$(v).classList.toggle('oculto', v !== idVista));
    document.body.dataset.rota = abaDoMenu || '';   // usado pelo CSS (ex.: a pesquisa aparece no topo na tela de busca)
    document.querySelectorAll('a.aba, a.aba-inferior').forEach((link) => {
      if (link.getAttribute('href') === `#${abaDoMenu}`) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* Leva a pessoa ao topo da nova tela e põe o foco no título (quem usa leitor de tela ouve onde está). */
  function focarTitulo(idVista) {
    if (primeira) { primeira = false; if (!location.hash) return; }
    const titulo = OBS.$(idVista).querySelector('h2');
    window.scrollTo(0, 0);
    if (titulo) { titulo.setAttribute('tabindex', '-1'); titulo.focus({ preventScroll: true }); }
  }

  async function mostrar() {
    const { nome, resto } = ler(location.hash);
    if (FICHAS[nome] && resto) {
      exibir('vista-ficha', FICHAS[nome]);
      focarTitulo('vista-ficha');
      await OBS.fichas.abrir(nome, resto);
      focarTitulo('vista-ficha');
      return;
    }
    if (nome === 'busca') {
      exibir('vista-busca', 'busca');
      await OBS.buscaTela.abrir(resto);
      // Sem nada digitado (ex.: tocou em "Buscar" na barra inferior): o cursor já vai para a caixa de pesquisa.
      if (!resto) { primeira = false; window.scrollTo(0, 0); OBS.$('campoBusca').focus(); return; }
      focarTitulo('vista-busca');
      return;
    }
    const aba = ABAS.includes(nome) ? nome : 'inicio';
    exibir(`aba-${aba}`, aba);
    // Despesas de um mês: "#gastos/2026-09" escolhe o mês e consulta (o período fica no endereço e pode ser compartilhado).
    if (aba === 'gastos' && /^\d{4}-\d{2}$/.test(resto)) {
      focarTitulo('aba-gastos');
      await OBS.abrirMes(resto);
      return;
    }
    const abrir = { inicio: OBS.inicioTela, servidores: OBS.pessoalTela, contratos: OBS.contratosTela, contas: OBS.contasTela, camara: OBS.camaraTela, siglas: OBS.siglasTela, sobre: OBS.situacaoTela }[aba];
    if (resto) {
      if (abrir) await abrir.abrir();
      const secao = OBS.$(`sec-${resto}`);
      if (secao) { secao.scrollIntoView({ block: 'start' }); primeira = false; return; }
    }
    focarTitulo(`aba-${aba}`);
    if (abrir) await abrir.abrir();
  }

  function iniciar() {
    window.addEventListener('hashchange', () => { trocas += 1; mostrar(); });
    mostrar();
  }

  /* Vai para outra tela e só termina quando ela estiver pronta (útil para, em seguida, preencher um filtro dela). */
  async function irPara(destino) {
    if (location.hash !== destino) {
      await new Promise((pronto) => { window.addEventListener('hashchange', pronto, { once: true }); location.hash = destino; });
    }
    return mostrar();
  }

  /* Endereços das fichas, montados num lugar só. */
  const link = {
    servidor: (s) => `#servidor/${encodeURIComponent(s.id)}`,
    fornecedor: (chave) => `#fornecedor/${encodeURIComponent(chave)}`,
    contrato: (c) => `#contrato/${encodeURIComponent(c.id)}`,
    busca: (termo) => `#busca/${encodeURIComponent(termo)}`
  };

  /* true se a pessoa chegou na tela atual vindo de outra tela do site (então "Voltar" pode usar o histórico). */
  const podeVoltar = () => trocas > 0;

  return { iniciar, mostrar, ler, link, irPara, podeVoltar };
})();
