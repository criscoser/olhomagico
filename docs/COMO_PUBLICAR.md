# Como colocar o site no ar (GitHub Pages, grátis)

O site fica no **GitHub Pages**, porque é o GitHub que roda, todo dia, os robôs que copiam servidores, contratos e contas.
Quem faz isso é o arquivo `.github/workflows/publicar.yml`. Você não precisa instalar nada.

## 1. Conta e privacidade
- Crie uma conta em https://github.com. **O nome de usuário aparece no endereço do site**
  (`usuario.github.io/...`) e no repositório público. Se quiser discrição, use um nome neutro
  (ex.: `olho-magico`) e um e-mail só do projeto. Lembre que o GitHub sabe quem é o dono da conta:
  isso dá discrição, não anonimato total.

## 2. Criar o repositório
1. Clique em **New repository**. Nome sugerido: `olho-magico`. Marque **Public**
   (o Pages gratuito exige repositório público, e código aberto também dá credibilidade ao projeto).
2. Clique em **uploading an existing file** e arraste **o conteúdo** da pasta `OBS`
   (index.html, css, js, ferramentas, testes, docs, dados, .github...).
   - **Não envie** os arquivos `.js` da pasta `dados` que você gerou no seu computador: o robô gera os dele.
3. Clique em **Commit changes**.

> Se a pasta `.github` não subir pelo navegador: clique em **Add file → Create new file**, digite
> `.github/workflows/publicar.yml` como nome, cole o conteúdo desse arquivo e salve.

## 3. Ligar o GitHub Pages
1. No repositório: **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.

## 4. Primeira publicação
1. Aba **Actions → Atualizar e publicar o site → Run workflow → Run workflow**.
2. Espere uns 2 a 3 minutos. Quando ficar verde, o endereço do site aparece no passo **Publicar**.
3. Depois disso, ele se atualiza sozinho todo dia às 06:17 (horário de Brasília) e sempre que você mudar o código.

## Se algo der errado
- **Ficou vermelho em "Rodar os testes"**: algum teste falhou. Nada foi publicado; o site antigo continua no ar.
- **Aviso amarelo "Alguma fonte falhou hoje"**: o site foi publicado normalmente. A fonte que falhou continua
  com a versão anterior, e a aba **Sobre → Situação das fontes** mostra qual foi e desde quando.
- **O GitHub pausa tarefas agendadas** de repositórios sem nenhuma alteração por 60 dias. Se isso acontecer,
  aparece um aviso na aba Actions: clique em **Enable workflow**.

## Testar no seu computador antes
1. `python ferramentas/atualizar.py` (gera os arquivos de `dados/`; leva alguns minutos).
2. Abra `index.html` no navegador.
3. Testes: `node testes/rodar_testes.js` e `python -m unittest discover -s testes -p "test_*.py"`.

## Domínio próprio (opcional, depois)
Em **Settings → Pages → Custom domain**. Atenção: domínios `.com.br` exigem CPF ou CNPJ do titular.
Confira no registro.br quais dados do titular ficam públicos antes de registrar, se a discrição importa.

## Checklist antes de divulgar
- [ ] Trocar `PIX_CHAVE` em `js/config.js` (hoje é a chave FALSA `123456789`).
- [ ] Nome: já está como Olho Mágico. Antes de divulgar, confira se o nome e o domínio estão livres.
- [ ] Publicar um canal de contato para correções (e-mail do projeto) na aba Sobre.
- [ ] Depois de publicar, abrir o site no endereço novo e consultar um mês na aba Gastos. Se der erro de acesso,
      é bloqueio de CORS para o domínio do GitHub: me chame.
- [ ] Conferir os totais de 3 meses com o portal oficial (aba Gastos).
- [ ] Conferir 3 ou 4 servidores da aba Servidores com a Relação Funcionário x Salário do portal.
- [ ] Abrir no celular e testar o botão "Apoie o projeto".
- [ ] Enviar o pedido de acesso à informação (`docs/pedido_acesso_informacao.txt`).
