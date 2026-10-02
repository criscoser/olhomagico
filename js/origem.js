/* COMPONENTE "ORIGEM DA INFORMAÇÃO": uma caixinha que abre e mostra de onde veio cada dado.
   É usado em todas as abas, sempre igual, para o cidadão poder conferir a fonte oficial.

   Recebe um objeto com (todos opcionais, menos fonte):
     fonte        nome da fonte oficial
     url          endereço da consulta mais específica possível (nunca a página inicial genérica)
     urlTexto     texto do link (padrão: "abrir a consulta oficial")
     tipo         tipo de informação (ex.: "Totais por órgão e credor")
     periodo      período ou competência a que os dados se referem
     consultadoEm data/hora em que ESTE site consultou a fonte (objeto Date)
     metodo       como o dado foi obtido
     identificador número ou código do registro na fonte (ex.: número de controle do PNCP), quando houver
     limitacao    o que a fonte não permite (ex.: não há link individual por registro) */
OBS.origem = function (info) {
  const { el } = OBS;
  const caixa = el('details', 'origem');
  caixa.append(el('summary', '', 'Origem da informação'));
  const lista = el('dl');

  /* Acrescenta uma linha "rótulo: valor" (o valor pode ser texto ou um elemento, como um link). */
  function linha(rotulo, valor) {
    if (valor === undefined || valor === null || valor === '') return;
    const dd = el('dd');
    dd.append(valor);
    lista.append(el('dt', '', rotulo), dd);
  }

  linha('Fonte', info.fonte);
  linha('Identificador original', info.identificador);
  if (OBS.urlSegura(info.url)) {   // nunca inventamos links: sem endereço válido, a linha não aparece
    const a = el('a', '', info.urlTexto || 'abrir a consulta oficial');
    a.href = OBS.urlSegura(info.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
    linha('Endereço', a);
  }
  linha('Tipo de informação', info.tipo);
  linha('Período', info.periodo);
  if (info.consultadoEm instanceof Date) linha('Consultado em', info.consultadoEm.toLocaleString('pt-BR'));
  linha('Como obtivemos', info.metodo);
  linha('Limitação', info.limitacao);

  caixa.append(lista);
  return caixa;
};
