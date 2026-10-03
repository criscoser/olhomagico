/* MENU (Sidebar / MobileMenu)
   - No computador (acima de 1024 px): o menu fica RECOLHIDO, só com os ícones. Ele abre quando o mouse passa
     por cima ou quando recebe o foco do teclado (isso é feito só com CSS). O botão "Manter o menu aberto" fixa.
   - Até 1024 px: barra no topo com o botão "Menu".
   Regras de acessibilidade do guia:
     - o botão informa se o menu está aberto (aria-expanded);
     - a tecla Esc fecha o menu e devolve o foco ao botão;
     - escolher uma seção fecha o menu.
   Também cuida do botão de tema (claro/escuro). As escolhas ficam guardadas só neste navegador. */
OBS.menu = (function () {
  const { $ } = OBS;
  const larga = window.matchMedia('(min-width: 64.0625rem)');

  /* Guarda/lê uma preferência no navegador. Se o navegador bloquear (janela anônima), simplesmente não guarda. */
  const lembrar = (chave, valor) => { try { localStorage.setItem(`olhomagico-${chave}`, valor); } catch (e) { /* sem memória: tudo bem */ } };
  const lembrado = (chave) => { try { return localStorage.getItem(`olhomagico-${chave}`); } catch (e) { return null; } };

  function abrir(sim) {
    $('lateral').classList.toggle('aberto', sim);
    $('btnMenu').setAttribute('aria-expanded', String(sim));
    $('btnMenu').textContent = sim ? 'Fechar' : 'Menu';
  }

  /* Tema: "claro" (padrão), "escuro", ou null = segue o modo do celular/computador (prefers-color-scheme).
     O CSS já resolve a cor sozinho; aqui só marcamos a escolha da pessoa e acertamos o texto do botão. */
  const sistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)');
  let escolhido = null;
  const temaEfetivo = () => escolhido || (sistemaEscuro.matches ? 'escuro' : 'claro');
  function aplicarTema(tema) {
    escolhido = tema === 'claro' || tema === 'escuro' ? tema : null;
    if (escolhido) document.documentElement.dataset.tema = escolhido; else delete document.documentElement.dataset.tema;
    const claro = temaEfetivo() === 'claro';
    $('btnTemaTexto').textContent = claro ? 'Usar tema escuro' : 'Usar tema claro';
    // Cor da barra do navegador no celular: a mesma do fundo da página.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = claro ? '#FAF8F5' : '#16111D'; });
  }

  /* Menu fixo aberto (só no computador). */
  function fixar(sim) {
    document.body.classList.toggle('menu-fixo', sim);
    $('btnFixar').setAttribute('aria-pressed', String(sim));
  }

  function iniciar() {
    aplicarTema(lembrado('tema'));
    fixar(lembrado('menu-fixo') === 'sim');
    $('btnTema').addEventListener('click', () => {
      const novo = temaEfetivo() === 'claro' ? 'escuro' : 'claro';
      aplicarTema(novo); lembrar('tema', novo);
    });
    // Sem escolha guardada, acompanha a troca de modo do sistema (ex.: celular que escurece à noite).
    sistemaEscuro.addEventListener('change', () => { if (!escolhido) aplicarTema(null); });
    $('btnFixar').addEventListener('click', () => {
      const sim = !document.body.classList.contains('menu-fixo');
      fixar(sim); lembrar('menu-fixo', sim ? 'sim' : 'nao');
    });
    $('btnMenu').addEventListener('click', () => {
      const vaiAbrir = $('btnMenu').getAttribute('aria-expanded') !== 'true';
      abrir(vaiAbrir);
      if (vaiAbrir) $('menuPrincipal').querySelector('a').focus();
    });
    $('menuPrincipal').addEventListener('click', (ev) => {
      const link = ev.target.closest('a');
      if (!link) return;
      if (!larga.matches) abrir(false);              // celular: escolheu uma seção, o menu fecha
      else if (ev.detail > 0) link.blur();           // computador, clique do mouse: tira o foco para o menu recolher
    });
    // Esc fecha e devolve o foco ao botão que abriu.
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && $('btnMenu').getAttribute('aria-expanded') === 'true') { abrir(false); $('btnMenu').focus(); }
    });
    // Se a tela crescer (girar o tablet), o menu volta ao normal.
    larga.addEventListener('change', () => abrir(false));
  }

  /* "Atualização" no cabeçalho: a data da cópia mais recente entre as fontes (de dados/situacao.js).
     Se alguma fonte falhou na última tentativa, ou a cópia tem mais de 3 dias, avisa que pode estar desatualizado. */
  async function mostrarAtualizacao() {
    const caixa = $('atualizacao');
    const s = await OBS.dados.situacao();
    const fontes = s ? Object.values(s) : [];
    const datas = fontes.map((f) => f.ultimoSucesso).filter(Boolean).sort();
    if (!datas.length) { caixa.textContent = 'Atualização: cópias diárias ainda não feitas'; return; }
    const ultima = new Date(datas[datas.length - 1]);
    const antiga = (Date.now() - ultima.getTime()) > 3 * 86400000;
    const falhas = fontes.filter((f) => f.ok === false).length;
    caixa.textContent = `Atualização: ${ultima.toLocaleDateString('pt-BR')}` + (falhas ? ` (${falhas} fonte(s) com falha)` : '');
    caixa.classList.toggle('desatualizado', antiga || falhas > 0);
    caixa.title = 'Ver a situação de cada fonte';
  }

  return { iniciar, mostrarAtualizacao };
})();
