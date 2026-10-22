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

## Etapas seguintes, pendentes

1. Busca: preferir reconstrução do corpus a partir dos JSON locais. Referenciar
   a fonte e a posição de cada registro; manter o texto das páginas PDF no índice,
   pois esse texto não está necessariamente nos JSON e o app não tem extrator PDF
   JavaScript. Não cortar a busca ao título ou trecho. Comparar os 456 textos e,
   para 10 termos, IDs, ordem, pontuação e trechos dos resultados antes/depois.
   O carregador atual em `app.js` chama `createIndex(data.documents)` de forma
   síncrona; é necessário autorizar sua adaptação mínima para aguardar a leitura
   dos JSON locais. Os textos continuam dentro do APK, inclusive na primeira busca.
2. Minificar JSON preservando a igualdade estrutural; regenerar hashes do índice.
3. Atualizar `sw.js` e conferir a lista de arquivos. Esta etapa de PDFs ainda não
   foi integrada ao cache nem está pronta para distribuição.
4. Build assinado 4.9.113: preservar a assinatura existente e aplicar versionCode
   41017 (4.9.112 usa 41016). Remover a publicação automática de release da
   configuração candidata antes de qualquer merge; distribuir apenas artefato de teste.

A atualização do repositório pela rede foi bloqueada pela revisão automática
por causa da instrução de não baixar nada da internet. Não houve tentativa de
contornar o bloqueio. O ambiente local também não possui SDK Android/Gradle nem
a chave de assinatura. Para validar CI e compilar com a assinatura existente,
é preciso autorizar explicitamente a obtenção de código e dependências de build;
o aplicativo continuará funcionando offline, sem baixar conteúdo.
