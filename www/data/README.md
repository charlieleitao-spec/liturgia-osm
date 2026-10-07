# Base comum OSM

Este diretório reúne as fontes canônicas compartilhadas pelo Liturgia OSM.

## Fontes

- `santoral.json` — identidade da celebração, data, título, grau, hagiografia e metadados.
- `oficios-osm.json` — conteúdo próprio da Liturgia das Horas, organizado por celebração e hora.
- `memoria-liturgica.json` — roteiro do Livro de Oração dos Servos de Maria, separado dos Ofícios.
- `missas-osm.json` — cadastro local de Missas próprias; permanece vazio enquanto não houver texto conferido.

O Hoje na Família Servita consome uma base derivada. Corrija primeiro os arquivos canônicos, valide-os e então regenere o conteúdo derivado; não edite uma cópia compilada como fonte editorial.

## Ofícios, esquema 3

`oficios-osm.json` contém `schema_version: 3` e `celebracoes`, indexada por data `MM-DD`. Todo o material próprio fica em `material.horas`, nas chaves `invitatorio`, `oficio_leituras`, `laudes`, `hora_media`, `vesperas` e, quando necessário, `textos_proprios`.

Uma hora pode conter `titulo`, `texto`, `alternativas`, `rubrica` e `oracao`. A oração própria é um campo separado, para que possa ser apresentada e copiada independentemente do restante do texto. Nas alternativas, cada item mantém seu título, fonte e texto.

As celebrações declaram `tipo_material`: `oficio_proprio`, `textos_proprios` ou `sem_material_proprio`. Não se completam textos ausentes sem fonte identificável; as lacunas devem permanecer explícitas.

O aplicativo valida as 32 celebrações e requer o esquema 3. A celebração do Bem-aventurado Boaventura de Pistoia permanece em 15 de dezembro; a divergência impressa no corpo do Livro de Oração deve ser registrada editorialmente, sem alterar a data do calendário.

## Conferência editorial da Liturgia das Horas

Para cotejar textos que sejam de fato da Liturgia das Horas oficial, usar a edição brasileira em quatro volumes publicada pela Paulus segundo a edição típica e registrar volume e página na fonte do texto. Os Ofícios próprios OSM e o Livro de Oração dos Servos de Maria permanecem identificados como materiais próprios; não se deve apresentar todo o conteúdo do aplicativo como reprodução integral da Liturgia das Horas.
