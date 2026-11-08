# Liturgia OSM 4.9.134 — candidato, sem publicação

PRs encadeados: etapa 1 #159, etapa 2 #160, etapa 3 a abrir sobre a etapa 2. Não mesclar nem publicar sem autorização.

## Tamanhos medidos no Actions (bytes reais do APK assinado)

| Base/etapa | Bytes | Economia em relação à anterior |
|---|---:|---:|
| 4.9.133 | 10.154.751 | — |
| Etapa 1 (41049) | 10.146.310 | 8.441 |
| Etapa 2 (41050) | 7.254.836 | 2.891.474 |
| Etapa 3 (41051) | a medir | a medir |

Execuções verificadas: 42444331319 (etapa 1), 42444728302 (etapa 2). Ambas concluídas com sucesso, incluindo certificado estável 5b2b3319cc9f9bb61a14fb8a30e63044db225f7b930fca9568c82854f38b4fe0, identidade do app e conferência de assets. Testes físicos não realizados.

## Busca e geração no build

O índice já usava referências para os 96 registros dos três JSON, sem campo text duplicado. Os 1.376.974 bytes de text vêm dos PDFs. Reduzir esses textos a trechos curtos reduziria a cobertura; são preservados. O gerador agora também lê os livros fora do APK e confere seus hashes. O pipeline regenera o índice e exige identidade com o gerado versionado. O índice só é solicitado ao abrir a busca; foi retirado do CORE do service worker. No Android a primeira busca offline lê o asset embarcado; na web a primeira busca precisa ter sido aberta online para seu índice entrar no cache.

Índice: 1.567.522 → 1.567.142 bytes; a diferença é o manifesto de fontes, sem promessa de redução adicional do texto. 708 documentos e 10 consultas × 6 filtros preservam IDs, ordem, pontuação, texto e trechos. Medidas antes/depois, carga, construção, medianas/p95 e ambiente estão em otimizacao-4.9.134-busca-final.json. As medições de CPU local/CI não substituem as do A56.

## Requisitos e bloqueios de publicação

- Resultado de livro não baixado usa o mesmo controle de download da Biblioteca; abre na página da busca após baixar.
- Download em filesDir, hash/tamanho conferidos, arquivo temporário e renomeação atômica; remoção compartilhada entre as três entradas do volume de 2015.
- Hook pós-sync e gate garantem ausência dos placeholders Cordova no pacote; OFL preservada.
- URL raw imutável aprovada; verify-download-origin.py exige ancestral da main ou tag. O commit 3a90e17 já pertence à main. Nenhuma tag/release criada.
- O workflow histórico fixado na 4.9.117 exclui estas branches; as verificações e builds dedicados da 4.9.134 ficam ativos.

Pendentes de aceite no aparelho: instalar por cima da 4.9.133 sem desinstalar; baixar livro e abrir offline; localizar resultado de livro não baixado e baixar; remover/rebaixar; conferir busca, lembretes e widgets. Não marcar como concluídos sem retorno do responsável.
