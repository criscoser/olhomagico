# Como adaptar o Olho Mágico para a sua cidade

O Olho Mágico nasceu para Videira/SC, mas foi pensado para ser reaproveitado. Este guia mostra
**o que trocar**, **onde trocar** e **como conferir** cada item, para que qualquer cidadão possa
montar um portal de transparência independente para o próprio município.

> **Antes de começar:** você vai precisar de uma conta no GitHub, do Python 3 instalado no computador
> e de um editor de texto (o VS Code é gratuito). Não é preciso saber programar a fundo, mas é preciso
> ter paciência para conferir cada código nas fontes oficiais.

---

## 1. Entenda o que muda e o que não muda

O site junta dados de dois tipos de fonte:

| Tipo | Fontes | O que fazer na sua cidade |
|---|---|---|
| **Nacionais** (servem para todos os municípios) | SICONFI/Tesouro (LRF, contas anuais, entregas), Transferências constitucionais (Tesouro), PNCP (licitações e contratos), SIOPE/FNDE (educação), CGU (convênios e benefícios) | Só trocar os **códigos do município**. |
| **Locais** (dependem do sistema que a cidade contratou) | Portal da Prefeitura (despesas ao vivo e lista de servidores) e API da Câmara | Pode funcionar sem mudanças **se** a sua cidade usar os mesmos sistemas. Se não usar, é preciso escrever um adaptador novo (veja a seção 5). |

Em Videira, a Prefeitura usa o portal **Atende.net** e a Câmara tem uma API própria de dados abertos.
Muitas cidades do Sul usam o Atende.net, mas confira a sua.

---

## 2. Os códigos do município (`ferramentas/municipio.json`)

Este arquivo é usado pelos **robôs** (os programas em Python que copiam os dados todos os dias).
Troque cada valor e **confira na fonte oficial** antes de seguir.

| Campo | O que é | Valor em Videira | Como descobrir o da sua cidade |
|---|---|---|---|
| `nome` | Nome do município | `Videira` | — |
| `uf` | Sigla do estado | `SC` | — |
| `codigo_ibge` | Código IBGE de 7 dígitos | `4219309` | Página "Cidades" do IBGE (cidades.ibge.gov.br), campo "Código do Município". |
| `codigo_siope` | Código IBGE **sem o último dígito** | `421930` | Apague o último número do código IBGE. |
| `codigo_tce_sc` | Código do município no Tribunal de Contas de SC | `421930` | Hoje não é usado pelos robôs. Fora de SC, pode deixar como está ou apagar. |
| `cnpj` | CNPJ da Prefeitura, só números | `83039842000184` | Consulta de CNPJ da Receita Federal ou o rodapé do site oficial da Prefeitura. |
| `codigo_tesouro_transferencias` | Código **SIAFI** do município (não é o IBGE) | `8379` | Tabela de municípios do SIAFI (Tesouro Nacional). Veja como conferir logo abaixo. |
| `codigo_uf_tesouro_transferencias` | Código do **estado** no sistema de transferências do Tesouro (não é o do IBGE) | `24` (SC) | Veja como conferir logo abaixo. |
| `portal_atende` | Endereço do portal Atende.net da Prefeitura | `https://videira.atende.net` | Só se a sua cidade usar Atende.net. |
| `camara_api` | Endereço da API da Câmara | `https://www.camaravideira.sc.gov.br/jsonweb/web-aplicativo.php` | Só se a Câmara tiver a mesma API (procure "dados abertos" no site da Câmara). |
| `siconfi`, `pncp`, `tesouro_transferencias`, `siope`, `cgu` | Endereços das APIs nacionais | — | **Não mude.** São iguais para todo o Brasil. |

### Como conferir os dois códigos do Tesouro

Abra no navegador o endereço abaixo, trocando `UF`, `MUNICIPIO` e `ANO`:

```
https://apiapex.tesouro.gov.br/aria/v1/transferencias_constitucionais/custom/por_estado_municipio?p_estado=UF&p_municipio=MUNICIPIO&p_ano=ANO
```

Na resposta, cada item traz `MUNICIPIO`, `UF` e `CO_IBGE`. **Os códigos estão certos quando aparecem o
nome da sua cidade e o seu código IBGE.** Se vier vazio ou outra cidade, os códigos estão errados.

---

## 3. As configurações do site (`js/config.js`)

Este arquivo é usado pelo **site** (o que roda no navegador de quem visita). Cada linha tem um comentário
explicando para que serve. Os campos com endereço de Videira são:

| Campo | O que é |
|---|---|
| `API_BASE` | API de dados abertos (contabilidade) do portal da Prefeitura. É dela que vem a aba "Despesas públicas", ao vivo. |
| `PORTAL` | Página inicial do portal de transparência da Prefeitura. |
| `DOC_API_DESPESAS` | Página que documenta a API de despesas. |
| `PORTAL_PAGAMENTOS`, `PORTAL_SALARIOS` | Telas oficiais de pagamentos e salários, para onde o site leva quem quer o detalhe. |
| `CAMARA_FOLHAS` | Página onde a Câmara publica as folhas de pagamento. |
| `PESSOAL.API` | API da lista de servidores. |
| `ANO_INICIAL` | Primeiro ano que aparece no seletor de despesas. Use o primeiro ano que a API da sua cidade tiver. |
| `PIX_CHAVE` | Chave Pix para doações. **Deixe vazia** (`''`) para esconder o botão. Se usar, prefira uma chave aleatória, para não expor CPF ou e-mail. |
| `NOME_SITE` | Nome do site. Pode trocar se quiser. |

---

## 4. A segurança do site (`index.html`, linha da "Content-Security-Policy")

Logo no começo do `index.html` há uma linha de segurança que diz com quais endereços o navegador pode
conversar. Hoje ela só permite o portal de Videira:

```
connect-src https://videira.atende.net;
```

**Troque pelo endereço do portal da sua cidade.** Se você esquecer, a aba "Despesas públicas" vai falhar,
porque o navegador bloqueia a consulta. Não acrescente outros endereços sem necessidade: essa trava
impede que código malicioso envie dados para fora.

---

## 5. Se a sua cidade usa outro sistema

Os adaptadores ficam em `ferramentas/fontes/` (robôs) e `js/fontes/` (site). Cada um começa com um
comentário explicando o endereço usado e os campos lidos. Para outra fonte:

1. Descubra se a Prefeitura ou a Câmara tem uma **API oficial de dados abertos** (procure "dados abertos"
   ou "API" no portal de transparência). Use só fontes oficiais e abertas.
2. Copie o adaptador mais parecido (por exemplo, `ferramentas/fontes/pessoal.py`) e ajuste o endereço e
   os nomes dos campos.
3. Mantenha o **mesmo formato de saída** (os mesmos campos no arquivo de `dados/`), assim as telas
   continuam funcionando sem mudanças.
4. Escreva ou ajuste o teste correspondente em `testes/test_robos.py`.

Se não existir API para alguma fonte, **não force**: deixe a fonte de fora. O site mostra "não integrado"
ou "indisponível" e segue funcionando com as outras.

---

## 6. Os textos com o nome "Videira"

Vários textos das telas citam Videira pelo nome. Use a busca do editor (no VS Code: `Ctrl+Shift+F`) por
**`Videira`** e revise cada resultado. Eles estão principalmente em:

- `index.html`: título, descrição para buscadores e redes sociais, subtítulos das abas e a aba "Sobre";
- `js/main.js` (título da aba do navegador), `js/contas-tela.js`, `js/contratos-tela.js`,
  `js/pessoal-tela.js`, `js/fichas.js`, `js/interface.js`, `js/exportar.js` e `js/camara-tela.js`;
- `ferramentas/conferir.py` (os links de conferência);
- `ferramentas/fontes/camara.py` (nome e página da Câmara).

Troque também, na aba "Sobre" e no rodapé do `index.html`, a frase de autoria pelo **seu** nome. Não é
permitido apresentar o seu portal como se fosse do autor original.

Nos arquivos de `ferramentas/fontes/`, os comentários "Confirmado para Videira em …" registram testes
feitos aqui. Quando você confirmar na sua cidade, atualize esses comentários com a sua data e os seus números.

---

## 7. As chaves de acesso

Duas fontes pedem uma chave gratuita:

| Variável | Fonte | Onde pedir |
|---|---|---|
| `CGU_CHAVE` | Portal da Transparência do Governo Federal | Página da "API de dados" do Portal da Transparência (a chave chega por e-mail). |
| `CAMARA_TOKEN` | API da Câmara (se a sua Câmara tiver uma igual à de Videira) | Página de dados abertos da Câmara. |

**Nunca coloque uma chave dentro do código, de um arquivo ou de um print.** No seu computador, use variáveis
de ambiente (no PowerShell: `$env:CGU_CHAVE = "..."`). No GitHub, use o cofre: Settings → Secrets and
variables → Actions. Sem a chave, a fonte é só pulada e o resto do site funciona normalmente.

---

## 8. Testar no seu computador

Dentro da pasta do projeto:

```
python -m unittest discover -s testes -p "test_*.py"
python ferramentas/atualizar.py
python ferramentas/conferir.py
```

1. O primeiro comando roda os testes dos robôs. Os testes usam dados simulados, então devem passar mesmo
   antes de você trocar os códigos.
2. O segundo copia os dados da sua cidade. Espere aparecer `Resumo:`. Se alguma fonte falhar, a mensagem
   explica o motivo.
3. O terceiro confere os arquivos e **sorteia números para você comparar com os portais oficiais**.
   Compare de verdade, um por um. É isso que dá credibilidade ao portal.

Depois, abra o `index.html` no navegador e passe por todas as abas. Os testes do site ficam em
`testes/testes.html` (abra no navegador).

---

## 9. Publicar

Siga o roteiro de [`COMO_PUBLICAR.md`](COMO_PUBLICAR.md). Em resumo: criar os secrets das chaves, ativar o
GitHub Pages com "Source: GitHub Actions" e ligar o workflow "Atualizar e publicar o site". O robô passa a
atualizar os dados todos os dias sozinho.

---

## 10. Regras que valem para todas as cidades

Estas regras protegem as pessoas e a credibilidade do projeto. **Não as remova ao adaptar:**

1. **Os dados aparecem exatamente como a fonte oficial publica.** Nunca altere, arredonde para "parecer
   melhor" ou complete valores que faltam. Quando um dado não existir, a tela diz que está indisponível,
   e nunca mostra zero ou um valor inventado.
2. **Privacidade:** nunca exiba matrícula, horário, local de trabalho ou situação de afastamento de
   servidores. O CPF completo nunca aparece na tela, em links, no CSV, em `dados/`, em logs ou no git.
   **CPF nunca pode ser pesquisável.**
3. **Cruzamento de pessoas: só por CPF, nunca pelo nome.** Homônimos existem, e ligar a pessoa errada é
   acusar um inocente em público. O cruzamento por CPF roda só no robô Python, usando um HMAC-SHA256 do CPF
   com segredo no Secret `CPF_SALT` (o CPF puro nunca é gravado). Só o resultado é publicado, com CPF
   mascarado e links das fontes. Coincidência é fato, não acusação. Empresas são ligadas pelo CNPJ.
4. **Respeite as fontes:** não tente burlar captcha ou bloqueio contra robôs, e respeite os pedidos de
   "espere um pouco" (HTTP 429). Os robôs já fazem isso; não diminua as pausas.
5. **Chaves e tokens** só em variáveis de ambiente ou no cofre do GitHub.
6. **Imparcialidade:** o portal mostra fatos e fontes, sem julgar pessoas nem criar rankings de "culpados".
7. **Deixe claro que o portal é independente** e não oficial, e que em caso de diferença vale a fonte oficial.

---

## Checklist rápido

- [ ] `ferramentas/municipio.json`: códigos trocados e conferidos
- [ ] `js/config.js`: endereços do portal da Prefeitura e da Câmara trocados
- [ ] `index.html`: `connect-src` da Content-Security-Policy trocado
- [ ] Textos com "Videira" revisados (busca no editor)
- [ ] Frase de autoria trocada pelo seu nome
- [ ] Chaves em variáveis de ambiente / secrets, nunca no código
- [ ] Testes passando e `conferir.py` comparado com os portais oficiais
- [ ] Publicado seguindo o `COMO_PUBLICAR.md`
