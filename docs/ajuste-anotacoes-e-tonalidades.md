# Ajuste dos botões de anotações e das tonalidades

Correção solicitada após as capturas do Stabat Mater e da Regra de Vida: os controles de anotação estavam altos demais, e o amarelo da oração diferia do bege da Regra.

- O grupo de anotação/retomada passa para depois do cabeçalho da oração ou do capítulo, antes do texto, no fluxo normal da página.
- No leitor incorporado, a anotação sai da barra de fonte e entra no próprio conteúdo, com o mesmo rótulo “Anotação pessoal”. A barra superior conserva fechar, título e controles de fonte/recarga.
- Controles com altura automática, área mínima de 44 px, quebra de rótulos, Georgia, contraste de texto e borda. Não há botão fixo sobre as linhas.
- Ao fechar o editor, o foco retorna ao botão que o abriu, inclusive dentro da Regra.
- Papel bege claro `#f7f4ed` compartilhado entre orações e recursos incorporados. O tema escuro mantém seus próprios tons; rubricas, textos e PDFs permanecem preservados.

Verificações específicas executadas em JSDOM: posição após o cabeçalho no Stabat e no índice/Capítulos I e III da Regra; um único grupo por página; abrir, salvar e fechar a nota associada à oração/capítulo correto; retorno do foco; texto original preservado. Sintaxe CSS conferida com css-tree e contraste claro calculado para texto/borda. Sintaxe JavaScript e diff conferidos. Não foram repetidos os testes antigos do A56 nem os testes de dados/backup já aprovados.

Essas verificações de estrutura e funcionamento não são uma captura visual de navegador ou do A56. O ajuste responde às imagens enviadas, com controles no fluxo e altura livre para fonte aumentada. A apresentação final no aparelho deve ser observada na atualização.
