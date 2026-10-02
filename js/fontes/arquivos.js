/* CARREGADOR DOS ARQUIVOS DA CÓPIA DIÁRIA (dados/*.js), gerados pelos robôs de ferramentas/.
   Cada arquivo define uma variável (ex.: window.OBS_DADOS_PNCP). Carregamos com <script>, que funciona
   até abrindo o site direto do computador (ler .json assim seria bloqueado pelo navegador).
   Cada arquivo é carregado UMA vez só, e apenas quando a aba que precisa dele é aberta. */
OBS.fontes = OBS.fontes || {};

OBS.fontes.arquivos = {
  _promessas: {},

  /* Devolve uma promessa com o conteúdo da variável, ou null se o arquivo não existir ainda. */
  carregar(arquivo, variavel) {
    if (this._promessas[arquivo]) return this._promessas[arquivo];
    this._promessas[arquivo] = new Promise((resolver) => {
      const s = document.createElement('script');
      // "?v=data de hoje" faz o navegador buscar a cópia nova a cada dia.
      s.src = `dados/${arquivo}?v=${new Date().toISOString().slice(0, 10)}`;
      s.onload = () => resolver(window[variavel] || null);
      s.onerror = () => resolver(null); // o robô ainda não gerou este arquivo
      document.head.append(s);
    });
    return this._promessas[arquivo];
  }
};
