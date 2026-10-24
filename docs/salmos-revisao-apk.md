# Revisão dos salmos no APK — teste 8

A revisão amplia o padrão aprovado na Vigília para todos os salmos em texto local: 53 salmos distintos, em 108 ocorrências (incluindo recortes responsoriais e repetições entre recursos).

- 38 salmos responsoriais nos formulários de Missa. O refrão e cada resposta da assembleia delimitam as respectivas estrofes; não se impõe a divisão do salmo integral ao recorte de uma Missa.
- 62 ocorrências de salmos em textos dos Ofícios, entre as horas individuais, os textos completos e o Ofício ao Pé da Cruz.
- 6 salmos da Vigília já aprovada, mantidos.
- Salmo 111 da Memória Litúrgica e Salmo 129 da oração pelos defuntos.
- Uma remissão ao Salmo 94, sem texto transcrito, permanece apenas como remissão. Não foi completada sem fonte.

## Fontes e método

As páginas diagramadas da *Liturgia Diária das Horas* da PAULUS, junho e julho de 2020, publicadas com autorização da CNBB, foram cotejadas com os textos locais. O Saltério brasileiro publicado pela Abadia de Itatinga foi usado como referência complementar para salmos ausentes dos formulários de Laudes e Vésperas dos periódicos. Para os textos próprios e variantes OSM, a divisão foi conferida nos PDFs oficiais incluídos no aplicativo. As fontes estão identificadas em `auditoria-salmos-apk.json` e, para a Vigília, em `vigilia-fontes-salmodia.md`.

Não se aplicou uma quebra de estrofe a cada travessão, asterisco ou versículo. Foram conservados as antífonas, os refrães, os recortes e a redação própria OSM. As alterações dos campos de texto são exclusivamente de espaços e quebras de linha; uma sequência literal `\n` indevida também foi convertida em quebra real. O manifesto registra hashes sem espaços para detectar perda ou alteração de palavras e sinais. Datas, graus e metadados permanecem iguais.

Os 66 PDFs originais do pacote permanecem inalterados. A revisão da apresentação se aplica aos leitores de texto e às transcrições; abrir o PDF continua mostrando o fac-símile oficial.

## Correções do leitor

Títulos como “Salmo 22 — Deus, bom Pastor” passam a ativar a composição poética. Um verso iniciado por aspas permanece como verso, sem ser confundido com epígrafe. A leitura completa dos PDFs ativa o modo salmódico ao encontrar um título de salmo. O marcador `-` das transcrições passa a usar o mesmo recuo dos outros sinais litúrgicos.

## Validação

- Testes de integridade de palavras, sinais e PDFs.
- Reconhecimento dos 70 títulos locais de salmos, incluindo a remissão sem texto.
- Preservação integral das 31 transcrições de Ofícios.
- Teste de navegador de todos os títulos e dos 38 salmos responsoriais.
- Apresentação a 320, 390 e 768 px, em 100% e 200%; estrofes e versos da Memória Litúrgica e hora individual real.
- Testes existentes da Vigília, acessibilidade, busca e funcionamento offline.

A confirmação final no Samsung A56 continua necessária. Sem merge e sem publicação de versão definitiva.
