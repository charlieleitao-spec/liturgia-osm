# Etapa 1 — fontes dos PDFs (candidata 4.9.113)

Base local: commit 36f076d. Os 152 arquivos existentes em `assets/public` do APK
4.9.112 disponibilizado anteriormente foram comparados byte a byte com o checkout:
nenhuma diferença. APK de referência: 13.272.599 bytes.

## Resultado verificado

| Medida | Antes | Depois | Economia |
| --- | ---: | ---: | ---: |
| 63 PDFs, bytes nos arquivos | 8.716.675 | 3.924.001 | 4.792.674 (55,0%) |
| PDFs dentro do APK, bytes comprimidos | 8.033.473 | 2.643.126 estimados | 5.390.347 estimados |
| APK completo | 13.272.599 | 7.882.252 estimados | 40,6% estimados |

A estimativa usa DEFLATE nível 6 e os tamanhos comprimidos reais dos PDFs no APK
original. Não é uma compilação Android nem inclui eventuais diferenças de alinhamento,
assinatura e metadados do novo build. Nenhum APK de teste foi gerado nesta etapa.

Os 63 PDFs e as 342 páginas passaram pelas seguintes comparações antes da gravação:

- Texto de cada página idêntico com PyMuPDF.
- Texto extraído por Poppler `pdftotext -layout` idêntico byte a byte.
- Dimensões e rotação idênticas.
- Pixels RGB de todas as páginas idênticos a 144 dpi com PyMuPDF.

O script `scripts/optimize-pdfs.py` reduz as fontes incorporadas sem substituir as
fontes ou recriar os documentos. Todos os 63 arquivos ficaram menores.
Versões usadas: PyMuPDF 1.26.6, Poppler 24.02.0.
A tabela completa, com hashes antes/depois, está em `pdf-bytes.csv`.

Os 32 registros do santoral e os 32 registros de `oficios-osm.json.celebracoes`
permanecem inalterados. Os PDFs continuam sendo 32 do missal e 31 dos ofícios.
`app.js`, `app.css` e `servite-3.js` não foram alterados.

O índice foi regenerado apenas para atualizar os 63 hashes dos PDFs: seus 456
documentos continuam exatamente iguais aos da 4.9.112. `npm test` passou integralmente.
Não foi executado o CI remoto nem a suíte de navegador nesta etapa.

## Etapas seguintes

- Etapa 2: referências aos JSON locais, corpus completo reconstruído no primeiro uso
  e cache opcional em IndexedDB. Ver `search.md` e `search-equivalence.json`.
- Etapa 3: minificação com igualdade estrutural; ver `json.md` e `json-bytes.csv`.
- Etapa 4: cache `liturgia-osm-v4.9.113-otimizacao-offline`, todos os arquivos
  alterados incluídos em CORE. Candidata 4.9.113, versionCode 41017, assinatura
  estável verificada contra a 4.9.112 (41016). O fluxo não publica releases.

O CI da candidata produz `size-report.json` com os bytes reais dos APKs e dos
arquivos comprimidos por grupo, e verifica a integridade dos JSON e do cache.
O teste Android instala a 4.9.112, preserva preferências/favoritos/histórico,
instala a candidata por cima e testa a primeira busca com cache removido,
redes móveis/Wi-Fi desabilitadas e requisições externas recusadas.

As quatro PRs permanecem em rascunho, sem merge. As estimativas acima são da
etapa 1 isolada; o resultado final medido está no artefato do CI.
