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

### Schema v2 dos Ofícios
`oficios-osm.json` possui `schema_version: 2` e uma coleção `celebracoes` indexada por `MM-DD`. Cada celebração declara `tipo_material` e `material`. Quando há Ofício próprio, `material.horas` organiza Invitatório, Ofício das Leituras, Laudes, Hora Média e Vésperas. Quando há apenas textos próprios, `material.secoes` mantém as seções editoriais. Celebrações sem material próprio são declaradas explicitamente.

O workflow `.github/workflows/gerar-base-derivada.yml` é disparado quando `santoral.json`, `oficios-osm.json`, `memoria-liturgica.json` ou o gerador mudam. Ele não depende de nenhuma cópia anterior de `servita.json`: reconstrói a base do zero, valida-a e a publica no outro repositório quando o secret `HOJE_FAMILIA_SERVITA_TOKEN` estiver configurado com permissão de escrita.

A base derivada mantém `material.horas` para a Liturgia das Horas e `memoria_liturgica` para o roteiro do Livro de Oração em campos distintos. Assim, os três arquivos canônicos constituem a fonte única para os dados compartilhados.


## Esquema de `oficios-osm.json` (versão 3, 4.9.35)

Todo o material de cada celebração (chave `MM-DD`) fica em `material.horas`. Cada hora é `{titulo, texto, alternativas?}`:
`invitatorio`, `oficio_leituras`, `laudes`, `hora_media`, `vesperas`.
A chave `textos_proprios` reúne trechos próprios que não pertencem a uma hora canônica (por exemplo responsório e oração do Comum); pode ter `alternativas` e `oracao`.
Os formatos antigos `secoes` e `oficio_leituras`+`oracao` (esquema 2) foram convertidos sem alterar o texto exibido.
`app.js` e `servite-3.js` exigem `schema_version` 3. O gerador `scripts/gerar-servita.js` (repositório Hoje na Família Servita) deve ser conferido antes de usar esta versão da base.
