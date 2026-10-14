# Simplificação de layout, interface e navegação (sobre o conteúdo web do APK 4.9.63)

Arquivos alterados: index.html, app.js, sw.js (app.css e demais arquivos intactos).

1. Barra superior: só o título e o botão ☰. A−, A+ e tema (☼) saíram do topo; continuam no menu, em "Leitura".
2. Menu: removida a seção "Navegação" (repetia Hoje/Calendário/Santoral e a aba Oração). Biblioteca e Ofício passaram para "Recursos". Removido o menu estático do index.html (o app.js já o sobrescrevia).
3. Tela inicial (Hoje): removidos a faixa "Aplicativo disponível / Conteúdo salvo", o bloco "Encontrar uma celebração" (repetia o seletor Hoje | Calendário | Santoral logo acima) e a "Observação" offline (o menu já informa).
4. Ficha da celebração: o último bloco perdeu o título "Navegação" (ficam só Anterior, Próxima e Compartilhar).
5. sw.js: cache renomeado para liturgia-osm-v4.9.63-ui32-simples, para o aparelho baixar a versão nova.

Não alterados (decisão pendente): estrutura das 3 abas, modo celebração, painel de idioma, causas-beatos.html.
6. Menu: "Missa do dia" incluído em Recursos (o atalho antigo dependia da seção removida).
7. APP_VERSION e nome do cache alinhados a 4.9.63 (ajuste ao número que for compilado).
