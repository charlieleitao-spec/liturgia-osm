# Validação Android — PR #144

Compilação de teste concluída em 28/10/2026. O APK estável 4.9.120 e os workflows permanecem inalterados.

| Campo | Resultado |
| --- | --- |
| Código compilado | `ce9c6b21eb860954e07b2f82a29e89de2d432d3e` |
| Arquivo | `Liturgia-OSM-PR144-teste.apk` |
| Nome no aparelho | Liturgia OSM · Teste |
| Pacote separado | `com.liturgia_osm.app.personaltest` |
| Versão de teste | `4.9.120-pessoal-teste1` |
| Código da versão | 41034 |
| Tamanho | 14.029.080 bytes (13,38 MiB) |
| Assinatura | Debug, verificada pelo apksigner; não é a assinatura estável |
| Arquivos offline | 162, conferidos byte a byte com `www` |
| Plugin pessoal | Compilado e presente no DEX |
| Permissão de armazenamento | Nenhuma adicionada |

SHA-256 do APK:

`0b1aa2e9b446e548b499924b7912aa2d18cfe0f26908e8cdcb72a32e19f618b9`

## Preparação e compilação

Ambiente preparado para esta tarefa: Amazon Corretto 21.0.13, Gradle 8.14.3, plataforma Android 36 e Build Tools 35.0.0 (padrão do AGP 8.13.0). Os componentes do SDK foram verificados pelos checksums do repositório oficial.

Foram executados `npx cap add android` (incluindo o hook de integração pessoal), `patch-android-notifications.mjs`, `patch-android-pdf.mjs` e `patch-android-widget.mjs`. Os ícones existentes foram copiados. Apenas no projeto Android gerado para este teste, foram aplicados `applicationIdSuffix ".personaltest"`, versão/código acima e nome “Liturgia OSM · Teste”. O backup automático do Android foi desativado, como na preparação estável.

O comando `gradle -p android :app:assembleDebug --console=plain` terminou com `BUILD SUCCESSFUL`, 129 tarefas executadas, em 2 min 13 s. Antes disso, a preparação exigiu completar os Build Tools e recriar o cache temporário do Gradle. Não houve correção de código necessária para a compilação.

A conferência final usou `apksigner verify --verbose --print-certs`, `aapt dump badging`, `aapt dump permissions`, leitura do DEX e comparação dos arquivos `assets/public` do APK com as fontes. O pacote separado permite coexistir com o estável; seus dados pessoais são independentes.

## Conferir somente os três avanços novos no A56

1. No **Liturgia OSM · Teste**, abrir uma oração longa ou hora do Ofício, rolar, fechar e reabrir. “Continuar de onde parei” deve retornar à parte/hora e posição salvas.
2. Escrever uma anotação pessoal, salvar, sair e voltar. O texto litúrgico deve permanecer preservado e a nota disponível na Biblioteca pessoal.
3. Exportar a cópia pelo seletor de arquivos e conferir o arquivo salvo. A restauração deve apresentar conferência antes de aplicar dados; cancelar deve preservar os dados. Para conferir a recuperação em uma instalação limpa, usar somente os dados do aplicativo de teste; a versão estável não precisa ser desinstalada nem ter dados apagados.

A conferência visual deve abranger tela estreita, teclado aberto, fonte aumentada e tema claro/escuro apenas nesses novos controles. Não foram repetidos os testes antigos do A56. A PR permanece em rascunho até esta conferência; o APK estável não foi substituído.
