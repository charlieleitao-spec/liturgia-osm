# 4.9.106 — Widget Android (em teste)

Dois widgets nativos, 4×1 e 2×2, mostram os dados locais do santoral sem rede.
O script versionado gera assets reduzidos, Java e recursos após o Capacitor sync.
O texto reutiliza as mesmas regras do lembrete; a ficha é aberta pelo id canônico.

Atualização por alarme inexato na próxima meia-noite local, após reinício,
atualização do APK, mudança de hora/fuso e atualização periódica do launcher.
O Android pode adiar a atualização em economia de bateria. Não solicita
permissão de alarme exato. Dias sem celebração exibem a mensagem própria.

Validação automatizada: npm test, dois providers registrados, leitura de três
datas (15/9, 17/2, 1/3), aplicação dos RemoteViews nos dois tamanhos e intent
abrindo a ficha 23. Regressão do lembrete e atualização sobre APK assinado.
Teste manual no aparelho: adicionar os dois tamanhos, conferir leitura, tocar
com app fechado/em segundo plano e verificar após virada do dia/reinício.

Referência de tamanho 4.9.105: 12.600.629 bytes. Comparar o APK do PR antes
da aprovação. Esta branch não autoriza publicação de release.
