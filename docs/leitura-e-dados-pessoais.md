# Leitura e dados pessoais

Implementação proposta para a próxima atualização do Liturgia OSM. A versão e o APK estáveis 4.9.120 permanecem inalterados. Não foram alterados textos litúrgicos, PDFs, workflows nem outros projetos.

## Três avanços

1. **Retomada da leitura:** a tela inicial apresenta a última leitura com sua parte e posição. O leitor oferece “Retomar posição salva”. São guardados rolagem, seções abertas e um marcador textual para ajudar após mudanças no tamanho da fonte. Inclui orações, partes das devoções, celebrações, Missas próprias, resultados textuais da busca e recursos incorporados. Nos recursos, distingue a hora do Ofício, capítulo da Regra, mistério/passo do Rosário e fórmula/passo da Coroa. A posição interna do visualizador nativo de PDF e a Missa do dia online não estão incluídas nesta primeira implementação.
2. **Anotações pessoais:** acesso junto à leitura e pelo menu/Biblioteca pessoal. Texto simples, associado à leitura, guardado localmente, separado das fontes litúrgicas. Salvar, editar, excluir e desfazer exclusão. O fechamento pelo botão Voltar também salva a edição; falhas de armazenamento mantêm o editor aberto.
3. **Cópia de segurança:** arquivo JSON com favoritos, recentes, notas, posições, tema e tamanho do texto. Exportação e restauração por arquivo, sem serviço de sincronização. No Android, o seletor nativo concede acesso somente ao arquivo escolhido. Não há nova dependência de execução nem permissão de armazenamento.

## Restauração

O arquivo é validado antes de apresentar a conferência. Há limites de tamanho (2 MB), quantidade e comprimento dos campos, versão explícita e lista de rotas/campos permitidos. Dados importados nunca são interpretados como comandos ou HTML.

A conferência informa novos registros e conflitos. Favoritos são unidos; notas, posições e última leitura já existentes no aparelho prevalecem. Tema e fonte são opcionais. Uma cópia do estado anterior é guardada antes das alterações. Falhas parciais tentam recuperar esse estado; a opção de desfazer pede nova conferência e explica que alterações posteriores serão substituídas.

## Integração

- `personal-data.js`: validação, armazenamento e restauração independentes da interface.
- `personal-reader.js` e `.css`: controles, diálogos acessíveis e rotas de leitura.
- Pequenos pontos de integração nos renderizadores principal e incorporado; o leitor incorporado expõe somente campos de navegação.
- `PersonalBackupPlugin.java`: seleção nativa de arquivo, leitura limitada e escrita em segundo plano. Copiado e registrado automaticamente após `cap sync android`, pelo hook `capacitor:sync:after`, sem alterar workflows.
- Novos arquivos incluídos no cache PWA. O Android continua usando arquivos empacotados.

## Verificação desta proposta

- `npm run test:personal`: 18 cenários: preparação Android idempotente/preservação do leitor PDF e persistência, fórmulas/horas distintas, exportação/restauração, conflitos, desfazer, dados inválidos, limites, campos extras, armazenamento cheio e recuperação após falha parcial.
- Integração DOM executada com JSDOM: oração e fórmula, anotação tratada como texto literal, edição salva pelo Voltar, Biblioteca pessoal, retomada em 845 px, oração diária, Missa e busca.
- Integração DOM do recurso: Laudes em 620 px e Vésperas em 330 px guardadas separadamente; retomada da hora e posição pela ponte incorporada. A navegação de documentos do iframe foi simulada porque JSDOM não a implementa.
- Preparação real com `npx cap add android`: hook executado e plugin copiado/registrado. A integração posterior do leitor PDF preservou os dois registros antes de `super.onCreate`.
- Sintaxe dos arquivos JavaScript alterados conferida.
- Nenhuma repetição dos testes do A56 já aprovados. Após a implementação, foi gerado um APK de teste paralelo, sem substituir ou publicar uma nova versão estável.
- Compilação Android `:app:assembleDebug` aprovada com Java 21, Gradle 8.14.3 e SDK 36. Assinatura verificada, plugin pessoal presente no DEX e 162 arquivos web/offline iguais às fontes. Evidências em `validacao-android-pr144.md`.

## Conferência da atualização Android

A compilação nativa de teste está concluída. Em 28/10/2026, o usuário confirmou a conferência dos três avanços no A56, após receber o APK paralelo. A condição para integrar a PR foi atendida. O APK de teste usa um pacote separado e não compartilha dados com a versão estável; a integração do código não publica uma nova release estável.

Roteiro de referência para as verificações da funcionalidade nova:

1. Usar a preparação Android habitual, com `npx cap sync android`, e confirmar os registros de `PersonalBackup` e `LocalPdf` antes de `super.onCreate`.
2. Na versão de teste, retomar uma oração, uma fórmula da Coroa e duas horas do Ofício, inclusive depois de fechar o aplicativo.
3. Com fonte aumentada e temas claro/escuro, conferir o diálogo em tela estreita, teclado aberto, botão Voltar e navegação com leitor de tela.
4. Salvar um arquivo pelo seletor Android; reinstalar apenas a versão de teste ou usar outro perfil e restaurar. Conferir favoritos, notas, posição, tema e fonte; cancelar os seletores; recusar arquivo inválido.
5. Conferir conflitos e recuperação do estado anterior. Não substituir o APK estável antes dessas verificações da funcionalidade nova.
