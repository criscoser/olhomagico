/* Roda os testes de testes/testes.html no terminal (Node.js), sem abrir o navegador.
   Uso: node testes/rodar_testes.js
   Termina com erro se algum teste falhar: o robô do GitHub usa isso para NÃO publicar código quebrado. */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const saida = [];
// "Documento" de mentira: só o necessário para a função teste() escrever os resultados.
const documentoFalso = {
  createElement: () => ({ style: {}, append() {} }),
  getElementById: () => ({ append: (li) => saida.push(li.textContent) })
};
const contexto = { console, document: documentoFalso };
contexto.window = contexto;
vm.createContext(contexto);

const html = fs.readFileSync(path.join(__dirname, 'testes.html'), 'utf8');
// Carrega os mesmos arquivos que a página de testes carrega, na mesma ordem.
for (const [, arquivo] of html.matchAll(/<script src="\.\.\/([^"]+)"><\/script>/g)) {
  vm.runInContext(fs.readFileSync(path.join(raiz, arquivo), 'utf8'), contexto, { filename: arquivo });
}
// Roda os testes escritos dentro da página.
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], contexto, { filename: 'testes.html' });

saida.forEach((linha) => console.log(linha));
const falhas = saida.filter((linha) => !linha.startsWith('OK'));
console.log(falhas.length ? `\n${falhas.length} TESTE(S) FALHARAM` : `\nTODOS OS ${saida.length} TESTES PASSARAM`);
process.exit(falhas.length ? 1 : 0);
