/* Gera uma IMAGEM (PNG) do QR Code do Pix, desenhado pelo MESMO código que o site usa (js/vendor/qrcodegen.js),
   a partir do código configurado em js/config.js. O robô do GitHub depois LÊ essa imagem com um leitor de QR
   (zbarimg), como faria o app de um banco, e confere se o texto lido é exatamente o código configurado.
   Uso: node testes/qr_png.js saida.png   (imprime o código esperado na saída) */
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const raiz = path.join(__dirname, '..');
const contexto = {}; contexto.window = contexto;
vm.createContext(contexto);
for (const arq of ['js/config.js', 'js/vendor/qrcodegen.js']) vm.runInContext(fs.readFileSync(path.join(raiz, arq), 'utf8'), contexto);
const codigo = contexto.OBS.config.PIX_COPIA_E_COLA;
const qr = contexto.OBS.qr.gerar(codigo, 'M');

// Imagem em tons de cinza: 8 pixels por módulo e margem de 4 módulos (como no site).
const ESCALA = 8, MARGEM = 4, lado = (qr.tamanho + MARGEM * 2) * ESCALA;
const linhas = [];
for (let py = 0; py < lado; py++) {
  const linha = Buffer.alloc(lado + 1);             // 1º byte de cada linha: filtro 0 (nenhum)
  for (let px = 0; px < lado; px++) {
    const x = Math.floor(px / ESCALA) - MARGEM, y = Math.floor(py / ESCALA) - MARGEM;
    linha[px + 1] = qr.modulo(x, y) ? 0 : 255;      // escuro = preto, claro = branco
  }
  linhas.push(linha);
}

// Monta o arquivo PNG (assinatura + blocos IHDR, IDAT e IEND, cada um com CRC32).
const crcTabela = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTabela[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const bloco = (tipo, dados) => {
  const t = Buffer.from(tipo, 'ascii'), tam = Buffer.alloc(4), crc = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(lado, 0); ihdr.writeUInt32BE(lado, 4);
ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8 bits, tons de cinza
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  bloco('IHDR', ihdr), bloco('IDAT', zlib.deflateSync(Buffer.concat(linhas))), bloco('IEND', Buffer.alloc(0))]);

fs.writeFileSync(process.argv[2] || 'qr-pix.png', png);
process.stdout.write(codigo);
