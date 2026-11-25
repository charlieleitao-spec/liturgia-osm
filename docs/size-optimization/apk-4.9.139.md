# Avaliação do APK Liturgia OSM 4.9.139-teste1

Base examinada **4.9.138**, pacote `com.liturgia_osm.app`, código 41067. A candidata de teste usa código 41068, os dados pessoais no mesmo pacote e um cache offline renovado. O fluxo de compilação confere o APK com `apksigner` e exige o SHA-256 do certificado da versão estável.

| Item | Resultado |
| --- | --- |
| PDFs por celebração | Os 63 arquivos existentes (342 páginas) já passaram por otimização. A segunda tentativa encontrou 18 arquivos menores, com o mesmo texto e a mesma renderização a 144 dpi. A soma da redução, de apenas 2.418 bytes, não justificou a regravação. |
| Biblioteca | Cinco entradas distribuídas em três PDFs maiores. O botão **Baixar para uso offline** já guarda os arquivos sob demanda, com verificação SHA-256 e opção de remover o download. |
| Limpeza | Os arquivos vazios de compatibilidade do Cordova e os documentos internos já estavam excluídos. Removida a variante estendida de Cinzel, que não atendia a nenhum caractere dos quatro títulos latinos em que a fonte é usada. A variante latina e `OFL-LICENSES.txt` permanecem. |
| Busca | `search-index.json` passou de 1.567.142 para 166.503 bytes (−89,4%). Reúne título, categoria, data fixa quando aplicável e referências. Os 594 textos de páginas foram transferidos integralmente para um arquivo comprimido de 432.909 bytes. A busca continua com 708 registros e inclui os livros da Biblioteca mesmo antes do download. A redução do índice em disco não equivale à redução do APK, cujo ZIP já comprimia o índice anterior. |
| Transcrição | Ajustes em quatro campos de Ofícios, com remoção de espaços indevidos antes de sinais e do ponto excedente que precedia “Nisto conhecerão”. A rotina de importação conserva estrofes, rubricas e hifens de `chamou-o` e `Louvar-te-ei`. As locuções “chamou o noivo” e “Chamou o centurião” foram preservadas. |

## Chaves MM-DD

O Santoral e os Ofícios têm as mesmas 32 chaves fixas e os mesmos IDs associados. A Memória tem 25 datas únicas, todas presentes nas outras duas bases. Os 10 textos específicos da Memória pertencem a esse subconjunto. Foram verificadas também as datas por extenso do Santoral.

| Ocorrência | Datas |
| --- | --- |
| Santoral e Ofícios fora da seleção da Memória | 04-08, 05-08, 08-25, 08-28, 09-15, 09-22, 11-17 |
| Memória que usa a forma comum e a biografia e oração do Santoral, sem texto individual cadastrado | 01-12, 01-15, 02-03, 02-19, 05-11, 05-12, 06-27, 07-01, 07-04, 09-01, 09-05, 09-06, 09-17, 12-10, 12-15 |
| Divergência já registrada na edição impressa | Boaventura de Pistoia aparece em **14 de dezembro** no corpo da Memória Litúrgica. O índice do livro, o calendário OSM e a base vigente adotam **15 de dezembro**. |

## Grafia a cotejar

Há 20 ocorrências de “género” ou “géneros” em 14 campos, incluindo transcrições que repetem o texto já estruturado. A grafia aparece no Ofício de 4, 8 e 30 de maio, 27 de junho, 15 de setembro, 16 de novembro e nas transcrições dos Sábados Marianos de Advento, Tempo Pascal e Tempo Comum conforme o índice do JSON. As grafias da fonte foram preservadas para cotejo editorial.

`npm run liturgia:importar` lista divergências, aplica os ajustes de transcrição conhecidos nos dados e regenera a busca. `python3 scripts/revisar-dados-liturgicos.py --check` confere a base sem gravar arquivos.
