/* BOTÃO "OUVIR": lê em voz alta a RESPOSTA da tela aberta (o título-pergunta e as frases principais), usando a voz
   do próprio aparelho (Web Speech API, speechSynthesis). Não usa serviço externo: nada é enviado a terceiros.
   - Só aparece se o aparelho tiver voz em português; sem voz, o botão fica escondido (não há botão que não funciona).
   - Prefere voz instalada no aparelho (localService): algumas vozes "na nuvem" mandariam o texto para fora.
   - O texto é preparado para a fala: "R$ 46,2 milhões" -> "46,2 milhões de reais"; "43,77%" -> "43,77 por cento";
     siglas viram o nome completo. A frase que está sendo lida fica destacada (ajuda quem acompanha lendo).
   - Fala frase por frase (o Chrome corta falas longas); para ao trocar de tela, ao esconder o app ou ao tocar de novo.
   As funções de texto (paraFala, pedacos) não mexem na tela e são testadas em testes/testes.html. */
OBS.ouvir = (function () {
  /* Texto escrito -> texto para a voz. */
  function paraFala(texto) {
    let t = String(texto || '').replace(/ /g, ' ');
    // Dinheiro com escala: "R$ 46,2 milhões" -> "46,2 milhões de reais"; "R$ 980 mil" -> "980 mil reais".
    t = t.replace(/(−|-)?R\$\s?([\d.]+(?:,\d+)?)\s(milhão|milhões|bilhão|bilhões)/g, (_, s, n, e) => `${s ? 'menos ' : ''}${n} ${e} de reais`);
    t = t.replace(/(−|-)?R\$\s?([\d.]+(?:,\d+)?)\smil\b/g, (_, s, n) => `${s ? 'menos ' : ''}${n} mil reais`);
    // Dinheiro exato: "R$ 46.165.401,23" -> "46.165.401 reais e 23 centavos".
    t = t.replace(/(−|-)?R\$\s?([\d.]+)(?:,(\d{2}))?/g, (_, s, inteiro, cent) =>
      `${s ? 'menos ' : ''}${inteiro} reais${cent && cent !== '00' ? ` e ${Number(cent)} centavos` : ''}`);
    t = t.replace(/(\d)\s?%/g, '$1 por cento');
    t = t.replace(/−/g, 'menos ');
    // Siglas: o nome completo (sem o que estiver entre parênteses).
    if (OBS.siglas && OBS.siglas.encontrar) {
      const achados = OBS.siglas.encontrar(t);
      for (let i = achados.length - 1; i >= 0; i--) {
        const { inicio, fim, item } = achados[i];
        const nome = String(item.nome).replace(/\s*\([^)]*\)/g, '').trim();
        t = t.slice(0, inicio) + nome + t.slice(fim);
      }
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  /* Divide em pedaços de no máximo ~200 letras, sem cortar no meio da frase quando possível. */
  function pedacos(texto, max = 200) {
    const frases = String(texto || '').split(/(?<=[.!?:;])\s+/).filter(Boolean);
    const saida = [];
    frases.forEach((f) => {
      if (f.length <= max) { saida.push(f); return; }
      let resto = f;
      while (resto.length > max) {
        const corte = resto.lastIndexOf(',', max) > max * 0.5 ? resto.lastIndexOf(',', max) + 1 : resto.lastIndexOf(' ', max);
        saida.push(resto.slice(0, corte > 0 ? corte : max).trim());
        resto = resto.slice(corte > 0 ? corte : max).trim();
      }
      if (resto) saida.push(resto);
    });
    return saida;
  }

  // ---------------- Daqui para baixo: só o que mexe na tela ----------------
  const suportado = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  let voz = null, falando = false, botaoAtivo = null, destacado = null;

  /* Escolhe a voz: pt-BR instalada no aparelho > pt-BR > qualquer português. */
  function escolherVoz() {
    const vozes = window.speechSynthesis.getVoices() || [];
    const pt = vozes.filter((v) => /^pt/i.test(v.lang));
    const br = pt.filter((v) => /^pt[-_]BR$/i.test(v.lang));
    return br.find((v) => v.localService) || br[0] || pt.find((v) => v.localService) || pt[0] || null;
  }

  /* As vozes chegam DEPOIS da página: espera o aviso "voiceschanged" por até 1,5 s. */
  function carregarVoz() {
    return new Promise((pronto) => {
      if (!suportado) { pronto(null); return; }
      const agora = escolherVoz();
      if (agora) { pronto(agora); return; }
      const fim = () => { window.speechSynthesis.removeEventListener('voiceschanged', fim); pronto(escolherVoz()); };
      window.speechSynthesis.addEventListener('voiceschanged', fim);
      setTimeout(fim, 1500);
    });
  }

  /* O que ler na tela visível: o título e as frases principais (camada 1), na ordem em que aparecem. */
  const SELETOR = 'h1, .cartao-pergunta-titulo, .frase-resposta, .frase, .frase-media, .faixa, [data-ouvir]';
  function trechos(vista) {
    return [...vista.querySelectorAll(SELETOR)].filter((e) => e.offsetParent !== null && e.textContent.trim() && !e.closest('details:not([open])'));
  }

  function marcar(elemento) {
    if (destacado) destacado.classList.remove('lendo');
    destacado = elemento;
    if (elemento) elemento.classList.add('lendo');
  }

  function parar() {
    if (!suportado) return;
    window.speechSynthesis.cancel();
    falando = false; marcar(null);
    if (botaoAtivo) { botaoAtivo.setAttribute('aria-pressed', 'false'); botaoAtivo.querySelector('span').textContent = 'Ouvir'; }
    botaoAtivo = null;
  }

  function ler(botao) {
    if (falando) { parar(); return; }
    const vista = botao.closest('#conteudo > div');
    const fila = [];
    trechos(vista).forEach((e) => pedacos(paraFala(e.textContent)).forEach((p) => fila.push([e, p])));
    if (!fila.length) return;
    falando = true; botaoAtivo = botao;
    botao.setAttribute('aria-pressed', 'true'); botao.querySelector('span').textContent = 'Parar';
    fila.forEach(([elemento, texto], i) => {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR'; u.voice = voz; u.rate = 0.95;
      u.onstart = () => marcar(elemento);
      if (i === fila.length - 1) { u.onend = parar; u.onerror = parar; }
      window.speechSynthesis.speak(u);
    });
  }

  /* Põe um botão "Ouvir" logo depois do título (h1) de uma tela. */
  function botaoPara(vista) {
    const h1 = vista && vista.querySelector('h1');
    if (!voz || !h1 || vista.querySelector('.botao-ouvir')) return;
    const b = OBS.el('button', 'sec botao-ouvir'); b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Ouvir a resposta desta tela em voz alta');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'icone'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const p1 = document.createElementNS(ns, 'path'); p1.setAttribute('d', 'M4 9h4l5-4v14l-5-4H4z');
    const p2 = document.createElementNS(ns, 'path'); p2.setAttribute('d', 'M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11');
    svg.append(p1, p2);
    b.append(svg, OBS.el('span', '', 'Ouvir'));
    b.addEventListener('click', () => ler(b));
    h1.after(b);
  }

  async function iniciar() {
    voz = await carregarVoz();
    if (!voz) return;                       // sem voz em português: nenhum botão aparece
    document.querySelectorAll('#conteudo > div').forEach(botaoPara);
    // Fichas e telas montadas depois (o título chega mais tarde): põe o botão quando o h1 aparecer.
    new MutationObserver(() => document.querySelectorAll('#conteudo > div').forEach(botaoPara))
      .observe(document.getElementById('conteudo'), { childList: true, subtree: true });
    window.addEventListener('hashchange', parar);
    document.addEventListener('visibilitychange', () => { if (document.hidden) parar(); });
  }

  return { paraFala, pedacos, iniciar, parar };
})();
