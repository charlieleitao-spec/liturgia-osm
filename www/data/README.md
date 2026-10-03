# Base comum OSM

Este diretório contém as **fontes canônicas normalizadas** dos dados compartilhados.

## Fontes canônicas

- `santoral.json` — identidade da celebração: data, título, grau, biografia e metadados.
- `oficios-osm.json` — conteúdo litúrgico próprio: Ofício das Leituras, Laudes, Vésperas, antífonas, hinos, leituras, responsórios e orações.

Esses dois arquivos constituem a base mestra do Liturgia OSM.

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

O script `scripts/gerar-servita.js` gera integralmente o arquivo consumido pelo Hoje na Família Servita a partir das duas fontes mestras.

### Schema v2 dos Ofícios
`oficios-osm.json` possui `schema_version: 2` e uma coleção `celebracoes` indexada por `MM-DD`. Cada celebração declara `tipo_material` e `material`. Quando há Ofício próprio, `material.horas` organiza Invitatório, Ofício das Leituras, Laudes, Hora Média e Vésperas. Quando há apenas textos próprios, `material.secoes` mantém as seções editoriais. Celebrações sem material próprio são declaradas explicitamente.

O workflow `.github/workflows/gerar-base-derivada.yml` é disparado quando `santoral.json`, `oficios-osm.json` ou o gerador mudam. Ele não depende de nenhuma cópia anterior de `servita.json`: reconstrói a base do zero, valida-a e a publica no outro repositório quando o secret `HOJE_FAMILIA_SERVITA_TOKEN` estiver configurado com permissão de escrita.

Assim, `santoral.json + oficios-osm.json` constituem a fonte única de verdade para os dados compartilhados.
