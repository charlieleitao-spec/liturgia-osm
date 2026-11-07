# Padrão dos leitores litúrgicos — segunda revisão de teste

Base: `043c323e13c21eceb8285368d64806dc8e019f8c`, continuação do PR #157.

O responsável aprovou as preces das Laudes do formulário I de Santa Maria no Tempo Comum no Samsung A56 e autorizou estender o padrão aos outros Ofícios, Missas e orações. Isso não equivale à aprovação física desta segunda compilação nem à autorização de release definitiva.

## Resultado

- Tratamento único das preces em `OSMPdf.formatIntercessions`, compartilhado entre os leitores principal, incorporado, mariano e de Ofício completo.
- Invocações, pedidos, refrão e rubricas recebem papéis próprios. O algoritmo reconhece sinais existentes (`-`, `–`, `—`, `_`) e limites de frases; nas duas Horas de Pucci com preces achatadas, recompõe a separação pelas invocações e pontuação preservadas. Não acrescenta marcadores nem palavras.
- Respostas R./R/ e T. destacadas onde já existem na fonte; refrão da Missa diária e dos salmos da Missa própria destacado.
- Mesma composição dos blocos de preces, fonte Georgia, rubricas vermelhas e respostas em negrito. O Ofício completo usa o papel e a tinta dos demais leitores ao ser expandido.
- Sinais junto às palavras permanecem unidos quando cabem; fontes ampliadas podem acomodá-los sem transbordamento.
- PDFs, bases JSON, tradução e fontes litúrgicas permanecem intactos nesta segunda revisão. Os ajustes de transcrição da primeira revisão continuam preservados.
- Cache renovado; mesma identidade de pacote Android. Nenhuma migração de notas, favoritos ou preferências.

## Evidências locais

`verify-unified-readers.mjs` percorre 58 textos de oração nos dois leitores, 360 seções das Missas, 71 textos das Horas (incluindo alternativas), 37 blocos de preces e 182 pedidos nas diferentes representações da base. Preserva textos, pontuação e sinais nas preces e nas seções das Missas; confere letras, números e sinais litúrgicos das Horas. Esses números incluem versões de um mesmo texto em leitores distintos e não representam 182 intenções litúrgicas exclusivas.

Verificações adicionais: 31 transcrições completas preservadas integralmente, 38 salmos responsoriais, salmos e cânticos, cinco formulários marianos, recursos/PDFs offline, tipografia em 320/390/768 px, claro/escuro e 100/200%, estabilidade de fonte/anotações e dados pessoais. O teste de anotações carrega a mesma dependência compartilhada já presente no HTML real.

O refrão da Missa diária é verificado com resposta de API simulada; não depende da disponibilidade do serviço externo. A reabertura offline e o PDF são conferidos pelo teste mariano existente. Nenhuma instalação física é declarada.

## Entrega

APK somente de teste: `4.9.132-padrao-teste2`, versionCode `41047`, pacote `com.liturgia_osm.app`. O workflow confere o certificado estável, identificação e igualdade byte a byte dos arquivos web/offline no APK; também exige o formatador compartilhado e sua utilização pelos dois leitores.

Manter o PR em rascunho, sem merge, tag ou release. Próxima conferência manual sugerida: Laudes de Santo Antônio Maria Pucci (12 de janeiro), comparando a Hora individual com o texto completo, e um salmo responsorial da Missa. A validação anterior do formulário mariano I permanece aceita; não repetir a rodada inteira já aprovada.
