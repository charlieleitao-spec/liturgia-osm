# Base comum OSM

Este diretório contém as **fontes canônicas normalizadas** dos dados compartilhados.

## Fontes canônicas

- `santoral.json` — identidade da celebração: data, título, grau, biografia e metadados.
- `oficios-osm.json` — conteúdo próprio da Liturgia das Horas, organizado por celebração e hora.
- `memoria-liturgica.json` — roteiro próprio do Livro de Oração dos Servos de Maria: hino, antífona, salmo, breve vida e oração própria. Esse material pertence à seção Oração e permanece separado dos Ofícios.

Esses três arquivos constituem a base mestra do Liturgia OSM.

## Dados derivados

O projeto **Hoje na Família Servita** mantém `servita.json` como arquivo compilado/derivado para seu leitor leve. Ele não deve ser editado como fonte editorial independente.

Quando houver correção de calendário, biografia ou texto litúrgico:
1. corrigir primeiro `santoral.json` e/ou `oficios-osm.json`;
2. validar a estrutura e as datas;
3. regenerar/sincronizar o `servita.json` do Hoje na Família Servita;
4. não manter cópias editoriais paralelas no Liturgia OSM.

A celebração do B. Boaventura de Pistoia está consolidada em **15 de dezembro**.

Normalização estabelecida em 3 de outubro de 2026.


## Automação da base derivada

O script `scripts/gerar-servita.js` gera integralmente o arquivo consumido pelo Hoje na Família Servita a partir das fontes canônicas: santoral, ofícios e Memória Litúrgica.

### Schemas v2 e v3 dos Ofícios
`oficios-osm.json` mantém a coleção `celebracoes` indexada por `MM-DD`, com `tipo_material` e `material`. No schema v3, todo conteúdo reside em `material.horas`; `textos_proprios` representa trechos que não são uma hora canônica. O gerador aceita schemas 2 e 3. Para o leitor atual do Hoje, converte somente os registros `textos_proprios` do v3 para `material.secoes` no JSON derivado, preservando integralmente títulos e textos (inclusive alternativas e oração); Ofícios completos conservam `material.horas`. A fonte canônica continua sendo o arquivo de Ofícios do Liturgia OSM.

O workflow `.github/workflows/gerar-base-derivada.yml` é disparado quando `santoral.json`, `oficios-osm.json`, `memoria-liturgica.json` ou o gerador mudam. Ele não depende de nenhuma cópia anterior de `servita.json`: reconstrói a base do zero, valida-a e a publica no outro repositório quando o secret `HOJE_FAMILIA_SERVITA_TOKEN` estiver configurado com permissão de escrita.

A base derivada mantém `material.horas` para a Liturgia das Horas e `memoria_liturgica` para o roteiro do Livro de Oração em campos distintos. Assim, os três arquivos canônicos constituem a fonte única para os dados compartilhados.
