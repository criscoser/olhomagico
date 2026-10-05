# Integridade e confiabilidade dos dados

## Controles identificados

- Cada fonte possui adaptador próprio em `ferramentas/fontes/`.
- O coordenador preserva o último arquivo válido se a atualização atual falhar.
- A geração usa arquivo temporário e substituição atômica.
- O fluxo de recuperação lê o formato `window.VARIAVEL = JSON;` e regrava apenas o objeto JSON.
- Os adaptadores incluem metadados de geração e fonte.
- Os testes exercitam paginação, valores ausentes, negativos, duplicidades conhecidas, formatos inválidos e preservação do snapshot quando uma fonte falha.
- O código de despesas mantém empenhado, liquidado e pago como etapas distintas e não guarda documento do credor na saída agregada.
- O conversor numérico Python foi endurecido contra `NaN`, infinitos e inteiros fora do intervalo de conversão segura.

## Limitações e cuidados

- A ausência de `dados/*.js` no ZIP impede a conferência dos valores realmente publicados.
- Um hash SHA-256 comprova igualdade de conteúdo em relação a uma impressão digital conhecida; isoladamente, não comprova quem originou o arquivo.
- Fontes diferentes podem ter datas de referência, periodicidades, unidades e conceitos distintos. Não somar ou comparar sem harmonização documentada.
- O resumo de despesas depende da semântica da API de origem; os testes simulados não provam que o portal municipal não mudou o contrato de dados.
- Dados nulos, ausentes, zero e negativos precisam continuar semanticamente distintos.
- A atualização preserva o último arquivo válido, mas isso pode deixar uma fonte desatualizada. A interface precisa exibir a data de sucesso e a situação da tentativa, sem sugerir que o dado foi atualizado hoje.
- Não inferir que endpoint público é API oficial/documentada sem documentação da fonte.
- Não inferir que erro HTTP, CORS ou CAPTCHA significa inexistência de dados ou API.

## Próximos controles recomendados

- Validar esquema de cada arquivo antes da publicação, incluindo campos obrigatórios, tipos, limites de tamanho e `meta.geradoEm`.
- Exibir no portal “última atualização bem-sucedida” separadamente de “última tentativa”.
- Criar testes de contrato com respostas gravadas e sanitizadas das fontes, versionadas no repositório de testes, sem dados pessoais desnecessários.
- Criar alertas para fonte que permanece sem sucesso por mais de um período esperado.
- Conferir amostras e totais diretamente nas fontes oficiais em rotina editorial, registrando período, método e limitações.
