# Etapa 2 — busca completa sem duplicar os JSON

`search-index.json`: 2.102.749 → 927.997 bytes (−1.174.752; −55,9%).
O schema 2 referencia cada registro do JSON local pela fonte e caminho no objeto.
O corpus completo é reconstruído ao abrir a busca e guardado em IndexedDB,
com revisão derivada dos hashes das fontes. Cache antigo é reconstruído;
armazenamento indisponível não impede a leitura dos arquivos locais.

Os textos das páginas PDF permanecem no manifesto: não há extrator PDF no app
e esses textos não são integralmente substituíveis pelos JSON. Não foram
truncados títulos, textos, resultados ou trechos.

A adaptação autorizada em `app.js` se limita a aguardar `loadDocuments` antes
de chamar o mecanismo existente. Ranking e tokenização permanecem inalterados.

Verificação: todos os 456 documentos reconstruídos são profundamente iguais
aos originais da 4.9.112. Dez consultas, cada uma com os seis filtros,
produzem resultados idênticos incluindo IDs, ordem, pontuação e trechos:
misericórdia; coroa nossa senhora dores; Regra Vida Ordem Secular; 2024;
Deus; Paulino; Stabat Mater; Maria; ressurreição; servos.

`npm test` e `node scripts/verify-search-equivalence.cjs` passaram localmente.
O gate de CI acompanha as PRs encadeadas em `optimize/**` sem publicar releases.
