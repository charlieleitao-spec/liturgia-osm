# Publicação Liturgia OSM 4.9.134

Frei Charlie autorizou integrar os PRs #159, #160 e #161 e preparar, conferir e publicar a versão definitiva com nova tag, preservando versões anteriores, nesta conversa em 08/11/2026 (resposta: “Autorizalo”).

PRs integrados à main: #159 em 47ab504f0f06b18436cbcdafeb4a070b740102a4; #160 em fe33f2bcaeddbf5f76fede4d17f68168849c0922; #161 em 1a4cc4b2dd6aa9bb092eb9a01a2c45c77acc857d.

Candidato aprovado no Samsung A56: APK 41051, SHA-256 186f9fb1249d6df6f35ece0e77dc9645df591ef8266a9a1048c1c92d6f6f9e2e, compilado do commit c8bf2c31d7622578ce196d68137fc9b3676ff4ee na execução 42445454377. O commit posterior 2276678 modifica somente documentação e relatórios.

O titular confirmou instalação sobre 4.9.133, abertura, download e leitura do livro, reabertura/leitura/páginas offline, busca offline e abertura do trecho, remoção e oferta de download na busca, novo download com página correta, dados pessoais preservados, lembrete em segundo plano e widget. Relatos do titular, sem observação física direta pelo assistente e sem extrapolar para todos os livros ou cenários.

A release 41052 conserva integralmente os arquivos web, PDFs, geradores Android, dados e dependências do candidato. O verificador compara bytes com o commit aprovado. O pipeline mantém os gates pós-sync, origem imutável dos PDFs na main/tag com SHA-256, assinatura estável e comparação dos arquivos web dentro do APK. Não modifica textos, formulários, apresentação ou banco de dados do usuário.

A execução de PR compila e verifica sem publicar. A integração deste workflow na main aciona a compilação e publicação já autorizadas, em tag nova v4.9.134, recusando substituir tag existente. A verificação final baixa o APK público e compara byte a byte com o compilado. Nenhuma nova instalação física da release é declarada.
