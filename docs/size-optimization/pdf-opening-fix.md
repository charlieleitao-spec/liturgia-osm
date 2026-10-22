# Correção da abertura dos PDFs no Android — candidata 4.9.114

A 4.9.113 continha os PDFs íntegros, mas os botões da Missa e de alguns ofícios
preferiam `pdf_url` (remoto) a `local_pdf_url`. A busca apontava para os arquivos
locais com `target="_blank"`, sem um leitor Android integrado para esses links.
Os testes anteriores verificavam arquivos, renderização desktop e busca, sem
clicar o PDF e verificar sua abertura nativa. Portanto não comprovavam esse fluxo.

A correção prefere os PDFs locais, encaminha links conhecidos à cópia empacotada
e abre uma Activity privada com o `PdfRenderer` do Android. Não adiciona bibliotecas
ou permissões. O leitor mantém uma página na memória, com anterior/próxima,
ampliação, gesto de pinça, deslocamento e retorno ao ponto original do aplicativo.
`#page` é respeitado na abertura a partir da busca. O script também acompanha
a página de recursos carregada no iframe; no navegador/PWA a navegação é preservada.

Nenhum dos 63 PDFs, JSON de conteúdo, imagens, textos ou graus é alterado nesta
correção. O APK compara esses bytes com a 4.9.113. Versão 4.9.114, code 41018,
mesma assinatura. A publicação de release continua removida.

O teste Android ampliado renderiza as 342 páginas com o motor Android e clica
o botão real de uma Missa e um resultado de Ofício na busca. Confere a página
inicial, próxima página, ampliação e retorno, com Wi-Fi/dados desativados e
requisições externas recusadas. Esses passos devem passar antes da entrega.
