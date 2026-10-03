/* CONFIGURAÇÕES: tudo que você pode querer mudar sem mexer na lógica.
   QUER USAR O OLHO MÁGICO NA SUA CIDADE? Veja o passo a passo em docs/ADAPTAR_PARA_SUA_CIDADE.md.
   Criamos um "espaço de nomes" chamado OBS (window.OBS) para guardar todas as funções do projeto
   num lugar só, evitando misturar com variáveis soltas do navegador. */
window.OBS = window.OBS || {};

OBS.config = {
  // NOME DO SITE: aparece no topo e na aba do navegador. Para trocar o nome, mude SÓ aqui.
  NOME_SITE: 'Olho Mágico',
  // Endereço-base da API de Dados Abertos (Contabilidade) da Prefeitura. Se um dia precisar de intermediário (proxy), troque aqui.
  API_BASE: 'https://videira.atende.net/api/WCPDadosAbertos',
  // Página oficial, usada nos links de "ver na fonte".
  PORTAL: 'https://videira.atende.net/transparencia/',
  // Página oficial que documenta a API de despesas (usada como fonte específica, em vez da página inicial do portal).
  DOC_API_DESPESAS: 'https://videira.atende.net/transparencia/item/api-de-dados-abertos-contabilidade',
  // Primeiro ano oferecido no seletor. Se a API tiver anos mais antigos, diminua este número.
  ANO_INICIAL: 2020,
  // Telas oficiais com o detalhe que a API aberta ainda não oferece (protegidas contra robôs,
  // por isso o site só leva a pessoa até elas, sem buscar os dados automaticamente).
  PORTAL_PAGAMENTOS: 'https://videira.atende.net/transparencia/item/pagamentos',
  PORTAL_SALARIOS: 'https://videira.atende.net/transparencia/item/relacao-funcionario-x-salario',
  // Página da Câmara onde ela publica as próprias folhas de pagamento (vereadores e servidores da Câmara).
  CAMARA_FOLHAS: 'https://www.camaravideira.sc.gov.br/imprensa/transparencia/0/4/0/644262',
  // PIX para apoio ao projeto. Os três valores precisam combinar: o site confere o código (js/pix-regras.js)
  // e, se algo não bater, NÃO mostra nada de Pix ("falha fechada"). Deixe PIX_CHAVE '' para esconder o botão.
  // ATENÇÃO: trocar estes valores é a mudança mais sensível do projeto. Veja CLAUDE.md antes.
  PIX_CHAVE: 'ec8e0fc1-33b9-437e-b64a-ff9b539bc57e',   // chave aleatória (não expõe CPF nem e-mail)
  // Código "Pix Copia e Cola" gerado pelo banco (sem valor fixo). O QR Code é desenhado A PARTIR deste texto.
  PIX_COPIA_E_COLA: '00020101021126580014br.gov.bcb.pix0136ec8e0fc1-33b9-437e-b64a-ff9b539bc57e5204000053039865802BR5913TIAGO C COSER6009SAO PAULO62070503***6304F8D7',
  PIX_RECEBEDOR: 'TIAGO C COSER',                      // nome gravado no código (campo 59)
  PIX_NOME_COMPLETO: 'Tiago Cristian Coser',           // nome que vários bancos mostram a quem paga
  // Endereço oficial do site, mostrado na caixa de apoio (para a pessoa perceber se está num site falso).
  SITE_OFICIAL: 'criscoser.github.io/olhomagico',

  // EXPLICAÇÕES AUTOMÁTICAS: quando o nome do credor bate com o padrão, aparece um texto explicando.
  // Só coloque aqui o que for CERTO pelo próprio nome (não adivinhe). link: 'salarios' mostra o atalho do portal.
  EXPLICACOES: [
    { padrao: /FOLHA DE PAGAMENTO/i,
      texto: 'Pelo nome, é o pagamento de salários de servidores, registrado de forma agrupada. Aqui não aparece cada pessoa.',
      link: 'salarios' },
    { padrao: /PREVID[EÊ]NCIA/i,
      texto: 'Pelo nome, é um órgão de previdência: recebe contribuições para a aposentadoria dos servidores.' }
  ],

  // LISTA DE SERVIDORES (aba "Servidores"). Os dados vêm da cópia diária feita pelo robô
  // ferramentas/atualizar_pessoal.py, que lê a API oficial abaixo e grava o arquivo dados/pessoal.js.
  PESSOAL: {
    ARQUIVO: 'dados/pessoal.js',
    API: 'https://videira.atende.net/api/transparencia-pessoal-funcionarios',
    LINHAS_INICIAIS: 20,   // quantas pessoas aparecem na busca antes do "Mostrar mais"
    LINHAS_POR_CLIQUE: 40,
    // Explicação de cada tipo de vínculo (o texto que a API manda no campo "regime").
    // A primeira regra cujo padrão bater com o vínculo é usada.
    VINCULOS: [
      // Os textos explicam o TIPO de vínculo; não afirmam como cada pessoa entrou (isso só aparece quando a fonte informa).
      { padrao: /comission/i, curto: 'Indicação (comissionado)',
        texto: 'Cargo em comissão: pela Constituição, é de livre nomeação e exoneração, sem concurso.' },
      { padrao: /estatut/i, curto: 'Servidor efetivo',
        texto: 'Servidor efetivo, no regime estatutário.' },
      { padrao: /prazo determinado|tempor/i, curto: 'Temporário',
        texto: 'Contratação por tempo determinado.' },
      { padrao: /estagi/i, curto: 'Estagiário', texto: 'Estudante em estágio, por tempo limitado.' },
      { padrao: /pol[ií]tic/i, curto: 'Agente político', texto: 'Cargo político, como prefeito, vice-prefeito ou secretário.' }
    ],
    // Cargos que contam como "políticos" no destaque do topo. Cuidado: "SECRETÁRIO ESCOLAR" NÃO é político,
    // por isso o padrão exige "SECRETÁRIO MUNICIPAL".
    CARGOS_POLITICOS: [/\bPREFEIT[OA]\b/i, /VICE[- ]?PREFEIT/i, /SECRET[AÁ]RI[OA] MUNICIPAL/i]
  },

  // Tempo máximo de espera pela API (em milissegundos).
  TIMEOUT_MS: 30000,
  // true = mostra o nome de pessoas físicas; false = esconde. Decisão editorial SUA (veja README).
  MOSTRAR_NOME_PESSOA_FISICA: true,
  // Quantos credores aparecem antes de clicar em "Mostrar mais", e quantos entram a cada clique.
  LINHAS_INICIAIS: 10,
  LINHAS_POR_CLIQUE: 20
};
