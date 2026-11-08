# Liturgia OSM 4.9.134 — candidato, sem publicação

PRs encadeados: etapa 1 #159, etapa 2 #160, etapa 3 a abrir sobre a etapa 2. Não mesclar nem publicar sem autorização.

## Tamanhos medidos no Actions (bytes reais do APK assinado)

| Base/etapa | Bytes | Economia em relação à anterior |
|---|---:|---:|
| 4.9.133 | 10.154.751 | — |
| Etapa 1 (41049) | 10.146.310 | 8.441 |
| Etapa 2 (41050) | 7.254.968 | 2.891.342 |
| Etapa 3 (41051) | 7.254.968 | 0 |

Execuções verificadas: 42445322507 (etapa 1), 42445325030 (etapa 2). Etapa 3: execução 42445454377, concluída com sucesso. As três incluem certificado estável 5b2b3319cc9f9bb61a14fb8a30e63044db225f7b930fca9568c82854f38b4fe0, identidade do app e conferência de assets. Testes físicos não realizados.

## Busca e geração no build

O índice já usava referências para os 96 registros dos três JSON, sem campo text duplicado. Os 1.376.974 bytes de text vêm dos PDFs. Reduzir esses textos a trechos curtos reduziria a cobertura; são preservados. O gerador agora também lê os livros fora do APK e confere seus hashes. O pipeline regenera o índice e exige identidade com o gerado versionado. O índice só é solicitado ao abrir a busca; foi retirado do CORE do service worker. No Android a primeira busca offline lê o asset embarcado; na web a primeira busca precisa ter sido aberta online para seu índice entrar no cache.

Índice: 1.567.522 → 1.567.142 bytes; a diferença é o manifesto de fontes, sem promessa de redução adicional do texto. 708 documentos e 10 consultas × 6 filtros preservam IDs, ordem, pontuação, texto e trechos. Medidas antes/depois, carga, construção, medianas/p95 e ambiente estão em otimizacao-4.9.134-busca-final.json. Medidas da execução final no Actions: carga do corpus 12,30 → 8,11 ms; construção do índice 112,73 → 117,34 ms. Medianas das dez consultas: antes 0,20–16,06 ms, depois 0,21–15,37 ms. Tempos informativos de execuções sequenciais, sujeitos a aquecimento/JIT; o algoritmo de busca não mudou e não se afirma melhoria estatística. As medições de CI não substituem as do A56.

## Requisitos e bloqueios de publicação

- Resultado de livro não baixado usa o mesmo controle de download da Biblioteca; abre na página da busca após baixar.
- Download em filesDir, hash/tamanho conferidos, arquivo temporário e renomeação atômica; remoção compartilhada entre as três entradas do volume de 2015.
- Hook pós-sync e gate garantem ausência dos placeholders Cordova no pacote; OFL preservada.
- URL raw imutável aprovada; verify-download-origin.py exige ancestral da main ou tag. O commit 3a90e17 já pertence à main. Nenhuma tag/release criada.
- O workflow histórico fixado na 4.9.117 exclui estas branches; as verificações e builds dedicados da 4.9.134 ficam ativos.

Pendentes de aceite no aparelho: instalar por cima da 4.9.133 sem desinstalar; baixar livro e abrir offline; localizar resultado de livro não baixado e baixar; remover/rebaixar; conferir busca, lembretes e widgets. Não marcar como concluídos sem retorno do responsável.

## Entrega final de teste

- Actions: https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42445454377
- Artefato: Liturgia-OSM-4.9.134-etapa3 (ID 13603029752), com APK, identidade, assinatura, SHA256SUMS, relatórios e capturas dos testes.
- APK: 7.254.968 bytes; SHA-256 186f9fb1249d6df6f35ece0e77dc9645df591ef8266a9a1048c1c92d6f6f9e2e.
- Economia: 2.899.783 bytes (28,56%). A etapa 3 não reduz adicionalmente o tamanho do APK.
- npm test, checagem de sintaxe, geração determinística, equivalência das consultas, regressão visual, build Android, identidade e assinatura estável aprovados. Testes de navegador comprovam carga lazy, busca offline após abertura inicial, oferta de download em resultado de livro não baixado, hash inválido rejeitado, persistência, abertura offline e remoção compartilhada. A ponte nativa foi simulada nas verificações de interface; o build Android foi real. O funcionamento no A56 permanece pendente.
- PRs #159, #160 e #161 continuam em rascunho; nenhuma release ou tag criada. A release mais recente consultada permanece v4.9.133.
