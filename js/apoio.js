/* APOIO (PIX): controla o botão "Apoie o projeto" e a caixa de diálogo.
   O site NÃO processa pagamento nem guarda dados de doadores: só mostra a chave para a pessoa copiar
   e pagar no aplicativo do próprio banco. */
(function () {
  const { $ } = OBS;
  const chave = (OBS.config.PIX_CHAVE || '').trim();
  if (!chave) return; // sem chave configurada: o botão continua escondido

  const caixa = $('dlgApoio');
  $('btnApoio').classList.remove('oculto');
  // FALHA FECHADA: se o código, a chave e o nome não combinarem, nada de Pix aparece (só um aviso neutro).
  const conferencia = OBS.pixCodigoValido();
  if (!conferencia.ok) {
    console.warn('Pix desativado: ' + conferencia.motivo);
    $('pixDados').replaceChildren(OBS.el('p', '', 'O apoio por Pix está indisponível no momento.'));
    $('btnApoio').addEventListener('click', () => caixa.showModal());
    $('fecharApoio').addEventListener('click', () => caixa.close());
    return;
  }
  $('pixChave').textContent = chave;

  /* Abre a caixa (showModal deixa o fundo escuro e prende o foco dentro dela). */
  $('btnApoio').addEventListener('click', () => { $('pixMsg').textContent = ''; caixa.showModal(); });
  $('fecharApoio').addEventListener('click', () => caixa.close());
  // Clicar fora da caixa (no fundo escuro) também fecha.
  caixa.addEventListener('click', (ev) => { if (ev.target === caixa) caixa.close(); });

  /* Copia a chave. Primeiro tenta o jeito moderno (só funciona em https);
     se falhar, usa um método antigo que funciona em mais lugares. */
  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = chave; document.body.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove();
      if (!ok) throw e;
    }
  }
  $('copiarPix').addEventListener('click', async () => {
    try { await copiar(); $('pixMsg').textContent = 'Chave copiada! Cole no app do seu banco.'; }
    catch { $('pixMsg').textContent = 'Não consegui copiar. Selecione a chave acima e copie manualmente.'; }
  });
})();
