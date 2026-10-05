/* REGRAS DA ABA "CONTAS E LIMITES" (gasto com pessoal x Lei de Responsabilidade Fiscal).
   Funções sem tela, fáceis de testar. Os limites vêm do próprio relatório (RGF), não são inventados aqui. */
OBS.contas = {};

/* Em que faixa da LRF está o gasto com pessoal? Comparação direta com os limites publicados no relatório.
   Devolve { nivel: 0..3, texto } ou null se faltar algum número. */
OBS.contas.faixa = function (p) {
  if (!p || typeof p.dtpPct !== 'number' || typeof p.limiteMaximoPct !== 'number') return null;
  const alerta = p.limiteAlertaPct, prudencial = p.limitePrudencialPct, maximo = p.limiteMaximoPct;
  if (p.dtpPct >= maximo) return { nivel: 3, texto: 'acima do limite máximo da LRF' };
  if (typeof prudencial === 'number' && p.dtpPct >= prudencial) return { nivel: 2, texto: 'acima do limite prudencial da LRF' };
  if (typeof alerta === 'number' && p.dtpPct >= alerta) return { nivel: 1, texto: 'acima do limite de alerta da LRF' };
  return { nivel: 0, texto: typeof alerta === 'number' ? 'abaixo do limite de alerta da LRF' : 'abaixo do limite máximo da LRF' };
};

/* Período mais recente de uma lista (ordem: ano, depois número do período). */
OBS.contas.maisRecente = function (periodos) {
  return (periodos || []).slice().sort((a, b) => (a.ano - b.ano) || (a.periodo - b.periodo)).pop() || null;
};

/* Formata percentual brasileiro: 41.78 -> "41,78%". */
OBS.contas.pct = (n) => (typeof n === 'number' ? `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—');

/* ---------- Despesa por área (DCA, contas anuais) ----------
   coluna: 'empenhado', 'liquidado' ou 'pago'. NUNCA misturamos colunas.
   Devolve as funções com o valor daquela coluna e a fatia (%) sobre a soma das funções NA MESMA coluna. */
OBS.contas.funcoes = function (anoDca, coluna) {
  const lista = (anoDca.funcoes || []).map((f) => ({ codigo: f.codigo, nome: f.nome, valor: f.valores[coluna], subfuncoes: f.subfuncoes }))
    .filter((f) => typeof f.valor === 'number');
  const total = lista.reduce((t, f) => t + f.valor, 0);
  return lista.map((f) => Object.assign(f, { fatia: total ? (f.valor / total) * 100 : null }))
    .sort((a, b) => b.valor - a.valor);
};

/* ---------- Indicadores de educação (SIOPE) ----------
   Mínimos legais conhecidos. Só são aplicados a indicadores cujo NOME diz que é percentual. */
/* SÓ os dois indicadores que TÊM mínimo legal, conferidos pelo código do SIOPE E pelo nome (os dois juntos).
   Antes bastava o nome citar "MDE": indicadores como "aposentadorias ... em relação às despesas com MDE" (que não têm
   mínimo nenhum) ou o 1.3 (que é um MÁXIMO) apareciam com "mínimo de 25%". Na dúvida, sem mínimo. */
OBS.contas.MINIMOS_EDUCACAO = [
  { codigo: '1.1', padrao: /^Percentual de aplica[cç][aã]o das receitas de impostos .*MDE/i, minimo: 25, base: 'Constituição Federal, art. 212' },
  { codigo: '1.2', padrao: /^Percentual de aplica[cç][aã]o do FUNDEB na remunera[cç][aã]o dos profissionais/i, minimo: 70, base: 'Lei 14.113/2020, art. 26' }
];

/* Como mostrar o valor de um indicador: pelo nome. "Percentual..." -> %; "Valor/Investimento/R$" -> dinheiro. */
OBS.contas.tipoIndicador = function (nome) {
  const n = String(nome || '');
  // Primeiro o COMEÇO do nome: "Valor exigido ... (Mínimo de 25%)" é dinheiro, apesar do "%" no fim.
  if (/^(valor|investimento|despesa|gasto|custo|saldo|super[aá]vit|d[eé]ficit)/i.test(n)) return 'moeda';
  if (/percentual/i.test(n)) return 'pct';
  if (/R\$/.test(n)) return 'moeda';
  if (/%/.test(n)) return 'pct';
  return 'numero';
};

/* Os mínimos da educação valem para o ANO FECHADO (6º bimestre). Antes disso o percentual é parcial
   e muda até dezembro: comparar com o mínimo daria uma conclusão que a fonte não permite. */
OBS.contas.anoFechado = (periodo) => Boolean(periodo) && periodo.bimestre === 6;
OBS.contas.AVISO_PARCIAL = 'Dado parcial do ano: o mínimo vale para o ano inteiro, então ainda não dá para dizer se será cumprido.';

/* Se o indicador tem um mínimo legal conhecido, compara. Devolve { minimo, base, cumpre } ou null. */
OBS.contas.minimoEducacao = function (ind) {
  if (OBS.contas.tipoIndicador(ind.nome) !== 'pct') return null;
  const regra = OBS.contas.MINIMOS_EDUCACAO.find((r) => r.codigo === ind.codigo && r.padrao.test(ind.nome || ''));
  return regra ? { minimo: regra.minimo, base: regra.base, cumpre: ind.valor >= regra.minimo } : null;
};

/* ---------- Entregas ao Tesouro (extrato do SICONFI) ----------
   Última entrega de cada relatório, por instituição (Prefeitura, Câmara). Mais recente primeiro. */
OBS.contas.ultimasEntregas = function (registros) {
  const m = new Map();
  (registros || []).forEach((r) => {
    const chave = `${r.instituicao}|${r.entregavel}`;
    const atual = m.get(chave);
    if (!atual || String(r.data || '') > String(atual.data || '')) m.set(chave, r);
  });
  return [...m.values()].sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
};

/* Rótulo do período de uma entrega: periodicidade Q + período 2 -> "2º quadrimestre". */
OBS.contas.rotuloPeriodo = function (r) {
  const nomes = { M: 'mês', B: 'bimestre', Q: 'quadrimestre', S: 'semestre' };
  if (r.periodicidade === 'A' || !r.periodo) return 'anual';
  if (r.periodicidade === 'M') return OBS.MESES[r.periodo - 1] ? OBS.MESES[r.periodo - 1].toLowerCase() : `mês ${r.periodo}`;
  return `${r.periodo}º ${nomes[r.periodicidade] || 'período'}`;
};
