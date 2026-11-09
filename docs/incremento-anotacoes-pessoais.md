# Primeiro incremento: encontrar anotações pessoais

Base conferida: `main`, commit `50463f1`, versão 4.9.134.

## Recursos encontrados

A retomada explícita da última leitura, as anotações por conteúdo, a biblioteca de notas e a exportação/restauração dos dados pessoais já existem. O padrão litúrgico compartilhado também consta desta base. Portanto, esses recursos não foram recriados.

## Incremento implementado

Em **Anotações e cópia de segurança → Minhas anotações**, a lista agora oferece busca por título e conteúdo completo, sem distinguir maiúsculas ou acentos. Todos os termos digitados devem estar presentes, em qualquer ordem. Há ordenação por última alteração (mais recentes ou mais antigas) e título em português, contagem dos resultados e comando para limpar a busca. A edição e a abertura da leitura continuam disponíveis na lista filtrada.

A busca e a ordem permanecem ao voltar do editor à lista na mesma sessão. Uma nova abertura dos dados pessoais começa com todas as notas e ordem mais recente. Notas excluídas não aparecem. Filtrar e ordenar não regrava registros; não há migração, envio de notas ou nova dependência de rede. A busca usa dados locais e não exige serviço externo. O cache web foi renovado para distribuir os arquivos alterados.

Textos litúrgicos, PDFs, assinaturas, identificação Android e versão pública permanecem como na base. Esta alteração ainda não foi integrada à main nem compilada em APK.

## Verificação

- `npm run test:reader-stability`: aprovado, incluindo busca por título/conteúdo além do resumo visível, acentos, ordenação, resultados vazios, exclusões, limpeza com foco, texto tratado como texto, edição e abertura pela lista filtrada e preservação dos registros ao pesquisar.
- `npm run test:personal`: 18 verificações aprovadas.
- `npm test`: auditorias e testes existentes aprovados. O aviso `Error: offline` no teste da biblioteca é uma falha de rede simulada e esperada pelo cenário.
- `git diff --check`: aprovado.
- A verificação visual em Chromium não foi executada: o navegador encerrou na inicialização com `socket() failed: Operation not permitted`. Não se declara validação de layout nem teste físico no A56.

## Próxima validação

Conferir busca, ordenação, edição e abertura na tela de celular, em claro/escuro e texto ampliado. Depois, preparar o APK de teste e conferir as mesmas ações em modo avião no A56, preservando as notas existentes. Nenhuma release, tag ou publicação é parte desta entrega.

## Sequência dos aplicativos

As demais propostas continuam pendentes de conferência do código de cada aplicativo: calendário e documentos offline do Hoje na Família Servita; navegação e artigos offline do Somos Servos; primeira abertura offline e acompanhamento de etapas do Caminho Servita. Não representam funcionalidades já implementadas por este incremento.
