/* TELA DA PESQUISA GERAL (#busca/termo): mostra, agrupado, o que foi encontrado em
   servidores, fornecedores, contratos e licitações. Cada resultado leva à ficha ou ao registro oficial. */
OBS.buscaTela = (function () {
  const { $, el, qtd } = OBS;
  const MAX_POR_GRUPO = 8;
  let pesquisa = 0;   // número da pesquisa mais recente: se uma antiga terminar depois, ela é ignorada

  /* Um grupo de resultados: título com a quantidade, uma tabela curta e um atalho para ver todos. */
  function grupo(titulo, itens, colunas, verTodos) {
    const sec = el('section', 'grupo-busca');
    sec.append(el('h3', '', `${titulo} (${qtd(itens.length)})`));
    const t = OBS.tabela({ colunas, porPagina: MAX_POR_GRUPO, legenda: titulo });
    sec.append(t.elemento); t.mostrar(itens);
    if (verTodos && itens.length > MAX_POR_GRUPO) sec.append(verTodos);
    return sec;
  }

  /* Botão que leva à aba com o mesmo texto já digitado no filtro dela. */
  function atalho(texto, aba, idCampo, termo) {
    const b = el('button', 'sec', texto); b.type = 'button';
    b.addEventListener('click', async () => {
      await OBS.rotas.irPara(`#${aba}`);   // espera a tela ficar pronta antes de preencher o filtro dela
      const campo = $(idCampo); campo.value = termo; campo.dispatchEvent(new Event('input'));
      campo.closest('section').scrollIntoView({ block: 'start' });
    });
    return b;
  }

  async function abrir(termo) {
    const minha = ++pesquisa;
    $('campoBusca').value = termo;
    $('buscaTitulo').textContent = termo ? `Pesquisa: “${termo}”` : 'Pesquisa';
    const resumo = $('buscaResumoGeral'), caixa = $('buscaResultados');
    caixa.replaceChildren();
    if (!OBS.buscaGlobal.palavras(termo).length) {
      resumo.textContent = 'Digite pelo menos duas letras (ou três números de um CNPJ) na caixa de pesquisa, no topo da página.';
      return;
    }
    resumo.replaceChildren(OBS.status('carregando', 'Procurando…'));
    const [pes, pn] = await Promise.all([OBS.dados.pessoal(), OBS.dados.pncp()]);
    if (minha !== pesquisa) return;   // a pessoa já fez outra pesquisa
    const r = OBS.buscaGlobal.procurar(termo, {
      servidores: pes && pes.lista, fornecedores: pn && pn.fornecedores, contratos: pn && pn.contratos, compras: pn && pn.compras
    });
    const total = r.servidores.length + r.fornecedores.length + r.contratos.length + r.compras.length;
    resumo.replaceChildren();
    resumo.textContent = total
      ? `${qtd(total)} resultado(s). Nomes iguais não querem dizer que é a mesma pessoa ou empresa: confira o cargo, o CNPJ e os detalhes.`
      : 'Nada encontrado. Confira a grafia, tente só uma parte do nome, ou procure pelo CNPJ.';
    if (r.servidores.length) {
      caixa.append(grupo('Servidores', r.servidores, [
        { chave: 'nome', titulo: 'Nome', link: (s) => OBS.rotas.link.servidor(s) },
        { chave: 'cargo', titulo: 'Cargo' }, { chave: 'lotacao', titulo: 'Setor' },
        { chave: 'salario', titulo: 'Salário-base', tipo: 'moeda' }], atalho('Ver todos na lista de servidores', 'servidores', 'buscaServidor', termo)));
    }
    if (r.fornecedores.length) {
      caixa.append(grupo('Fornecedores com contrato', r.fornecedores, [
        { chave: 'nome', titulo: 'Fornecedor', link: (f) => OBS.rotas.link.fornecedor(f.chave) },
        { chave: 'doc', titulo: 'Documento' }, { chave: 'contratos', titulo: 'Contratos', tipo: 'numero' },
        { chave: 'soma', titulo: 'Valor global', tipo: 'moeda' }]));
    }
    if (r.contratos.length) {
      caixa.append(grupo('Contratos', r.contratos, [
        { chave: 'objeto', titulo: 'Objeto', link: (c) => OBS.rotas.link.contrato(c), formatar: (v) => OBS.resumirTexto(v, 90) || '(sem descrição)' },
        { chave: 'fornecedor', titulo: 'Fornecedor' }, { chave: 'dataAssinatura', titulo: 'Assinatura', tipo: 'data' },
        { chave: 'valorGlobal', titulo: 'Valor global', tipo: 'moeda' }], atalho('Ver todos na lista de contratos', 'contratos', 'buscaContrato', termo)));
    }
    if (r.compras.length) {
      caixa.append(grupo('Licitações e compras', r.compras, [
        { chave: 'objeto', titulo: 'Objeto', link: (c) => c.url, formatar: (v) => OBS.resumirTexto(v, 90) || '(sem descrição)' },
        { chave: 'modalidade', titulo: 'Modalidade' }, { chave: 'dataPublicacao', titulo: 'Publicação', tipo: 'data' },
        { chave: 'valorEstimado', titulo: 'Estimado', tipo: 'moeda' }], atalho('Ver todas na lista de licitações', 'contratos', 'buscaCompra', termo)));
    }
    const faltando = [!pes && 'servidores', !pn && 'contratos e licitações'].filter(Boolean);
    if (faltando.length) caixa.append(el('p', 'meta', `Ainda sem cópia neste site: ${faltando.join(' e ')}. A pesquisa não incluiu esses dados.`));
    caixa.append(el('p', 'meta', 'A pesquisa não inclui os gastos do mês (consultados ao vivo): para eles, use a aba Gastos do mês.'));
  }

  /* Liga a caixa de pesquisa do topo: enviar leva para #busca/termo. */
  function ligar() {
    $('formBusca').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const termo = $('campoBusca').value.trim();
      const destino = OBS.rotas.link.busca(termo);
      if (location.hash === destino) OBS.rotas.mostrar(); else location.hash = destino;
    });
  }

  return { abrir, ligar };
})();
