# Etapa 3 — minificação sem perda

JSON de conteúdo/configuração em `www` (fora o índice gerado):
1.239.053 → 1.208.180 bytes, economia de 30.873 bytes.
O índice gerado perde também sua quebra de linha final: 927.997 → 927.996 bytes.
Grande parte dos JSON maiores já estava compactada; não há ganho relevante
adicional somente removendo espaços. A tabela por arquivo está em `json-bytes.csv`.

Cada arquivo foi carregado antes/depois e os valores comparados por igualdade
estrutural. Strings internas, incluindo quebras de linha litúrgicas, não mudam.
O gerador atualiza os hashes do índice depois da minificação.

`npm test` e a equivalência integral da busca passaram localmente. O mesmo gate
é executado na PR em CI. Contagens: 32 celebrações, 32 registros de ofícios,
63 PDFs e 456 documentos pesquisáveis.
