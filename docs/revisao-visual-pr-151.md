# Revisão visual da Liturgia OSM — PR #151

## Escopo e limites

Revisão conservadora da tipografia e da interação dos menus. Não modificar palavras, pontuação, estrofes, antífonas, refrões ou a ordem dos textos oficiais. Preservar o leitor offline, anotações, PDFs, modo escuro e navegação Android.

## Verificações automatizadas antes do merge

Na raiz do repositório, com dependências e Chromium/Playwright disponíveis:

```sh
npm test
npm run test:reader-stability
npm run test:personal
node scripts/verify-all-psalms.mjs
node scripts/verify-office-resources.mjs
node scripts/verify-accessibility.mjs
```

Os três últimos scripts fazem verificações específicas de salmos, Ofícios, tamanhos de tela e acessibilidade; não substituem inspeção humana. Registrar o resultado e os artefatos de capturas de tela antes de integrar. Não presumir aprovação apenas porque a PR existe.

## Conferência visual mínima no Samsung A56

1. Abrir e fechar o menu; conferir foco, contraste, animações discretas e ausência de saltos.
2. Aumentar fonte até 200%; confirmar título, botão Voltar, cabeçalho, barra de fontes e controles sem sobreposição.
3. Conferir uma Missa com salmo responsorial, um Ofício com hino e salmo, uma Vigília com antífonas e uma oração longa. Comparar palavras, versos, refrões e estrofes com a fonte original.
4. Testar anotações: abrir, escrever, salvar, reabrir e voltar. Confirmar que o teclado não encobre a edição.
5. Repetir navegação e leitura em modo escuro e sem rede; verificar o botão Voltar físico.
6. Se houver APK de teste, verificar assinatura e atualização sobre a versão instalada antes de publicar.

## Critérios para integração

Sem alterações do texto litúrgico; sem rolagem horizontal; controles acessíveis; menu sem movimento excessivo; testes automatizados verdes; validação visual aprovada. Se algum critério falhar, corrigir na própria PR e não publicar.
