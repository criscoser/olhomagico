/* REGRAS DA LISTA DE SERVIDORES: funções sem tela (só contas e filtros), fáceis de testar.
   Cada servidor tem: nome, cargo, funcao, lotacao (setor), entidade, vinculo, ingresso,
   desde (MM/AAAA), salario (salário-base, número ou null) e horasMes. */
OBS.pessoal = {};

/* Tira acentos e deixa minúsculo, para a busca achar "joao" em "JOÃO". */
OBS.pessoal.normalizar = function (texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
};

/* Prepara a lista UMA vez: guarda o texto de busca de cada pessoa (nome + cargo + função + setor). */
OBS.pessoal.preparar = function (servidores) {
  return servidores.map((s) => Object.assign({}, s, {
    _busca: OBS.pessoal.normalizar([s.nome, s.cargo, s.funcao, s.lotacao].join(' '))
  }));
};

/* Explicação simples do vínculo (regras em config.js). Devolve {curto, texto} ou null. */
OBS.pessoal.explicarVinculo = function (vinculo) {
  return OBS.config.PESSOAL.VINCULOS.find((r) => r.padrao.test(vinculo || '')) || null;
};

/* É cargo comissionado (indicação)? */
OBS.pessoal.ehComissionado = (s) => /comission/i.test(s.vinculo || '');

/* É prefeito, vice ou secretário municipal? (padrões em config.js) */
OBS.pessoal.ehCargoPolitico = (s) => OBS.config.PESSOAL.CARGOS_POLITICOS.some((p) => p.test(s.cargo || ''));

/* Soma os salários-base de uma lista (quem não tem salário informado fica de fora da soma). */
OBS.pessoal.somaSalarios = (lista) => lista.reduce((t, s) => t + (typeof s.salario === 'number' ? s.salario : 0), 0);

/* Agrupa por um campo: devolve [{nome, pessoas: [...], soma}] do grupo com mais gente para o com menos. */
OBS.pessoal.agrupar = function (lista, campo, rotuloVazio) {
  const grupos = new Map();
  for (const s of lista) {
    const chave = s[campo] || rotuloVazio;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(s);
  }
  return [...grupos.entries()]
    .map(([nome, pessoas]) => ({ nome, pessoas, soma: OBS.pessoal.somaSalarios(pessoas) }))
    .sort((a, b) => b.pessoas.length - a.pessoas.length || b.soma - a.soma);
};

/* Comissionados agrupados por setor, com o setor de maior soma primeiro e as pessoas do maior salário-base para o menor. */
OBS.pessoal.comissionadosPorSetor = function (lista) {
  return OBS.pessoal.agrupar(lista.filter(OBS.pessoal.ehComissionado), 'lotacao', '(setor não informado)')
    .map((g) => Object.assign(g, { pessoas: g.pessoas.slice().sort((a, b) => (b.salario || 0) - (a.salario || 0)) }))
    .sort((a, b) => b.soma - a.soma);
};

/* Busca com filtros combináveis. "filtros" pode ter:
     termo   palavras digitadas: TODAS precisam aparecer (em qualquer ordem) no nome, cargo, função ou setor
     vinculo tipo de vínculo exato (ou vazio = todos)
     setor   setor/lotação exato (ou vazio = todos)
     cargo   cargo exato (ou vazio = todos)
     ordem   'nome' (A a Z) ou 'salario' (maior salário-base primeiro) */
OBS.pessoal.buscar = function (lista, filtros) {
  const { termo = '', vinculo = '', setor = '', cargo = '', ordem = 'nome' } = filtros || {};
  const palavras = OBS.pessoal.normalizar(termo).split(/\s+/).filter(Boolean);
  const achados = lista.filter((s) => (!vinculo || s.vinculo === vinculo) && (!setor || s.lotacao === setor) && (!cargo || s.cargo === cargo) &&
    palavras.every((p) => s._busca.includes(p)));
  if (ordem === 'salario') {
    achados.sort((a, b) => (b.salario ?? -1) - (a.salario ?? -1)); // sem salário informado vai para o fim
  } else {
    achados.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }
  return achados;
};

/* ENDEREÇO DA FICHA de cada registro: nome + cargo + mês de admissão ("joao-silva--professor--03-2021").
   Não usa matrícula nem CPF (não guardamos). Se dois registros ficarem iguais, o segundo ganha "--2".
   ATENÇÃO: a ficha é de um REGISTRO (vínculo), não de uma pessoa: o site não junta pessoas pelo nome. */
OBS.pessoal.comIds = function (lista) {
  const usados = new Map();
  const ordenada = lista.slice().sort((a, b) => [a.nome, a.cargo, a.desde, a.lotacao].join('|').localeCompare([b.nome, b.cargo, b.desde, b.lotacao].join('|')));
  ordenada.forEach((s) => {
    const base = [OBS.slug(s.nome), OBS.slug(s.cargo), OBS.slug(s.desde)].filter(Boolean).join('--') || 'registro';
    const n = (usados.get(base) || 0) + 1;
    usados.set(base, n);
    s.id = n === 1 ? base : `${base}--${n}`;
  });
  return lista;
};

/* Como o salário-base deste registro se compara com o dos outros registros do MESMO cargo.
   Devolve { total, maiores, menores, iguais } ou null (sem salário). Fato simples, sem juízo de valor. */
OBS.pessoal.comparacaoCargo = function (lista, s) {
  if (typeof s.salario !== 'number') return null;
  const mesmo = lista.filter((x) => x.cargo === s.cargo && typeof x.salario === 'number');
  return {
    total: mesmo.length,
    maiores: mesmo.filter((x) => x.salario > s.salario).length,
    menores: mesmo.filter((x) => x.salario < s.salario).length,
    iguais: mesmo.filter((x) => x.salario === s.salario).length
  };
};
