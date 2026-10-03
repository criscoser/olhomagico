/* REGRAS DO PIX (funções puras, sem tela, testadas em testes/testes.html).
   O código "Pix Copia e Cola" segue o padrão BR Code do Banco Central (formato EMV):
   uma sequência de campos "ID (2 dígitos) + TAMANHO (2 dígitos) + VALOR", terminada pelo
   campo 63 com um CRC16 (um "dígito verificador" de 4 letras/números).

   Por que conferir? Se alguém trocar só uma parte (a chave, o nome, ou só o código), a conferência
   falha e o site NÃO mostra nada de Pix ("falha fechada"). Assim, QR, código e chave dizem sempre
   a mesma coisa. Atenção: isto NÃO impede que alguém com acesso ao repositório troque TUDO junto;
   para isso existem as proteções do GitHub (veja docs e REGRAS_INVIOLAVEIS.md). */
OBS.pix = {};

/* CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), como manda o BR Code. Devolve 4 caracteres, ex.: "F8D7". */
OBS.pix.crc16 = function (texto) {
  let crc = 0xFFFF;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/* Lê os campos "ID TAMANHO VALOR". Devolve [[id, valor], ...] ou null se a estrutura estiver quebrada. */
OBS.pix.lerCampos = function (texto) {
  const campos = [];
  let i = 0;
  while (i < texto.length) {
    const id = texto.slice(i, i + 2), tamanho = texto.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(tamanho)) return null;
    const n = Number(tamanho);
    if (i + 4 + n > texto.length) return null;
    campos.push([id, texto.slice(i + 4, i + 4 + n)]);
    i += 4 + n;
  }
  return campos;
};

/* CONFERE o código Copia e Cola. esperado = { chave, recebedor }.
   Devolve { ok: true } ou { ok: false, motivo } (o motivo vai só para o console, nunca para a tela). */
OBS.pix.validar = function (codigo, esperado) {
  const falha = (motivo) => ({ ok: false, motivo });
  const c = String(codigo || '');
  if (!/^[\x20-\x7E]+$/.test(c)) return falha('caracteres inválidos ou código vazio');
  if (!/6304[0-9A-F]{4}$/.test(c)) return falha('sem o campo 63 (CRC) no final');
  if (OBS.pix.crc16(c.slice(0, -4)) !== c.slice(-4)) return falha('CRC não confere');
  const campos = OBS.pix.lerCampos(c);
  if (!campos) return falha('estrutura de campos quebrada');
  const ids = campos.map(([id]) => id);
  if (new Set(ids).size !== ids.length) return falha('campo repetido');
  const campo = Object.fromEntries(campos);
  if (campo['00'] !== '01') return falha('campo 00 (formato) inválido');
  const conta = OBS.pix.lerCampos(campo['26'] || '');
  if (!conta) return falha('campo 26 (conta) quebrado');
  const sub = Object.fromEntries(conta);
  if (String(sub['00'] || '').toLowerCase() !== 'br.gov.bcb.pix') return falha('campo 26 não é Pix');
  if (sub['01'] !== esperado.chave) return falha('a chave do código é diferente da chave configurada');
  if (campo['53'] !== '986') return falha('moeda não é o real');
  if (campo['58'] !== 'BR') return falha('país não é BR');
  if (campo['59'] !== esperado.recebedor) return falha('o nome do recebedor é diferente do configurado');
  return { ok: true };
};

/* Atalho com o nome usado no plano do projeto: confere o código da configuração. */
OBS.pixCodigoValido = function (config = OBS.config) {
  return OBS.pix.validar(config.PIX_COPIA_E_COLA, { chave: config.PIX_CHAVE, recebedor: config.PIX_RECEBEDOR });
};
