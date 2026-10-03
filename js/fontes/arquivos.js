/* CARREGADOR DOS ARQUIVOS DA CÓPIA DIÁRIA (dados/*.js), gerados pelos robôs de ferramentas/.
   Cada arquivo define uma variável (ex.: window.OBS_DADOS_PNCP). Carregamos com <script>, que funciona
   até abrindo o site direto do computador (ler .json assim seria bloqueado pelo navegador).
   Cada arquivo é carregado UMA vez só, e apenas quando a aba que precisa dele é aberta. */
OBS.fontes = OBS.fontes || {};

/* TRUSTED TYPES (segurança): a página proíbe (pela CSP) carregar scripts a partir de textos soltos. A única exceção
   é esta "política", que só aceita os arquivos de dados do próprio site: "dados/<nome>.js?v=AAAA-MM-DD".
   Navegadores sem Trusted Types (Firefox, Safari) simplesmente usam o texto normal. */
OBS.fontes.politicaScripts = (window.trustedTypes && window.trustedTypes.createPolicy)
  ? window.trustedTypes.createPolicy('olhomagico', {
    createScriptURL(url) {
      if (/^dados\/[a-z0-9-]+\.js\?v=\d{4}-\d{2}-\d{2}$/.test(url)) return url;
      throw new TypeError(`Endereço de script não permitido: ${url}`);
    }
  })
  : null;

OBS.fontes.arquivos = {
  _promessas: {},

  /* Devolve uma promessa com o conteúdo da variável, ou null se o arquivo não existir ainda. */
  carregar(arquivo, variavel) {
    if (this._promessas[arquivo]) return this._promessas[arquivo];
    this._promessas[arquivo] = new Promise((resolver) => {
      const s = document.createElement('script');
      // "?v=data de hoje" faz o navegador buscar a cópia nova a cada dia.
      const url = `dados/${arquivo}?v=${new Date().toISOString().slice(0, 10)}`;
      s.src = OBS.fontes.politicaScripts ? OBS.fontes.politicaScripts.createScriptURL(url) : url;
      s.onload = () => resolver(window[variavel] || null);
      s.onerror = () => resolver(null); // o robô ainda não gerou este arquivo
      document.head.append(s);
    });
    return this._promessas[arquivo];
  }
};
