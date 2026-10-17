# 4.9.104 — lembrete opcional (rascunho)

Menu Android: interruptor desligado por padrão e horário inicial 07:00.
A permissão é solicitada somente após ativação e explicação. Agendamento inexato
para as celebrações dos próximos 60 dias; renovação ao abrir/retomar o app ou
alterar o horário. Desligar cancela os lembretes deste recurso. O toque abre a
ficha pelo ID canônico, inclusive quando recebido antes do carregamento dos dados.
Dados litúrgicos preservados. Plugin fixado em @capacitor/local-notifications 8.3.1.
Manifesto gerado por patch, removendo permissões de alarmes exatos inclusive da
mesclagem do manifesto do plugin. O plugin inclui receptor de reinicialização.

## Conferência

- npm test: aprovado, incluindo texto, datas, virada do ano, selo e aviso inexato.
- Projeto Capacitor gerado e sincronizado; manifesto ajustado pelo script.
- CI do PR: compila APK assinado e compara certificado e versionCode com baseline
  4.9.102 (referência já usada pelo projeto). Isso não prova atualização da 4.9.103.
- Não testado em aparelho físico: recebimento, toque com app fechado/em segundo
  plano, reinicialização e atualização sobre a versão instalada.
- Para testar: ativar com horário próximo a uma celebração, conferir conteúdo e
  abertura da ficha; repetir com Nossa Senhora das Dores; conferir ausência de
  aviso em dia vazio e cancelamento ao desligar. Reiniciar aparelho e conferir
  entrega sem abrir o app. Não usar alarmes exatos.
- Em aparelhos com economia de bateria, o horário pode variar. Sem abrir o app
  por 60 dias, não há novos agendamentos; essa limitação aparece na configuração.
- Sem mesclagem ou publicação autorizada nesta etapa. Itens 5 e 3 ainda pendentes.
