/* APOIO: controla o botão "Apoie o projeto" e a caixa de diálogo (decisão do mantenedor, 04/10/2026):
     - em destaque, o E-MAIL do projeto, para doações, sugestões e para a pessoa contar por que está apoiando;
     - para quem prefere doar direto: o QR Code do Pix e o botão "Copiar código Pix" (quem está no celular não
       consegue ler o QR na própria tela). A chave e o texto do código não aparecem mais na tela;
     - link para as metas do projeto (#metas).
   O site NÃO processa pagamento nem guarda dados de quem apoia.
   SEGURANÇA DO PIX (mantida): tudo vem de js/config.js e é CONFERIDO por OBS.pixCodigoValido (js/pix-regras.js).
   Se a conferência falhar, nada de Pix aparece ("falha fechada"); dentro de outro site (iframe), também não. */
(function () {
  const { $, el } = OBS;
  const cfg = OBS.config;
  const chave = (cfg.PIX_CHAVE || '').trim();
  if (!chave) return; // sem chave configurada: o botão continua escondido

  const caixa = $('dlgApoio');
  $('btnApoio').classList.remove('oculto');
  $('btnApoio').addEventListener('click', () => { $('pixMsg').textContent = ''; caixa.showModal(); });
  $('fecharApoio').addEventListener('click', () => caixa.close());
  // Clicar fora da caixa (no fundo escuro) também fecha; ir para as metas também.
  caixa.addEventListener('click', (ev) => { if (ev.target === caixa) caixa.close(); });
  $('apoioMetas').addEventListener('click', () => caixa.close());

  /* E-MAIL: montado aqui, na hora (robôs que colhem e-mails em páginas para mandar spam, em geral, não rodam
     JavaScript). As partes ficam em js/config.js. */
  const email = `${cfg.EMAIL_USUARIO}@${cfg.EMAIL_DOMINIO}`;
  const linkEmail = el('a', 'apoio-email-link', email);
  linkEmail.href = `mailto:${email}?subject=${encodeURIComponent('Olho Mágico: quero contribuir')}`;
  $('apoioEmail').replaceChildren(linkEmail);

  /* Copia um texto. Primeiro o jeito moderno (só funciona em https); se falhar, um método antigo. */
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = texto; t.setAttribute('readonly', ''); caixa.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove();
      if (!ok) throw e;
    }
  }

  /* Mensagem para todos, inclusive leitores de tela (aria-live). Limpa antes, para repetir o aviso se a pessoa copiar de novo. */
  function avisar(texto) {
    $('pixMsg').textContent = '';
    setTimeout(() => { $('pixMsg').textContent = texto; }, 50);
  }

  $('copiarEmail').addEventListener('click', async () => {
    try { await copiar(email); avisar('E-mail copiado.'); } catch (e) { avisar(`Não consegui copiar. O e-mail é: ${email}`); }
  });

  // DENTRO DE OUTRO SITE (iframe): um site falso poderia mostrar o Olho Mágico "embrulhado" e pôr um botão ou QR
  // por cima. O GitHub Pages não deixa proibir isso pelo servidor, então, nesse caso, nada de Pix aparece aqui.
  let dentroDeOutroSite = true;
  try { dentroDeOutroSite = window.top !== window.self; } catch (e) { /* navegador bloqueou a comparação: trata como embrulhado */ }
  if (dentroDeOutroSite) {
    $('pixDados').replaceChildren(el('p', '', `Por segurança, o Pix só aparece com o site aberto diretamente no endereço ${cfg.SITE_OFICIAL}.`));
    return;
  }

  // FALHA FECHADA: se o código, a chave e o nome não combinarem, nada de Pix aparece (só um aviso neutro).
  const conferencia = OBS.pixCodigoValido();
  if (!conferencia.ok) {
    console.warn('Pix desativado: ' + conferencia.motivo);
    $('pixDados').replaceChildren(el('p', '', 'O apoio por Pix está indisponível no momento.'));
    return;
  }

  const codigo = cfg.PIX_COPIA_E_COLA;
  $('pixSite').textContent = cfg.SITE_OFICIAL;

  /* QR CODE: desenhado AQUI, a partir do MESMO texto do "Copiar código Pix" (não existe imagem separada que
     possa ser trocada). Se o gerador falhar por qualquer motivo, o QR simplesmente não aparece; o botão continua. */
  try {
    const qr = OBS.qr.svg(OBS.qr.gerar(codigo, 'M'));
    qr.setAttribute('role', 'img');
    qr.setAttribute('aria-label', 'QR Code do Pix do Olho Mágico.');
    $('apoioQr').prepend(qr);
    $('apoioQr').classList.remove('oculto');
  } catch (e) { console.warn('QR Code não gerado: ' + e.message); }

  $('copiarCodigo').addEventListener('click', async () => {
    try { await copiar(codigo); avisar('Código Pix copiado. Agora cole no app do seu banco, em Pix Copia e Cola.'); } catch (e) {
      avisar('Não consegui copiar o código. Use o QR Code ou escreva para o e-mail acima.');
    }
  });
})();
