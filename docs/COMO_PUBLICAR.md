# Como colocar o site no ar (roteiro final)

O código já está no GitHub (`github.com/criscoser/olhomagico`). O robô (`.github/workflows/publicar.yml`)
roda os testes, copia os dados das fontes oficiais e publica no GitHub Pages.
Enquanto o site não estiver pronto para o público, o robô fica **desligado** (Actions → Disable workflow).

## Antes de publicar (no seu computador)

1. **Atualizar os dados** (dentro da pasta OBS, no PowerShell):
   ```
   $env:CGU_CHAVE = "..."      # a chave da CGU (a nova, se você pediu outra)
   $env:CAMARA_TOKEN = "..."   # o token da Câmara
   python ferramentas\atualizar.py
   ```
   Espere aparecer `Resumo:`. O PNCP demora (vai devagar de propósito, para não ser bloqueado).
2. **Conferir os arquivos e sortear números para comparar com o portal oficial:**
   ```
   python ferramentas\conferir.py
   ```
   Compare os números sorteados com os links que ele mostra. Se algum não bater, mande o print para o Claude.
3. **Abrir o `index.html`** e olhar cada tela: Visão geral, Despesas públicas, Servidores (abra uma ficha),
   Licitações e contratos (abra um contrato e um fornecedor), Contas e transferências, Câmara, Fontes e metodologia.
4. **Chave Pix:** se quiser o botão "Apoie o projeto", coloque a chave verdadeira em `PIX_CHAVE`, em `js/config.js`.
   Vazia, o botão não aparece.
5. **Enviar as alterações para o GitHub:**
   ```
   git add .
   git commit -m "Ajustes antes de publicar"
   git push
   ```
   Os arquivos de `dados/` **não** sobem (o `.gitignore` impede). O robô do GitHub gera os dele.

## No dia da publicação (no GitHub)

1. **Settings → Secrets and variables → Actions → New repository secret**: crie `CGU_CHAVE` e `CAMARA_TOKEN`
   (se ainda não criou). Sem elas, o site sai sem os dados da CGU e da Câmara, o resto funciona.
2. **Settings → Pages → Source: GitHub Actions.**
3. **Actions → Atualizar e publicar o site → Enable workflow** (se estiver desligado) → **Run workflow**.
4. Espere ficar **verde** (15 a 20 minutos na primeira vez). O endereço aparece em **Settings → Pages**:
   `https://criscoser.github.io/olhomagico/`.

## Logo depois de publicar (teste de verdade)

- [ ] Abrir o endereço no computador e no celular (Chrome e, se puder, Safari ou Firefox).
- [ ] **Despesas públicas:** consultar um mês. Esta consulta é feita pelo navegador direto no portal da Prefeitura.
      No seu computador funcionou, mas no endereço do GitHub o portal pode recusar (bloqueio de CORS).
      Se aparecer "Não consegui acessar a fonte", mande o print para o Claude.
- [ ] Rodar `python ferramentas\conferir.py` não é preciso aqui: no site publicado, veja **Fontes e metodologia →
      Situação das fontes** (todas devem aparecer com data de hoje).
- [ ] Testar a pesquisa (um nome de servidor e um CNPJ de fornecedor) e abrir duas fichas.

## Segurança (já está garantido no código, só não desfaça)

- Nenhuma chave fica no código, no site ou no zip. Elas vêm só do PowerShell (teste) ou do cofre do GitHub.
- Se uma chave aparecer numa mensagem de erro, o robô troca por `***` antes de gravar (testado).
- **Nunca** mande print com a chave aparecendo. Se vazar: gere outra na fonte e troque em Settings → Secrets.
- Os commits usam o e-mail privado do GitHub (`...@users.noreply.github.com`), configurado com `git config --global user.email`.

## Se algo der errado

- **Vermelho em "Rodar os testes":** nada foi publicado; o site anterior continua no ar. Mande o print.
- **Aviso amarelo "Alguma fonte falhou hoje":** o site foi publicado; a fonte que falhou continua com a cópia anterior.
- **O GitHub pausa o robô** em repositórios sem alteração por 60 dias: aparece um aviso em Actions; clique em **Enable workflow**.

## Depois (melhorias, sem pressa)

- Pedido pela Lei de Acesso à Informação (`docs/pedido_acesso_informacao.txt`): remuneração completa e diárias.
- Emendas parlamentares (CGU) e projetos de lei (Câmara): falta conferir o formato dos dados.
- Domínio próprio: Settings → Pages → Custom domain. Domínios `.com.br` exigem CPF ou CNPJ do titular
  (confira no registro.br o que fica público).
