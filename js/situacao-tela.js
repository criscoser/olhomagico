/* PAINEL "SITUAÇÃO DAS FONTES" (aba Sobre): mostra, para CADA fonte, quando foi a última cópia bem-sucedida
   e se a última tentativa falhou. Lê dados/situacao.js, gravado pelo coordenador dos robôs. */
OBS.situacaoTela = (function () {
  const { $, el } = OBS;
  let iniciado = false;
  const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca');

  async function abrir() {
    if (iniciado) return;
    iniciado = true;
    const ul = $('listaSituacao');
    const s = await OBS.fontes.arquivos.carregar('situacao.js', 'OBS_SITUACAO');
    const linhas = [el('li', '', 'Gastos da Prefeitura: consulta ao vivo, feita pelo seu navegador a cada pesquisa.')];
    if (!s) {
      linhas.push(el('li', 'meta', 'As cópias diárias ainda não foram feitas neste site.'));
    } else {
      Object.values(s).forEach((f) => {
        const li = el('li');
        li.append(el('strong', '', `${f.nome}: `), `última cópia válida em ${quando(f.ultimoSucesso)}.`);
        if (f.ok === false) li.append(el('span', 'faixa faixa-2', ` A última tentativa (${quando(f.ultimaTentativa)}) falhou; o site mostra a cópia anterior.`));
        linhas.push(li);
      });
    }
    ul.replaceChildren(...linhas);
  }

  return { abrir };
})();
