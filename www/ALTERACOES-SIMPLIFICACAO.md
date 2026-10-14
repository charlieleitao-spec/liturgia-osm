# Simplificação de layout, interface e navegação (conteúdo web do APK 4.9.66)

Arquivos alterados: index.html, app.js, sw.js (app.css e demais arquivos intactos).

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
