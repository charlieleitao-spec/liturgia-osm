# Simplificação de layout, interface e navegação (conteúdo web do APK 4.9.71)

Arquivos alterados ao longo das rodadas: index.html, app.js, app.css, sw.js e servite.html.

## Primeira rodada (4.9.63)

1. Barra superior: só o título e o botão ☰. A−, A+ e tema (☼) saíram do topo; continuam no menu, em "Leitura".
2. Menu: removida a seção "Navegação" (repetia Hoje/Calendário/Santoral e a aba Oração). Biblioteca e Ofício passaram para "Recursos". Removido o menu estático do index.html (o app.js já o sobrescrevia).
3. Tela inicial (Hoje): removidos a faixa "Aplicativo disponível / Conteúdo salvo", o bloco "Encontrar uma celebração" (repetia o seletor Hoje | Calendário | Santoral logo acima) e a "Observação" offline (o menu já informa).
4. Ficha da celebração: o último bloco perdeu o título "Navegação" (ficam só Anterior, Próxima e Compartilhar).
5. sw.js: cache renomeado para liturgia-osm-v4.9.63-ui32-simples, para o aparelho baixar a versão nova.

Na primeira rodada, ficaram sem alteração: estrutura das abas, modo celebração, painel de idioma e causas-beatos.html. A estrutura foi atualizada nesta segunda rodada, conforme o item 8.
6. Menu: "Missa do dia" incluído em Recursos (o atalho antigo dependia da seção removida).
7. APP_VERSION e nome do cache alinhados a 4.9.63 (ajuste ao número que for compilado).
## Segunda rodada (4.9.64)

8. Calendário e Santoral: uma única subtela reúne o calendário mensal e o índice pesquisável. A busca procura celebrações pelo nome, data e grau; os resultados mantêm a data e abrem a ficha existente. A navegação antiga `santoral` continua aceita para links e estado salvo, mas exibe a subtela unificada.
9. APP_VERSION e cache atualizados para 4.9.64; cache: `liturgia-osm-v4.9.64-ui33-calendario-santoral`.

## Terceira rodada (4.9.65)

10. Calendário e Santoral: o calendário mensal permanece no início da subtela e o índice visual do Santoral volta logo abaixo, com miniaturas, busca e índice alfabético. A busca filtra o índice sem ocultar o calendário. A lista mensal duplicada foi removida; a seleção de um dia continua mostrando as celebrações daquele dia.
11. APP_VERSION atualizado para 4.9.65; cache: `liturgia-osm-v4.9.65-ui34-santoral-abaixo-calendario`.

## Quarta rodada (4.9.66)

12. Modo celebração: controle único flutuante nos detalhes do Santoral, orações e Missa do dia. Removidos os botões repetidos da ficha e do cabeçalho da Missa. O botão flutuante permanece acessível sobre a consulta da Missa e informa “Sair do modo celebração” quando ativo.
13. APP_VERSION atualizado para 4.9.66; cache: `liturgia-osm-v4.9.66-ui35-modo-celebracao-unico`.

## Quinta rodada (4.9.67)

14. Painel de idioma da interface: reduzidos largura, margens e altura; o botão Fechar passou para o cabeçalho e a explicação foi encurtada. Mantidas as quatro opções e o estado selecionado.
15. O cartão “Idiomas” dos recursos servitas agora abre a página de recursos linguísticos; “Idioma da interface” no menu continua abrindo o seletor de idioma.
16. APP_VERSION atualizado para 4.9.67; cache: `liturgia-osm-v4.9.67-ui36-idioma-compacto`.

## Sexta rodada (4.9.68)

17. Missa do dia: o acesso do menu continua abrindo diretamente a leitura. O cartão de Hoje, que duplicava os atalhos da aba Liturgia, saiu; na aba Missa, o cartão de hoje agora informa a data sem repetir o botão de consulta.
18. Tela Hoje: removidos os cartões “Missa do dia” e “Liturgia das Horas”; permanecem a celebração com seus atalhos e a oração diária.
19. Recursos: removida a função não utilizada `viewOSMPlus()`. O atalho “Idiomas dos recursos servitas” foi colocado no menu, ao lado do idioma da interface.
20. APP_VERSION atualizado para 4.9.68; cache: `liturgia-osm-v4.9.68-ui37-missa-hoje-menu`.

## Sétima rodada (4.9.70)

21. Menu reorganizado em Leitura, Conteúdo, Preferências e Sobre. Removidos do menu os atalhos de Ofício, Regra, Rosário, Coroa e Sábado Mariano; removido o item sem destino próprio “Idiomas dos recursos servitas”. O único seletor de idioma do menu é o da interface.
22. Aba Oração: Rosário, Regra, Coroa, Sábado Mariano e Ofício reunidos em “Recursos de oração servita”. A Coroa nativa aparece uma única vez nessa seção.
23. Biblioteca: removida a busca geral; ficam apenas Favoritos e Últimos acessados. A busca do Santoral permanece.
24. Retorno do iframe: a seta de voltar foi trocada por um botão Fechar, mantendo uma saída clara do recurso. O retorno flutuante e o retorno da ficha permanecem.
25. Removido o destino antigo `servite.html?view=idioma`, que abria as configurações gerais em vez de um recurso linguístico.
26. APP_VERSION atualizado para 4.9.70; cache: `liturgia-osm-v4.9.70-ui38-menu-oracao-biblioteca`.


## Oitava rodada (4.9.70)

27. Corrige a visibilidade do menu em telas estreitas: regras responsivas antigas escondiam o primeiro botão da barra superior, agora o único botão é o menu.
28. Atualiza APP_VERSION e o cache para 4.9.70.


## Nona rodada (4.9.71)

29. A aba Liturgia passa a mostrar somente as Missas próprias OSM e os Ofícios próprios OSM; remove o cartão de data e o atalho para a fonte externa da Paulus.
30. Identifica as seções como Missa OSM e Ofício OSM e renova o cache.
31. Harmoniza as fontes da interface e dos recursos servitas com Georgia, preservando tamanhos, pesos e estilos de leitura.


## Décima rodada (4.9.72)

31. Unifica os dois acessos aos Ofícios próprios OSM na aba Liturgia, preservando o cabeçalho editorial, o número do dia, os nomes, as datas, os graus litúrgicos e os conteúdos complementares.
32. Mantém Missa OSM e Ofício OSM como únicas seções da aba Liturgia e renova o cache.


## Décima primeira rodada (4.9.73)

33. Harmoniza os cabeçalhos e as linhas das páginas Missa própria OSM e Ofício próprio OSM, com datas, graus litúrgicos e dias do mês no mesmo padrão.
34. Remove de Oração o atalho para Ofício próprio, já acessível na aba Liturgia.
35. Remove do menu os atalhos de Missa do dia e idioma da interface; a consulta da Missa datada permanece na tela Hoje. Atualiza o status e o cache.


## Décima segunda rodada (4.9.74, revisão)

36. Sábado Mariano: os cinco formulários passam a viver só em Liturgia › Ofício OSM; removidos `data/devocoes/sabado-mariano.json` e sua entrada no cache offline. Seletor de idioma da interface retirado do `index.html`. Verificado: sintaxe dos JS e JSON íntegros, sem manipuladores `onclick` sem função.

## Décima terceira rodada (4.9.75)

37. Missa do dia: a 4.9.73 tirou o atalho do menu e a 4.9.68 já havia tirado o cartão de Hoje, deixando a consulta da data de hoje acessível só pela ficha de uma celebração. Hoje ganha uma única linha “Missa do dia” → Abrir, que abre direto a leitura de hoje.
38. Idioma: sem o seletor, quem havia escolhido outro idioma ficava preso nele. A interface agora inicia sempre em português e o valor salvo é apagado.
39. APP_VERSION 4.9.75; cache: `liturgia-osm-v4.9.75-ui44-missa-hoje-idioma`.



## Décima quarta rodada (4.9.76)

40. Remove o código de tradução da interface que permaneceu sem seletor: `MAIN_I18N`, estado e funções de idioma, além dos ganchos de renderização e retorno. A interface fica em português.
41. Preserva a preferência de idioma dos recursos servitas no iframe; ela continua salva em `santoral-osm-lang` e deixa de ser apagada ao iniciar o app.
42. APP_VERSION 4.9.76; cache: `liturgia-osm-v4.9.76-ui45-i18n-removido`.


## Décima quinta rodada (4.9.77)

43. Recursos Servitas: removidos o seletor de idioma, as traduções auxiliares em latim, italiano e inglês e o código de persistência. O leitor fica em português; textos e funcionalidades portuguesas foram preservados.
44. APP_VERSION 4.9.77; cache: `liturgia-osm-v4.9.77-ui46-idiomas-removidos`.


## Décima sexta rodada (4.9.78)

45. Calendário: separa categoria da pessoa (santo, beato, servo de Deus) do grau litúrgico (solenidade, festa, memória, memória facultativa, comemoração); os dois filtros podem ser combinados.
46. Simplifica o marcador do calendário para uma única cor e remove a legenda de cores por categoria.
47. APP_VERSION 4.9.78; cache: `liturgia-osm-v4.9.78-ui47-calendario-categorias`.


## Décima sétima rodada (4.9.79)

48. Aba Oração: substitui a exibição inline com seletor do Anjo do Senhor/Rainha do Céu por dois acessos compactos que abrem cada texto em sua própria tela. A oração diária de Hoje continua abrindo a oração selecionada.
49. APP_VERSION 4.9.79; cache: `liturgia-osm-v4.9.79-ui48-oracao-atalhos`.


## Décima oitava rodada (4.9.80)

50. Ficha da celebração, bloco Oração: as quatro a cinco linhas de fonte separadas viram uma única linha “Fontes”, com a mesma informação. Quando não há Memória Litúrgica, deixa de repetir dois avisos de ausência: mostra a oração do Santoral com sua fonte ou uma só mensagem.
51. Ficha da celebração, bloco Liturgia: nota da Missa do dia mais curta, sem mudar o botão nem a regra de cópia offline.
52. APP_VERSION 4.9.80; cache: `liturgia-osm-v4.9.80-ui49-ficha-simplificada`.


## Décima nona rodada (4.9.81)

53. Ficha da celebração: Vida continua aberta; Liturgia e Oração ficam recolhidas e abrem ao toque. Os atalhos Vida/Liturgia/Oração de Hoje abrem a seção escolhida antes de rolar até ela. O estado aberto/fechado sobrevive a novas renderizações da mesma ficha e volta ao padrão ao trocar de celebração.
54. Setas e botões “Voltar” removidos do app principal: botão flutuante ←, “‹ Voltar a…” da ficha e dos Ofícios/Missas próprios, ← da Oração diária e da Memória Litúrgica, e “Voltar” dos detalhes de oração e devoção. Fica apenas o botão Voltar do Android (`smartBack`), que já cobre menu, leitor servita, Missa do dia, Ofícios/Missas próprios, oração diária, Memória Litúrgica, devoções, ficha e abas (qualquer aba volta a Hoje; em Hoje sai do app). Os botões de fechar dos painéis sobrepostos e o voltar interno do leitor servita foram mantidos.
55. APP_VERSION 4.9.81; cache: `liturgia-osm-v4.9.81-ui50-sem-setas-secoes-recolhidas`.



## Vigésima rodada (4.9.82)

56. Ficha da celebração: Liturgia e Oração continuam recolhidas inicialmente; os atalhos de Hoje abrem e levam à seção escolhida. Vida permanece aberta.
57. Retorno: um botão contextual flutuante fica disponível no navegador e no iPhone em telas secundárias e abas internas, executando a mesma sequência de retorno do Android. Ele se oculta somente no app Android, onde o botão nativo já atende à navegação; no navegador e no iPhone, inclusive em app nativo, permanece disponível. Em painéis com botão de fechar, fica oculto para evitar duplicação.
58. APP_VERSION 4.9.82; cache: `liturgia-osm-v4.9.82-ui51-voltar-web-secoes-recolhidas`.


## Vigésima primeira rodada (4.9.83)

59. Limpeza: removido do `app.css` o estilo das setas de voltar que já não existem (`.back-btn`, `.hub-back`, `.hub-top-actions`) e a verificação de “botão de voltar na tela” do botão flutuante, que não tinha mais o que verificar. O botão flutuante (navegador e iPhone) foi mantido.
60. Oração: o atalho passa a se chamar “Coroa de Nossa Senhora das Dores” (antes “Coroa das Sete Dores”), igual ao título do texto e do leitor servita; mesmo nome no título do painel servita.
61. APP_VERSION 4.9.83; cache: `liturgia-osm-v4.9.83-ui52-css-limpo-coroa`.



## Vigésima segunda rodada (4.9.84)

62. Aba Oração: removido o cartão da Regra OSSM, que é conteúdo de formação e consulta, não uma oração.
63. Menu: criada a seção “Ordem Secular”, com acesso direto à Regra de Vida da OSSM. O conteúdo, o leitor servita e os dados da Regra foram preservados.
64. APP_VERSION 4.9.84; cache: `liturgia-osm-v4.9.84-ui53-regra-menu-ossm`.


## Vigésima terceira rodada (4.9.85)

65. Textos copiados de PDFs: a exibição recompõe quebras de linha no meio da prosa e remove espaços duplicados e espaços antes da pontuação. Hinos, salmos, antífonas, estrofes e turnos dialogados mantêm suas quebras.
66. Hífens em fim de linha: a quebra é removida, preservando hífens legítimos em pronomes, palavras compostas e referências numéricas; hifenização tipográfica é recomposta sem hífen.
67. APP_VERSION 4.9.85; cache: `liturgia-osm-v4.9.85-ui54-texto-linhas-recompostas`.


## Vigésima quarta rodada (4.9.86)

68. Correção na junção de hífens da 4.9.85 (`app.js` e `servite-3.js`): o pronome “o” em fim de linha (“chamou-/o”) virava “chamouo”, e a mesóclise (“Louvar-te-/ei”, “dar-te-/ei”) virava “louvar-teei”. Agora “-o” e as terminações de mesóclise (ei, ás, á, emos, eis, ão, ia, ias, íamos, íeis, iam) mantêm o hífen.
69. APP_VERSION 4.9.86; cache: `liturgia-osm-v4.9.86-ui55-hifen-pronomes-mesoclise`.



## Vigésima quinta rodada (4.9.87, registro retroativo) e vigésima sexta (4.9.88)

70. 4.9.87: padrão litúrgico (`liturgical-reader.css`, papel/tinta/vermelho litúrgicos, tema escuro por padrão). Não constava no changelog.
71. Hífens (`app.js` e `servite-3.js`): o pronome em fim de linha só mantém o hífen se a parte da esquerda parecer forma verbal (4 letras ou mais, ou termina em vogal acentuada, r, s, z ou u). Antes, sílabas como “no-/me”, “pe-/na”, “se-/te”, “fa-/la” viravam “no-me”, “pe-na”, “se-te”, “fa-la”. As 20 ocorrências reais dos dados continuam corretas (“dar-nos”, “dá-lhe”, “faça-a”, “uniu-se”).
72. Cache offline: 21 imagens de santos (`media/*.webp`) eram usadas pelo app mas não estavam na lista de pré-cache; só funcionavam offline se já tivessem sido abertas antes. Agora estão em `CORE`.
73. APP_VERSION 4.9.88; cache: `liturgia-osm-v4.9.88-ui57-hifen-silabas-cache-imagens`.
