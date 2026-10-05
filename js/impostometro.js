/* IMPOSTÔMETRO NO CABEÇALHO (decisões do mantenedor, 04/10/2026): SEMPRE ABERTO, entre o logo e "Apoie o projeto",
   com uma seta (lista) para escolher Videira, Santa Catarina ou Brasil.
     - Videira é sempre o padrão; escolhendo outro, a pessoa vê; ao trocar de tela ou recarregar, volta para Videira
       (nada é guardado);
     - usa o widget OFICIAL da ACSP no tamanho 430 x 157 e mostra só a faixa dos números e unidades (escolha do mantenedor;
       PENDENTE: autorização por escrito da ACSP, porque os termos dela não permitem modificar o conteúdo);
     - o quadro fica isolado (sandbox, sem referrer). Por estar sempre aberto, toda visita conecta ao site da ACSP:
       isso está dito na aba Sobre (Privacidade). */
OBS.impostometro = (function () {
  const { $, el } = OBS;
  const ESCOPOS = {
    municipio: { nome: 'Videira', explica: 'Estimativa da ACSP dos tributos MUNICIPAIS pagos em Videira (impostos, taxas e contribuições, como IPTU, ISS e ITBI), do começo do ano até agora.' },
    estado: { nome: 'Santa Catarina', explica: 'Estimativa da ACSP dos tributos federais, estaduais e municipais pagos em Santa Catarina, do começo do ano até agora.' },
    brasil: { nome: 'Brasil', explica: 'Estimativa da ACSP dos tributos federais, estaduais e municipais pagos no Brasil, do começo do ano até agora.' }
  };
  const PADRAO = 'municipio';
  let atual = null;
  let quadro = null;

  /* Endereço do widget para o escopo, só se for do site da ACSP (nunca carrega outro endereço). */
  function endereco(escopo) {
    const url = OBS.urlSegura(((OBS.config.IMPOSTOMETRO || {})[escopo]) || '');
    return url && /^https:\/\/impostometro\.com\.br\/widget\/contador\//.test(url) ? url : null;
  }

  function mostrar(escopo) {
    const novo = ESCOPOS[escopo] ? escopo : PADRAO;
    $('escolhaImpostometro').value = novo;
    if (novo === atual) return;                 // já está nele: não recarrega o contador
    atual = novo;
    const url = endereco(novo);
    if (!url) return;
    quadro.src = url;
    quadro.title = `Impostômetro da ACSP: ${ESCOPOS[novo].nome}. ${ESCOPOS[novo].explica}`;
    $('impostometroFaixa').title = ESCOPOS[novo].explica;
    $('impostometroExplica').textContent = ESCOPOS[novo].explica;
  }

  /* TAMANHO DO QUADRO. Computador: 430 x 157 (o formato da ACSP que mostra as unidades), reduzido pelo CSS.
     Celular (menos de 640 px): o quadro de 430 px fica MAIS LARGO que a tela, e o Android aumenta as letras de dentro
     dele, o que quebra os números em duas linhas. Por isso, no celular, o quadro tem exatamente a largura da tela
     (formato compacto da ACSP, só os números, numa linha) e o CSS mostra só a linha dos dígitos. */
  function ajustarTamanho() {
    const celular = window.innerWidth < 640;
    const largura = celular ? Math.min(window.innerWidth, 429) : 430;
    if (quadro.width !== String(largura)) quadro.width = String(largura);
    quadro.height = celular ? '80' : '157';
    $('impostometroTopo').classList.toggle('impostometro-compacto', celular);
    $('impostometroFaixa').style.width = celular ? `${largura}px` : '';
  }

  function iniciar() {
    const caixa = $('impostometroTopo');
    if (!caixa || !endereco(PADRAO)) return;
    quadro = el('iframe', 'impostometro-quadro');
    ajustarTamanho();
    quadro.setAttribute('scrolling', 'no');
    quadro.setAttribute('referrerpolicy', 'no-referrer');
    quadro.setAttribute('sandbox', 'allow-scripts allow-same-origin');   // o contador roda, mas não abre janelas nem navega o site
    $('impostometroFaixa').replaceChildren(quadro);
    caixa.classList.remove('oculto');
    mostrar(PADRAO);
    $('escolhaImpostometro').addEventListener('change', (ev) => mostrar(ev.target.value));
    let espera = 0;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(ajustarTamanho, 200); });
    window.addEventListener('hashchange', () => { mostrar(PADRAO); ajuda(false); });   // saiu da tela: volta para Videira
    // ⓘ: abre e fecha a explicação; fecha com Esc ou ao tocar fora.
    const botao = $('ajudaImpostometro');
    const ajuda = (sim) => { $('infoImpostometro').classList.toggle('oculto', !sim); botao.setAttribute('aria-expanded', String(sim)); };
    botao.addEventListener('click', () => ajuda(botao.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') { ajuda(false); botao.focus(); } });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('#impostometroTopo')) ajuda(false); });
  }

  return { iniciar, endereco };
})();
