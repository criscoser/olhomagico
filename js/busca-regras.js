/* REGRAS DA PESQUISA GERAL (caixa "Pesquisar" no topo): procura ao mesmo tempo em
   servidores, fornecedores, contratos e licitações. Funções sem tela, fáceis de testar. */
OBS.buscaGlobal = {};

/* Transforma o que a pessoa digitou em "palavras" de busca.
   Um CNPJ digitado com pontos e barra ("12.345.678/0001-90") vira só os números. */
OBS.buscaGlobal.palavras = function (termo) {
  const t = String(termo || '').trim();
  if (/^[\d.\/\s-]+$/.test(t)) {
    const digitos = t.replace(/\D/g, '');
    return digitos.length >= 3 ? [digitos] : [];
  }
  return OBS.pessoal.normalizar(t).split(/\s+/).filter((p) => p.length >= 2);
};

/* Procura em cada conjunto (cada item precisa ter o campo _busca). TODAS as palavras precisam aparecer.
   conjuntos: { servidores, fornecedores, contratos, compras } (qualquer um pode faltar). */
OBS.buscaGlobal.procurar = function (termo, conjuntos) {
  const palavras = OBS.buscaGlobal.palavras(termo);
  const resultado = {};
  Object.entries(conjuntos).forEach(([nome, itens]) => {
    resultado[nome] = !palavras.length || !itens ? [] : itens.filter((it) => {
      const texto = it._busca + ' ' + String(it._digitos || '');
      return palavras.every((p) => texto.includes(p));
    });
  });
  return resultado;
};
