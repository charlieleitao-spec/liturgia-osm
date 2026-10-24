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

**Estado atual:** PDF preparado localmente, mas ainda não enviado ao GitHub. Não declarar integração offline concluída.
