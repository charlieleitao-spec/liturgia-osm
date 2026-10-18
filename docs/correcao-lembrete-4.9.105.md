# 4.9.105 — corrigir inicialização Android

A 4.9.104 lançava TypeError ao chamar .catch() no retorno síncrono de
Capacitor.Plugins.LocalNotifications.addListener. O script app.js parava antes
da chamada loadCanonicalSantoral, deixando a tela carregando e os controles
bloqueados. O teste simulado usava retorno assíncrono incorreto, e a instrumentação
anterior aceitava a mensagem de carregamento como página pronta.

Correções:
- Normalização do retorno dos listeners com Promise.resolve.
- Falhas na inicialização opcional do lembrete não interrompem a liturgia.
- Teste reproduz o objeto { remove } da ponte nativa. A versão antiga falha nesse teste.
- Instrumentação exige santoral e ofícios carregados e 32 celebrações.
- No APK real em emulador, testa controles ativos, ativação, agendamentos pendentes
  pelo plugin nativo, desativação e cancelamento. Permissão concedida pelo shell
  de teste; diálogo explicativo confirmado automaticamente só na instrumentação.
- Versão 4.9.105, versionCode 41009, assinatura preservada.

Ainda requer aparelho físico: diálogo de permissão, entrega no horário, toque
com app fechado e persistência após reiniciar. Não publicar antes da autorização.
