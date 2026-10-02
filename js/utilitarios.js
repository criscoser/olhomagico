/* UTILITÁRIOS: funções pequenas e reaproveitáveis. Não sabem nada sobre a Prefeitura.
   Por isso são fáceis de testar (veja testes/testes.html). */

/* Atalho para buscar um elemento da página pelo id. */
OBS.$ = (id) => document.getElementById(id);

/* A API manda valores como TEXTO ("2030.00"). Esta função vira número.
   Se o texto for inválido, devolve null (e NÃO zero, para não esconder um erro). */
OBS.numero = function (valor) {
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : null;
};

/* Formata número como dinheiro brasileiro: 1234.5 -> "R$ 1.234,50". */
OBS.moeda = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* Cria um elemento HTML com texto seguro.
   Usamos textContent (e não innerHTML) para que nomes vindos da API nunca sejam executados como código. */
OBS.el = function (tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
};

/* Descobre se o documento é CPF (11 dígitos, pessoa física) ou CNPJ (14, empresa).
   CPF é MASCARADO (***.123.456-**) por privacidade. CNPJ aparece formatado e completo. */
OBS.tratarDocumento = function (bruto) {
  const d = String(bruto || '').replace(/\D/g, ''); // tira tudo que não é número
  if (d.length === 11) return { tipo: 'Pessoa física', texto: `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` };
  if (d.length === 14) return { tipo: 'Empresa ou entidade', texto: d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') };
  return { tipo: 'Documento não informado', texto: '' };
};

/* Transforma "2026-09" no período que a API entende: de 01/09/2026 a 30/09/2026.
   Um mês inteiro sempre fica dentro do mesmo ano, como a API exige. */
OBS.periodoDoMes = function (anoMes) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate(); // dia 0 do mês seguinte = último dia deste mês
  const dois = (n) => String(n).padStart(2, '0');
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return { ini: `01/${dois(mes)}/${ano}`, fim: `${dois(ultimoDia)}/${dois(mes)}/${ano}`, nome };
};

/* Nomes dos meses, para o seletor. */
OBS.MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/* Mês anterior a uma data, como "AAAA-MM".
   Usa o dia 1: "31 de março menos um mês" daria 31 de fevereiro, que o JavaScript transforma em março. */
OBS.mesAnterior = function (data) {
  const d = new Date(data.getFullYear(), data.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* Data ISO (2025-12-10 ou 2025-12-10T09:00) no formato brasileiro 10/12/2025. Texto inválido -> ''. */
OBS.dataBR = function (iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

/* "Endereço amigável" de um texto, usado nos links das fichas: "JOÃO DA SILVA" -> "joao-da-silva". */
OBS.slug = function (texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

/* Quantidade com separador de milhar: 3049 -> "3.049". */
OBS.qtd = (n) => Number(n || 0).toLocaleString('pt-BR');

/* Nome curto do mês: 1 -> "jan". */
OBS.mesCurto = (m) => ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][m - 1] || '?';

/* Encurta um texto longo (objetos de contrato podem ter parágrafos inteiros): corta numa palavra e põe "…". */
OBS.resumirTexto = function (texto, max = 120) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(' ', max - 1) > max * 0.6 ? t.lastIndexOf(' ', max - 1) : max - 1) + '…';
};

/* PAGINAÇÃO (função pura): qual fatia mostrar. Página fora do intervalo é corrigida para a mais próxima.
   Ex.: paginar(45, 3, 20) -> { pagina: 3, paginas: 3, inicio: 40, fim: 45 } */
OBS.paginar = function (total, pagina, porPagina) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const p = Math.min(Math.max(1, Math.floor(pagina) || 1), paginas);
  return { pagina: p, paginas, inicio: (p - 1) * porPagina, fim: Math.min(total, p * porPagina) };
};

/* Só deixa passar endereços seguros para links: "https://...", "http://..." ou "#..." (dentro do site).
   Qualquer outra coisa (ex.: "javascript:...") vira null e o texto aparece sem link. */
OBS.urlSegura = function (url) {
  const u = String(url || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(u) || /^#[^\s]*$/.test(u) ? u : null;
};
