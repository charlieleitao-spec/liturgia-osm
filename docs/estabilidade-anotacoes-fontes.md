# Estabilidade das anotações, fonte e navegação

Correções em resposta ao relato de funcionamento irregular das anotações e da barra de fonte durante a navegação.

## Causas identificadas

- A chave das notas usava a rota completa do leitor. Vésperas abertas depois de Laudes tinham uma chave diferente das mesmas Vésperas abertas diretamente. A nota continuava gravada, mas não era encontrada no outro caminho.
- O menu principal aumentava a escala em 8%, enquanto o leitor incorporado arredondava pixels inteiros. Os valores armazenados e exibidos podiam divergir ao alternar os leitores.
- A restauração de posição usava callbacks sem conferir a página atual. Uma navegação rápida podia receber depois a rolagem da leitura anterior. Também havia restauração automática após cada renderização da mesma rota.

## Correções

- Identidade de anotação baseada no conteúdo: celebração/hora, capítulo ou parte da devoção. Ignora o caminho inicial e estados de outras orações. Os registros existentes não são regravados nem migrados; ao editar uma nota encontrada por outro caminho, sua rota original é preservada. Registros antigos separados continuam disponíveis na Biblioteca. Exclusões e notas locais prevalecem em conflitos de restauração, inclusive quando a cópia usa outro caminho para o mesmo conteúdo.
- “Editar anotação” indica que a página já possui nota. Salvamento e retorno do foco permanecem disponíveis.
- `reader-scale.js` compartilha os mesmos limites, passo de 8%, preferência e arredondamento decimal entre os leitores. A mudança aplica CSS sem recriar a página. Os controles ficam desativados durante o carregamento do recurso e nos limites da escala.
- Retomada somente por solicitação explícita, vinculada ao documento e à rota. A troca de página, o fechamento/recarregamento do recurso ou uma alteração da fonte cancela a restauração pendente. Menu e diálogos não recolhem a navegação durante o uso dos controles.

## Verificação específica

`npm run test:reader-stability` executa oito cenários de identidade de notas, preservação de registros e conflitos de restauração, partes distintas das devoções, escala comum e limites. A integração DOM com JSDOM verifica:

1. Retomada solicitada em uma oração, seguida imediatamente por outra navegação: a página nova permanece no início; a retomada explícita continua funcionando.
2. Nota escrita em Vésperas depois de abrir Laudes, recurso reaberto diretamente em Vésperas e edição da mesma nota, sem duplicação.
3. Fonte 108% → 116% → 108% nos dois leitores, persistência ao trocar de hora, sincronização com o menu e bloqueio durante carregamento/no limite.
4. Menu aberto e eventos de rolagem sem herdar ou recolher a navegação da página anterior.

JSDOM foi adicionado somente como dependência de desenvolvimento para tornar essa regressão reproduzível. Não é empacotado nos arquivos web do APK. Não foram repetidos os testes antigos do A56 nem as auditorias funcionais já aprovadas. São verificações de código/DOM; não substituem uma observação no aparelho do comportamento relatado.
