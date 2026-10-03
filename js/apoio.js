/* APOIO (PIX): controla o botão "Apoie o projeto" e a caixa de diálogo.
   O site NÃO processa pagamento nem guarda dados de quem apoia: só mostra o código e a chave para a pessoa
   copiar (ou o QR Code para ler) e pagar no aplicativo do próprio banco.
   SEGURANÇA: tudo vem de js/config.js e é CONFERIDO por OBS.pixCodigoValido (js/pix-regras.js).
   Se a conferência falhar, nada de Pix aparece: só um aviso neutro ("falha fechada"). */
(function () {
  const { $, el } = OBS;
  const cfg = OBS.config;
  const chave = (cfg.PIX_CHAVE || '').trim();
  if (!chave) return; // sem chave configurada: o botão continua escondido

  const caixa = $('dlgApoio');
  $('btnApoio').classList.remove('oculto');
  $('btnApoio').addEventListener('click', () => { $('pixMsg').textContent = ''; caixa.showModal(); });
  $('fecharApoio').addEventListener('click', () => caixa.close());
  // Clicar fora da caixa (no fundo escuro) também fecha.
  caixa.addEventListener('click', (ev) => { if (ev.target === caixa) caixa.close(); });

  // FALHA FECHADA: se o código, a chave e o nome não combinarem, nada de Pix aparece (só um aviso neutro).
  const conferencia = OBS.pixCodigoValido();
  if (!conferencia.ok) {
    console.warn('Pix desativado: ' + conferencia.motivo);
    $('pixDados').replaceChildren(el('p', '', 'O apoio por Pix está indisponível no momento.'));
    return;
  }

  const codigo = cfg.PIX_COPIA_E_COLA;
  $('pixChave').textContent = chave;
  $('pixCodigo').textContent = codigo;
  $('pixNome').textContent = cfg.PIX_NOME_COMPLETO;
  $('pixNomeCurto').textContent = cfg.PIX_RECEBEDOR;
  $('pixSite').textContent = cfg.SITE_OFICIAL;

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

  async function copiarComAviso(texto, sucesso) {
    try { await copiar(texto); avisar(sucesso); } catch (e) {
      $('pixDetalhes').open = true;   // mostra o código e a chave para a pessoa copiar à mão
      avisar('Não consegui copiar. Toque e segure o código abaixo para copiar.');
    }
  }

  $('copiarCodigo').addEventListener('click', () => copiarComAviso(codigo, 'Código Pix copiado. Agora cole no app do seu banco, em Pix Copia e Cola.'));
  $('copiarPix').addEventListener('click', () => copiarComAviso(chave, 'Chave copiada. Agora cole no app do seu banco.'));
})();
