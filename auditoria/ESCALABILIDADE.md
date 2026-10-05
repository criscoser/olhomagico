# Escalabilidade, arquitetura e manutenção

## Estado atual

O portal publicado é uma instância estática focada em Videira/SC. Os robôs Python recebem um arquivo `municipio.json`, mas a interface e a política CSP também contêm endereços, textos, títulos, metadados e rótulos específicos de Videira.

Portanto, a configuração do robô é reaproveitável em parte, mas a aplicação inteira ainda não é multi-município por simples troca de JSON.

## O que precisa ser definido antes de expandir

### Configuração por instância

Definir um contrato de configuração versionado para:
- nome, UF, código IBGE e identificadores específicos de cada fonte;
- domínio e páginas oficiais do Executivo e Legislativo;
- adaptadores suportados, documentação, limites, autenticação e periodicidade;
- fontes sem API ou com CAPTCHA, que devem permanecer links manuais;
- fontes e domínios permitidos pela CSP daquela instância;
- rótulos e metadados sociais (title, description, Open Graph).

### Modelo de dados comum

Cada adaptador deve entregar um formato normalizado, sem apagar o formato original necessário à rastreabilidade:
- `fonte`, `url`, `tipo`, `periodo`, `consultadoEm`, `geradoEm`, `metodo`;
- `status`: atualizado, parcial, pulado, falha ou desatualizado;
- limitações conhecidas e identificadores de registro, quando disponíveis;
- valores nulos sem conversão automática para zero.

### Operação para muitos municípios

Para 295 municípios (Executivo e Legislativo), evitar um workflow monolítico que atualize tudo em uma única execução. Avaliar matriz de execução, lotes e filas com limites por provedor. Respeitar quotas de API, concorrência e janelas de manutenção. Um limite deve ser configurável por fonte, não um valor global cego.

### Isolamento

- Não misturar snapshots de municípios.
- Não reutilizar tokens entre órgãos.
- Armazenar credenciais fora do conteúdo publicado.
- Isolar erros por município e por fonte.
- Não permitir que uma configuração fornecida por usuário transforme qualquer URL em destino arbitrário sem validação (risco de SSRF nos robôs).
- Definir política para URLs/domínios autorizados antes de executar adaptadores.

### Publicação e custos

O modelo estático pode manter custo baixo, mas exige automação robusta, snapshots e controle de tamanho. Antes de nacionalizar, medir:
- tamanho dos dados por município;
- tempo de coleta por fonte;
- limites e disponibilidade dos provedores;
- número de arquivos e frequência de publicação;
- tempo de CI e limite de execução;
- custo e retenção de armazenamento se o histórico for adotado.

## Não recomendado nesta etapa

Não criar ainda uma camada de autenticação, banco de dados central, painel administrativo ou API própria sem uma necessidade operacional demonstrada. Primeiro consolidar contratos de dados, estado de atualização, isolamento por município e evidência de fontes.
