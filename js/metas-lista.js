/* METAS DO PROJETO (página #metas). Para marcar uma meta como alcançada, troque  alcancado: false  por
   alcancado: true  no item. A página mostra o ✓ verde e conta o progresso de cada fase sozinha.
   VALORES: aproximados, para planejamento (pesquisados em 04/10/2026). Os marcados "estimativa" são faixas de
   mercado, não orçamentos. Fontes conferidas: domínio .com.br no Registro.br (R$ 40/ano); marca no INPI (taxa única
   por classe, desde 20/09/2025 já cobre a concessão e os 10 primeiros anos: R$ 880, ou R$ 440 com desconto para
   pessoa física e entidade sem fins lucrativos, com especificação pré-aprovada). */
OBS.METAS = [
  {
    fase: 1, nome: 'Municipal', resumo: 'Videira: o portal de uma cidade, com os dados oficiais conferidos.',
    itens: [
      { nome: 'Site no ar com os dados oficiais de Videira', valor: 'R$ 0', alcancado: true },
      { nome: 'Atualização automática todos os dias', valor: 'R$ 0 (GitHub Actions, gratuito para projetos de código aberto)', alcancado: true },
      { nome: 'Hospedagem do site', valor: 'R$ 0 (GitHub Pages)', alcancado: true },
      { nome: 'Código aberto (licença MIT)', valor: 'R$ 0', alcancado: true },
      { nome: 'E-mail de contato do projeto', valor: 'R$ 0', alcancado: true },
      { nome: 'Domínio próprio (.com.br), para o site não depender do endereço do GitHub', valor: 'R$ 40 por ano (Registro.br)', alcancado: false },
      { nome: 'Registro da marca "Olho Mágico" no INPI (1 classe), se o nome estiver disponível', valor: 'R$ 440 (pessoa física; R$ 880 sem desconto), taxa única que cobre 10 anos', alcancado: false }
    ]
  },
  {
    fase: 2, nome: 'Estadual', resumo: 'Os 295 municípios de Santa Catarina, com Prefeitura e Câmara de cada um.',
    itens: [
      { nome: 'Guardar o histórico dos dados (uma cópia por dia)', valor: 'R$ 0 (no próprio GitHub)', alcancado: false },
      { nome: 'Revisão jurídica (privacidade, LGPD e termos de uso)', valor: 'R$ 1.000 a R$ 5.000, uma vez (estimativa)', alcancado: false },
      { nome: 'Formalizar o projeto como associação sem fins lucrativos (CNPJ), se for preciso', valor: 'R$ 500 a R$ 2.000 para abrir e R$ 150 a R$ 500 por mês de contador (estimativa)', alcancado: false },
      { nome: 'Servidor em nuvem para coletar e guardar os dados', valor: 'R$ 200 a R$ 800 por mês (estimativa)', alcancado: false },
      { nome: 'Banco de dados', valor: 'R$ 100 a R$ 500 por mês (estimativa)', alcancado: false },
      { nome: 'Levantamento dos cerca de 590 portais (Prefeituras e Câmaras)', valor: '100 a 150 horas de trabalho (voluntários ou bolsa)', alcancado: false },
      { nome: 'Revisores da comunidade para conferir os dados', valor: 'Voluntários', alcancado: false }
    ]
  },
  {
    fase: 3, nome: 'Nacional', resumo: 'Os 5.570 municípios do Brasil.',
    itens: [
      { nome: 'Infraestrutura em nuvem para todo o país', valor: 'R$ 1.000 a R$ 5.000 por mês (estimativa)', alcancado: false },
      { nome: 'Equipe técnica e editorial', valor: 'A definir', alcancado: false },
      { nome: 'Marca em mais classes no INPI', valor: 'R$ 440 a R$ 880 por classe', alcancado: false },
      { nome: 'Parcerias com universidades e organizações da sociedade civil', valor: 'A definir', alcancado: false }
    ]
  },
  {
    fase: 4, nome: 'Mundial', resumo: 'Levar a ideia a outros países.',
    itens: [
      { nome: 'Registro internacional da marca (Protocolo de Madri, pelo INPI)', valor: 'Varia por país: alguns milhares de reais (estimativa)', alcancado: false },
      { nome: 'Site em outros idiomas', valor: 'A definir', alcancado: false },
      { nome: 'Estudo das leis de acesso à informação de cada país', valor: 'A definir', alcancado: false }
    ]
  }
];
