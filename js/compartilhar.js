/* COMPARTILHAR: "WhatsApp", "Copiar link" e "Outros apps" logo abaixo do título de cada tela.
   A mensagem é encaminhada e vira print, LONGE do site: por isso ela carrega a frase, o valor exato, a data, o link
   e o aviso de que o site NÃO é oficial. Nada é enviado a nenhum servidor: o WhatsApp é aberto com o texto pronto.
   Ficha de servidor: a mensagem NÃO traz nome nem salário (decisão do projeto: dado público, mas exposição fora de
   contexto e salário-base costuma ser confundido com o que a pessoa recebe). Leva só o cargo e o link. */
OBS.compartilhar = (function () {
  const { el } = OBS;

  /* Endereço oficial completo da tela atual (o mesmo "#..." que está no navegador). */
  const enderecoDaTela = (hash = location.hash) => `https://${OBS.config.SITE_OFICIAL}/${hash || ''}`;

  /* Texto da mensagem (função sem tela, testada). o = { titulo, frase, exato, data, url } */
  function montarTexto(o) {
    const linhas = [];
    if (o.titulo) linhas.push(`*${o.titulo}*`);
    if (o.frase) linhas.push(o.frase);
    if (o.exato) linhas.push(o.exato);
    linhas.push('');
    linhas.push(`Fonte: dados públicos oficiais (a origem de cada número está no link). Consultado em ${o.data}.`);
    linhas.push(`Veja os detalhes: ${o.url}`);
    linhas.push('');
    linhas.push('Olho Mágico, portal independente (não é site oficial da Prefeitura).');
    return linhas.join('\n').replace(/ /g, ' ');
  }

  /* Ficha de servidor (opção A): sem nome e sem salário. */
  function textoFichaServidor(cargo, data, url) {
    return montarTexto({ titulo: 'Ficha de um registro da lista de pessoal do Município de Videira',
      frase: cargo ? `Cargo: ${cargo}.` : '', data, url });
  }

  /* "Valor exato: R$ 46.165.401,23. 22 órgãos..." -> "Valor exato: R$ 46.165.401,23." (o valor INTEIRO: os pontos de
     milhar fazem parte do número; um erro aqui mandaria "R$ 46." no WhatsApp). Sem valor reconhecível: ''. */
  function valorExato(texto) {
    const m = String(texto || '').replace(/\u00a0/g, ' ').match(/Valor exato: (−|-)?R\$ ?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/);
    return m ? `${m[0]}.` : '';
  }

  /* Lê da TELA visível o que vai na mensagem: título, primeira frase principal e o valor exato (se houver). */
  function dadosDaTela(vista) {
    const visivel = (e) => e && e.offsetParent !== null && !e.closest('details:not([open])');
    const primeiro = (sel) => [...vista.querySelectorAll(sel)].find(visivel);
    const hoje = new Date().toLocaleDateString('pt-BR');
    const url = enderecoDaTela();
    if (vista.id === 'vista-ficha' && location.hash.startsWith('#servidor/')) {
      const cargo = [...vista.querySelectorAll('.ficha-id p')].map((p) => p.textContent).find((t) => t.startsWith('Cargo: '));
      return textoFichaServidor(cargo ? cargo.slice(7).replace(/\.$/, '') : '', hoje, url);
    }
    const h1 = vista.querySelector('h1');
    const frase = primeiro('.frase-resposta, .frase, .frase-media');
    const exatoEl = primeiro('.valor-exato, #notaFrase, #transfExato');
    const exato = valorExato(exatoEl ? exatoEl.textContent : '');
    return montarTexto({ titulo: h1 ? h1.textContent.trim() : 'Olho Mágico', frase: frase ? frase.textContent.trim() : '', exato, data: hoje, url });
  }

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); } catch (e) {
      const t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', ''); document.body.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove(); if (!ok) throw e;
    }
  }

  function icone(d) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'icone'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    d.forEach((x) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', x); svg.append(p); });
    return svg;
  }

  /* Barra com os 3 botões, logo abaixo do título (e do "Ouvir", se houver) de uma tela. */
  function barraPara(vista) {
    const h1 = vista && vista.querySelector('h1');
    if (!h1 || vista.id === 'vista-busca' || vista.querySelector('.barra-compartilhar')) return;
    const barra = el('div', 'barra-compartilhar');
    barra.setAttribute('role', 'group'); barra.setAttribute('aria-label', 'Compartilhar esta tela');
    const msg = el('span', 'meta compartilhar-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
    const avisar = (t) => { msg.textContent = ''; setTimeout(() => { msg.textContent = t; }, 50); };

    // WhatsApp: um link (abre o app com o texto pronto). O endereço é montado na hora do toque, com a tela atual.
    const zap = el('a', 'botao-compartilhar'); zap.href = 'https://wa.me/'; zap.target = '_blank'; zap.rel = 'noopener noreferrer';
    zap.append(icone(['M4 20l1.5-4.5A8 8 0 1 1 8.5 19z']), el('span', '', 'WhatsApp'));
    zap.setAttribute('aria-label', 'Enviar no WhatsApp');
    zap.addEventListener('click', () => { zap.href = `https://wa.me/?text=${encodeURIComponent(dadosDaTela(vista))}`; });

    const link = el('button', 'botao-compartilhar'); link.type = 'button'; link.setAttribute('aria-label', 'Copiar o link desta tela');
    link.append(icone(['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1']), el('span', '', 'Copiar link'));
    link.addEventListener('click', async () => {
      try { await copiar(enderecoDaTela()); avisar('Link copiado.'); } catch (e) { avisar(`Não consegui copiar. O link é: ${enderecoDaTela()}`); }
    });
    barra.append(zap, link);

    // "Outros apps": o menu de compartilhar do próprio celular (só onde existe).
    if (navigator.share) {
      const outros = el('button', 'botao-compartilhar'); outros.type = 'button'; outros.setAttribute('aria-label', 'Compartilhar em outros aplicativos');
      outros.append(icone(['M12 3v12', 'M7 8l5-5 5 5', 'M5 13v6h14v-6']), el('span', '', 'Outros apps'));
      outros.addEventListener('click', () => {
        navigator.share({ title: 'Olho Mágico', text: dadosDaTela(vista), url: enderecoDaTela() }).catch(() => { /* a pessoa desistiu: tudo bem */ });
      });
      barra.append(outros);
    }
    barra.append(msg);
    // Uma linha só, pequena, logo abaixo do título: o "Ouvir" (se houver) entra no começo dela.
    h1.after(barra);
    const ouvir = vista.querySelector('.botao-ouvir');
    if (ouvir) barra.prepend(ouvir);
  }

  function iniciar() {
    const todas = () => document.querySelectorAll('#conteudo > div').forEach(barraPara);
    todas();
    // Fichas e telas montadas depois (o título chega mais tarde).
    new MutationObserver(todas).observe(document.getElementById('conteudo'), { childList: true, subtree: true });
  }

  return { montarTexto, textoFichaServidor, enderecoDaTela, valorExato, iniciar };
})();
