# Base comum OSM

Este diretório é a fonte canônica de dados compartilhados dos projetos Liturgia OSM e Hoje na Família Servita.

## Arquivos canônicos
- `santoral.json`: calendário/santoral servita e dados biográficos.
- `oficios-osm.json`: textos próprios dos ofícios da Ordem.
- `hoje-familia-servita.json`: base consolidada usada pelo leitor Hoje na Família Servita, derivada dos dados mais evoluídos do Liturgia OSM.

## Regra de manutenção
1. Correções de datas, biografias e textos litúrgicos devem ser feitas primeiro neste diretório do Liturgia OSM.
2. O Hoje na Família Servita deve receber a base `hoje-familia-servita.json` sem manter uma variante editorial independente.
3. Não reintroduzir 14 de dezembro para o B. Boaventura de Pistoia: a base consolidada deste projeto usa 15 de dezembro.
4. Antes de publicar uma sincronização, validar o JSON e comparar chaves/datas para evitar perda de celebrações.

Base comum consolidada em 3 de outubro de 2026.
