# Liturgia OSM 4.9.134 — revisão por etapas

Base: release/4.9.133, commit 3a90e17f8e4faa4055f7b01201c5df71cc727265.

## Etapa 1

Seis arquivos saem do pacote: dois placeholders vazios Cordova são removidos; quatro documentos são preservados em docs/assets-retirados. OFL-LICENSES.txt permanece no aplicativo. O gate deixa de exigir os placeholders. O hook capacitor:sync:after remove também os placeholders recriados pelo Capacitor e interrompe a operação se algum deixar de ser vazio. Nenhum conteúdo litúrgico, estilo ou controle é alterado; apenas versão interna e chave do cache passam para 4.9.134.

Verificação local: npm test e sintaxe de todos os JavaScript de www aprovados. Busca com 708 entradas. Nenhum HTML/JS/JSON/CSS operacional referencia os arquivos retirados. O workflow exclusivo da branch gera APK assinado com versionCode 41049, confere o certificado estável e guarda somente artefatos; não contém publicação ou criação de tag. O relatório cleanup-size.json compara os bytes reais com o APK publicado 4.9.133 e exige identidade de todos os assets restantes, exceto a versão.

## Etapa 2 — aguardando confirmação da origem

Proposta concreta, sem publicar nem implementar downloads: usar os PDFs existentes no commit imutável da base, em https://raw.githubusercontent.com/charlieleitao-spec/liturgia-osm/3a90e17f8e4faa4055f7b01201c5df71cc727265/www/data/pdfs/biblioteca/<arquivo>.pdf. Nomes: constituicoes-regra-diretorio-osm-2015; ratio-institutionis-osm-2015; regra-vida-ordem-secular-1995. Acrescentar SHA-256 e tamanho ao catálogo. A referência por commit mantém o arquivo estável sem exigir publicar uma release de documentos.

O armazenamento precisa usar filesDir, e não cacheDir (este pode ser limpo pelo Android), com download temporário, validação do PDF/hash e renomeação atômica. LocalPdfActivity será reaproveitada. Nenhuma credencial será incorporada. Controles de baixar/remover serão a única alteração visível autorizada na Biblioteca.

## Etapa 3 — diagnóstico da base

O gerador já omite text dos registros de santoral.json, missas-osm.json e oficios-osm.json usando ref. O corpus é reconstruído a partir dos JSON locais ao abrir a busca. A função loadGlobalSearch já é chamada na abertura; o service worker faz pré-cache do arquivo para garantir acesso offline na web.

O volume de text remanescente vem de páginas PDF, não de cópias dos três JSON. Truncar esses textos muda o alcance e os trechos dos resultados e requer decisão explícita após medição. O teste histórico verify-search-equivalence.cjs ainda usa uma base antiga com 456 documentos; o comparativo novo deve partir de 4.9.133 (708 entradas), com as mesmas 10 consultas e 6 filtros, medindo separadamente carga/indexação e consultas.

## Aceite no Samsung A56 — pendente

Instalação sobre a versão atual; Biblioteca online e sem internet; busca; lembretes; widgets. A compatibilidade do certificado no CI não substitui o teste de instalação no aparelho. Não considerar essas verificações concluídas sem evidência.

## Medições locais da etapa 1

Arquivos retirados: 18.248 bytes descomprimidos. A economia real no APK ainda depende do build assinado; não equivale a essa soma.

Índice: 1.567.522 bytes; campo text: 1.376.974 bytes, todos de páginas PDF. Dos 96 registros de oficios-osm.json, missas-osm.json e santoral.json, nenhum contém text. Comparação com a base 4.9.133: mesmas 10 consultas × 6 filtros, resultados, ordem, pontuação e trechos idênticos. Carga local: 9,72 ms; construção do índice: 127,45 ms; medianas das consultas: 0,23–14,50 ms. Ambiente Node 24 em contêiner, sem simular o Samsung A56. Dados completos em otimizacao-4.9.134-busca.json.

Build/assinatura/tamanho do APK conferidos no Actions; testes físicos ainda pendentes. Preparação Android e hook de limpeza verificados localmente. Após autorização explícita, as branches foram enviadas e os PRs #159, #160 e #161 foram abertos em rascunho. Builds dedicados geram somente artefatos. Consulte otimizacao-4.9.134-final.md para o estado atual.

Confirmação do usuário: origem raw por commit com SHA-256 aprovada; antes de publicar, o commit deve estar na main ou coberto por tag. A base 3a90e17 já é ancestral da main a23e5d4 nesta verificação. Etapa 2 deve oferecer download também ao abrir resultados de busca de livros não baixados. O gate verify-cleanup.mjs integra npm test e verifica os assets Android após sync no pipeline.
