/* MENU
   - No computador (acima de 1024 px): cabeçalho no topo, com as seções numa linha; some ao tirar o mouse depois de rolar.
   - Até 1024 px: barra inferior com 5 atalhos; o botão "Mais" abre o corpo do menu como uma folha que sobe de baixo.
   Regras de acessibilidade:
     - o botão "Mais" informa se a folha está aberta (aria-expanded);
     - a tecla Esc fecha a folha e devolve o foco ao botão; tocar fora dela também fecha;
     - escolher uma seção (ou trocar de tela) fecha a folha.
   Também cuida do botão de tema (claro/escuro). As escolhas ficam guardadas só neste navegador. */
OBS.menu = (function () {
  const { $ } = OBS;
  const larga = window.matchMedia('(min-width: 64.0625rem)');

  /* Guarda/lê uma preferência no navegador. Se o navegador bloquear (janela anônima), simplesmente não guarda. */
  const lembrar = (chave, valor) => { try { localStorage.setItem(`olhomagico-${chave}`, valor); } catch (e) { /* sem memória: tudo bem */ } };
  const lembrado = (chave) => { try { return localStorage.getItem(`olhomagico-${chave}`); } catch (e) { return null; } };

  function abrir(sim) {
    $('lateral').classList.toggle('aberto', sim);
    document.body.classList.toggle('mais-aberto', sim);   // escurece o fundo atrás da folha
    $('btnMenu').setAttribute('aria-expanded', String(sim));
    $('btnMenuTexto').textContent = sim ? 'Fechar' : 'Mais';
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

  /* Tamanho da letra: 4 passos. O CSS faz o resto (todos os tamanhos do site estão em "rem"). */
  const TAMANHOS = [100, 115, 130, 150];
  function aplicarLetra(passo) {
    const p = Math.min(TAMANHOS.length, Math.max(1, Number(passo) || 1));
    if (p === 1) delete document.documentElement.dataset.letra; else document.documentElement.dataset.letra = String(p);
    $('letraValor').textContent = `${TAMANHOS[p - 1]}%`;
    $('letraMenor').disabled = p === 1;
    $('letraMaior').disabled = p === TAMANHOS.length;
    return p;
  }

  function iniciar() {
    aplicarTema(lembrado('tema'));
    let letra = aplicarLetra(lembrado('letra'));
    $('letraMenor').addEventListener('click', () => { letra = aplicarLetra(letra - 1); lembrar('letra', String(letra)); });
    $('letraMaior').addEventListener('click', () => { letra = aplicarLetra(letra + 1); lembrar('letra', String(letra)); });
    $('btnTema').addEventListener('click', () => {
      const novo = temaEfetivo() === 'claro' ? 'escuro' : 'claro';
      aplicarTema(novo); lembrar('tema', novo);
    });
    // Sem escolha guardada, acompanha a troca de modo do sistema (ex.: celular que escurece à noite).
    sistemaEscuro.addEventListener('change', () => { if (!escolhido) aplicarTema(null); });
    $('btnMenu').addEventListener('click', () => {
      const vaiAbrir = $('btnMenu').getAttribute('aria-expanded') !== 'true';
      abrir(vaiAbrir);
      if (vaiAbrir) $('menuPrincipal').querySelector('a').focus();
    });
    $('menuPrincipal').addEventListener('click', (ev) => {
      const link = ev.target.closest('a');
      if (!link) return;
      if (!larga.matches) abrir(false);              // celular: escolheu uma seção, a folha fecha
      else if (ev.detail > 0) link.blur();           // computador, clique do mouse: tira o foco para o menu recolher
    });
    // Tocar fora da folha (no fundo escurecido) fecha; trocar de tela também.
    document.addEventListener('click', (ev) => {
      if (document.body.classList.contains('mais-aberto') && !ev.target.closest('#lateralCorpo, #btnMenu')) abrir(false);
    });
    window.addEventListener('hashchange', () => abrir(false));
    // Esc fecha e devolve o foco ao botão que abriu.
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && $('btnMenu').getAttribute('aria-expanded') === 'true') { abrir(false); $('btnMenu').focus(); }
    });
    // Se a tela crescer (girar o tablet), o menu volta ao normal.
    larga.addEventListener('change', () => abrir(false));
    cabecalhoQueSome();
  }

  /* CABEÇALHO QUE SOME (decisão do mantenedor em 03/10/2026), para sobrar mais área de leitura:
     - computador: depois de rolar um pouco, some quando o mouse sai dele; volta ao levar o mouse ao topo da janela;
     - celular: some ao rolar para baixo e volta ao rolar para cima.
     Nunca some no topo da página, com a folha "Mais" aberta ou com o foco do teclado dentro dele. */
  function cabecalhoQueSome() {
    const lateral = $('lateral');
    const LIMITE = 80;            // px rolados antes de poder sumir
    let ultimoY = window.scrollY, mouseEmCima = false;
    const medir = () => document.documentElement.style.setProperty('--alt-cabecalho', `${lateral.offsetHeight}px`);
    const esconder = (sim) => {
      const pode = sim && window.scrollY > LIMITE && !document.body.classList.contains('mais-aberto') && !lateral.contains(document.activeElement);
      lateral.classList.toggle('cabecalho-oculto', pode);
    };
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y <= LIMITE) esconder(false);
      else if (larga.matches) { if (!mouseEmCima) esconder(true); }
      else if (y > ultimoY + 4) esconder(true);
      else if (y < ultimoY - 4) esconder(false);
      ultimoY = y;
    }, { passive: true });
    lateral.addEventListener('mouseenter', () => { mouseEmCima = true; esconder(false); });
    lateral.addEventListener('mouseleave', () => { mouseEmCima = false; esconder(true); });
    document.addEventListener('mousemove', (ev) => { if (larga.matches && ev.clientY < 14) esconder(false); }, { passive: true });
    lateral.addEventListener('focusin', () => esconder(false));
    window.addEventListener('resize', medir);
    medir();
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
