/* EXPORTAÇÃO EM CSV (planilha): só os dados que a fonte publicou, com fonte e período dentro do arquivo.
   Formato pensado para o Excel brasileiro: separador ";" e vírgula nos centavos. */
OBS.exportar = {};

/* Prepara um valor para uma célula do CSV.
   - Coloca entre aspas e dobra as aspas internas (padrão do CSV).
   - Proteção contra "injeção de fórmula": se o texto começar com = + - @ (ou tab/enter), o Excel poderia
     executá-lo como fórmula. Nesses casos, colocamos um apóstrofo na frente. */
OBS.exportar.celula = function (valor) {
  if (valor === null || valor === undefined) return '""';
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
  return '"' + texto.replace(/"/g, '""') + '"';
};

/* Número no formato brasileiro, sem "R$": 1234.5 -> "1234,50" (o Excel entende como número). */
OBS.exportar.numero = (n) => (typeof n === 'number' && Number.isFinite(n)) ? n.toFixed(2).replace('.', ',') : '';

/* Monta o CSV das despesas de um período a partir das linhas JÁ VALIDADAS da API. */
OBS.exportar.csvDespesas = function (linhas, periodo, meta) {
  const c = OBS.exportar.celula, n = OBS.exportar.numero;
  const cabecalho = [
    [c('Fonte'), c('API de Dados Abertos (Contabilidade) - Portal da Transparência de Videira')],
    [c('Consulta'), c(meta.url)],
    [c('Período'), c(`${periodo.ini} a ${periodo.fim}`)],
    [c('Consultado em'), c(meta.consultadoEm.toLocaleString('pt-BR'))],
    [c('Observação'), c('Valores como publicados pela fonte. Empenhado, liquidado e pago são etapas da MESMA despesa: não some as colunas. CPF de pessoa física mascarado.')]
  ];
  if (meta.filtros) cabecalho.push([c('Filtros aplicados'), c(meta.filtros)]);
  if (meta.descartadas) cabecalho.push([c('Registros ignorados'), c(`${meta.descartadas} com valores inválidos`)]);
  const colunas = ['Órgão', 'Unidade', 'Fonte de recurso', 'Credor', 'Tipo', 'Documento', 'Empenhado', 'Anulado', 'Liquidado', 'Retido', 'Pago'];
  const corpo = linhas.map((l) => {
    const doc = OBS.tratarDocumento(l.cpfCnpjCredor);
    const nome = (doc.tipo === 'Pessoa física' && !OBS.config.MOSTRAR_NOME_PESSOA_FISICA) ? 'Pessoa física (nome não exibido)' : l.nomeCredor;
    return [c(l.orgaoDescricao), c(l.unidadeDescricao), c(l.fonteRecursoDescricao), c(nome), c(doc.tipo), c(doc.texto),
      n(OBS.numero(l.valorEmpenhado)), n(OBS.numero(l.valorAnulado)), n(OBS.numero(l.valorLiquidado)),
      n(OBS.numero(l.valorRetido)), n(OBS.numero(l.valorPago))];
  });
  const linhasCsv = [...cabecalho, [], colunas.map(c), ...corpo].map((l) => l.join(';'));
  return '﻿' + linhasCsv.join('\r\n') + '\r\n'; // ﻿ faz o Excel reconhecer os acentos
};

/* Faz o navegador baixar um texto como arquivo (nada é enviado a nenhum servidor). */
OBS.exportar.baixar = function (texto, nomeArquivo) {
  const blob = new Blob([texto], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nomeArquivo;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* Planilha genérica a partir de uma TABELA do site (contratos, transferências, despesa por área...).
   info: { titulo, fonte, url, periodo, observacao }. colunas: [{titulo, valor(linha), tipo}] (tipo 'moeda' vira número). */
OBS.exportar.csvTabela = function (info, colunas, linhas) {
  const c = OBS.exportar.celula, n = OBS.exportar.numero;
  const cabecalho = [[c('Conteúdo'), c(info.titulo)], [c('Fonte'), c(info.fonte)]];
  if (info.url) cabecalho.push([c('Consulta'), c(info.url)]);
  if (info.periodo) cabecalho.push([c('Período'), c(info.periodo)]);
  cabecalho.push([c('Gerado em'), c(new Date().toLocaleString('pt-BR'))]);
  if (info.observacao) cabecalho.push([c('Observação'), c(info.observacao)]);
  const corpo = linhas.map((l) => colunas.map((col) => {
    const v = col.valor(l);
    return ['moeda', 'numero'].includes(col.tipo) ? n(v) : c(v);
  }));
  const todas = [...cabecalho, [], colunas.map((col) => c(col.titulo)), ...corpo].map((l) => l.join(';'));
  return '﻿' + todas.join('\r\n') + '\r\n';
};
