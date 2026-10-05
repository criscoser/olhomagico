/* REGRAS DAS TRANSFERÊNCIAS CONSTITUCIONAIS (dinheiro que a União repassa ao município por obrigação).
   Cada registro: { ano, mes (1-12), tipo (FPM, FUNDEB...), valor }. O valor pode ser NEGATIVO (ajuste ou devolução):
   ele entra nas somas como veio da fonte, sem esconder nada. */
OBS.transferencias = {};

/* Anos presentes nos dados, do mais recente para o mais antigo. */
OBS.transferencias.anos = (regs) => [...new Set(regs.map((r) => r.ano))].sort((a, b) => b - a);

/* Último mês com algum registro naquele ano (0 se não houver nenhum). */
OBS.transferencias.ultimoMes = (regs, ano) => Math.max(0, ...regs.filter((r) => r.ano === ano).map((r) => r.mes));

/* Total de cada mês do ano: 12 posições. Mês sem nenhum registro fica null ("sem dado"), e não zero. */
OBS.transferencias.porMes = function (regs, ano, tipo) {
  const meses = Array(12).fill(null);
  regs.filter((r) => r.ano === ano && (!tipo || r.tipo === tipo)).forEach((r) => { meses[r.mes - 1] = (meses[r.mes - 1] || 0) + r.valor; });
  return meses;
};

/* Total por tipo de transferência no ano (até o mês "ateMes", se informado), do maior para o menor. */
OBS.transferencias.porTipo = function (regs, ano, ateMes = 12) {
  const m = new Map();
  regs.filter((r) => r.ano === ano && r.mes <= ateMes).forEach((r) => m.set(r.tipo, (m.get(r.tipo) || 0) + r.valor));
  return [...m.entries()].map(([tipo, valor]) => ({ tipo, valor })).sort((a, b) => b.valor - a.valor);
};

/* Soma do ano até um mês (inclusive). Serve para comparar "janeiro a agosto" de dois anos de forma justa. */
OBS.transferencias.acumulado = (regs, ano, ateMes, tipo) =>
  regs.filter((r) => r.ano === ano && r.mes <= ateMes && (!tipo || r.tipo === tipo)).reduce((t, r) => t + r.valor, 0);

/* Variação percentual entre dois valores (null se a base for zero ou faltar). */
OBS.transferencias.variacao = (atual, anterior) => (anterior ? ((atual - anterior) / Math.abs(anterior)) * 100 : null);
