/* FONTE DE DADOS: DESPESAS DA PREFEITURA (API de Dados Abertos - Contabilidade).
   Este arquivo é um "adaptador": só ele sabe falar com essa API. O resto do site recebe
   linhas já validadas. Para uma nova fonte (folha, Câmara...), crie outro arquivo nesta pasta.
   Campos CONFIRMADOS na documentação: orgaoDescricao, unidadeDescricao, nomeCredor, cpfCnpjCredor,
   valorEmpenhado, valorAnulado, valorLiquidado, valorRetido, valorPago. */
OBS.fontes = OBS.fontes || {};

OBS.fontes.despesas = {
  /* O portal da Prefeitura aceita no máximo 10 consultas por minuto (conferido em 03/10/2026). */
  LIMITE_POR_MINUTO: 10,
  PAUSA_ENTRE_CONSULTAS_MS: 6500,   // ~9 por minuto: abaixo do limite
  MENSAGEM_LIMITE: 'O portal da Prefeitura aceita no máximo 10 consultas por minuto. Aguarde um minuto e tente de novo.',

  /* Monta o endereço da consulta. As datas vão com "/" puro (01/09/2026): codificar a barra (%2F)
     faz a API responder erro 400. */
  montarUrl(ini, fim) {
    return `${OBS.config.API_BASE}/despesas?dataInicial=${ini}&dataFinal=${fim}`;
  },

  /* Busca na API. Se demorar mais que TIMEOUT_MS, cancela. Lança erro com mensagem clara se algo falhar. */
  async buscar(ini, fim) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), OBS.config.TIMEOUT_MS);
    try {
      const resposta = await fetch(this.montarUrl(ini, fim), { signal: controle.signal });
      const json = await resposta.json().catch(() => null);
      // O portal aceita no máximo 10 consultas por minuto; passou disso, responde 429 e uma mensagem de "limite".
      if (resposta.status === 429 || (json && /limite de requisi/i.test(String(json.msg || '')))) {
        const e = new Error(OBS.fontes.despesas.MENSAGEM_LIMITE); e.limite = true; throw e;
      }
      if (!resposta.ok) throw new Error(`A fonte respondeu com erro ${resposta.status}.`);
      if (!json || json.status !== 'ok' || !Array.isArray(json.retorno)) throw new Error('A fonte respondeu em um formato inesperado.');
      return json.retorno;
    } finally {
      clearTimeout(relogio); // sempre desliga o relógio, deu certo ou não
    }
  },

  /* Confere cada linha ANTES de usar. Linhas com valores que não são números vão para "descartadas"
     (e a tela avisa), em vez de virarem zero em silêncio. Assim um dado estranho não passa despercebido. */
  validar(linhas) {
    const validas = [], descartadas = [];
    const campos = ['valorEmpenhado', 'valorLiquidado', 'valorPago'];
    for (const l of linhas) {
      const ok = l && typeof l === 'object' && campos.every((c) => OBS.numero(l[c]) !== null);
      (ok ? validas : descartadas).push(l);
    }
    return { validas, descartadas };
  }
};
