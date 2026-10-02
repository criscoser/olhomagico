# Relatório de auditoria do Olho Mágico (02/10/2026)

Auditoria feita a partir do documento "Plano de auditoria, segurança, confiabilidade e redesign".
Antes de qualquer mudança, foi feita uma cópia de segurança: `OBS_backup_antes_auditoria.zip`.

## 1. O que foi verificado, e como

| Fonte | Resultado | Como | Limite da verificação |
|---|---|---|---|
| API de Pessoal (`/api/transparencia-pessoal-funcionarios`) | Responde em JSON: 3.049 registros, 31 páginas de 100, os 18 campos documentados | Leitura direta em 01/10/2026 | Valores individuais não foram comparados com o portal |
| API de despesas (`/api/WCPDadosAbertos/despesas`) | Funciona com dados reais (setembro/2026); campos iguais aos da documentação | Teste do usuário no navegador + amostra real colada no chat | O ambiente do Claude não alcança a API. **Totais não conferidos com o portal** |
| Pagamentos e Funcionário x Salário | Existem, mas são protegidas por captcha (Turnstile) | Teste do usuário (DevTools e script) | Usadas só como link; o site não as consulta |
| Robô da lista de servidores | Funciona em 5 cenários | Servidor **simulado**, com dados fictícios | **Ainda não rodou contra a API real** |

## 2. Problemas encontrados e corrigidos (classificação: Necessário)

1. **Seletor de mês não funcionava no Firefox nem no Safari** (`<input type="month">` vira caixa de texto; digitar "09/2026" quebrava a consulta). Corrigido: duas listas, de mês e de ano.
2. **Mês anterior calculado errado em dias 31** (em 31/03, "mês anterior" virava março). Corrigido, com testes.
3. **"3.049 pessoas" era impreciso**: a lista oficial é por vínculo (matrícula), e quem tem dois cargos aparece duas vezes. Agora o site diz "registros" e explica.
4. **Textos afirmavam mais do que os dados mostram**: "em geral entrou por concurso" (estatutário) e "em geral por processo seletivo" (temporário). Removidos. A forma de ingresso só aparece quando a fonte informa.
5. **A fonte apontava para a página inicial do portal.** Agora aponta para a consulta exata do período e para a página que documenta a API.
6. **O destaque "Prefeito, vice e secretários" classificava cargos como políticos** a partir de palavras. Foi renomeado e explica que o filtro olha só o nome do cargo.
7. **A explicação da folha de pagamento afirmava o conteúdo.** Agora diz "Pelo nome, é…", como as demais explicações.

## 3. Segurança

- **XSS:** todo texto vindo das APIs entra na página por `textContent`. Não há `innerHTML`, `eval`, `new Function` nem `document.write` (verificado por busca no código). OK.
- **CSP (implementada):** o navegador só aceita scripts e estilos do próprio site (mais a fonte do Google) e só se conecta à API de Videira. Testada sem violações, inclusive abrindo o site direto do computador. Para isso, o único estilo embutido no HTML foi removido.
- **Planilha CSV:** proteção contra injeção de fórmula (células que começam com `= + - @`) e CPF mascarado. Testado.
- **GitHub Actions:** ações fixadas pelo SHA (checkout v4.4.0, upload-pages-artifact v3.0.1, deploy-pages v4.0.5), `persist-credentials: false` e permissões mínimas (ler código, publicar no Pages).
- **Segredos:** não há token nem senha no código. O token da Câmara, quando vier, **não pode** entrar no repositório.
- **Endereço (#hash):** só aceita os nomes das três abas.
- **Dependência externa restante:** Google Fonts, que recebe o IP de quem abre o site. É **recomendado** hospedar a fonte junto com o site; ficou pendente porque o download do pacote foi bloqueado neste ambiente. Isso está declarado na aba Sobre.

## 4. Cálculos (revisados)

- Empenhado, liquidado e pago nunca são somados entre si. As porcentagens são sobre o total **pago**.
- Credores são juntados pelo CPF/CNPJ (ou pelo nome, sem documento); nomes parecidos nunca são juntados.
- Linhas com valor inválido são ignoradas **e contadas** na tela.
- O "valor por morador" foi **removido** em 02/10/2026, por decisão do projeto, e não deve voltar.
- Testes de lista vazia, dados ausentes, valores negativos (estornos) e valores muito altos.
- **Duplicidade (limitação):** a API de despesas entrega linhas já somadas e sem identificador, então não dá para detectar repetições exatas. Na lista de servidores, o robô remove repetidos pela matrícula antes de descartá-la.

## 5. Rastreabilidade

- Componente reutilizável **"Origem da informação"** (`js/origem.js`), nas abas Gastos e Servidores, com fonte, link, tipo, período, data da consulta ou da cópia, método e limitação.
- As fontes não têm link individual por registro, e isso aparece declarado como limitação.

## 6. Classificação dos itens do plano

| Item do plano | Classificação | Situação |
|---|---|---|
| Backup antes de mudar | Necessário | Feito (`OBS_backup_antes_auditoria.zip`). O ramo Git fica para quando subir no GitHub |
| Auditoria de código, segurança e cálculos | Necessário | Feito (seções 2 a 5) |
| Componente "Origem da informação" | Necessário | Feito |
| Aviso editorial de independência | Necessário | Feito (faixa do topo + aba Sobre) |
| Páginas Sobre, Como interpretar, Metodologia | Recomendado | Feito (aba "Sobre e metodologia") |
| Glossário (fonte de recurso, dotação) | Recomendado | Feito |
| Servidores: busca, vínculo, **setor**, ordem, paginação, limpar filtros | Recomendado | Feito |
| Exportar CSV com fonte e período | Recomendado | Feito para Gastos |
| Exportar CSV de servidores | Opcional | Não feito: exportação em massa de nomes e salários amplia a exposição. Decidir antes |
| Fixar ações por SHA, permissões mínimas | Recomendado | Feito |
| Hospedar a fonte de letra no próprio site | Recomendado | Pendente (download bloqueado aqui) |
| Paleta verde, azul e dourado | Não recomendado | Mantida a paleta uva e vinho, escolhida por você. Para trocar, mude só os tokens em `:root` |
| Menu com 12 seções (receitas, licitações, contratos, obras…) | Não recomendado agora | Seções vazias passam a impressão de site inacabado. Elas estão listadas em "O que ainda não está aqui" |
| Painel com cartões clicáveis e gráficos de evolução | Recomendado (próxima etapa) | Exige consultar vários meses (uma consulta por mês). Fazer com controle de carga |
| Tabelas ordenáveis com modal | Opcional | As listas clicáveis já cumprem esse papel e funcionam melhor no celular |
| Histórico de alterações (cópias antigas) | Não recomendado agora | Contraria a decisão de não guardar histórico. Repensar se quiser |
| Painel de atualização | Parcial | A data da cópia e a hora da consulta aparecem; falhas do robô aparecem na aba Actions do GitHub |
| WCAG 2.2 AA | Parcial | Contraste medido (mínimo 6,9:1), foco visível, HTML semântico e rótulos. Falta testar com leitor de tela real |

## 7. Testes

**Executados e aprovados**
- 48 testes automáticos (`node testes/rodar_testes.js`), incluindo casos extremos, CSV e mês anterior.
- Robô: cenário normal, captcha, formato errado, lista mudando durante a cópia e privacidade do arquivo gerado (servidor simulado).
- Navegador Chromium no computador e no celular, modo claro e escuro: seletor (incluindo mês futuro), consulta, caixa de origem, download do CSV, abas, filtros, "Limpar filtros", aba Sobre. Sem erros de JavaScript e **sem violações de CSP**.

**Não executados (pendentes)**
- Chamada real às APIs a partir do ambiente do Claude (bloqueado).
- Conferência dos totais com o portal oficial (3 meses) e de 3 ou 4 servidores com a Relação Funcionário x Salário.
- Robô contra a API real (rodar no seu computador).
- Firefox, Safari e iPhone reais (testado só no Chromium).
- Leitor de tela.

## 8. Arquivos novos e modificados

- **Novos:** `js/origem.js`, `js/exportar.js`, `docs/AUDITORIA.md`.
- **Modificados:** `index.html`, `css/estilo.css`, `js/config.js`, `js/utilitarios.js`, `js/interface.js`, `js/main.js`, `js/abas.js`, `js/pessoal-regras.js`, `js/pessoal-tela.js`, `testes/testes.html`, `.github/workflows/publicar.yml`, `ferramentas/atualizar_pessoal.py` (só a identificação do robô), `README.md`, `docs/COMO_PUBLICAR.md`.

## 9. Como rodar e publicar

- **No computador:** `python ferramentas/atualizar_pessoal.py` (dentro da pasta do projeto) e depois abra `index.html`.
- **Testes:** `node testes/rodar_testes.js`, ou abra `testes/testes.html` no navegador.
- **Publicação:** `docs/COMO_PUBLICAR.md`.
