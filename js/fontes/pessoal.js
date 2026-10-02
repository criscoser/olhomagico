/* FONTE DE DADOS: LISTA DE SERVIDORES (cópia diária da API de Pessoal, feita pelo robô
   ferramentas/fontes/pessoal.py). Usa o carregador comum (js/fontes/arquivos.js). */
OBS.fontes = OBS.fontes || {};

OBS.fontes.pessoal = {
  /* Carrega a cópia diária. Resolve com os dados, ou com null se o arquivo ainda não existir ou estiver estranho. */
  async carregar() {
    const d = await OBS.fontes.arquivos.carregar('pessoal.js', 'OBS_DADOS_PESSOAL');
    return this.validar(d) ? d : null;
  },

  /* Confere o formato antes de usar: lista de servidores + data de geração. */
  validar(d) {
    return Boolean(d && Array.isArray(d.servidores) && d.meta && d.meta.geradoEm);
  }
};
