# Base comum OSM

Este diretório reúne as fontes canônicas compartilhadas pelo Liturgia OSM.

## Fontes

- `santoral.json` — identidade da celebração, data, título, grau, hagiografia e metadados.
- `oficios-osm.json` — conteúdo próprio da Liturgia das Horas, organizado por celebração e hora.
- `memoria-liturgica.json` — roteiro do Livro de Oração dos Servos de Maria, separado dos Ofícios.
- `missas-osm.json` — cadastro local de Missas próprias; permanece vazio enquanto não houver texto conferido.

O Hoje na Família Servita consome uma base derivada. Corrija primeiro os arquivos canônicos, valide-os e então regenere o conteúdo derivado; não edite uma cópia compilada como fonte editorial.

## Celebrações sem imagem própria

Há atualmente 21 celebrações sem imagem. A interface usa um marcador tipográfico com as iniciais do título, sem criar ou substituir imagens:

- Tiago de "Città della Pieve"
- Joaquim de Sena
- Isabel Picenardi
- Frei Paulino M. Baldassarri
- Virgem Maria, Mãe e Medianeira
- Benincasa de Montepulciano
- Francisco de Sena
- Tiago Filipe de Faenza
- Fernando Maria Baccilieri
- Ubaldo de Sansepolcro
- Santa Clélia Barbieri
- Frei Egídio Maria Moscini
- Santo Agostinho
- André de Sansepolcro
- Boaventura de Forlì
- Nossa Senhora das Dores
- Dedicação da Basílica de Monte Senário
- João Ângelo de Milão
- Comemoração dos Defuntos da Ordem
- Jerônimo de Sant'Angelo in Vado
- Boaventura de Pistoia

Quando uma imagem identificada e autorizada for adicionada ao `santoral.json`, ela substitui automaticamente o marcador.

## Missas próprias

`missas-osm.json` contém os formulários próprios transcritos dos PDFs oficiais do Missal OSM. Os formulários fixos são indexados por data `MM-DD`; as celebrações móveis e as Missas de Santa Maria no Sábado usam chaves próprias e são exibidas em grupos separados na seção **Liturgia > Missa**. Cada formulário preserva a ordem das seções, as alternativas de leituras e o link ao PDF de origem.

O registro de Santo Antônio Maria Pucci mantém a transcrição estruturada já conferida. Os novos formulários usam `sections`, uma lista ordenada com `heading` e `text`, para conservar títulos e opções como aparecem nos PDFs. O renderizador aceita as duas formas.

## Ofícios, esquema 3

`oficios-osm.json` contém `schema_version: 3` e `celebracoes`, indexada por data `MM-DD`. Todo o material próprio fica em `material.horas`, nas chaves `invitatorio`, `oficio_leituras`, `laudes`, `hora_media`, `vesperas` e, quando necessário, `textos_proprios`.

Uma hora pode conter `titulo`, `texto`, `alternativas`, `rubrica` e `oracao`. A oração própria é um campo separado, para que possa ser apresentada e copiada independentemente do restante do texto. Nas alternativas, cada item mantém seu título, fonte e texto.

As celebrações declaram `tipo_material`: `oficio_proprio`, `textos_proprios` ou `sem_material_proprio`. Não se completam textos ausentes sem fonte identificável; as lacunas devem permanecer explícitas.

O aplicativo valida as 32 celebrações e requer o esquema 3. A celebração do Bem-aventurado Boaventura de Pistoia permanece em 15 de dezembro; a divergência impressa no corpo do Livro de Oração deve ser registrada editorialmente, sem alterar a data do calendário.

## Conferência editorial da Liturgia das Horas

Para cotejar textos que sejam de fato da Liturgia das Horas oficial, usar a edição brasileira em quatro volumes publicada pela Paulus segundo a edição típica e registrar volume e página na fonte do texto. Os Ofícios próprios OSM e o Livro de Oração dos Servos de Maria permanecem identificados como materiais próprios; não se deve apresentar todo o conteúdo do aplicativo como reprodução integral da Liturgia das Horas.


Os 32 PDFs do Missal OSM e os 31 PDFs de Ofícios próprios estão incluídos em `pdfs/missal/` e `pdfs/oficios/`. As bases guardam `local_pdf_url` para abrir a cópia incluída e `pdf_url` como fonte oficial. A transcrição pesquisável dos Ofícios está no campo `pdf_transcript`; a dos formulários de Missa está organizada em `sections`. Os PDFs também integram o cache inicial para leitura sem conexão.
