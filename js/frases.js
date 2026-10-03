/* GERADOR DE FRASES (camada 1 da linguagem simples): transforma DADOS em frases curtas, sempre com o mesmo padrão.
   Regras (testadas em testes/testes.html):
     - ordem direta, período primeiro e por extenso ("Em setembro de 2026, ...");
     - SUJEITO CERTO para cada fonte: API de despesas, PNCP e lista de pessoal = "o Município" (incluem Câmara,
       autarquias e fundos); RGF do Executivo = "a Prefeitura"; relatórios ao Tesouro/FNDE = "declarou";
     - NENHUM adjetivo ou opinião (lista PROIBIDAS abaixo);
     - valores grandes por extenso ("R$ 46,2 milhões"); singular de 1 até menos de 2 ("R$ 1,5 milhão");
     - percentual comparado com limite da lei aparece com as casas da fonte (nunca arredondado para cima ou para baixo
       de um limite: 53,98% nunca vira "54%");
     - dado parcial diz que é parcial NA PRÓPRIA FRASE; ausência de dado nunca vira "R$ 0".
   Estas funções não mexem na tela: devolvem texto. */
OBS.frases = (function () {
  /* Palavras que dão opinião, tom ou julgamento. "alta/queda de X%" (variação) é permitido. */
  const PROIBIDAS = ['alto', 'altos', 'baixo', 'baixos', 'baixa', 'baixas', 'apenas', 'só', 'somente', 'quase', 'muito', 'muita',
    'bastante', 'enorme', 'enormes', 'excessivo', 'excessiva', 'impressionante', 'preocupante', 'desperdiçou', 'desperdício',
    'irregular', 'irregularidade', 'disparou', 'despencou', 'economizou', 'absurdo', 'escandaloso', 'gastança', 'rombo'];

  /* Devolve a primeira palavra proibida encontrada no texto, ou null. */
  function opiniao(texto) {
    const palavras = String(texto || '').toLowerCase().split(/[^\p{L}]+/u);
    const achada = palavras.find((p) => PROIBIDAS.includes(p));
    if (achada) return achada;
    return /gastou demais/i.test(texto) ? 'gastou demais' : null;
  }

  /* Valor em reais, por extenso para quem lê rápido: 46165401.23 -> "R$ 46,2 milhões"; 1500000 -> "R$ 1,5 milhão";
     980000 -> "R$ 980 mil"; 2000000 -> "R$ 2 milhões"; valores menores que mil, com centavos. Negativo com "−". */
  function reais(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    const sinal = n < 0 ? '−' : '', abs = Math.abs(n);
    const fmt = (v, casas) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
    const escala = (div, um, varios) => {
      const v = Math.round((abs / div) * 10) / 10;            // uma casa decimal
      return `${sinal}R$ ${fmt(v, 1)} ${v < 2 ? um : varios}`;   // espaço que não quebra: "R$" nunca fica sozinho na linha
    };
    if (abs >= 1e9) return escala(1e9, 'bilhão', 'bilhões');
    if (abs >= 1e6) return escala(1e6, 'milhão', 'milhões');
    if (abs >= 1e3) return `${sinal}R$ ${fmt(Math.round(abs / 1e3), 0)} mil`;
    return sinal + OBS.moeda(abs);
  }

  /* Percentual com as casas que a fonte publicou (até 2), em vírgula: 43.77 -> "43,77%"; 54 -> "54%". */
  const pct = (n) => (typeof n === 'number' ? `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%` : '—');

  /* "2026-09" -> "setembro de 2026". */
  const mes = (anoMes) => OBS.periodoDoMes(anoMes).nome;

  /* ---------- Frases de cada pergunta ---------- */

  /* Gastos do mês (resumo diário ou consulta ao vivo). m = { anoMes, pago, parcial, vazio } */
  function gastoDoMes(m) {
    if (!m || m.vazio) return `A fonte ainda não publicou os gastos de ${m ? mes(m.anoMes) : 'este mês'}.`;
    if (m.parcial) return `Até agora em ${mes(m.anoMes)} (o mês ainda não terminou), o Município de Videira pagou ${reais(m.pago)}.`;
    return `Em ${mes(m.anoMes)}, o Município de Videira pagou ${reais(m.pago)}.`;
  }

  /* Transferências constitucionais no ano até um mês. */
  function transferencias(ano, ateMes, total) {
    const ate = OBS.MESES[ateMes - 1].toLowerCase();
    return `De janeiro a ${ate} de ${ano}, Videira recebeu ${reais(total)} em transferências constitucionais (FPM, FUNDEB e outras), ` +
      'segundo o Tesouro Nacional. O último mês pode estar incompleto.';
  }

  /* Lista de pessoal (Município inteiro). r = { registros, comissionados, inativos? } */
  function pessoal(r) {
    const qtd = OBS.qtd;
    let f = `A lista de pessoal do Município tem ${qtd(r.registros)} registros`;
    if (typeof r.inativos === 'number' && r.inativos > 0) f += `, incluindo ${qtd(r.inativos)} de aposentados e pensionistas`;
    f += '.';
    if (typeof r.comissionados === 'number') f += ` ${qtd(r.comissionados)} são cargos de indicação (comissionados).`;
    return f;
  }

  /* Contratos do PNCP (só órgãos do Município). r = { contratos, valorGlobal } */
  function contratos(r) {
    return `Nos últimos 12 meses, os órgãos do Município publicaram ${OBS.qtd(r.contratos)} contratos no PNCP, ` +
      `com valor previsto somado de ${reais(r.valorGlobal)} (valor previsto, não o pago).`;
  }

  /* Gasto com pessoal da Prefeitura (RGF, Poder Executivo): número declarado e o limite máximo da lei. */
  function limitePessoal(p) {
    return `No ${p.rotulo}, a Prefeitura declarou ao Tesouro um gasto com pessoal de ${pct(p.dtpPct)} da receita corrente líquida. ` +
      `O limite máximo da lei é ${pct(p.limiteMaximoPct)}.`;
  }

  /* Pauta mais recente publicada pela Câmara. */
  function pautaCamara(p) {
    const data = OBS.dataBR(p.data);
    return `A pauta mais recente publicada pela Câmara é “${p.titulo}”${data ? `, de ${data}` : ''}.`;
  }

  return { PROIBIDAS, opiniao, reais, pct, gastoDoMes, transferencias, pessoal, contratos, limitePessoal, pautaCamara };
})();
