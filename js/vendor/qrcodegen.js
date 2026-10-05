/* GERADOR DE QR CODE (sem biblioteca externa, sem serviço externo).
   Adaptado para o Olho Mágico a partir do "QR Code generator library" de Project Nayuki
   (https://www.nayuki.io/page/qr-code-generator-library), mantendo o mesmo algoritmo, mas só com o
   modo "byte" (suficiente para o código Pix). Conferido bit a bit contra a versão original em Python
   (veja testes/testes.html e o histórico do Git).

   Copyright (c) Project Nayuki. (MIT License)
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
   associated documentation files (the "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
   following conditions:
   - The above copyright notice and this permission notice shall be included in all copies or substantial
     portions of the Software.
   - The Software is provided "as is", without warranty of any kind, express or implied, including but not
     limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no
     event shall the authors or copyright holders be liable for any claim, damages or other liability, whether
     in an action of contract, tort or otherwise, arising from, out of or in connection with the Software or
     the use or other dealings in the Software.

   Uso: OBS.qr.gerar(texto, 'M') -> { versao, tamanho, nivel, mascara, modulo(x, y) }   (true = escuro)
        OBS.qr.svg(qr, margem)  -> elemento <svg> (preto sobre branco) */
window.OBS = window.OBS || {};

OBS.qr = (function () {
  // Nível de correção de erro: índice nas tabelas e "bits de formato" do padrão.
  const NIVEIS = { L: { ordem: 0, bits: 1 }, M: { ordem: 1, bits: 0 }, Q: { ordem: 2, bits: 3 }, H: { ordem: 3, bits: 2 } };
  const ORDEM_NIVEIS = ['L', 'M', 'Q', 'H'];

  const ECC_POR_BLOCO = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  const NUM_BLOCOS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  const MASCARAS = [
    (x, y) => (x + y) % 2, (x, y) => y % 2, (x, y) => x % 3, (x, y) => (x + y) % 3,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2, (x, y) => x * y % 2 + x * y % 3,
    (x, y) => (x * y % 2 + x * y % 3) % 2, (x, y) => ((x + y) % 2 + x * y % 3) % 2
  ];

  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  /* Texto -> bytes UTF-8 (feito à mão para funcionar em qualquer navegador e nos testes do Node). */
  function utf8(texto) {
    const out = [];
    for (const ch of String(texto)) {
      const c = ch.codePointAt(0);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function modulosBrutos(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  const palavrasDeDados = (ver, nivel) => Math.floor(modulosBrutos(ver) / 8) - ECC_POR_BLOCO[nivel.ordem][ver] * NUM_BLOCOS[nivel.ordem][ver];

  // ---- Reed-Solomon (correção de erros) ----
  function rsMultiplicar(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(grau) {
    const r = new Array(grau).fill(0); r[grau - 1] = 1;
    let raiz = 1;
    for (let i = 0; i < grau; i++) {
      for (let j = 0; j < grau; j++) { r[j] = rsMultiplicar(r[j], raiz); if (j + 1 < grau) r[j] ^= r[j + 1]; }
      raiz = rsMultiplicar(raiz, 0x02);
    }
    return r;
  }
  function rsResto(dados, divisor) {
    const r = divisor.map(() => 0);
    for (const b of dados) {
      const fator = b ^ r.shift(); r.push(0);
      divisor.forEach((coef, i) => { r[i] ^= rsMultiplicar(coef, fator); });
    }
    return r;
  }

  /* Monta o QR Code. texto: string; nivelMinimo: 'L' | 'M' | 'Q' | 'H' (o nível sobe sozinho se couber na mesma versão). */
  function gerar(texto, nivelMinimo = 'M') {
    const dados = utf8(texto);
    let nivel = NIVEIS[nivelMinimo];
    if (!nivel) throw new Error('nível de correção inválido');

    // Menor versão em que os dados cabem (modo byte: 4 bits de modo + contador de 8 ou 16 bits + 8 bits por byte).
    let ver, bitsUsados;
    for (ver = 1; ver <= 40; ver++) {
      bitsUsados = 4 + (ver <= 9 ? 8 : 16) + dados.length * 8;
      if (bitsUsados <= palavrasDeDados(ver, nivel) * 8) break;
    }
    if (ver > 40) throw new Error('texto longo demais para um QR Code');
    for (const n of ['M', 'Q', 'H']) if (bitsUsados <= palavrasDeDados(ver, NIVEIS[n]) * 8) nivel = NIVEIS[n];

    // Sequência de bits: modo byte (0100), quantidade, dados, terminador, alinhamento e preenchimento (0xEC, 0x11).
    const bits = [];
    const anexar = (valor, n) => { for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1); };
    anexar(0x4, 4);
    anexar(dados.length, ver <= 9 ? 8 : 16);
    dados.forEach((b) => anexar(b, 8));
    const capacidade = palavrasDeDados(ver, nivel) * 8;
    anexar(0, Math.min(4, capacidade - bits.length));
    anexar(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < capacidade; pad ^= 0xEC ^ 0x11) anexar(pad, 8);
    const palavras = new Array(bits.length / 8).fill(0);
    bits.forEach((b, i) => { palavras[i >>> 3] |= b << (7 - (i & 7)); });

    const tamanho = ver * 4 + 17;
    const mod = Array.from({ length: tamanho }, () => new Array(tamanho).fill(false));
    const funcao = Array.from({ length: tamanho }, () => new Array(tamanho).fill(false));
    const fixar = (x, y, escuro) => { mod[y][x] = escuro; funcao[y][x] = true; };

    // ---- Padrões fixos: temporização, localizadores, alinhamento, formato e versão ----
    for (let i = 0; i < tamanho; i++) { fixar(6, i, i % 2 === 0); fixar(i, 6, i % 2 === 0); }
    const localizador = (x, y) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx, yy = y + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (xx >= 0 && xx < tamanho && yy >= 0 && yy < tamanho) fixar(xx, yy, d !== 2 && d !== 4);
      }
    };
    localizador(3, 3); localizador(tamanho - 4, 3); localizador(3, tamanho - 4);
    if (ver > 1) {
      const n = Math.floor(ver / 7) + 2;
      const passo = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
      const pos = [];
      for (let i = 0; i < n - 1; i++) pos.push(tamanho - 7 - i * passo);
      pos.push(6); pos.reverse();
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fixar(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    const desenharFormato = (mascara) => {
      const dado = nivel.bits << 3 | mascara;
      let resto = dado;
      for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
      const b = (dado << 10 | resto) ^ 0x5412;
      for (let i = 0; i <= 5; i++) fixar(8, i, bit(b, i));
      fixar(8, 7, bit(b, 6)); fixar(8, 8, bit(b, 7)); fixar(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) fixar(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) fixar(tamanho - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) fixar(8, tamanho - 15 + i, bit(b, i));
      fixar(8, tamanho - 8, true);
    };
    desenharFormato(0);
    if (ver >= 7) {
      let resto = ver;
      for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1F25);
      const b = ver << 12 | resto;
      for (let i = 0; i < 18; i++) {
        const a = tamanho - 11 + i % 3, c = Math.floor(i / 3);
        fixar(a, c, bit(b, i)); fixar(c, a, bit(b, i));
      }
    }

    // ---- Correção de erros e intercalação dos blocos ----
    const nb = NUM_BLOCOS[nivel.ordem][ver], eccLen = ECC_POR_BLOCO[nivel.ordem][ver];
    const brutas = Math.floor(modulosBrutos(ver) / 8);
    const curtos = nb - brutas % nb, lenCurto = Math.floor(brutas / nb);
    const divisor = rsDivisor(eccLen);
    const blocos = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = palavras.slice(k, k + lenCurto - eccLen + (i < curtos ? 0 : 1));
      k += d.length;
      const ecc = rsResto(d, divisor);
      if (i < curtos) d.push(0);
      blocos.push(d.concat(ecc));
    }
    const todas = [];
    for (let i = 0; i < blocos[0].length; i++) blocos.forEach((blk, j) => { if (i !== lenCurto - eccLen || j >= curtos) todas.push(blk[i]); });

    // ---- Coloca os bits em zigue-zague ----
    let i = 0;
    for (let direita = tamanho - 1; direita >= 1; direita -= 2) {
      if (direita === 6) direita = 5;
      for (let vert = 0; vert < tamanho; vert++) for (let j = 0; j < 2; j++) {
        const x = direita - j, subindo = ((direita + 1) & 2) === 0, y = subindo ? tamanho - 1 - vert : vert;
        if (!funcao[y][x] && i < todas.length * 8) { mod[y][x] = bit(todas[i >>> 3], 7 - (i & 7)); i++; }
      }
    }

    // ---- Máscara: testa as 8 e fica com a de menor "penalidade" (mais fácil de ler) ----
    const aplicarMascara = (m) => {
      for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) if (!funcao[y][x] && MASCARAS[m](x, y) === 0) mod[y][x] = !mod[y][x];
    };
    const addHist = (run, hist) => { if (hist[0] === 0) run += tamanho; hist.pop(); hist.unshift(run); };
    const contarPadroes = (h) => {
      const n = h[1], centro = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
      return (centro && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (centro && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
    };
    const terminar = (cor, run, hist) => { if (cor) { addHist(run, hist); run = 0; } run += tamanho; addHist(run, hist); return contarPadroes(hist); };
    const penalidade = () => {
      let r = 0;
      for (const linha of [false, true]) {
        for (let a = 0; a < tamanho; a++) {
          let cor = false, run = 0;
          const hist = [0, 0, 0, 0, 0, 0, 0];
          for (let b = 0; b < tamanho; b++) {
            const m = linha ? mod[a][b] : mod[b][a];
            if (m === cor) { run++; if (run === 5) r += 3; else if (run > 5) r += 1; } else {
              addHist(run, hist);
              if (!cor) r += contarPadroes(hist) * 40;
              cor = m; run = 1;
            }
          }
          r += terminar(cor, run, hist) * 40;
        }
      }
      for (let y = 0; y < tamanho - 1; y++) for (let x = 0; x < tamanho - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) r += 3;
      }
      let escuros = 0;
      mod.forEach((l) => l.forEach((c) => { if (c) escuros++; }));
      const total = tamanho * tamanho;
      r += (Math.ceil(Math.abs(escuros * 20 - total * 10) / total) - 1) * 10;
      return r;
    };
    let melhor = 0, menor = Infinity;
    for (let m = 0; m < 8; m++) {
      aplicarMascara(m); desenharFormato(m);
      const p = penalidade();
      if (p < menor) { menor = p; melhor = m; }
      aplicarMascara(m);
    }
    aplicarMascara(melhor); desenharFormato(melhor);

    return { versao: ver, tamanho, nivel: ORDEM_NIVEIS[nivel.ordem], mascara: melhor,
      modulo: (x, y) => x >= 0 && x < tamanho && y >= 0 && y < tamanho && mod[y][x] };
  }

  /* Desenha o QR como <svg>: módulos pretos sobre fundo branco, com "zona de silêncio" (margem) de 4 módulos,
     como o padrão exige. Um único <path>: leve e nítido em qualquer tamanho. */
  function svg(qr, margem = 4) {
    const NS = 'http://www.w3.org/2000/svg';
    const lado = qr.tamanho + margem * 2;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
    s.setAttribute('shape-rendering', 'crispEdges');
    const fundo = document.createElementNS(NS, 'rect');
    fundo.setAttribute('width', String(lado)); fundo.setAttribute('height', String(lado)); fundo.setAttribute('fill', '#ffffff');
    const partes = [];
    for (let y = 0; y < qr.tamanho; y++) for (let x = 0; x < qr.tamanho; x++) if (qr.modulo(x, y)) partes.push(`M${x + margem},${y + margem}h1v1h-1z`);
    const caminho = document.createElementNS(NS, 'path');
    caminho.setAttribute('d', partes.join('')); caminho.setAttribute('fill', '#000000');
    s.append(fundo, caminho);
    return s;
  }

  return { gerar, svg, utf8 };
})();
