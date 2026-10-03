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
