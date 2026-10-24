# Integração do PDF oficial de 2015 — Biblioteca Servita

## Arquivo de origem
Volume oficial em português de 2015, 152 páginas, contendo Constituições OSM, Regra de Santo Agostinho e Diretório Geral. O responsável pelo projeto confirmou autorização para distribuição nos aplicativos.

## Etapa necessária no GitHub
Na branch `feature/biblioteca-servita`, enviar o PDF binário para:

`www/data/pdfs/biblioteca/constituicoes-regra-diretorio-osm-2015.pdf`

O pacote ZIP de integração preparado para o projeto contém exatamente esse arquivo no caminho indicado. Não enviar o ZIP como substituto do PDF.

## Após o envio
1. Atualizar `www/data/biblioteca-servita-catalogo.json` e `data/biblioteca-servita-catalogo.json`, atribuindo aos três primeiros documentos `offline_asset: "./data/pdfs/biblioteca/constituicoes-regra-diretorio-osm-2015.pdf"`.
2. Incluir `"./data/pdfs/biblioteca/constituicoes-regra-diretorio-osm-2015.pdf"` na lista `CORE` de `www/sw.js`, com revisão do nome do cache.
3. Executar `node scripts/test-biblioteca-servita.cjs` e a suíte existente.
4. Testar abertura e impressão do PDF, leitura sem rede e atualização por cima no Samsung A56.
5. Não fazer merge ou publicar APK sem aprovação.

**Estado atual:** PDF enviado à branch, com integridade SHA-256 conferida (`dde52f1feeed23b275f27bb230a7d56c27949272dade68504b1bd5423c79341a`). Os dois catálogos apontam os três documentos para o volume local; o arquivo foi incluído em CORE e o cache foi atualizado. Abertura, impressão, instalação limpa e atualização por cima no Samsung A56 ainda aguardam teste. Sem merge ou publicação de APK.

## Acesso direto às partes do volume
Os links do catálogo abrem o início do texto: Constituições na página 43, Regra de Santo Agostinho na página 25 e Diretório Geral na página 131. As páginas foram conferidas no PDF e no índice do volume; a numeração impressa coincide com a numeração do arquivo. O PDF permanece integral e inalterado. O teste de navegador verifica o envio das três páginas ao leitor Android simulado, inclusive sem rede. A confirmação no aparelho continua pendente.
