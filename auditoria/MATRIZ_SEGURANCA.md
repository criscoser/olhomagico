# Matriz de segurança e privacidade

| Área | Evidência no código | Resultado desta revisão | Ação |
|---|---|---|---|
| Tokens CGU/Câmara | Variáveis de ambiente e Secrets do GitHub | Não há tokens literais nos arquivos do ZIP; bug de log de CAPTCHA corrigido | Manter rotação e não compartilhar logs sensíveis |
| Token em URL da Câmara | `keysoft=` na query string | Risco inerente ao endpoint; mensagens do robô são mascaradas | Verificar se provedor oferece cabeçalho alternativo |
| Pix | CRC/campos validados no front; SHA-256 externo opcional no workflow | Validação local presente; proteção externa é ignorada se `PIX_SHA256` faltar | Confirmar Secret cadastrado antes de produção |
| XSS | `OBS.el`, `textContent`, links validados | Busca estática não encontrou sink executável perigoso | Manter padrão e revisar novas telas |
| CSV injection | `OBS.exportar.celula` | Prefixos de fórmula escapados | Manter testes ao adicionar colunas |
| CPF | Máscara em exportação/PNCP; não guardado em alguns agregados | Controles presentes; validar cada nova fonte antes de armazenar | Não adicionar identificadores sem necessidade |
| Dados pessoais de fornecedores | `MOSTRAR_NOME_PESSOA_FISICA: true` | Nome pode aparecer; CPF mascarado | Decisão editorial e análise de minimização |
| CSP | Meta `Content-Security-Policy` em `index.html` | Política restritiva no documento; não equivale a cabeçalho HTTP | Verificar no site publicado e manter origens mínimas |
| Iframe ACSP | URL validada, `sandbox`, `no-referrer`, carregamento após clique | Reduz exposição e isolamento do widget | Rever se o widget mudar |
| GitHub Actions | SHA fixo, permissões específicas, `persist-credentials: false` | Configuração adequada no YAML inspecionado | Revisar permissões quando novos jobs forem criados |
| Arquivos de dados | Recuperação como JSON puro e regravação | Defesa útil contra persistência de código em snapshots | Testar esquema e tamanho máximo de dados |
| Dependências | JavaScript puro e Python padrão | Sem dependências de pacote detectadas nos scripts auditados | Continuar evitando dependências desnecessárias |

## Limitações

A análise é estática e baseada no ZIP. Não confirma os headers efetivos do GitHub Pages, logs do provedor da Câmara, segredos configurados na conta, nem comportamento de terceiros.
