# Busca de textos e documentos

Acesso: Menu → Biblioteca → Buscar textos e documentos.

Pesquisa local em todas as bases JSON de conteúdo e nos 63 PDFs empacotados: 456 entradas, incluindo 342 páginas de PDF. Aceita palavras com e sem acento, termos combinados e prefixo na última palavra. Prioriza títulos; permite filtrar Orações, Missas, Ofícios, Santoral e PDFs. Os resultados exibem trecho, fonte e página. O leitor abre o texto completo da entrada; nos PDFs também oferece o arquivo com referência à página. Voltar preserva a consulta e o filtro.

O corpus é carregado sob demanda. Nas versões Android integra os arquivos locais; na versão web o service worker guarda corpus e motor para uso offline após a instalação do cache. Não consulta conteúdo remoto nem PDFs que não estejam incluídos no aplicativo. A abertura do PDF na página indicada depende do suporte do leitor de PDF; o texto da página permanece disponível no leitor interno.

## Atualização do conteúdo

Executar `npm run search:build` depois de modificar as bases JSON ou PDFs. Requer Python 3 e Poppler (`pdftotext`). O gerador é determinístico e não altera os arquivos originais. O corpus mantém hashes das fontes; `npm test` falha se uma fonte existente mudar sem regenerar o índice.

## Validação

`npm test` inclui acentos, prefixos, filtros, relevância de títulos, edição 2024, resultados vazios, referências aos PDFs locais e integridade das fontes. A validação no aparelho Android continua necessária antes de lançar uma nova versão.
