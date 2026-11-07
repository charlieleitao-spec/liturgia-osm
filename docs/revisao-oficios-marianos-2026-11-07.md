# Revisão dos cinco Ofícios marianos — 7 de novembro de 2026

Base: `b628824f047d07a7766e41b8672357a092b6f2b5` (main).

## Problema e correção

A revisão anterior estava integrada à 4.9.132, mas o leitor específico `renderMarianOfficeTranscript` ainda unia intenções e pedidos, não reconhecia todas as leituras e deixava prosa sob o estilo de hino.

- Cinco formulários do Tempo Comum: 25 invocações com seus pedidos em blocos independentes.
- Resposta inicial em negrito; indicadores litúrgicos e rubricas em vermelho.
- Continuação de responsórios e antífonas no mesmo parágrafo.
- Títulos de leituras (incluindo alternativas), referências e títulos das Horas reconhecidos.
- Rodapés/mudanças de página não interrompem frases; parágrafos de prosa recuperados pelo recuo da fonte.
- Numeração dos formulários apresentada somente no cabeçalho, sem numeral solto no fim do anterior.
- Quebra responsiva das indicações junto à primeira palavra para evitar transbordamento a 200%.
- Índice de busca regenerado e chave de cache renovada.

## Conferência com a fonte

Fonte: `www/data/pdfs/oficios/ordinario.pdf`, 28 páginas, PDF oficial OSM local preservado.
SHA-256: `68e762ff0c99880dd2d76a5573d398180d92159754ea979f6457fa5abb879933`.

As preces estão nas páginas 6, 10–11, 15–16, 20–21 e 28. O teste confronta a sequência completa de letras e números da transcrição com a extração do PDF; ignora caixa, acentos, sinais de pontuação e espaços somente nessa comparação. A comparação adicional do HTML com a transcrição normalizada preserva palavras, pontuação e sinais litúrgicos.

Os ajustes de grafia abaixo são recomposições tipográficas. O restante da redação recebida permanece; esta revisão não moderniza tradução, acentos ou o texto litúrgico.

| Antes | Depois |
|---|---|
| abri-gai-nos | abrigai-nos |
| procla-mar-vos | proclamar-vos |
| se melhança | semelhança |
| naverdade | na verdade |
| pro moção | promoção |
| encarna da | encarnada |
| au mentai | aumentai |
| pro-teção | proteção |
| bem-aventu-rada | bem-aventurada |
| bem-aven-turada | bem-aventurada |
| batis-mo | batismo |
| Com-preende-se | Compreende-se |
| batis-mal | batismal |
| desencar-na-se | desencarna-se |
| latino-america-nas | latino-americanas |
| latino-america-no | latino-americano |
| me-dita-a | medita-a |
| indio-zinho | indiozinho |
| Diegui-to | Dieguito |

## Validação e entrega

- `npm test`: aprovado (base, navegação, imagens, lembretes, widgets, busca e PDFs).
- `npm run test:reader-stability` e `npm run test:personal`: aprovados.
- `node scripts/verify-marian-offices.mjs`: cinco formulários, 25 invocações/pedidos, integridade textual, larguras 320/390/768, claro/escuro e 100/200%; reabertura e PDF offline.
- Capturas e relatório JSON em `validation-layout/`, anexados ao workflow.

O workflow gera somente artefato de teste `Liturgia-OSM-4.9.132-mariano-teste1.apk`, versionCode 41046, pacote `com.liturgia_osm.app`, usando certificado estável já configurado. Identificação interna e cache são marcados como teste apenas durante a compilação. Confere assinatura, identidade e todos os arquivos web/offline byte a byte no APK. Não cria tag nem release.

Pendente: conclusão do workflow Android e validação dos trechos corrigidos no Samsung A56 pelo responsável. Não declarar instalação nem teste físico; manter PR sem merge e release pública 4.9.132 preservada.
