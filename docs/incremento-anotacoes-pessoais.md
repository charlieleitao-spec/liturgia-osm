# Primeiro incremento: encontrar anotações pessoais

Base conferida: `main`, commit `50463f1`, versão 4.9.134.

## Recursos encontrados

A retomada explícita da última leitura, as anotações por conteúdo, a biblioteca de notas e a exportação/restauração dos dados pessoais já existem. O padrão litúrgico compartilhado também consta desta base. Portanto, esses recursos não foram recriados.

## Incremento implementado

Em **Anotações e cópia de segurança → Minhas anotações**, a lista agora oferece busca por título e conteúdo completo, sem distinguir maiúsculas ou acentos. Todos os termos digitados devem estar presentes, em qualquer ordem. Há ordenação por última alteração (mais recentes ou mais antigas) e título em português, contagem dos resultados e comando para limpar a busca. A edição e a abertura da leitura continuam disponíveis na lista filtrada.

A busca e a ordem permanecem ao voltar do editor à lista na mesma sessão. Uma nova abertura dos dados pessoais começa com todas as notas e ordem mais recente. Notas excluídas não aparecem. Filtrar e ordenar não regrava registros; não há migração, envio de notas ou nova dependência de rede. A busca usa dados locais e não exige serviço externo. O cache web foi renovado para distribuir os arquivos alterados.

Textos litúrgicos, PDFs, assinaturas, identificação Android e versão pública permanecem como na base. Esta alteração permanece em branch de trabalho; o APK de teste descrito abaixo foi compilado sem integração à main.

## Verificação

- `npm run test:reader-stability`: aprovado, incluindo busca por título/conteúdo além do resumo visível, acentos, ordenação, resultados vazios, exclusões, limpeza com foco, texto tratado como texto, edição e abertura pela lista filtrada e preservação dos registros ao pesquisar.
- `npm run test:personal`: 18 verificações aprovadas.
- `npm test`: auditorias e testes existentes aprovados. O aviso `Error: offline` no teste da biblioteca é uma falha de rede simulada e esperada pelo cenário.
- `git diff --check`: aprovado.
- A tentativa local de Chromium foi bloqueada pelo ambiente. A conferência foi concluída no GitHub Actions: 12 combinações de largura (320/390/768), tema e escala, sem transbordamento; busca, ordenação, edição e abertura offline verificadas em 6 contextos. Capturas em 320 px foram inspecionadas nos temas claro e escuro, incluindo texto ampliado.
- `verify-unified-readers.mjs`: aprovado na mesma execução.
- Assinatura estável, identificação Android, ausência dos placeholders Cordova e igualdade byte a byte dos arquivos web incluídos no APK: aprovadas no pipeline. A validação pelo usuário está registrada abaixo.

## APK de teste entregue

Execução concluída com sucesso: https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42555888671

- Commit compilado: `03f72ae112fef871f9e0780018862b4d495859bb`.
- Arquivo: `Liturgia-OSM-4.9.134-anotacoes-teste1.apk`.
- Pacote: `com.liturgia_osm.app`; versionCode `41053`; versionName `4.9.134-anotacoes-teste1`.
- Tamanho: 7.255.764 bytes.
- SHA-256: `aad7a9167fa68f022c5e121d849b8ac28cb5947c479fb0e157528fdcfe2a77cb`.
- Certificado SHA-256: `5b2b3319cc9f9bb61a14fb8a30e63044db225f7b930fca9568c82854f38b4fe0`, igual ao estável.

## Validação pelo usuário no A56

Em 9 de novembro de 2026, após receber este APK e as orientações para instalação sobre a versão atual e teste da busca/ordenação também em modo avião, Frei Charlie confirmou: “Tudo ok”. O teste foi aceito com base nesse relato geral; não houve acompanhamento direto do aparelho nem relato separado de cada ação.

A validação do APK de teste está concluída pelo usuário. A integração à main e a publicação definitiva continuam pendentes; esta confirmação não foi tratada como autorização para release ou tag.

## Sequência dos aplicativos

As demais propostas continuam pendentes de conferência do código de cada aplicativo: calendário e documentos offline do Hoje na Família Servita; navegação e artigos offline do Somos Servos; primeira abertura offline e acompanhamento de etapas do Caminho Servita. Não representam funcionalidades já implementadas por este incremento.
