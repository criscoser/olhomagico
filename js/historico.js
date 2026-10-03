/* VÁRIOS MESES DE DESPESAS: usado na "evolução mensal" (aba Gastos) e nos pagamentos de um fornecedor (ficha).
   A API de despesas só aceita um período por vez, então fazemos UMA consulta por mês, uma depois da outra
   (nunca todas ao mesmo tempo, para não sobrecarregar o portal). Cada mês fica na memória da página (OBS.cache):
   se a pessoa voltar a ele, não consultamos de novo. */
OBS.cache = OBS.cache || new Map();

OBS.historico = {
  /* Lista de meses "AAAA-MM", terminando em "ultimo" e voltando "n" meses. Ex.: ('2026-02', 3) -> 2025-12, 2026-01, 2026-02. */
  meses(ultimo, n) {
    const [ano, mes] = ultimo.split('-').map(Number);
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(ano, mes - 1 - (n - 1 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  },

  /* Busca UM mês (ou devolve da memória). Resolve com { linhas (já validadas), descartadas, consultadoEm }. */
  async mes(anoMes) {
    if (OBS.cache.has(anoMes)) return OBS.cache.get(anoMes);
    const p = OBS.periodoDoMes(anoMes);
    const brutas = await OBS.fontes.despesas.buscar(p.ini, p.fim);
    const { validas, descartadas } = OBS.fontes.despesas.validar(brutas);
    const dados = { linhas: validas, recebidas: brutas.length, descartadas: descartadas.length, consultadoEm: new Date() };
    if (brutas.length > 0) OBS.cache.set(anoMes, dados);   // respostas vazias não ficam guardadas
    return dados;
  },

  /* Busca vários meses, um de cada vez. "aoAvancar(feitos, total)" atualiza a mensagem de progresso.
     Um mês que falhar não derruba os outros: ele volta com "erro". */
  async varios(listaMeses, aoAvancar = () => {}) {
    const resultado = [];
    for (let i = 0; i < listaMeses.length; i++) {
      try {
        resultado.push(Object.assign({ anoMes: listaMeses[i] }, await this.mes(listaMeses[i])));
      } catch (erro) {
        resultado.push({ anoMes: listaMeses[i], erro: erro.name === 'AbortError' ? 'a fonte demorou demais' : (erro.message || 'falha') });
      }
      aoAvancar(i + 1, listaMeses.length);
    }
    return resultado;
  },

  /* Totais de cada mês, nas três etapas SEPARADAS (nunca somadas entre si). Mês com erro fica com valores null. */
  totaisPorMes(resultado) {
    return resultado.map((r) => {
      if (r.erro) return { anoMes: r.anoMes, erro: r.erro, empenhado: null, liquidado: null, pago: null };
      const t = OBS.agregar(r.linhas).total;
      return { anoMes: r.anoMes, empenhado: t.empenhado, liquidado: t.liquidado, pago: t.pago, vazio: r.linhas.length === 0 };
    });
  },

  /* O que UM credor (pelo CNPJ, só números) recebeu em cada mês, nas três etapas, e de quais órgãos.
     Só junta pelo documento, nunca pelo nome. */
  doCredor(resultado, cnpj) {
    return resultado.map((r) => {
      if (r.erro) return { anoMes: r.anoMes, erro: r.erro, empenhado: null, liquidado: null, pago: null, orgaos: [], nome: null };
      const minhas = r.linhas.filter((l) => String(l.cpfCnpjCredor || '').replace(/\D/g, '') === cnpj);
      const t = OBS.agregar(minhas);
      return { anoMes: r.anoMes, empenhado: t.total.empenhado, liquidado: t.total.liquidado, pago: t.total.pago,
        orgaos: t.orgaos.map((o) => [o.nome, o.pago]), nome: minhas.length ? minhas[0].nomeCredor : null };
    });
  },

  /* Totais por mês a partir do RESUMO DIÁRIO do robô (dados/despesas-resumo.js), no mesmo formato de totaisPorMes.
     Devolve null se faltar algum dos meses pedidos (aí o site consulta a API ao vivo). "parcial" = mês em andamento. */
  doResumo(resumo, listaMeses) {
    if (!resumo || !Array.isArray(resumo.meses)) return null;
    const porMes = new Map(resumo.meses.map((m) => [m.anoMes, m]));
    const saida = [];
    for (const anoMes of listaMeses) {
      const m = porMes.get(anoMes);
      if (!m || !m.total) return null;
      saida.push({ anoMes, empenhado: m.total.empenhado, liquidado: m.total.liquidado, pago: m.total.pago,
        vazio: m.registros === 0, parcial: Boolean(m.parcial), credoresQueReceberam: m.credoresQueReceberam });
    }
    return saida;
  },

  /* "2026-03" -> "mar/26" (rótulo curto para gráficos). */
  rotulo(anoMes) {
    const [ano, mes] = anoMes.split('-');
    return `${OBS.mesCurto(Number(mes))}/${ano.slice(2)}`;
  }
};
