/* REGRAS DE NEGÓCIO: transforma muitas linhas da API em totais fáceis de entender.
   Tudo acontece na memória, sem salvar nada. Recebe linhas JÁ VALIDADAS.

   Além dos totais, guardamos "quem pagou quem" para permitir o clique:
   - em cada SECRETARIA: quais credores ela pagou, por quais setores e de qual fonte de dinheiro;
   - em cada CREDOR: quais secretarias pagaram e de qual fonte de dinheiro. */

/* Soma "valor" na chave "chave" de um Map (cria a chave com 0 se não existir). */
OBS.somarEm = function (mapa, chave, valor) {
  mapa.set(chave, (mapa.get(chave) || 0) + valor);
};

/* Transforma um Map em lista [[nome, valor], ...] do MAIOR para o MENOR valor. */
OBS.ordenar = function (mapa) {
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
};

OBS.agregar = function (linhas) {
  // Totais gerais por etapa. NÃO são somados entre si: cada etapa é uma "foto" do mesmo gasto.
  const total = { empenhado: 0, liquidado: 0, pago: 0, anulado: 0, retido: 0 };
  const credores = new Map(); // chave do credor -> dados do credor
  const orgaos = new Map();   // nome da secretaria -> dados da secretaria
  const fontes = new Map();   // origem do dinheiro -> valor pago

  for (const l of linhas) {
    const emp = OBS.numero(l.valorEmpenhado), liq = OBS.numero(l.valorLiquidado), pag = OBS.numero(l.valorPago);
    total.empenhado += emp; total.liquidado += liq; total.pago += pag;
    // Anulado e retido: se vierem vazios, contam como 0 (não são obrigatórios para validar a linha).
    total.anulado += OBS.numero(l.valorAnulado) || 0;
    total.retido += OBS.numero(l.valorRetido) || 0;

    // Textos da linha, com um valor padrão quando a fonte não informar.
    const orgao = (l.orgaoDescricao || '').trim() || '(órgão não informado)';
    const unidade = (l.unidadeDescricao || '').trim() || '(setor não informado)';
    const fonte = (l.fonteRecursoDescricao || '').trim() || '(origem não informada)';

    // CREDOR: juntamos pelo documento (ou, sem ele, pelo nome).
    // Não juntamos por nomes parecidos: isso poderia ligar pessoas diferentes por engano.
    const doc = String(l.cpfCnpjCredor || '').replace(/\D/g, '');
    const chave = doc || l.nomeCredor || '(sem nome)';
    if (!credores.has(chave)) {
      credores.set(chave, { chave, nome: l.nomeCredor || '(sem nome)', doc: l.cpfCnpjCredor,
        pago: 0, empenhado: 0, liquidado: 0, porOrgao: new Map(), porFonte: new Map() });
    }
    const c = credores.get(chave);
    c.pago += pag; c.empenhado += emp; c.liquidado += liq;
    OBS.somarEm(c.porOrgao, orgao, pag);
    OBS.somarEm(c.porFonte, fonte, pag);

    // SECRETARIA (órgão): quanto pagou, a quem, por qual setor e com dinheiro de qual origem.
    if (!orgaos.has(orgao)) {
      orgaos.set(orgao, { nome: orgao, pago: 0, porCredor: new Map(), porUnidade: new Map(), porFonte: new Map() });
    }
    const o = orgaos.get(orgao);
    o.pago += pag;
    OBS.somarEm(o.porCredor, chave, pag);
    OBS.somarEm(o.porUnidade, unidade, pag);
    OBS.somarEm(o.porFonte, fonte, pag);

    // ORIGEM DO DINHEIRO (fonte de recurso).
    OBS.somarEm(fontes, fonte, pag);
  }

  return {
    total,
    credores: [...credores.values()].sort((a, b) => b.pago - a.pago), // do maior para o menor valor pago
    credoresPorChave: credores,                                       // para achar o nome a partir da chave
    orgaos: [...orgaos.values()].sort((a, b) => b.pago - a.pago),
    fontes: OBS.ordenar(fontes)
  };
};

/* FILTRO DOS REGISTROS DE DESPESA (função pura, testada). Combina os filtros; vazio = todos.
   f = { orgao, unidade, fonte (valores exatos), credor (texto: parte do nome, sem acento, ou parte do CNPJ) } */
OBS.filtrarDespesas = function (linhas, f) {
  const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termo = norm(f.credor).trim();
  const digitos = String(f.credor || '').replace(/\D/g, '');
  // Busca por números SÓ em CNPJ (empresas). CPF de pessoa física nunca é pesquisável (privacidade).
  const cnpj = (l) => { const d = String(l.cpfCnpjCredor || '').replace(/\D/g, ''); return d.length === 14 ? d : ''; };
  return (linhas || []).filter((l) => (!f.orgao || l.orgaoDescricao === f.orgao) && (!f.unidade || l.unidadeDescricao === f.unidade) &&
    (!f.fonte || l.fonteRecursoDescricao === f.fonte) &&
    (!termo || norm(l.nomeCredor).includes(termo) || (digitos.length >= 3 && cnpj(l).includes(digitos))));
};
