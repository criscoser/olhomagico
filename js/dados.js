/* DADOS PREPARADOS, compartilhados entre as telas (abas, busca geral e fichas).
   Cada conjunto é carregado UMA vez e preparado UMA vez (texto de busca, endereço da ficha...).
   Se o arquivo da cópia diária não existir, devolve null e a tela explica. */
OBS.dados = (function () {
  const promessas = {};
  const umaVez = (nome, fn) => (promessas[nome] = promessas[nome] || fn());

  /* Lista de servidores com texto de busca e endereço de ficha. */
  const pessoal = () => umaVez('pessoal', async () => {
    const d = await OBS.fontes.pessoal.carregar();
    if (!d) return null;
    return { meta: d.meta, lista: OBS.pessoal.comIds(OBS.pessoal.preparar(d.servidores)) };
  });

  /* Contratos e compras do PNCP, com os fornecedores já somados. */
  const pncp = () => umaVez('pncp', async () => {
    const d = await OBS.fontes.arquivos.carregar('pncp.js', 'OBS_DADOS_PNCP');
    if (!d || !Array.isArray(d.contratos) || !Array.isArray(d.compras)) return null;
    const contratos = OBS.contratos.preparar(d.contratos, ['fornecedor', 'objeto', 'orgao', 'fornecedorDoc'])
      .map((c) => Object.assign(c, { _chaveFornecedor: OBS.contratos.chaveFornecedor(c),
        _digitos: String(c.fornecedorDoc || '').replace(/\D/g, '') }));   // para achar pelo CNPJ digitado com pontos
    const compras = OBS.contratos.preparar(d.compras, ['objeto', 'modalidade', 'orgao', 'unidade']);
    const fornecedores = OBS.contratos.fornecedores(contratos)
      .map((f) => Object.assign(f, { _busca: OBS.pessoal.normalizar(`${f.nome} ${f.doc || ''}`), _digitos: f.chave }));
    return { meta: d.meta, contratos, compras, fornecedores };
  });

  /* Arquivos pequenos, usados como vieram (cada tela confere o formato). */
  const arquivo = (nome, variavel) => umaVez(nome, () => OBS.fontes.arquivos.carregar(nome, variavel));
  const siconfi = () => arquivo('siconfi.js', 'OBS_DADOS_SICONFI');
  const transferencias = () => arquivo('transferencias.js', 'OBS_DADOS_TRANSFERENCIAS');
  const dca = () => arquivo('dca.js', 'OBS_DADOS_DCA');
  const siope = () => arquivo('siope.js', 'OBS_DADOS_SIOPE');
  const entregas = () => arquivo('entregas.js', 'OBS_DADOS_ENTREGAS');
  const situacao = () => arquivo('situacao.js', 'OBS_SITUACAO');
  const cgu = () => arquivo('cgu.js', 'OBS_DADOS_CGU');
  const camara = () => arquivo('camara.js', 'OBS_DADOS_CAMARA');

  return { pessoal, pncp, siconfi, transferencias, dca, siope, entregas, situacao, cgu, camara };
})();
