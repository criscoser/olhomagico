/* REGRAS DA ABA "CONTRATOS E LICITAÇÕES" (dados do PNCP). Funções sem tela, fáceis de testar. */
OBS.contratos = {};

/* Texto de busca de cada item, preparado UMA vez (sem acento, minúsculo). */
OBS.contratos.preparar = function (itens, campos) {
  return (itens || []).map((it) => Object.assign({}, it, {
    _busca: OBS.pessoal.normalizar(campos.map((c) => it[c]).join(' '))
  }));
};

/* Busca com filtros combináveis. filtros = { termo, campo: valor exato, ordem: 'recente' | 'valor' }.
   "campoValor" é o campo usado na ordem por valor; "campoData", o da ordem por data. */
OBS.contratos.buscar = function (itens, filtros, campoValor, campoData) {
  const { termo = '', ordem = 'recente' } = filtros || {};
  const exatos = Object.entries(filtros || {}).filter(([k, v]) => !['termo', 'ordem'].includes(k) && v);
  const palavras = OBS.pessoal.normalizar(termo).split(/\s+/).filter(Boolean);
  const achados = itens.filter((it) => exatos.every(([k, v]) => it[k] === v) && palavras.every((p) => it._busca.includes(p)));
  if (ordem === 'valor') achados.sort((a, b) => (b[campoValor] ?? -1) - (a[campoValor] ?? -1));
  else achados.sort((a, b) => String(b[campoData] || '').localeCompare(String(a[campoData] || '')));
  return achados;
};

/* Maiores fornecedores pela SOMA do valor global dos contratos (valor previsto, não o pago).
   Junta pelo documento (CNPJ / CPF mascarado) e, sem documento, pelo nome. */
/* CHAVE da ficha de um fornecedor (vai no endereço #fornecedor/...):
   empresa -> os 14 números do CNPJ; pessoa física (CPF mascarado) ou sem documento -> "n-" + nome. */
OBS.contratos.chaveFornecedor = function (c) {
  const digitos = String(c.fornecedorDoc || '').replace(/\D/g, '');
  if (digitos.length === 14) return digitos;
  return `n-${OBS.slug(c.fornecedor)}${digitos ? '-' + digitos : ''}`;
};

OBS.contratos.fornecedores = function (contratos) {
  const grupos = new Map();
  for (const c of contratos) {
    const chave = OBS.contratos.chaveFornecedor(c);
    if (!grupos.has(chave)) grupos.set(chave, { chave, nome: c.fornecedor || '(sem nome)', doc: c.fornecedorDoc, contratos: 0, soma: 0 });
    const g = grupos.get(chave);
    g.contratos += 1;
    g.soma += typeof c.valorGlobal === 'number' ? c.valorGlobal : 0;
  }
  return [...grupos.values()].sort((a, b) => b.soma - a.soma);
};

/* Quantidade por um campo (ex.: modalidade), do mais frequente para o menos. */
OBS.contratos.contar = function (itens, campo) {
  const m = new Map();
  for (const it of itens) m.set(it[campo] || '(não informado)', (m.get(it[campo] || '(não informado)') || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

/* CONSÓRCIO intermunicipal (ex.: CISAMARP) tem sede em Videira e por isso aparece na consulta pelo código IBGE,
   mas é outra entidade e atende vários municípios: os contratos dele NÃO são do município e ficam fora dos totais. */
OBS.contratos.ehConsorcio = (item) => /\bCONS[OÓ]RCIO\b/i.test(item.orgao || '');

/* Data ISO (2025-12-10 ou 2025-12-10T...) para o formato brasileiro 10/12/2025. */
OBS.contratos.data = (iso) => OBS.dataBR(iso);
