# Liturgia OSM 4.9.129 — otimização dos recursos

Base: `30ad09b8998ccc7ad938a184d66e9ce136e40fe6` (4.9.128). Branch: `optimize/4.9.129-assets`.

## Resultado local

- Inventário real: **66 PDFs, 594 páginas**, e não 67 PDFs. Há 32 PDFs de Missa, 31 de Ofícios e 3 da Biblioteca.
- PDFs: **7,111,456 → 5,579,849 bytes**, economia de **1,531,607 bytes (21.54%)**.
- Oito fontes removidas: **374,148 bytes**. Duas fontes Cinzel mantidas.
- Economia de PDFs e arquivos WOFF2: **1,905,755 bytes**, antes da compactação do APK.
- APK público 4.9.128: **10.637.179 bytes**. Tamanho do APK 4.9.129: pendente do build assinado; não inferido a partir dos recursos.
- APP_VERSION, package.json, package-lock.json e cache: **4.9.129**.
- Novo APK preparado com `versionCode 41042`, superior a `41041` da 4.9.128, mesmo applicationId e assinatura estável verificada pelo CI.

## PDFs

Comando: `qpdf --object-streams=generate --compress-streams=y --recompress-flate --compression-level=9` (qpdf 11.9.0).

Todos os 66 resultados ficaram menores e foram aceitos. Cada candidato passou em `qpdf --check`, sem avisos ou erros. `pdftotext` simples e `-layout` produziram exatamente os mesmos bytes, incluindo os separadores de página. As 594 páginas tiveram pixels idênticos a 144 dpi no PyMuPDF 1.26.6; dimensões, caixas de página, rotação, links, marcadores, rótulos de página e metadados foram preservados. A versão declarada do formato PDF pode subir a 1.5 para suportar object streams; isso não altera conteúdo ou numeração.

O índice foi regenerado apenas para atualizar os hashes dos PDFs. As **708 entradas, textos, IDs, ordem, fontes, URLs e âncoras #page=N são idênticos à base**. Dez consultas em seis filtros tiveram resultados idênticos, incluindo pontuação e trechos.

### Experiência de 150 dpi no Ratio

Mantida apenas a recompressão sem perdas: **1.872.785 → 1.755.275 bytes**. O PDF tem 79 páginas. A inspeção identifica quatro imagens-base compartilhadas; repetições e máscaras não equivalem a 83 fotografias independentes.

As duas imagens maiores já têm aproximadamente 70 e 87 dpi efetivos. Reduzir a cerca de 150 dpi as duas imagens menores acima desse valor produziu **1.764.066 bytes**, 8.791 bytes a mais que a opção sem perdas. Na inspeção visual, a conversão experimental também perdeu transparência do brasão, criando um retângulo preto. **Candidato descartado; nenhum desses pixels foi incorporado.** Não houve rasterização das páginas nem alteração da camada de texto. Dados do experimento em `ratio-experiment.json`.

### Tamanhos por arquivo

Valores exatos em bytes; caminhos relativos a `www/data/pdfs/`.

| Arquivo | Páginas | Antes | Depois | Economia |
|---|---:|---:|---:|---:|
| biblioteca/constituicoes-regra-diretorio-osm-2015.pdf | 152 | 1070418 | 967679 | 102739 |
| biblioteca/ratio-institutionis-osm-2015.pdf | 79 | 1872785 | 1755275 | 117510 |
| biblioteca/regra-vida-ordem-secular-1995.pdf | 21 | 244252 | 222594 | 21658 |
| missal/adviento.pdf | 4 | 59253 | 40792 | 18461 |
| missal/agustin.pdf | 3 | 41247 | 27810 | 13437 |
| missal/andres.pdf | 3 | 74498 | 57818 | 16680 |
| missal/antonio.pdf | 3 | 58692 | 44883 | 13809 |
| missal/benincasa.pdf | 3 | 40747 | 27602 | 13145 |
| missal/bonaforli.pdf | 3 | 49627 | 35371 | 14256 |
| missal/bonapistoia.pdf | 3 | 48844 | 35134 | 13710 |
| missal/clelia.pdf | 3 | 49936 | 35025 | 14911 |
| missal/difuntos.pdf | 4 | 52147 | 37179 | 14968 |
| missal/dolorosa.pdf | 6 | 86451 | 58796 | 27655 |
| missal/filipe.pdf | 7 | 96664 | 67556 | 29108 |
| missal/francisco.pdf | 3 | 40463 | 26960 | 13503 |
| missal/fundadores.pdf | 8 | 87074 | 58325 | 28749 |
| missal/isabel.pdf | 3 | 49331 | 35335 | 13996 |
| missal/jeronimo.pdf | 3 | 48867 | 34345 | 14522 |
| missal/joaquin.pdf | 4 | 54647 | 38819 | 15828 |
| missal/juana.pdf | 3 | 48176 | 34190 | 13986 |
| missal/juanangel.pdf | 3 | 51454 | 36258 | 15196 |
| missal/juliana.pdf | 5 | 65978 | 45294 | 20684 |
| missal/maria1.pdf | 3 | 61429 | 46945 | 14484 |
| missal/maria2.pdf | 7 | 75763 | 50140 | 25623 |
| missal/mariagracia.pdf | 3 | 49884 | 36001 | 13883 |
| missal/msenario.pdf | 5 | 69559 | 48928 | 20631 |
| missal/navidad.pdf | 3 | 50721 | 36005 | 14716 |
| missal/pascua.pdf | 4 | 53420 | 37577 | 15843 |
| missal/peregrino.pdf | 6 | 86133 | 64848 | 21285 |
| missal/piecruz.pdf | 8 | 82669 | 53196 | 29473 |
| missal/tiago.pdf | 3 | 40907 | 27477 | 13430 |
| missal/todosantos.pdf | 4 | 61577 | 45067 | 16510 |
| missal/tomas.pdf | 3 | 39941 | 27133 | 12808 |
| missal/ubaldo.pdf | 3 | 40028 | 26961 | 13067 |
| missal/villa.pdf | 3 | 57012 | 42666 | 14346 |
| oficios/adviento.pdf | 7 | 64584 | 44716 | 19868 |
| oficios/agustin.pdf | 8 | 72736 | 44516 | 28220 |
| oficios/andres.pdf | 2 | 27529 | 20491 | 7038 |
| oficios/antonio.pdf | 9 | 78643 | 48374 | 30269 |
| oficios/benincasa.pdf | 2 | 26390 | 18979 | 7411 |
| oficios/bonaforli.pdf | 3 | 32420 | 23481 | 8939 |
| oficios/bonapistoia.pdf | 2 | 28755 | 21429 | 7326 |
| oficios/clelia.pdf | 3 | 30525 | 22506 | 8019 |
| oficios/difuntos.pdf | 16 | 142162 | 81607 | 60555 |
| oficios/dolorosa.pdf | 17 | 156972 | 89436 | 67536 |
| oficios/filipe.pdf | 9 | 81235 | 50634 | 30601 |
| oficios/francisco.pdf | 3 | 35510 | 26002 | 9508 |
| oficios/fundadores.pdf | 14 | 132519 | 76056 | 56463 |
| oficios/isabel.pdf | 3 | 31736 | 22916 | 8820 |
| oficios/jeronimo.pdf | 2 | 27949 | 20770 | 7179 |
| oficios/joaquin.pdf | 4 | 38041 | 28386 | 9655 |
| oficios/juana.pdf | 3 | 43730 | 34662 | 9068 |
| oficios/juanangel.pdf | 3 | 35426 | 25754 | 9672 |
| oficios/juliana.pdf | 9 | 82884 | 50029 | 32855 |
| oficios/mariagracia.pdf | 5 | 46095 | 29545 | 16550 |
| oficios/msenario.pdf | 4 | 42678 | 29082 | 13596 |
| oficios/navidad.pdf | 5 | 48526 | 32146 | 16380 |
| oficios/ordinario.pdf | 28 | 238546 | 151083 | 87463 |
| oficios/pascua.pdf | 5 | 46984 | 29596 | 17388 |
| oficios/peregrino.pdf | 8 | 75593 | 47270 | 28323 |
| oficios/piecruz.pdf | 14 | 128386 | 75052 | 53334 |
| oficios/tiago.pdf | 3 | 36099 | 27316 | 8783 |
| oficios/todosantos.pdf | 14 | 129463 | 76225 | 53238 |
| oficios/tomas.pdf | 2 | 27899 | 20438 | 7461 |
| oficios/ubaldo.pdf | 3 | 30779 | 22994 | 7785 |
| oficios/villa.pdf | 3 | 30068 | 22374 | 7694 |
| **Total** | **594** | **7111456** | **5579849** | **1531607** |

## Fontes

Foram inspecionados todos os arquivos de CSS, HTML, JavaScript e dados em `www`, incluindo `servite-3.js`. `fonts.css` é carregado por `servite.html`. `--font-app` usa Georgia.

| Arquivos | Decisão | Evidência |
|---|---|---|
| cinzel-normal-latin.woff2 | Manter | `renderFinalAntifonaBlock()` em servite-3.js declara Cinzel no título latino das antífonas. Normal, pesos disponíveis 500–700. |
| cinzel-normal-latin-ext.woff2 | Manter | Complemento de caracteres da família utilizada; conservado por precaução quanto aos títulos e repertório futuro. |
| cormorant-garamond-normal-latin.woff2 e latin-ext | Remover | Nenhum uso da família fora da sua própria declaração de @font-face/cache/licença. |
| cormorant-garamond-italic-latin.woff2 e latin-ext | Remover | Mesmo resultado; o uso genérico de itálico em Georgia não exige esta família. |
| eb-garamond-normal-latin.woff2 e latin-ext | Remover | Nenhum uso da família fora da sua própria declaração de @font-face/cache/licença. |
| eb-garamond-italic-latin.woff2 e latin-ext | Remover | Nenhum uso da família; variantes sem consumidores. |
| OFL-LICENSES.txt | Manter integralmente | Mesmo conteúdo e hash da base. |

As oito declarações correspondentes foram removidas de fonts.css e do CORE de sw.js. O cache passa de 156 para 148 entradas, mantendo todos os 66 PDFs.

## Cordova

Mantidos `www/cordova.js` e `www/cordova_plugins.js` (0 byte). Na versão instalada @capacitor/cli 8.5.1, `handleCordovaPluginsJS()` chama `createEmptyCordovaJS()` quando não há plugins Cordova e cria ambos no diretório Android de recursos. Sem ganho material de tamanho, não se interfere nesse comportamento gerado.

## Validação e limites

**Passou localmente:** npm test; npm run test:reader-stability; npm run test:personal; equivalência de busca (708 documentos, 10 consultas × 6 filtros); auditoria completa dos PDFs; sintaxe Python, JS, shell e YAML; git diff --check.

**Preparado para CI, ainda sem execução nesta revisão:** tipografia no Chromium; atualização real do service worker da 4.9.128 para 4.9.129, preservação do armazenamento e leitura dos 148 recursos offline; build Android com assinatura estável; comparação de certificados e tamanhos; instalação sobre a 4.9.128 sem desinstalação; preservação do UID e hashes dos arquivos/armazenamento; abertura das 594 páginas pelo PdfRenderer do Android e destino #page=2 através da busca offline.

A criação do projeto Android, a sincronização Capacitor e os patches de notificações, PDF, widgets e cópia pessoal passaram localmente; ambos os placeholders Cordova foram recriados automaticamente com 0 byte.

O Chromium local não iniciou devido à restrição de socket do ambiente. Não se declara aprovação visual do navegador, do APK ou da instalação sem a execução correspondente. A aprovação visual dos PDFs sem perdas é respaldada pela comparação de pixels de todas as páginas e inspeção da capa do Ratio.

Workflow de teste: `.github/workflows/test-4.9.129.yml`. Dispara somente na branch de otimização ou manualmente; guarda APK e evidências e **não publica release**. Reutiliza o processo da 4.9.128, com mesma assinatura, R8, ícones, notificações, widgets e leitor PDF.

O gate existente de equivalência apontava para um corpus antigo de 456 documentos. Foi atualizado para a base 4.9.128 de 708 documentos e passou a resolver também as referências JSON do manifesto de origem, evitando comparar referências compactadas com documentos já resolvidos. O gate passa a atender PRs para main.

## Arquivos

Modificados: 66 PDFs; www/data/search-index.json (hashes); www/app.js; www/sw.js; www/media/fonts/fonts.css; package.json; package-lock.json; scripts/verify-search-equivalence.cjs; .github/workflows/optimization-gate.yml.

Adicionados: scripts/recompress-pdfs.py; scripts/verify-optimized-assets.py; scripts/verify-asset-cache.mjs; scripts/verify-asset-upgrade.sh; scripts/android-validation/AssetUpgradeInstrumentation.java; .github/workflows/test-4.9.129.yml; este relatório, CSV com tamanhos/hashes e JSONs de fontes removidas e experimento do Ratio.

Removidos:

- `www/media/fonts/eb-garamond-normal-latin-ext.woff2` — 113928 bytes.
- `www/media/fonts/cormorant-garamond-normal-latin.woff2` — 37640 bytes.
- `www/media/fonts/eb-garamond-normal-latin.woff2` — 44336 bytes.
- `www/media/fonts/cormorant-garamond-italic-latin.woff2` — 39260 bytes.
- `www/media/fonts/eb-garamond-italic-latin-ext.woff2` — 45468 bytes.
- `www/media/fonts/cormorant-garamond-italic-latin-ext.woff2` — 34392 bytes.
- `www/media/fonts/cormorant-garamond-normal-latin-ext.woff2` — 33736 bytes.
- `www/media/fonts/eb-garamond-italic-latin.woff2` — 25388 bytes.

## Bloqueio de envio

A revisão automática rejeitou o envio da branch ao GitHub por exigir autorização explícita para esse destino externo. O conector confirmou o repositório público `charlieleitao-spec/liturgia-osm`, a URL de clone e as permissões de escrita, mas a revisão manteve o bloqueio. Nenhuma alternativa de publicação foi usada. O CI, a compilação com a chave estável e a instalação sobre a 4.9.128 permanecem pendentes. Os resultados locais acima estão concluídos e as alterações estão registradas em commit local.
