/* REGRAS DAS RECEITAS E DOS NÚMEROS DO MUNICÍPIO (sem tela; testadas em testes/testes.html).
   Receitas: do Relatório Resumido da Execução Orçamentária (RREO) que o Município envia ao Tesouro.
   "Previsto" = previsão atualizada para o ano; "recebido" = receita realizada até o bimestre do relatório.
   Números do município: do IBGE. PIB NÃO é dinheiro da Prefeitura (as frases dizem isso). */
OBS.receitas = {
  /* Quanto do previsto já entrou, em %, com uma casa. Sem previsão (ou previsão zero): null, nunca "0%". */
  percentual(realizado, previsto) {
    if (typeof realizado !== 'number' || typeof previsto !== 'number' || !(previsto > 0)) return null;
    return Math.round((realizado / previsto) * 1000) / 10;
  },

  /* Frase principal das receitas do ano. */
  frase(r) {
    if (!r || !r.total || typeof r.total.realizado !== 'number') return null;
    const p = OBS.receitas.percentual(r.total.realizado, r.total.previsto);
    return `De ${r.periodo}, o Município de Videira recebeu ${OBS.frases.reais(r.total.realizado)} em receitas` +
      (p === null ? '' : `, ${OBS.frases.pct(p)} do previsto para o ano (${OBS.frases.reais(r.total.previsto)})`) +
      ', segundo o relatório que ele mesmo enviou ao Tesouro Nacional.';
  },

  /* Número com casas decimais no jeito brasileiro: 384.127 -> "384,1". */
  decimal(v, casas = 1) {
    return typeof v === 'number' ? v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) : '—';
  }
};
